import { createContext, ReactNode, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type Notice = { id: number; kind: 'success' | 'error'; text: string };
const ToastContext = createContext<{ success: (text: string) => void; error: (text: string) => void }>({ success: () => {}, error: () => {} });
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const add = (kind: Notice['kind'], text: string) => { const id = Date.now(); setNotices((current) => [...current, { id, kind, text }]); window.setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 4500); };
  return <ToastContext.Provider value={{ success: (text) => add('success', text), error: (text) => add('error', text) }}>{children}<div className="toast-stack">{notices.map((notice) => <div key={notice.id} className={`toast ${notice.kind}`}>{notice.kind === 'success' ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}<span>{notice.text}</span><button onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))}><X size={16} /></button></div>)}</div></ToastContext.Provider>;
}
