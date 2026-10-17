import Link from 'next/link';
export default function NotFound() {
  return <main className="center-page"><section className="card center"><span className="chip">404</span><h1>Không tìm thấy nội dung</h1><p>Nội dung không tồn tại hoặc bạn chưa có quyền truy cập.</p><Link className="button" href="/dashboard">Về trang chủ</Link></section></main>;
}
