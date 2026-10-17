import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AnswerQueue, type SaveState} from '../src/lib/answer-queue';

test('failed answers remain pending until retry succeeds', async () => {
  let fail = true;
  let state: SaveState = {pending: 0, error: '', closed: false};
  const queue = new AnswerQueue(async () => fail ? {data: null, error: 'Offline'} : {data: true, error: null}, value => {state = value;});
  queue.enqueue('q1', 2);
  assert.equal(await queue.flush(), false);
  assert.equal(state.pending, 1);
  assert.equal(state.error, 'Offline');
  fail = false;
  queue.retry();
  assert.equal(await queue.flush(), true);
  assert.equal(state.pending, 0);
  assert.equal(state.error, '');
});
test('rapid changes preserve the most recent answer and cannot clear a newer pending save', async () => {
  const saved: number[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => {release = resolve;});
  const queue = new AnswerQueue(async (_id, choice) => {if (choice === 0) await gate; saved.push(choice); return {data: true, error: null};}, () => {});
  queue.enqueue('q1', 0);
  await Promise.resolve();
  queue.enqueue('q1', 1);
  queue.enqueue('q1', 3);
  release();
  assert.equal(await queue.flush(), true);
  assert.deepEqual(saved, [0, 3]);
});
test('a rejected request does not poison the queue or erase other failed answers', async () => {
  let state: SaveState = {pending: 0, error: '', closed: false};
  const queue = new AnswerQueue(async id => {if (id === 'q1') throw new Error('Network'); return {data: true, error: null};}, value => {state = value;});
  queue.enqueue('q1', 0); queue.enqueue('q2', 1);
  assert.equal(await queue.flush(), false);
  assert.equal(state.pending, 1);
  assert.ok(state.error);
});
test('server expiry closes the queue and does not accept further changes', async () => {
  let state: SaveState = {pending: 0, error: '', closed: false};
  let calls = 0;
  const queue = new AnswerQueue(async () => {calls++; return {data: false, error: null};}, value => {state = value;});
  queue.enqueue('q1', 0);
  await queue.flush();
  queue.enqueue('q2', 1);
  assert.equal(state.closed, true);
  assert.equal(calls, 1);
});
