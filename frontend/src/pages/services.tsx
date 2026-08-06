import { FormEvent, useEffect, useState } from 'react';
import { Save, Settings2 } from 'lucide-react';
import { api } from '../lib/api';
import { CatalogService } from '../types';
import { Loading, PageHeader } from '../components/ui';
import { useToast } from '../components/toast';

export function ServicesPage() {
  const { success, error } = useToast(); const [services, setServices] = useState<CatalogService[]>(); const [values, setValues] = useState<Record<string, number>>({}); const [saving, setSaving] = useState(false);
  useEffect(() => { api<CatalogService[]>('/services').then((data) => { setServices(data); setValues(Object.fromEntries(data.map((service) => [service.code, service.price]))); }).catch((err) => error(err.message)); }, []);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); try { await Promise.all((services || []).map((service) => api(`/services/${service.code}`, { method: 'PUT', body: { price: values[service.code] } }))); success('Tabela de serviços atualizada.'); } catch (err) { error(err instanceof Error ? err.message : 'Não foi possível salvar.'); } finally { setSaving(false); } };
  if (!services) return <Loading />;
  return <div><PageHeader title="Serviços tabelados" description="Defina os valores sugeridos para alinhamento e balanceamento." />
    <div className="info-banner"><Settings2 size={20} /><span>A mão de obra é livre: ela é digitada na própria venda, com descrição e valor escolhidos no momento.</span></div>
    <form onSubmit={submit} className="service-cards">{services.map((service) => <article className="service-card" key={service.code}><div><h2>{service.name}</h2><p>Valor sugerido para inserir nas novas vendas.</p></div><label>Preço de venda<input type="number" min="0" step="0.01" value={values[service.code] ?? 0} onChange={(event) => setValues((current) => ({ ...current, [service.code]: Number(event.target.value) }))} /></label></article>)}<div className="form-actions"><button disabled={saving} className="button primary"><Save size={18} /> {saving ? 'Salvando…' : 'Salvar valores'}</button></div></form>
  </div>;
}
