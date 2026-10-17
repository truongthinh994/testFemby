import {createConnection} from 'node:net';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = process.env.TOEIC_LOCAL_DATA_DIR ? path.resolve(root, process.env.TOEIC_LOCAL_DATA_DIR) : path.join(root, '.local-demo');
try {
  const info = JSON.parse(await readFile(path.join(dataDir, 'control.json'), 'utf8'));
  if (info.root !== root || ![info.appPort, info.apiPort].every(port => Number.isInteger(port) && port >= 1024 && port <= 65535)) throw new Error('Thông tin tiến trình local không hợp lệ.');
  const name = 'toeic-local-' + createHash('sha256').update(root).digest('hex').slice(0, 16) + '-' + info.appPort;
  const expected = process.platform === 'win32' ? '\\\\.\\pipe\\' + name : path.join(dataDir, name + '.sock');
  if (info.pipe !== expected) throw new Error('Sai địa chỉ điều khiển bản local.');
  await new Promise((resolve, reject) => {
    const socket = createConnection(info.pipe);
    socket.setTimeout(5000, () => {socket.destroy(); reject(new Error('Không liên lạc được với bản local.'));});
    socket.once('connect', () => socket.end('stop'));
    socket.once('error', reject); socket.on('data', () => {}); socket.once('close', resolve);
  });
  const listening = port => new Promise(resolve => {
    const socket = createConnection({host: '127.0.0.1', port});
    socket.once('connect', () => {socket.destroy(); resolve(true);}); socket.once('error', () => resolve(false));
  });
  const deadline = Date.now() + 12000;
  while (await listening(info.appPort) || await listening(info.apiPort)) {
    if (Date.now() > deadline) throw new Error('Ứng dụng đang dừng lâu hơn dự kiến.');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log('Đã dừng bản local. Dữ liệu học được giữ lại.');
} catch (error) {
  if (error.code === 'ENOENT' || error.code === 'ECONNREFUSED') console.log('Không có bản local đang chạy trong thư mục này.');
  else {console.error(error.message); process.exitCode = 1;}
}
