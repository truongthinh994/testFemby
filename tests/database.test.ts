import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ALICE, BOB, asUser, createDatabase, rpc} from './helpers/database';

test('migrations, scoring, study and isolation run against PostgreSQL', async t => {
  const db = await createDatabase();
  try {
    await t.test('seed is re-runnable with 30 words and 20 questions', async () => {
      await db.exec(await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'));
      const {rows} = await db.query<{words: number; questions: number; listening: number}>(`select
        (select count(*)::int from public.words) words,
        (select count(*)::int from public.questions) questions,
        (select count(*)::int from public.question_groups where section='Listening') listening`);
      assert.deepEqual(rows[0], {words: 30, questions: 20, listening: 10});
    });
    const attempt = await rpc<string>(db, ALICE, 'start_attempt', ['mini-01']);
    await t.test('repeated start resumes the same attempt and deadline', async () => {
      assert.equal(await rpc(db, ALICE, 'start_attempt', ['mini-01']), attempt);
      const {rows} = await db.query('select * from public.attempts where user_id=$1', [ALICE]);
      assert.equal(rows.length, 1);
    });
    await t.test('answer keys and result stay private before submission', async () => {
      await assert.rejects(asUser(db, ALICE, tx => tx.query('select * from private.answer_keys')), /permission denied/);
      await assert.rejects(rpc(db, ALICE, 'get_result', [attempt]), /before viewing answers/);
      const {rows} = await asUser(db, ALICE, tx => tx.query<Record<string, unknown>>('select * from public.questions'));
      assert.ok(rows.every(row => !('correct' in row) && !('explanation' in row) && !('transcript' in row)));
    });
    await t.test('another account cannot read, save or submit the attempt', async () => {
      const {rows} = await asUser(db, BOB, tx => tx.query('select * from public.attempts'));
      assert.equal(rows.length, 0);
      await assert.rejects(rpc(db, BOB, 'save_answer', [attempt, 'q-01', 0]), /Attempt not found/);
      await assert.rejects(rpc(db, BOB, 'submit_attempt', [attempt]), /Attempt not found/);
      await assert.rejects(asUser(db, ALICE, tx => tx.query('update public.attempts set score=20')), /permission denied/);
    });
    await t.test('answers reject invalid choices and questions', async () => {
      await assert.rejects(rpc(db, ALICE, 'save_answer', [attempt, 'q-01', 4]), /Invalid answer/);
      await assert.rejects(rpc(db, ALICE, 'save_answer', [attempt, 'q-01', null]), /Invalid answer/);
      await assert.rejects(rpc(db, ALICE, 'save_answer', [attempt, 'missing', 0]), /Invalid question/);
      await rpc(db, ALICE, 'save_answer', [attempt, 'q-01', 1]);
      await rpc(db, ALICE, 'save_answer', [attempt, 'q-01', 0]);
      await rpc(db, ALICE, 'save_answer', [attempt, 'q-02', 1]);
      const {rows} = await asUser(db, BOB, tx => tx.query('select * from public.answers'));
      assert.equal(rows.length, 0);
    });
    await t.test('server scores saved answers, counts blanks wrong and submits idempotently', async () => {
      const first = await rpc<{score: number}>(db, ALICE, 'submit_attempt', [attempt]);
      assert.equal(first.score, 1);
      assert.deepEqual(await rpc(db, ALICE, 'submit_attempt', [attempt]), first);
      assert.equal(await rpc(db, ALICE, 'save_answer', [attempt, 'q-02', 2]), false);
      const result = await rpc<{questions: {correct: number; transcript: string | null}[]}>(db, ALICE, 'get_result', [attempt]);
      assert.equal(result.questions.length, 20);
      assert.equal(result.questions[0].correct, 0);
      assert.ok(result.questions[0].transcript);
      await assert.rejects(rpc(db, BOB, 'get_result', [attempt]), /Attempt not found/);
    });
    await t.test('expiry freezes saved answers, caps duration, and permits a fresh attempt', async () => {
      const expired = await rpc<string>(db, ALICE, 'start_attempt', ['mini-01']);
      await rpc(db, ALICE, 'save_answer', [expired, 'q-01', 0]);
      await db.query("update public.attempts set started_at=now()-interval '21 minutes',expires_at=now()-interval '1 minute' where id=$1", [expired]);
      assert.equal(await rpc(db, ALICE, 'save_answer', [expired, 'q-02', 2]), false);
      const result = await rpc<{attempt: {score: number; submitted_at: string; expires_at: string}}>(db, ALICE, 'get_result', [expired]);
      assert.equal(result.attempt.score, 1);
      assert.equal(result.attempt.submitted_at, result.attempt.expires_at);
      assert.notEqual(await rpc(db, ALICE, 'start_attempt', ['mini-01']), expired);
    });
    const study = await rpc<string>(db, ALICE, 'start_study', ['office']);
    await t.test('study resumes, requires learning every word and prevents grade-one bypass', async () => {
      assert.equal(await rpc(db, ALICE, 'start_study', ['office']), study);
      await assert.rejects(rpc(db, ALICE, 'complete_study', [study, {}]), /reviewing all words/);
      await assert.rejects(rpc(db, ALICE, 'rate_word', [study, null, 5]), /Invalid rating/);
      await assert.rejects(rpc(db, BOB, 'rate_word', [study, 'office-01', 5]), /Session not available/);
      for (let i = 1; i <= 10; i++) await rpc(db, ALICE, 'rate_word', [study, 'office-' + String(i).padStart(2, '0'), i === 1 ? 1 : i === 2 ? 3 : 5]);
      await assert.rejects(rpc(db, ALICE, 'complete_study', [study, {}]), /reviewing all words/);
      const {rows} = await asUser(db, ALICE, tx => tx.query<{grade: number; days: number}>("select grade,round(extract(epoch from (due_at-updated_at))/86400)::int days from public.progress order by word_id"));
      assert.deepEqual(rows.slice(0, 3).map(row => [row.grade, row.days]), [[1, 0], [3, 1], [5, 3]]);
      assert.equal((await asUser(db, BOB, tx => tx.query('select * from public.progress'))).rows.length, 0);
      assert.equal((await asUser(db, BOB, tx => tx.query('select * from public.study_sessions'))).rows.length, 0);
    });
    await t.test('review includes only due words; quiz is scored once on the server', async () => {
      const review = await rpc<string>(db, ALICE, 'start_study', ['review']);
      const {rows} = await db.query<{word_ids: string[]}>('select word_ids from public.study_sessions where id=$1', [review]);
      assert.deepEqual(rows[0].word_ids, ['office-01']);
      await rpc(db, ALICE, 'rate_word', [study, 'office-01', 5]);
      await assert.rejects(rpc(db, ALICE, 'complete_study', [study, null]), /Invalid quiz answers/);
      const answers = {'office-01': 'office-01', 'office-02': 'wrong'};
      assert.equal(await rpc(db, ALICE, 'complete_study', [study, answers]), 1);
      assert.equal(await rpc(db, ALICE, 'complete_study', [study, {}]), 1);
      await assert.rejects(rpc(db, ALICE, 'rate_word', [study, 'office-01', 3]), /Session not available/);
      await assert.rejects(rpc(db, BOB, 'complete_study', [study, {}]), /Session not found/);
    });
    await t.test('anonymous callers cannot use learner data or RPCs', async () => {
      await assert.rejects(asUser(db, null, tx => tx.query('select * from public.words'), 'anon'), /permission denied/);
      await assert.rejects(asUser(db, null, tx => tx.query("select public.start_attempt('mini-01')"), 'anon'), /permission denied/);
    });
  } finally {await db.close();}
});
