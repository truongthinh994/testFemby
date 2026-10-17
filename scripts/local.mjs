import {spawn, execFile} from 'node:child_process';
import {createServer} from 'node:net';
import {createHash} from 'node:crypto';
import {mkdir, writeFile, readFile, unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const development = process.argv.includes('--dev');
const nextBin = path.join(root, 'node_modules/next/dist/bin/next');
const appPort = Number(process.env.TOEIC_LOCAL_APP_PORT || 3000);
const apiPort = Number(process.env.TOEIC_LOCAL_API_PORT || 54330);
if (![appPort, apiPort].every(port => Number.isInteger(port) && port >= 1024 && port <= 65535) || appPort === apiPort) throw new Error('Các cổng local phải khác nhau và nằm trong khoảng 1024–65535.');
const appUrl = 'http://127.0.0.1:' + appPort;
const apiUrl = 'http://127.0.0.1:' + apiPort;
const dataDir = process.env.TOEIC_LOCAL_DATA_DIR ? path.resolve(root, process.env.TOEIC_LOCAL_DATA_DIR) : path.join(root, '.local-demo');
const controlFile = path.join(dataDir, 'control.json');
const controlName = 'toeic-local-' + createHash('sha256').update(root).digest('hex').slice(0, 16) + '-' + appPort;
const controlPath = process.platform === 'win32' ? '\\\\.\\pipe\\' + controlName : path.join(dataDir, controlName + '.sock');
const children = [];
let stopping = false;
let exitCode = 0;
const running = child => child.exitCode === null && child.signalCode === null;
const control = createServer(socket => {
  socket.once('data', data => {if (data.toString() === 'stop') {socket.end('Đang dừng bản local.'); void stop();} else socket.end();});
});

function available(port) {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', () => reject(new Error('Cổng ' + port + ' đang được sử dụng. Dừng bản local cũ hoặc chọn cổng khác.')));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}
function start(args, env, persistent = true) {
  const child = spawn(process.execPath, args, {cwd: root, env, stdio: ['ignore', 'inherit', 'inherit', 'ipc'], windowsHide: true});
  children.push(child);
  child.once('error', error => {console.error(error.message); stop(1);});
  child.once('exit', code => {if (persistent && !stopping) {console.error('Tiến trình local đã dừng.'); stop(code || 1);}});
  return child;
}
async function stop(code = 0) {
  if (stopping) return;
  stopping = true; exitCode = code;
  if (control.listening) control.close();
  try {const info = JSON.parse(await readFile(controlFile, 'utf8')); if (info.pid === process.pid) await unlink(controlFile);} catch {}
  // Let the database flush before terminating the Next.js process tree on Windows.
  if (children[0]?.connected) children[0].send('shutdown', () => {});
  await Promise.race([children[0] && running(children[0]) ? new Promise(resolve => children[0].once('exit', resolve)) : Promise.resolve(), new Promise(resolve => setTimeout(resolve, 4000))]);
  for (const child of [...children].reverse()) if (running(child) && child.pid) {
    if (process.platform === 'win32') execFile('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {windowsHide: true}, () => {});
    else child.kill('SIGTERM');
  }
  const deadline = setTimeout(() => {for (const child of children) if (running(child)) child.kill('SIGKILL'); process.exit(exitCode);}, 5000);
  deadline.unref();
  await Promise.all(children.map(child => !running(child) ? Promise.resolve() : new Promise(resolve => child.once('exit', resolve))));
  clearTimeout(deadline);
  process.exit(exitCode);
}
async function ready(url) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline && !stopping) {
    try {if ((await fetch(url, {signal: AbortSignal.timeout(1500)})).ok) return;} catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Chưa khởi động được bản local. Xem thông báo lỗi phía trên.');
}
process.on('SIGINT', () => {void stop();}); process.on('SIGTERM', () => {void stop();});
process.on('message', message => {if (message === 'shutdown') void stop();});
try {
  await available(appPort); await available(apiPort); await mkdir(dataDir, {recursive: true});
  await new Promise((resolve, reject) => {control.once('error', reject); control.listen(controlPath, resolve);});
  await writeFile(controlFile, JSON.stringify({pid: process.pid, root, pipe: controlPath, appPort, apiPort}));
  const env = {...process.env, NODE_ENV: development ? 'development' : 'production', TOEIC_LOCAL_DEMO: '1', TOEIC_LOCAL_DATA_DIR: dataDir,
    TOEIC_LOCAL_API_PORT: String(apiPort), NEXT_PUBLIC_SITE_URL: appUrl,
    NEXT_PUBLIC_SUPABASE_URL: apiUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-demo-only',
    TOEIC_LOCAL_MAILBOX_URL: apiUrl + '/demo/inbox'};
  start(['--import', 'tsx', 'tests/fixtures/supabase-server.ts'], env);
  await ready(apiUrl + '/health');
  if (!development) {
    console.log('Đang chuẩn bị bản local tối ưu. Chờ hoàn tất trước khi mở trình duyệt…');
    const build = start([nextBin, 'build'], env, false);
    await new Promise((resolve, reject) => {
      build.once('exit', code => code === 0 ? resolve() : reject(new Error('Chưa biên dịch được bản local. Xem lỗi phía trên.')));
      build.once('error', reject);
    });
    if (stopping) throw new Error('Đã dừng bản local.');
  }
  start([nextBin, development ? 'dev' : 'start', '--hostname', '127.0.0.1', '--port', String(appPort)], env);
  await ready(appUrl + '/auth/login');
  console.log('\nTOEIC MASTER — BẢN LOCAL\nMở: ' + appUrl + '\nTài khoản: alice@example.test\nMật khẩu: Test-password-123\nHộp thư mô phỏng: ' + apiUrl + '/demo/inbox\nDữ liệu lưu tại ' + path.join(dataDir, 'database') + '.\nCtrl+C hoặc npm run local:stop để dừng.\n');
} catch (error) {console.error(error.message); await stop(1);}
