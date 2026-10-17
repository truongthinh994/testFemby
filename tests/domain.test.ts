import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scoreAnswers, reviewDate, secondsLeft, safeNext} from '../src/lib/domain';

test('score ignores unanswered questions and unknown answers', () => {
  assert.equal(scoreAnswers({a: 0, b: 2, c: 1}, {a: 0, b: 1, other: 1}), 1);
});
test('review schedule uses 0, 1, 3 elapsed days', () => {
  const now = new Date('2026-10-17T00:00:00Z');
  assert.equal(reviewDate(1, now).toISOString(), now.toISOString());
  assert.equal(reviewDate(3, now).toISOString(), '2026-10-18T00:00:00.000Z');
  assert.equal(reviewDate(5, now).toISOString(), '2026-10-20T00:00:00.000Z');
  assert.throws(() => reviewDate(2, now));
});
test('expiry is anchored to the server timestamp, clamped to zero', () => {
  assert.equal(secondsLeft('2026-10-17T00:20:00Z', Date.parse('2026-10-17T00:19:00Z')), 60);
  assert.equal(secondsLeft('2026-10-17T00:20:00Z', Date.parse('2026-10-17T00:30:00Z')), 0);
  assert.equal(secondsLeft('invalid'), 0);
});
test('redirect rejects external and protocol-relative destinations', () => {
  assert.equal(safeNext('https://evil.test'), '/dashboard');
  assert.equal(safeNext('//evil.test'), '/dashboard');
  assert.equal(safeNext('/attempt/abc'), '/attempt/abc');
});
test('redirect rejects browser-normalized control characters and preserves valid query strings', () => {
  for (const value of ['/\n/evil.test', '/\t/evil.test', '/\\evil.test', null, '']) assert.equal(safeNext(value), '/dashboard');
  assert.equal(safeNext('/history?filter=recent#result'), '/history?filter=recent#result');
});
