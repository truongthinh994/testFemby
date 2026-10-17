import './globals.css';
import type {Metadata} from 'next';
import {localDemo, localMailbox} from '@/lib/local-demo';

export const metadata: Metadata = {title: 'TOEIC Master — Học mỗi ngày', description: 'Học từ vựng và luyện mini test Listening & Reading.'};
export default function Layout({children}: {children: React.ReactNode}) {
  const mailbox = localMailbox();
  return <html lang="vi"><body>{localDemo() && <aside className="local-banner" aria-label="Thông tin bản local"><strong>Bản local</strong><span>Tiến độ lưu trên máy này. Email được mô phỏng.</span>{mailbox && <a href={mailbox} target="_blank" rel="noreferrer">Hộp thư mô phỏng ↗</a>}</aside>}{children}</body></html>;
}
