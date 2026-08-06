import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout';
import { DashboardPage } from './pages/dashboard';
import { ProductsPage } from './pages/products';
import { StockPage } from './pages/stock';
import { ServicesPage } from './pages/services';
import { SalePage } from './pages/sale';
import { HistoryPage } from './pages/history';
import { CashPage } from './pages/cash';
import { ReportsPage } from './pages/reports';
import { SettingsPage } from './pages/settings';

export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route path="/" element={<DashboardPage />} /><Route path="/venda" element={<SalePage />} /><Route path="/estoque" element={<StockPage />} />
    <Route path="/produtos/pneus" element={<ProductsPage type="TIRE" />} /><Route path="/produtos/rodas" element={<ProductsPage type="WHEEL" />} /><Route path="/produtos/bicos" element={<ProductsPage type="VALVE" />} />
    <Route path="/servicos" element={<ServicesPage />} /><Route path="/historico" element={<HistoryPage />} /><Route path="/caixa" element={<CashPage />} /><Route path="/relatorios" element={<ReportsPage />} /><Route path="/configuracoes" element={<SettingsPage />} />
  </Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
