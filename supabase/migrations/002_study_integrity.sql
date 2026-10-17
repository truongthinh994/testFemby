-- Upgrade existing MVP installations without replacing their data.
revoke all on public.progress, public.study_sessions, public.attempts, public.answers from authenticated;
grant select on public.progress, public.study_sessions, public.attempts, public.answers to authenticated;
create index if not exists progress_due on public.progress(user_id, due_at);
create index if not exists study_recent on public.study_sessions(user_id, created_at desc);
create index if not exists attempt_history on public.attempts(user_id, started_at desc);

create or replace function public.rate_word(p_session uuid, p_word text, p_grade int)
returns boolean language plpgsql security definer set search_path='' as $$
declare s public.study_sessions;
begin
 select * into s from public.study_sessions where id=p_session and user_id=auth.uid() for update;
 if not found or s.completed_at is not null then raise exception 'Session not available'; end if;
 if p_word is null or not(p_word=any(s.word_ids)) or p_grade is null or p_grade not in(1,3,5) then raise exception 'Invalid rating'; end if;
 update public.study_sessions set ratings=ratings||jsonb_build_object(p_word,p_grade) where id=s.id;
 insert into public.progress(user_id,word_id,grade,due_at) values(auth.uid(),p_word,p_grade,now()+make_interval(days=>case p_grade when 5 then 3 when 3 then 1 else 0 end))
 on conflict(user_id,word_id) do update set grade=excluded.grade,due_at=excluded.due_at,updated_at=now();
 return true;
end $$;

create or replace function public.complete_study(p_session uuid, p_answers jsonb)
returns int language plpgsql security definer set search_path='' as $$
declare s public.study_sessions; total int:=0; wid text;
begin
 select * into s from public.study_sessions where id=p_session and user_id=auth.uid() for update;
 if not found then raise exception 'Session not found'; end if;
 if s.completed_at is not null then return s.quiz_score; end if;
 if p_answers is null or jsonb_typeof(p_answers)<>'object' then raise exception 'Invalid quiz answers'; end if;
 foreach wid in array s.word_ids loop
  if not(s.ratings ? wid) or (s.ratings->>wid)::int not in(3,5) then raise exception 'Finish reviewing all words first'; end if;
 end loop;
 foreach wid in array s.word_ids[1:least(5,array_length(s.word_ids,1))] loop
  if p_answers->>wid=wid then total:=total+1; end if;
 end loop;
 update public.study_sessions set completed_at=now(),quiz_answers=p_answers,quiz_score=total where id=s.id;
 return total;
end $$;

create or replace function public.start_study(p_topic text)
returns uuid language plpgsql security definer set search_path='' as $$
declare ids text[]; result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||'study:'||p_topic,0));
 if p_topic='review' then
  select array_agg(id order by due_at,id) into ids from (
   select w.id,p.due_at from public.words w join public.progress p on p.word_id=w.id
   where p.user_id=auth.uid() and p.due_at<=now() order by p.due_at,w.id limit 10
  ) x;
 else
  select array_agg(id order by id) into ids from (select id from public.words where topic_id=p_topic order by id limit 10) x;
 end if;
 if ids is null then raise exception 'No words due'; end if;
 select id into result from public.study_sessions where user_id=auth.uid() and completed_at is null and word_ids=ids order by created_at desc limit 1;
 if result is not null then return result; end if;
 insert into public.study_sessions(user_id,word_ids) values(auth.uid(),ids) returning id into result;
 return result;
end $$;
