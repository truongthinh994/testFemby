import 'server-only';
import {notFound, redirect} from 'next/navigation';
import {supabase} from './supabase/server';
import type {Payload} from './domain';

export async function loadWorkspace(view: string, id?: string): Promise<Payload> {
  const db = await supabase();
  const {data: {user}} = await db.auth.getUser();
  if (!user) redirect('/auth/login?next=' + encodeURIComponent('/' + view + (id ? '/' + id : '')));
  const metadataName = user.user_metadata.display_name;
  const payload: Payload = {
    view, id, now: Date.now(),
    name: typeof metadataName === 'string' && metadataName.trim() ? metadataName : user.email?.split('@')[0] || 'Bạn',
    topics: [], words: [], attempts: [], progress: [], exams: [], questions: [], answers: {}, groups: [], sessions: [],
  };
  const queries = await Promise.all([
    db.from('topics').select('*').order('id'),
    db.from('words').select('*').order('id'),
    db.from('attempts').select('*').order('started_at', {ascending: false}),
    db.from('progress').select('*'),
    db.from('exams').select('*').order('id'),
    db.from('study_sessions').select('*').order('created_at', {ascending: false}),
  ]);
  if (queries.some(query => query.error)) throw new Error('Database unavailable');
  [payload.topics, payload.words, payload.attempts, payload.progress, payload.exams, payload.sessions] = queries.map(query => query.data || []);
  if (view === 'attempt') {
    const attempt = payload.attempts.find(item => item.id === id);
    if (!attempt) notFound();
    if (attempt.submitted_at || Date.parse(attempt.expires_at) <= payload.now) {
      if (!attempt.submitted_at) {
        const result = await db.rpc('submit_attempt', {p_attempt: id});
        if (result.error) throw new Error('Submission unavailable');
      }
      redirect('/result/' + id);
    }
    const [questions, groups, answers] = await Promise.all([
      db.from('questions').select('*').eq('exam_id', attempt.exam_id).order('position'),
      db.from('question_groups').select('*').eq('exam_id', attempt.exam_id),
      db.from('answers').select('*').eq('attempt_id', id),
    ]);
    if (questions.error || groups.error || answers.error) throw new Error('Exam unavailable');
    payload.questions = questions.data || [];
    payload.groups = groups.data || [];
    payload.answers = Object.fromEntries((answers.data || []).map(answer => [answer.question_id, answer.choice]));
  }
  if (view === 'result') {
    const {data, error} = await db.rpc('get_result', {p_attempt: id});
    if (error) {
      // Opening an active result URL must keep the learner in the current attempt.
      if (payload.attempts.some(attempt => attempt.id === id && !attempt.submitted_at)) redirect('/attempt/' + id);
      notFound();
    }
    payload.result = data;
  }
  if (view === 'study' && !payload.sessions.some(session => session.id === id)) notFound();
  return payload;
}
