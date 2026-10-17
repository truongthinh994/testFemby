'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="center-page"><section className="card"><h1>Không thể tải dữ liệu</h1><p>Kiểm tra kết nối mạng rồi thử lại.</p><button onClick={reset}>Thử lại</button></section></main>;}
