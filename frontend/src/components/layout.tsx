import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Boxes, BriefcaseBusiness, CircleDollarSign, ClipboardList, Gauge, History, PackagePlus, Settings, ShoppingCart, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Settings as SettingsType } from '../types';

const nav = [
  ['/', 'Dashboard', Gauge], ['/venda', 'Nova venda', ShoppingCart], ['/estoque', 'Estoque', Boxes],
  ['/produtos/pneus', 'Pneus', PackagePlus], ['/produtos/rodas', 'Rodas', CircleDollarSign], ['/produtos/bicos', 'Bicos', Wrench],
  ['/servicos', 'Serviços', BriefcaseBusiness], ['/historico', 'Histórico', History], ['/caixa', 'Caixa', ClipboardList], ['/relatorios', 'Relatórios', BarChart3], ['/configuracoes', 'Configurações', Settings],
] as const;

export function Layout() {
  const [company, setCompany] = useState('Pneu Pro Gestão');
  useEffect(() => { api<SettingsType>('/settings').then((settings) => setCompany(settings.companyName)).catch(() => {}); }, []);
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">PP</span><div><strong>{company}</strong><small>Gestão local</small></div></div>
      <nav>{nav.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'}><Icon size={19} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-footer"><span className="status-dot" /> Dados salvos neste computador</div>
    </aside>
    <main className="main-content"><Outlet /></main>
  </div>;
}
