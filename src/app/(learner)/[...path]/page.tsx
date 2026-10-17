import Link from 'next/link';
import {notFound} from 'next/navigation';
import {configured} from '@/lib/supabase/server';
import {loadWorkspace} from '@/lib/load-workspace';
import {Workspace} from '@/components/workspace';

export const dynamic = 'force-dynamic';
export default async function Page({params}: {params: Promise<{path: string[]}>}) {
  const {path} = await params;
  const [view, id] = path;
  const needsId = ['study', 'attempt', 'result'].includes(view);
  if (!['dashboard', 'vocabulary', 'study', 'exams', 'attempt', 'result', 'history'].includes(view)
    || path.length !== (needsId ? 2 : 1)
    || (needsId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) notFound();
  if (!configured()) return <main className="center-page"><section className="card"><div className="brand"><span>T</span>TOEIC Master</div><h1>Kết nối dịch vụ học tập</h1><p>Ứng dụng cần cấu hình Supabase trước khi đăng nhập và lưu tiến độ.</p><p className="muted">Thực hiện các bước trong README của dự án, sau đó tải lại trang.</p><Link className="button" href="/auth/login">Xem trang đăng nhập</Link></section></main>;
  const payload = await loadWorkspace(view, id);
  return <Workspace key={view + '/' + (id || '')} data={payload}/>;
}
