'use client';
import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Clock} from 'lucide-react';
import {command} from '@/app/actions';
import {AnswerQueue, type SaveState} from '@/lib/answer-queue';
import {secondsLeft, type Attempt, type Question, type Payload} from '@/lib/domain';
import {Audio, Modal} from './study-controls';

export function ExamView({attempt: a, questions, answers, groups, serverNow, title}: {
  attempt: Attempt; questions: Question[]; answers: Record<string, number>;
  groups: Payload['groups']; serverNow: number; title: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState(answers);
  const [left, setLeft] = useState(() => secondsLeft(a.expires_at, serverNow));
  const [saveState, setSaveState] = useState<SaveState>({pending: 0, error: '', closed: false});
  const [error, setError] = useState('');
  const [modal, setModal] = useState<string | null>(null);
  const [destination, setDestination] = useState('/dashboard');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const expired = useRef(false);
  const [queue] = useState(() => new AnswerQueue(
    (id, choice) => command('save_answer', {p_attempt: a.id, p_question: id, p_choice: choice}),
    setSaveState,
  ));

  useEffect(() => {
    const started = performance.now();
    const tick = () => setLeft(secondsLeft(a.expires_at, serverNow + performance.now() - started));
    const timer = setInterval(tick, 1000);
    const refresh = () => {if (document.visibilityState === 'visible') tick();};
    document.addEventListener('visibilitychange', refresh);
    return () => {clearInterval(timer); document.removeEventListener('visibilitychange', refresh);};
  }, [a.expires_at, serverNow]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState.pending) {event.preventDefault(); event.returnValue = '';}
    };
    const leave = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (link instanceof HTMLAnchorElement && link.origin === location.origin && link.pathname !== location.pathname) {
        event.preventDefault(); event.stopPropagation();
        setDestination(link.pathname + link.search); setModal('leave');
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', leave, true);
    return () => {window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', leave, true);};
  }, [saveState.pending]);

  async function submit(automatic = false) {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    const saved = await queue.flush();
    if (!saved && !automatic) {
      setError('Còn đáp án chưa lưu. Hãy lưu lại trước khi nộp bài.');
      setModal(null); setBusy(false); submitting.current = false; return;
    }
    const result = await command('submit_attempt', {p_attempt: a.id});
    setBusy(false); submitting.current = false;
    if (result.error) {setError(result.error); setModal(null);}
    else router.replace('/result/' + a.id);
  }

  useEffect(() => {
    if (saveState.closed) router.replace('/result/' + a.id);
    if (left === 0 && !expired.current) {
      expired.current = true;
      queueMicrotask(() => {void submit(true);});
    }
  });

  function save(id: string, choice: number) {
    if (submitting.current || left === 0 || saveState.closed) return;
    setValues(v => ({...v, [id]: choice}));
    queue.enqueue(id, choice);
  }

  const q = questions[index];
  const group = groups.find(g => g.id === q?.group_id);
  const unanswered = questions.filter(q => values[q.id] === undefined).length;
  const numbers = <><h3>Danh sách câu hỏi</h3><div className="question-grid">{questions.map((question, i) => <button
    className={'number ' + (values[question.id] !== undefined ? 'done ' : '') + (index === i ? 'current' : '')}
    key={question.id} aria-label={'Câu ' + (i + 1) + (values[question.id] !== undefined ? ', đã trả lời' : ', chưa trả lời')}
    aria-current={index === i ? 'step' : undefined} onClick={() => {setIndex(i); setModal(null);}}
  >{i + 1}{values[question.id] !== undefined && <span aria-hidden="true" className="answered-mark">✓</span>}</button>)}</div><p className="muted">✓ Đã trả lời · Viền xanh: câu hiện tại</p></>;

  if (!q) return <section className="card empty"><h1>Chưa tải được câu hỏi</h1><button onClick={() => router.refresh()}>Thử lại</button></section>;
  return <>
    <div className="exam-toolbar"><div><strong>{title}</strong><p className="muted">{group?.section} · Câu {index + 1}/{questions.length}</p></div><div className={'timer ' + (left < 60 ? 'danger' : '')} aria-label="Thời gian còn lại"><Clock size={18}/>{Math.floor(left / 60).toString().padStart(2, '0')}:{(left % 60).toString().padStart(2, '0')}</div><button disabled={busy} onClick={() => setModal('submit')}>Nộp bài</button><button className="secondary" disabled={busy} onClick={() => {setDestination('/dashboard'); setModal('leave');}}>Thoát</button></div>
    {(error || saveState.error) && <div className="notice error" role="alert">{error || saveState.error}<div className="actions">{left > 0 && saveState.pending > 0 && <button className="secondary small" onClick={() => {setError(''); queue.retry();}}>Lưu lại đáp án</button>}{left === 0 && <button disabled={busy} onClick={() => submit(true)}>Thử nộp lại</button>}</div></div>}
    <div className="exam-grid"><section className="card question-card">{group?.audio_url && <Audio src={group.audio_url}/>} {group?.passage && <div className="passage">{group.passage}</div>}<span className="chip">Câu {index + 1}</span><h2>{q.prompt}</h2><div className="stack">{q.options.map((option, i) => <button disabled={busy || left === 0 || saveState.closed} className={'answer ' + (values[q.id] === i ? 'selected' : '')} key={i} onClick={() => save(q.id, i)} aria-pressed={values[q.id] === i}><span>{'ABCD'[i]}</span><span className="answer-text">{option}{values[q.id] === i && <small>✓ Đã chọn</small>}</span></button>)}</div><div className="actions"><button className="secondary" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>← Câu trước</button><button disabled={index === questions.length - 1} onClick={() => setIndex(i => i + 1)}>Câu sau →</button></div><p className="muted" role="status">{saveState.pending ? (saveState.error ? 'Có đáp án chưa lưu' : 'Đang lưu…') : 'Đã lưu'}</p><button className="secondary mobile-only" onClick={() => setModal('numbers')}>Danh sách câu hỏi</button></section><aside className="card desktop-only">{numbers}<p className="muted">Đồng hồ tiếp tục chạy khi tải lại trang.</p></aside></div>
    {modal && <Modal title={modal === 'submit' ? 'Nộp bài thi?' : modal === 'leave' ? 'Thoát bài thi?' : 'Chọn câu hỏi'} onClose={() => {if (!busy) setModal(null);}}>{modal === 'numbers' ? numbers : <><p>{modal === 'submit' ? 'Bạn còn ' + unanswered + ' câu chưa trả lời. Câu bỏ trống được tính là sai.' : 'Bạn có thể tiếp tục lượt thi trong danh sách đề. Đồng hồ vẫn tiếp tục chạy.'}</p>{saveState.pending > 0 && <p className="notice error">Có đáp án chưa lưu. Hãy quay lại và lưu trước khi rời bài.</p>}<div className="actions"><button className="secondary" disabled={busy} onClick={() => setModal(null)}>Tiếp tục làm bài</button><button disabled={busy || saveState.pending > 0} onClick={modal === 'submit' ? () => submit(left === 0) : () => router.push(destination)}>{busy ? 'Đang nộp…' : modal === 'submit' ? 'Xác nhận nộp bài' : 'Rời bài thi'}</button></div></>}</Modal>}
  </>;
}
