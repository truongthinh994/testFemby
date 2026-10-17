import {NextResponse, type NextRequest} from 'next/server';
import {supabase, configured} from '@/lib/supabase/server';
import {safeNext} from '@/lib/domain';
import type {EmailOtpType} from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const failure = new URL('/auth/login?error=expired', origin);
  if (!configured()) return NextResponse.redirect(failure);
  const params = req.nextUrl.searchParams;
  const code = params.get('code');
  const hash = params.get('token_hash');
  const type = params.get('type');
  const allowedTypes = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];
  try {
    const db = await supabase();
    const result = code ? await db.auth.exchangeCodeForSession(code)
      : hash && type && allowedTypes.includes(type) ? await db.auth.verifyOtp({token_hash: hash, type: type as EmailOtpType})
        : {error: true};
    const next = type === 'recovery' ? '/auth/reset' : safeNext(params.get('next'));
    return NextResponse.redirect(result.error ? failure : new URL(next, origin));
  } catch {
    return NextResponse.redirect(failure);
  }
}
