'use server';
import {redirect} from 'next/navigation';
import {supabase, configured} from '@/lib/supabase/server';
import {safeNext} from '@/lib/domain';

export async function authenticate(_state: {error: string}, form: FormData): Promise<{error: string}> {
  if (!configured()) return {error: 'Dịch vụ tài khoản chưa được cấu hình.'};
  const mode = String(form.get('mode'));
  if (!['login', 'signup', 'forgot', 'reset'].includes(mode)) return {error: 'Yêu cầu không hợp lệ.'};
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const next = safeNext(String(form.get('next') || ''));
  if (mode !== 'reset' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {error: 'Nhập địa chỉ email hợp lệ.'};
  if (mode !== 'forgot' && password.length < 8) return {error: 'Mật khẩu cần ít nhất 8 ký tự.'};
  if (['signup', 'reset'].includes(mode) && password !== form.get('confirm')) return {error: 'Mật khẩu xác nhận chưa khớp.'};
  let destination = next;
  try {
    const db = await supabase();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    if (mode === 'login') {
      const {error} = await db.auth.signInWithPassword({email, password});
      if (error) return {error: 'Email hoặc mật khẩu chưa đúng, hoặc email chưa được xác nhận.'};
    } else if (mode === 'signup') {
      const {error} = await db.auth.signUp({email, password, options: {
        data: {display_name: String(form.get('name') || 'Bạn').trim().slice(0, 80)},
        emailRedirectTo: origin + '/auth/callback?next=' + encodeURIComponent(next),
      }});
      if (error) return {error: 'Chưa thể tạo tài khoản. Hãy kiểm tra thông tin hoặc thử lại sau.'};
      destination = '/auth/verify?kind=signup';
    } else if (mode === 'forgot') {
      const {error} = await db.auth.resetPasswordForEmail(email, {redirectTo: origin + '/auth/callback?next=/auth/reset'});
      if (error) return {error: 'Chưa gửi được email. Vui lòng thử lại sau.'};
      destination = '/auth/verify?kind=recovery';
    } else {
      const {data: {user}} = await db.auth.getUser();
      if (!user) return {error: 'Liên kết đã hết hạn. Hãy yêu cầu email khôi phục mới.'};
      const {error} = await db.auth.updateUser({password});
      if (error) return {error: 'Chưa đổi được mật khẩu. Vui lòng thử lại.'};
      destination = '/dashboard';
    }
  } catch {
    return {error: 'Mất kết nối tới dịch vụ tài khoản. Vui lòng thử lại.'};
  }
  redirect(destination);
}

export async function signout() {
  if (configured()) {const db = await supabase(); await db.auth.signOut();}
  redirect('/auth/login');
}
