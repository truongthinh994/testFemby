create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table public.topics(id text primary key,title text not null,description text not null);
create table public.words(id text primary key,topic_id text references public.topics not null,word text not null,pronunciation text not null,meaning text not null,example text not null,audio_url text);
create table public.progress(user_id uuid references auth.users on delete cascade,word_id text references public.words,grade int check(grade in(1,3,5)),due_at timestamptz not null,updated_at timestamptz not null default now(),primary key(user_id,word_id));
create table public.study_sessions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,word_ids text[] not null,ratings jsonb not null default '{}',quiz_answers jsonb not null default '{}',quiz_score int,completed_at timestamptz,created_at timestamptz not null default now());
create table public.exams(id text primary key,title text not null,duration_seconds int not null check(duration_seconds>0));
create table public.question_groups(id text primary key,exam_id text references public.exams not null,section text not null check(section in('Listening','Reading')),passage text,audio_url text);
create table public.questions(id text primary key,exam_id text references public.exams not null,group_id text references public.question_groups not null,position int not null,prompt text not null,options jsonb not null check(jsonb_array_length(options)=4),unique(exam_id,position));
create table private.answer_keys(question_id text primary key references public.questions,correct int not null check(correct between 0 and 3),explanation text not null,transcript text);
create table public.attempts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,exam_id text not null references public.exams,started_at timestamptz not null default now(),expires_at timestamptz not null,submitted_at timestamptz,score int);
create table public.answers(attempt_id uuid references public.attempts on delete cascade,question_id text references public.questions,choice int check(choice between 0 and 3),primary key(attempt_id,question_id));
create unique index one_active_attempt on public.attempts(user_id,exam_id) where submitted_at is null;
alter table public.topics enable row level security;
alter table public.words enable row level security;
alter table public.progress enable row level security;
alter table public.study_sessions enable row level security;
alter table public.exams enable row level security;
alter table public.question_groups enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.answers enable row level security;
create policy read_topics on public.topics for select to authenticated using(true);
create policy read_words on public.words for select to authenticated using(true);
create policy read_exams on public.exams for select to authenticated using(true);
create policy read_groups on public.question_groups for select to authenticated using(true);
create policy read_questions on public.questions for select to authenticated using(true);
create policy own_progress on public.progress for select to authenticated using(user_id=(select auth.uid()));
create policy own_study on public.study_sessions for select to authenticated using(user_id=(select auth.uid()));
create policy own_attempts on public.attempts for select to authenticated using(user_id=(select auth.uid()));
create policy own_answers on public.answers for select to authenticated using(exists(select 1 from public.attempts a where a.id=attempt_id and a.user_id=(select auth.uid())));
revoke all on all tables in schema public from anon;
revoke insert,update,delete on public.progress,public.study_sessions,public.attempts,public.answers from authenticated;
grant select on public.topics,public.words,public.exams,public.question_groups,public.questions,public.progress,public.study_sessions,public.attempts,public.answers to authenticated;

create function public.submit_attempt(p_attempt uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.attempts; s int;
begin
 select * into a from public.attempts where id=p_attempt and user_id=auth.uid() for update;
 if not found then raise exception 'Attempt not found'; end if;
 if a.submitted_at is null then
  select count(*) into s from public.answers an join private.answer_keys k on k.question_id=an.question_id where an.attempt_id=a.id and an.choice=k.correct;
  update public.attempts set submitted_at=least(now(),expires_at),score=s where id=a.id returning * into a;
 end if;
 return to_jsonb(a);
end $$;
create function public.start_attempt(p_exam text) returns uuid language plpgsql security definer set search_path='' as $$
declare a public.attempts; duration int; result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_exam,0));
 select * into a from public.attempts where user_id=auth.uid() and exam_id=p_exam and submitted_at is null;
 if found then
  if a.expires_at>now() then return a.id; end if;
  perform public.submit_attempt(a.id);
 end if;
 select duration_seconds into duration from public.exams where id=p_exam;
 if not found then raise exception 'Exam not found'; end if;
 insert into public.attempts(user_id,exam_id,expires_at) values(auth.uid(),p_exam,now()+make_interval(secs=>duration)) returning id into result;
 return result;
end $$;
create function public.save_answer(p_attempt uuid,p_question text,p_choice int) returns boolean language plpgsql security definer set search_path='' as $$
declare a public.attempts;
begin
 select * into a from public.attempts where id=p_attempt and user_id=auth.uid() for update;
 if not found then raise exception 'Attempt not found'; end if;
 if a.submitted_at is not null then return false; end if;
 if a.expires_at<=now() then perform public.submit_attempt(a.id); return false; end if;
 if p_choice not between 0 and 3 or p_choice is null then raise exception 'Invalid answer'; end if;
 if not exists(select 1 from public.questions where id=p_question and exam_id=a.exam_id) then raise exception 'Invalid question'; end if;
 insert into public.answers values(a.id,p_question,p_choice) on conflict(attempt_id,question_id) do update set choice=excluded.choice;
 return true;
end $$;
create function public.get_result(p_attempt uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.attempts; items jsonb;
begin
 select * into a from public.attempts where id=p_attempt and user_id=auth.uid();
 if not found then raise exception 'Attempt not found'; end if;
 if a.submitted_at is null and a.expires_at<=now() then perform public.submit_attempt(a.id);select * into a from public.attempts where id=a.id; end if;
 if a.submitted_at is null then raise exception 'Submit the exam before viewing answers'; end if;
 select jsonb_agg(to_jsonb(q)||jsonb_build_object('choice',an.choice,'correct',k.correct,'explanation',k.explanation,'transcript',k.transcript,'section',g.section,'passage',g.passage,'audio_url',g.audio_url) order by q.position) into items
 from public.questions q join private.answer_keys k on k.question_id=q.id join public.question_groups g on g.id=q.group_id left join public.answers an on an.question_id=q.id and an.attempt_id=a.id where q.exam_id=a.exam_id;
 return jsonb_build_object('attempt',to_jsonb(a),'questions',items);
end $$;
create function public.start_study(p_topic text) returns uuid language plpgsql security definer set search_path='' as $$
declare ids text[]; result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_topic='review' then
 select array_agg(id) into ids from(select w.id from public.words w join public.progress p on p.word_id=w.id where p.user_id=auth.uid() and p.due_at<=now() order by p.due_at limit 10) x;
 else
 select array_agg(id) into ids from(select id from public.words where topic_id=p_topic order by id limit 10) x;
 end if;
 if ids is null then raise exception 'No words due'; end if;
 insert into public.study_sessions(user_id,word_ids) values(auth.uid(),ids) returning id into result;
 return result;
end $$;
create function public.rate_word(p_session uuid,p_word text,p_grade int) returns boolean language plpgsql security definer set search_path='' as $$
declare s public.study_sessions;
begin
 select * into s from public.study_sessions where id=p_session and user_id=auth.uid() for update;
 if not found or s.completed_at is not null then raise exception 'Session not available'; end if;
 if not(p_word=any(s.word_ids)) or p_grade not in(1,3,5) or p_grade is null then raise exception 'Invalid rating'; end if;
 update public.study_sessions set ratings=ratings||jsonb_build_object(p_word,p_grade) where id=s.id;
 insert into public.progress(user_id,word_id,grade,due_at) values(auth.uid(),p_word,p_grade,now()+make_interval(days=>case p_grade when 5 then 3 when 3 then 1 else 0 end))
 on conflict(user_id,word_id) do update set grade=excluded.grade,due_at=excluded.due_at,updated_at=now();
 return true;
end $$;
create function public.complete_study(p_session uuid,p_answers jsonb) returns int language plpgsql security definer set search_path='' as $$
declare s public.study_sessions; total int:=0; wid text;
begin
 select * into s from public.study_sessions where id=p_session and user_id=auth.uid() for update;
 if not found then raise exception 'Session not found'; end if;
 if s.completed_at is not null then return s.quiz_score; end if;
 foreach wid in array s.word_ids loop
 if not(s.ratings ? wid) then raise exception 'Rate all words first'; end if;
 end loop;
 foreach wid in array s.word_ids[1:least(5,array_length(s.word_ids,1))] loop
 if p_answers->>wid=wid then total:=total+1;end if;
 end loop;
 update public.study_sessions set completed_at=now(),quiz_answers=p_answers,quiz_score=total where id=s.id;
 return total;
end $$;
revoke all on function public.submit_attempt(uuid),public.start_attempt(text),public.save_answer(uuid,text,int),public.get_result(uuid),public.start_study(text),public.rate_word(uuid,text,int),public.complete_study(uuid,jsonb) from public,anon;
grant execute on function public.submit_attempt(uuid),public.start_attempt(text),public.save_answer(uuid,text,int),public.get_result(uuid),public.start_study(text),public.rate_word(uuid,text,int),public.complete_study(uuid,jsonb) to authenticated;
