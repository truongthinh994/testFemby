import 'server-only';

export function localDemo() {
  return process.env.TOEIC_LOCAL_DEMO === '1'
    && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === 'local-demo-only'
    && /^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
}

export function localMailbox() {
  if (!localDemo()) return null;
  const value = process.env.TOEIC_LOCAL_MAILBOX_URL;
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' && url.hostname === '127.0.0.1' ? url.href : null;
  } catch {return null;}
}
