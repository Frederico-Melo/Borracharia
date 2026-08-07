import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Banknote, CalendarDays, CircleDollarSign, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { money, paymentLabel, productName, shortDate, stockLocationLabel } from '../lib/format';
import { Dashboard } from '../types';
import { Badge, Empty, Loading, PageHeader } from '../components/ui';

export function DashboardPage() {
  const [data, setData] = useState<Dashboard>(); const [showCosts, setShowCosts] = useState(false);
  useEffect(() => { api<Dashboard>('/dashboard').then(setData).catch(() => {}); }, []);
  if (!data) return <Loading />;
  const cards = [
    ['Vendido hoje', money(data.todaySales), `${data.todayCount} venda${data.todayCount === 1 ? '' : 's'} registrada${data.todayCount === 1 ? '' : 's'}`, Banknote, 'teal'],
    ['Vendido no mês', money(data.monthSales), 'Faturamento acumulado', CalendarDays, 'blue'],
    ['Lucro no mês', money(data.monthProfit), 'Venda menos custo dos produtos', CircleDollarSign, 'green'],
    ['Estoque baixo', String(data.lowStock.length), 'Itens no limite mínimo', AlertTriangle, 'orange'],
  ] as const;
  return <div><PageHeader title="Bom trabalho!" description="Acompanhe a operação da borracharia em tempo real." action={<Link className="button primary" to="/venda"><ShoppingBag size={18} /> Nova venda</Link>} />
    <section className="stats-grid">{cards.map(([title, value, note, Icon, tone]) => <article key={title} className={`stat-card ${tone}`}><span className="stat-icon"><Icon size={22} /></span><div><small>{title}</small><strong>{value}</strong><p>{note}</p></div></article>)}</section>
    <section className="panel stock-summary"><div className="panel-heading"><div><h2>Valor do estoque</h2><p>Valores separados pelo preço de venda e pelo custo dos produtos.</p></div><div className="header-actions"><button type="button" className="button secondary" onClick={() => setShowCosts((current) => !current)}>{showCosts ? <EyeOff size={16} /> : <Eye size={16} />}{showCosts ? 'Ocultar custos' : 'Mostrar custos'}</button><Link to="/estoque">Ver estoque <ArrowRight size={16} /></Link></div></div><div className="stock-summary-section"><b>Valor de venda</b><div className="stock-summary-grid"><article className="stock-summary-card total"><small>Total geral</small><strong>{money(data.stockValue.total)}</strong><p>Valor de venda de todo o estoque</p></article><article className="stock-summary-card"><small>Pneus</small><strong>{money(data.stockValue.tires)}</strong><p>Valor de venda em estoque</p></article><article className="stock-summary-card"><small>Rodas</small><strong>{money(data.stockValue.wheels)}</strong><p>Valor de venda em estoque</p></article><article className="stock-summary-card"><small>Bicos</small><strong>{money(data.stockValue.valves)}</strong><p>Valor de venda em estoque</p></article></div></div>{showCosts && <div className="stock-summary-section cost-summary"><b>Valor de custo</b><div className="stock-summary-grid"><article className="stock-summary-card total"><small>Total geral</small><strong>{money(data.stockCost.total)}</strong><p>Custo de todo o estoque</p></article><article className="stock-summary-card"><small>Pneus</small><strong>{money(data.stockCost.tires)}</strong><p>Custo em estoque</p></article><article className="stock-summary-card"><small>Rodas</small><strong>{money(data.stockCost.wheels)}</strong><p>Custo em estoque</p></article><article className="stock-summary-card"><small>Bicos</small><strong>{money(data.stockCost.valves)}</strong><p>Custo em estoque</p></article></div></div>}</section>
    <section className="dashboard-grid"><article className="panel"><div className="panel-heading"><div><h2>Produtos com estoque baixo</h2><p>Reponha os itens que chegaram ao mínimo.</p></div><Link to="/estoque">Ver estoque <ArrowRight size={16} /></Link></div>
      {data.lowStock.length ? <div className="compact-list">{data.lowStock.map((product) => <div key={product.id} className="compact-row"><div><strong>{productName(product)}</strong><small>{product.type === 'TIRE' ? `Pneu • ${stockLocationLabel[product.stockLocation]}` : product.type === 'WHEEL' ? 'Roda' : 'Bico'}</small></div><div className="stock-warning"><b>{product.quantity}</b><span>mín. {product.minimumQuantity}</span></div></div>)}</div> : <Empty>Estoque em dia. Nenhum item está abaixo do mínimo.</Empty>}</article>
      <article className="panel"><div className="panel-heading"><div><h2>Últimas vendas</h2><p>Movimentações mais recentes.</p></div><Link to="/historico">Histórico <ArrowRight size={16} /></Link></div>
      {data.recentSales.length ? <div className="compact-list">{data.recentSales.map((sale) => <div className="compact-row" key={sale.id}><div><strong>{sale.saleNumber}</strong><small>{sale.vehiclePlate || 'Sem placa'} {sale.vehicleModel ? `• ${sale.vehicleModel}` : ''} • {shortDate(sale.soldAt)}</small></div><div className="sale-total"><b>{money(sale.total)}</b><Badge tone="info">{paymentLabel[sale.paymentMethod]}</Badge></div></div>)}</div> : <Empty>Ainda não há vendas registradas.</Empty>}</article></section>
  </div>;
}
