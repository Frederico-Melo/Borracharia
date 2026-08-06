import { ReactNode } from 'react';
import { X, Inbox } from 'lucide-react';
import { money } from '../lib/format';

export const Money = ({ value, className = '' }: { value: number; className?: string }) => <span className={className}>{money(value)}</span>;
export const Loading = () => <div className="loading"><span className="spinner" /> Carregando dados…</div>;
export const Empty = ({ children = 'Nenhum registro encontrado.' }: { children?: ReactNode }) => <div className="empty"><Inbox size={28} />{children}</div>;
export const Badge = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) => <span className={`badge ${tone}`}>{children}</span>;

export function Modal({ title, children, onClose, width = 'normal' }: { title: string; children: ReactNode; onClose: () => void; width?: 'normal' | 'wide' }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className={`modal ${width}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></header>
      <div className="modal-content">{children}</div>
    </section>
  </div>;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-action">{action}</div>}</div>;
}
