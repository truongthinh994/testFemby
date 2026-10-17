'use client';
import {useActionState, useState, useSyncExternalStore} from 'react';
import Link from 'next/link';
import {authenticate} from '@/app/auth/actions';

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function AuthForm({mode, next, available}: {mode: string; next: string; available: boolean}) {
  const [state, action, pending] = useActionState(authenticate, {error: ''});
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const disabled = !hydrated || pending;
  const labels: Record<string, string> = {login: 'Đăng nhập', signup: 'Tạo tài khoản', forgot: 'Gửi liên kết', reset: 'Lưu mật khẩu'};
  return <form action={action} className="stack" aria-busy={pending}>
    <input type="hidden" name="mode" value={mode}/><input type="hidden" name="next" value={next}/>
    {mode === 'signup' && <label>Họ và tên<input name="name" value={name} onChange={e => setName(e.target.value)} disabled={disabled} autoComplete="name" required maxLength={80} placeholder="Nguyễn Văn A"/></label>}
    {mode !== 'reset' && <label>Email<input name="email" value={email} onChange={e => setEmail(e.target.value)} disabled={disabled} type="email" autoComplete="email" required placeholder="ban@email.com"/></label>}
    {mode !== 'forgot' && <label>Mật khẩu<input name="password" value={password} onChange={e => setPassword(e.target.value)} disabled={disabled} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required placeholder="Ít nhất 8 ký tự"/></label>}
    {['signup', 'reset'].includes(mode) && <label>Xác nhận mật khẩu<input name="confirm" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={disabled} type="password" autoComplete="new-password" minLength={8} required/></label>}
    {mode === 'login' && <Link className="text-link right" href={'/auth/forgot?next=' + encodeURIComponent(next)}>Quên mật khẩu?</Link>}
    {state.error && <p className="notice error" role="alert">{state.error}</p>}
    {!available && <p className="notice">Dịch vụ tài khoản chưa được kết nối. Xem hướng dẫn cấu hình trong README của dự án.</p>}
    <button disabled={disabled || !available}>{!hydrated ? 'Đang tải…' : pending ? 'Đang xử lý…' : labels[mode]}</button>
    <p className="muted">{mode === 'login' ? <>Chưa có tài khoản? <Link href={'/auth/signup?next=' + encodeURIComponent(next)}>Đăng ký ngay</Link></> : <Link href={'/auth/login?next=' + encodeURIComponent(next)}>Quay lại đăng nhập</Link>}</p>
  </form>;
}
