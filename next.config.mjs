const localDemo = process.env.TOEIC_LOCAL_DEMO === '1'
  && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === 'local-demo-only'
  && /^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
const config = {
  distDir: localDemo ? process.env.TOEIC_LOCAL_DIST_DIR || (process.env.NODE_ENV === 'development' ? '.next-local' : '.next-local-build') : '.next',
  ...(localDemo ? {devIndicators: false} : {}),
};
export default config;
