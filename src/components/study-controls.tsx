'use client';
import {useEffect, useRef, useState} from 'react';
import {Headphones, X} from 'lucide-react';

export function Modal({title, children, onClose}: {title: string; children: React.ReactNode; onClose: () => void}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} onCancel={e => {e.preventDefault(); onClose();}} onClick={e => {if (e.target === ref.current) onClose();}} aria-labelledby="modal-title">
    <div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button secondary" aria-label="Đóng hộp thoại" onClick={onClose}><X size={18}/></button></div>
    {children}
  </dialog>;
}

export function Audio({src}: {src: string}) {
  return <AudioPlayer key={src} src={src}/>;
}

function AudioPlayer({src}: {src: string}) {
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  return <div className="audio-box"><Headphones size={22} aria-hidden="true"/>{failed
    ? <div role="alert">Không tải được audio. <button className="secondary small" onClick={() => {setFailed(false); setVersion(v => v + 1);}}>Thử lại audio</button></div>
    : <audio key={version} aria-label="Audio luyện nghe" controls preload="none" src={src} onError={() => setFailed(true)}>Trình duyệt không hỗ trợ audio.</audio>}
  </div>;
}
