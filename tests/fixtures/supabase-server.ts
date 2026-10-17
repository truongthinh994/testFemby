// Loopback-only Auth/HTTP simulation for E2E and the explicit `npm run local` demo.
// The application never imports this adapter in production.
import {createServer} from 'node:http';
import {createHmac, randomUUID, scryptSync, timingSafeEqual} from 'node:crypto';
import {resolve} from 'node:path';
import {ALICE, BOB, asUser, createDatabase} from '../helpers/database';

type Account = {id: string; email: string; name: string; password_hash: string; confirmed: boolean};
function passwordHash(password: string) {
  const salt = randomUUID();
  return salt + ':' + scryptSync(password, salt, 32).toString('hex');
}
function passwordMatches(password: string, hash: string) {
  const [salt, hex] = hash.split(':');
  const expected = Buffer.from(hex, 'hex');
  const actual = scryptSync(password, salt, 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

async function main() {
  const demo = process.env.TOEIC_LOCAL_DEMO === '1';
  const port = Number(demo ? process.env.TOEIC_LOCAL_API_PORT || 54330 : 54329);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local API port');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3100';
  if (new URL(siteUrl).hostname !== '127.0.0.1') throw new Error('Local demo requires a loopback app URL');
  const dataDir = demo ? resolve(process.env.TOEIC_LOCAL_DATA_DIR || '.local-demo', 'database') : undefined;
  const db = await createDatabase(dataDir);
  await db.exec(`create table if not exists local_demo.accounts(
    email text primary key,id uuid not null references auth.users on delete cascade,
    name text not null,password_hash text not null,confirmed boolean not null default false);`);
  for (const [email, id, name] of [['alice@example.test', ALICE, 'Người học thử'], ['bob@example.test', BOB, 'Người học thứ hai']]) {
    await db.query('insert into local_demo.accounts(email,id,name,password_hash,confirmed) values($1,$2,$3,$4,true) on conflict(email) do nothing', [email, id, name, passwordHash('Test-password-123')]);
  }
  const users = new Map((await db.query<Account>('select * from local_demo.accounts')).rows.map(account => [account.email, account]));
  const sessions = new Map<string, string>();
  const tokens = new Map<string, {id: string; type: string}>();
  const messages: {email: string; type: string; link: string}[] = [];
  let failSave = false;
  const userFor = (id: string) => {
    const record = [...users.values()].find(value => value.id === id)!;
    return {id, email: record.email, aud: 'authenticated', role: 'authenticated', email_confirmed_at: record.confirmed ? new Date().toISOString() : null, created_at: new Date().toISOString(), app_metadata: {provider: 'email', providers: ['email']}, user_metadata: {display_name: record.name}, identities: []};
  };
  function session(id: string) {
    const now = Math.floor(Date.now() / 1000);
    const data = [Buffer.from(JSON.stringify({alg: 'HS256', typ: 'JWT'})).toString('base64url'), Buffer.from(JSON.stringify({sub: id, aud: 'authenticated', role: 'authenticated', iat: now, exp: now + 3600})).toString('base64url')].join('.');
    const access = data + '.' + createHmac('sha256', 'local-test-secret').update(data).digest('base64url');
    const refresh = randomUUID();
    sessions.set(access, id); sessions.set(refresh, id);
    return {access_token: access, refresh_token: refresh, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, user: userFor(id)};
  }
  function issueEmail(email: string, type: string) {
    const record = users.get(email);
    if (!record || !demo) return;
    const token = randomUUID();
    tokens.set(token, {id: record.id, type});
    messages.unshift({email, type, link: siteUrl + '/auth/callback?token_hash=' + token + '&type=' + type});
    messages.splice(20);
    console.log('Hộp thư mô phỏng: http://127.0.0.1:' + port + '/demo/inbox');
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1:' + port);
    const send = (status: number, body: unknown) => {res.writeHead(status, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(body));};
    try {
      if (demo && url.pathname === '/demo/inbox' && req.method === 'GET') {
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"});
        res.end('<!doctype html><html lang="vi"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hộp thư local — TOEIC Master</title><style>body{font:16px/1.6 system-ui;background:#f5f7fb;color:#0f172a;max-width:720px;margin:40px auto;padding:20px}article{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin:20px 0;overflow-wrap:anywhere}a{color:#2563eb}</style><h1>Hộp thư mô phỏng</h1><p>Thư chỉ xuất hiện trên máy này, không được gửi qua Internet. Liên kết dùng một lần và hết hiệu lực khi dừng bản local.</p><p><a href="' + escapeHtml(siteUrl) + '">Quay lại TOEIC Master</a></p>' + (messages.length ? messages.map(message => '<article><p>' + escapeHtml(message.email) + '</p><h2>' + (message.type === 'recovery' ? 'Đặt lại mật khẩu' : 'Xác nhận tài khoản') + '</h2><a href="' + escapeHtml(message.link) + '">Mở liên kết</a></article>').join('') : '<article>Chưa có thư. Hãy đăng ký hoặc yêu cầu khôi phục mật khẩu trong ứng dụng, rồi tải lại trang này.</article>') + '</html>');
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {size += chunk.length; if (size > 65536) return send(413, {message: 'Request too large'}); chunks.push(Buffer.from(chunk));}
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
      const id = sessions.get((req.headers.authorization || '').replace(/^Bearer /i, ''));
      if (url.pathname === '/health') return send(200, {ok: true, mode: demo ? 'demo' : 'test'});
      if (!demo && url.pathname === '/__test__/failure') {failSave = Boolean(body.fail); return send(200, {});}
      if (!demo && url.pathname === '/__test__/expire') {await db.query("update public.attempts set started_at=now()-interval '21 minutes',expires_at=now()-interval '1 minute' where id=$1", [body.id]); return send(200, {});}
      if (!demo && url.pathname === '/__test__/deadline') {await db.query("update public.attempts set expires_at=now()+interval '3 seconds' where id=$1", [body.id]); return send(200, {});}
      if (url.pathname === '/auth/v1/signup') {
        if (!users.has(body.email)) {
          const account: Account = {id: randomUUID(), email: body.email, name: body.data?.display_name || 'Bạn', password_hash: passwordHash(body.password), confirmed: !demo};
          await db.transaction(async tx => {
            await tx.query('insert into auth.users(id,email) values($1,$2)', [account.id, account.email]);
            await tx.query('insert into local_demo.accounts(email,id,name,password_hash,confirmed) values($1,$2,$3,$4,$5)', [account.email, account.id, account.name, account.password_hash, account.confirmed]);
          });
          users.set(account.email, account);
        }
        issueEmail(body.email, 'signup');
        return send(200, userFor(users.get(body.email)!.id));
      }
      if (url.pathname === '/auth/v1/token') {
        const record = users.get(body.email);
        const uid = url.searchParams.get('grant_type') === 'refresh_token' ? sessions.get(body.refresh_token) : record?.confirmed && passwordMatches(body.password || '', record.password_hash) ? record.id : null;
        return uid ? send(200, session(uid)) : send(400, {error: 'invalid_grant', error_description: 'Invalid login credentials'});
      }
      if (url.pathname === '/auth/v1/verify') {
        const issued = tokens.get(body.token_hash);
        if (demo && issued && issued.type === body.type) {
          tokens.delete(body.token_hash);
          const record = [...users.values()].find(value => value.id === issued.id)!;
          record.confirmed = true;
          await db.query('update local_demo.accounts set confirmed=true where id=$1', [record.id]);
          return send(200, session(record.id));
        }
        return !demo && body.token_hash === 'recovery-alice' ? send(200, session(ALICE)) : send(403, {msg: 'Invalid token'});
      }
      if (url.pathname === '/auth/v1/recover') {issueEmail(body.email, 'recovery'); return send(200, {});}
      if (url.pathname === '/auth/v1/logout') {if (id) for (const [token, userId] of sessions) if (userId === id) sessions.delete(token); return send(200, {});}
      if (url.pathname === '/auth/v1/user' && id) {
        if (req.method === 'PUT' && body.password) {
          const record = [...users.values()].find(record => record.id === id)!;
          const hash = passwordHash(body.password);
          await db.query('update local_demo.accounts set password_hash=$1 where id=$2', [hash, id]);
          record.password_hash = hash;
        }
        return send(200, userFor(id));
      }
      if (!id) return send(401, {msg: 'Authentication required'});
      if (url.pathname.startsWith('/rest/v1/rpc/')) {
        const name = url.pathname.split('/').at(-1)!;
        const signatures: Record<string, string[]> = {
          start_attempt: ['p_exam'], save_answer: ['p_attempt', 'p_question', 'p_choice'],
          submit_attempt: ['p_attempt'], get_result: ['p_attempt'], start_study: ['p_topic'],
          rate_word: ['p_session', 'p_word', 'p_grade'], complete_study: ['p_session', 'p_answers'],
        };
        if (!signatures[name]) return send(404, {});
        if (name === 'save_answer' && failSave) return send(503, {message: 'Simulated connection failure'});
        const args = signatures[name].map(key => typeof body[key] === 'object' && body[key] !== null ? JSON.stringify(body[key]) : body[key]);
        const {rows} = await asUser(db, id, tx => tx.query<{value: unknown}>(`select public.${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) value`, args));
        return send(200, rows[0].value);
      }
      if (url.pathname.startsWith('/rest/v1/')) {
        const table = url.pathname.split('/').at(-1)!;
        if (!['topics', 'words', 'attempts', 'progress', 'exams', 'study_sessions', 'questions', 'question_groups', 'answers'].includes(table) || req.method !== 'GET') return send(405, {});
        const clauses: string[] = [];
        const args: string[] = [];
        for (const [column, value] of url.searchParams) {
          if (['exam_id', 'attempt_id', 'id'].includes(column) && value.startsWith('eq.')) {args.push(value.slice(3)); clauses.push(column + '=$' + args.length);}
        }
        const order = url.searchParams.get('order')?.split('.') || [];
        const ordering = ['id', 'started_at', 'created_at', 'position'].includes(order[0]) ? ' order by ' + order[0] + (order[1] === 'desc' ? ' desc' : ' asc') : '';
        const {rows} = await asUser(db, id, tx => tx.query('select * from public.' + table + (clauses.length ? ' where ' + clauses.join(' and ') : '') + ordering, args));
        return send(200, rows);
      }
      send(404, {message: 'Not found'});
    } catch (error) {send(400, {message: error instanceof Error ? error.message : 'Local adapter error'});}
  });
  server.on('error', async error => {console.error(error); await db.close(); process.exit(1);});
  server.listen(port, '127.0.0.1', () => console.log('Local ' + (demo ? 'demo' : 'test') + ' database ready on ' + port + '. Auth/email are simulated.'));
  let closing = false;
  async function close() {if (closing) return; closing = true; server.close(); await db.close(); process.exit(0);}
  process.on('SIGINT', close); process.on('SIGTERM', close);
  process.on('message', message => {if (message === 'shutdown') void close();});
}
main().catch(error => {console.error(error); process.exit(1);});
