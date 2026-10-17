import Link from 'next/link';
import {notFound} from 'next/navigation';
import {AuthForm} from '@/components/auth-form';
import {configured} from '@/lib/supabase/server';
import {safeNext} from '@/lib/domain';
import {localDemo, localMailbox} from '@/lib/local-demo';

export default async function AuthPage({params, searchParams}: {params: Promise<{mode: string}>; searchParams: Promise<Record<string, string | undefined>>}) {
  const {mode} = await params;
  const query = await searchParams;
  const titles: Record<string, string> = {login: 'Đăng nhập', signup: 'Tạo tài khoản', forgot: 'Quên mật khẩu', reset: 'Đặt lại mật khẩu', verify: 'Kiểm tra email của bạn'};
  if (!titles[mode]) notFound();
  const demo = localDemo();
  const mailbox = localMailbox();
  return <main className="auth-page"><aside className="auth-hero"><div className="brand"><span>T</span>TOEIC Master</div><h1>Ôn thi TOEIC 2 kỹ năng<br/>hiệu quả mỗi ngày</h1><ul><li>Flashcard từ vựng và lịch ôn tập cá nhân</li><li>Mini test 20 câu có tính giờ, chấm điểm tự động</li><li>Lưu tiến độ và xem lời giải sau mỗi bài thi</li></ul></aside><section className="auth-panel"><div className="auth-box"><div className="mobile-brand brand"><span>T</span>TOEIC Master</div><h1>{titles[mode]}</h1><p className="muted">{mode === 'verify' ? (demo ? 'Mở hộp thư mô phỏng để xác nhận tài khoản hoặc đặt lại mật khẩu.' : 'Nếu email hợp lệ, bạn sẽ nhận được liên kết. Hãy kiểm tra cả thư mục spam.') : 'Tiếp tục hành trình ôn thi của bạn.'}</p>
    {demo && mode === 'login' && <div className="notice local-account"><strong>Tài khoản mẫu</strong><span>alice@example.test</span><span>Mật khẩu: <code>Test-password-123</code></span></div>}
    {query.error && <p className="notice error" role="alert">Liên kết không hợp lệ hoặc đã hết hạn.</p>}
    {mode === 'verify' ? <div className="stack">{mailbox && <a className="button" href={mailbox} target="_blank" rel="noreferrer">Mở hộp thư mô phỏng</a>}<Link className={'button ' + (mailbox ? 'secondary' : '')} href="/auth/login">Quay lại đăng nhập</Link></div> : <AuthForm mode={mode} next={safeNext(query.next || null)} available={configured()}/>}
  </div></section></main>;
}
