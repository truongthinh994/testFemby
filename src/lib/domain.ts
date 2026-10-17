export function safeNext(value: string | null): string {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return '/dashboard';
  const url = new URL(value, 'https://toeic.local');
  return url.origin === 'https://toeic.local' ? url.pathname + url.search + url.hash : '/dashboard';
}

export function reviewDate(grade: number, now = new Date()): Date {
  if (![1, 3, 5].includes(grade)) throw new Error('Invalid grade');
  return new Date(now.getTime() + (grade === 5 ? 3 : grade === 3 ? 1 : 0) * 86400000);
}

export function scoreAnswers(keys: Record<string, number>, answers: Record<string, number>): number {
  return Object.entries(keys).filter(([id, correct]) => answers[id] === correct).length;
}

export function secondsLeft(expires: string, now = Date.now()): number {
  const remaining = Date.parse(expires) - now;
  return Number.isFinite(remaining) ? Math.max(0, Math.ceil(remaining / 1000)) : 0;
}

export type Topic = {id: string; title: string; description: string};
export type Word = {id: string; topic_id: string; word: string; pronunciation: string; meaning: string; example: string; audio_url: string | null};
export type Attempt = {id: string; exam_id: string; started_at: string; expires_at: string; submitted_at: string | null; score: number | null};
export type Question = {id: string; position: number; prompt: string; options: string[]; group_id: string; section?: string; passage?: string; audio_url?: string; correct?: number; choice?: number | null; explanation?: string; transcript?: string};
export type Study = {id: string; word_ids: string[]; ratings: Record<string, number>; quiz_score: number | null; completed_at: string | null};
export type Payload = {
  view: string; id?: string; name: string; now: number;
  topics: Topic[]; words: Word[]; attempts: Attempt[];
  progress: {word_id: string; grade: number; due_at: string}[];
  exams: {id: string; title: string; duration_seconds: number}[];
  questions: Question[]; answers: Record<string, number>;
  groups: {id: string; section: string; passage: string | null; audio_url: string | null}[];
  sessions: Study[];
  result?: {attempt: Attempt; questions: Question[]};
};
