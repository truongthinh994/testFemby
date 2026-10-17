import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn, type ChildProcess} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDatabase} from './helpers/database';

test('local demo confirms mail once and retains accounts, passwords and scores after restart', {timeout: 60_000}, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'toeic-local-test-'));
  const root = fileURLToPath(new URL('../', import.meta.url));
  const port = await new Promise<number>((resolve, reject) => {
    const probe = createServer(); probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {const address = probe.address(); const port = typeof address === 'object' && address ? address.port : 0; probe.close(() => resolve(port));});
  });
  const base = 'http://127.0.0.1:' + port;
  let child: ChildProcess | undefined;
  let output = '';
  async function start() {
    child = spawn(process.execPath, ['--import', 'tsx', 'tests/fixtures/supabase-server.ts'], {cwd: root,
      env: {...process.env, TOEIC_LOCAL_DEMO: '1', TOEIC_LOCAL_API_PORT: String(port), TOEIC_LOCAL_DATA_DIR: directory, NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100'},
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true,
    });
    child.stdout?.on('data', value => {output += value;}); child.stderr?.on('data', value => {output += value;});
    const deadline = Date.now() + 25000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(output);
      try {const response = await fetch(base + '/health', {signal: AbortSignal.timeout(1000)}); if (response.ok) return;} catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Local server did not become ready: ' + output);
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const active = child;
    const exited = new Promise<void>(resolve => active.once('exit', () => resolve()));
    if (active.connected) active.send('shutdown');
    const timer = setTimeout(() => active.kill('SIGKILL'), 5000);
    await exited; clearTimeout(timer);
  }
  const call = (route: string, data: unknown, token?: string) => fetch(base + route, {method: 'POST', headers: {'Content-Type': 'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {})}, body: JSON.stringify(data)});
  try {
    await start();
    const email = 'persisted@example.test';
    await call('/auth/v1/signup', {email, password: 'Initial-local-123', data: {display_name: 'Tên được giữ lại'}});
    assert.equal((await call('/auth/v1/token?grant_type=password', {email, password: 'Initial-local-123'})).status, 400);
    const inbox = await (await fetch(base + '/demo/inbox')).text();
    assert.ok(inbox.includes(email));
    const tokenHash = inbox.match(/token_hash=([^&"]+)/)?.[1];
    assert.ok(tokenHash);
    const confirmation = await call('/auth/v1/verify', {token_hash: tokenHash, type: 'signup'});
    const session = await confirmation.json();
    assert.equal(confirmation.status, 200);
    assert.equal((await call('/auth/v1/verify', {token_hash: tokenHash, type: 'signup'})).status, 403);
    const attempt = await (await call('/rest/v1/rpc/start_attempt', {p_exam: 'mini-01'}, session.access_token)).json();
    await call('/rest/v1/rpc/save_answer', {p_attempt: attempt, p_question: 'q-01', p_choice: 0}, session.access_token);
    const submitted = await (await call('/rest/v1/rpc/submit_attempt', {p_attempt: attempt}, session.access_token)).json();
    assert.equal(submitted.score, 1);
    const update = await fetch(base + '/auth/v1/user', {method: 'PUT', headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token}, body: JSON.stringify({password: 'Changed-local-456'})});
    assert.equal(update.status, 200);
    assert.equal((await call('/__test__/deadline', {id: attempt}, session.access_token)).status, 404);
    await stop(); await start();
    assert.equal((await call('/auth/v1/token?grant_type=password', {email, password: 'Initial-local-123'})).status, 400);
    const login = await (await call('/auth/v1/token?grant_type=password', {email, password: 'Changed-local-456'})).json();
    assert.equal(login.user.user_metadata.display_name, 'Tên được giữ lại');
    const result = await (await call('/rest/v1/rpc/get_result', {p_attempt: attempt}, login.access_token)).json();
    assert.equal(result.attempt.score, 1);
    assert.equal(result.questions.length, 20);
    assert.equal((await fetch(base + '/rest/v1/attempts')).status, 401);
    await stop();
    const db = await createDatabase(join(directory, 'database'));
    try {
      const {rows} = await db.query<{password_hash: string}>('select password_hash from local_demo.accounts where email=$1', [email]);
      assert.ok(!rows[0].password_hash.includes('Changed-local-456'));
      assert.equal((await db.query('select * from local_demo.migrations')).rows.length, 2);
    } finally {await db.close();}
  } finally {
    await stop();
    const target = resolve(directory);
    if (!target.startsWith(resolve(tmpdir()) + '\\toeic-local-test-') && !target.startsWith(resolve(tmpdir()) + '/toeic-local-test-')) throw new Error('Unexpected cleanup path');
    await rm(target, {recursive: true, force: true});
  }
});
