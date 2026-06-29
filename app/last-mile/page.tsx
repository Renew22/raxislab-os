"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'nuevo' | 'contactado' | 'interesado' | 'propuesta' | 'cerrado';
type TrackerStatus = 'sin_contactar' | 'primer_contacto' | 'en_conversacion' | 'muestra_enviada' | 'propuesta_enviada' | 'activo' | 'descartado';
type StockStatus = 'disponible' | 'bajo_pedido' | 'no_disponible';
type TabType = 'Resumen' | 'Pipeline' | 'Emails' | 'Tracker' | 'Catálogo' | 'Comerciales';

interface Lead {
  id: string;
  nombre: string;
  empresa?: string;
  email: string;
  telefono?: string;
  mensaje: string;
  tipo: 'Distribuidor' | 'HORECA' | 'Minorista' | 'Comercial' | 'Proveedor';
  canal: string;
  fecha: string;
  ultimaAccion: string;
  proximaAccion: string;
  status: LeadStatus;
}

interface TrackerEntry {
  id: string;
  empresa: string;
  tipo: string;
  ciudad: string;
  zona: string;
  status: TrackerStatus;
  contacto?: string;
  web?: string;
  ultimoContacto?: string;
  proximoPaso?: string;
}

interface CatalogItem {
  id: string;
  nombre: string;
  do: string;
  bodega?: string;
  tipo: 'Tinto' | 'Blanco' | 'Rosado' | 'Aceite AOVE';
  stock: StockStatus;
}

interface Comercial {
  id: string;
  nombre: string;
  zona: string;
  leadsAsignados: number;
  contactosMes: number;
  cierresMes: number;
  proximaAccion: string;
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_LEADS: Lead[] = [
  { id: 'l1', nombre: 'Martina Castillo', email: 'marticast1175@gmail.com', mensaje: 'Quiero ser distribuidora en Paraguay', tipo: 'Distribuidor', canal: 'Formulario web', fecha: '2026-06-20', ultimaAccion: 'Lead recibido por formulario', proximaAccion: 'Llamar + enviar catálogo URGENTE', status: 'nuevo' },
  { id: 'l2', nombre: 'Pablo (Le Club)', empresa: 'Le Club', email: 'lionsbrokerspablo@gmail.com', telefono: '0992 323308', mensaje: 'Quiero WhatsApp, mi número es 0992 323308', tipo: 'HORECA', canal: 'Formulario web', fecha: '2026-06-21', ultimaAccion: 'Lead recibido por formulario', proximaAccion: 'Llamar al 0992 323308 HOY', status: 'nuevo' },
  { id: 'l3', nombre: 'Marcos Griffith', email: 'marcos.griffith@gmail.com', mensaje: 'Catálogo y precios aceite y vinos, minorista', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-22', ultimaAccion: 'Lead recibido por formulario', proximaAccion: 'Enviar catálogo + lista de precios HOY', status: 'nuevo' },
  { id: 'l4', nombre: 'Hernán Candia', email: 'hercand@gmail.com', mensaje: 'Favor enviar catálogo y precios', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-22', ultimaAccion: 'Lead recibido por formulario', proximaAccion: 'Enviar catálogo HOY', status: 'nuevo' },
  { id: 'l5', nombre: 'Guillermo Torres', email: 'gtamd@email.com', mensaje: 'Lista precios aceites, compra mínima', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-23', ultimaAccion: 'Lead recibido por formulario', proximaAccion: 'Enviar precios aceite + mínimos HOY', status: 'nuevo' },
  { id: 'l6', nombre: 'Manuel Mejías', email: 'mejiasmanuel006@gmail.com', mensaje: 'Más información de productos', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-18', ultimaAccion: 'Lead recibido', proximaAccion: 'Seguimiento esta semana', status: 'contactado' },
  { id: 'l7', nombre: 'Sandra Bartolozzi', email: 'sbartolozzi@hotmail.com', mensaje: 'Conocer el aceite para la compra', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-19', ultimaAccion: 'Lead recibido', proximaAccion: 'Enviar info Urzante AOVE', status: 'contactado' },
  { id: 'l8', nombre: 'Gricelda Boggino', email: 'lis59boggino@gmail.com', mensaje: 'Vendedores independientes del interior Paraguay', tipo: 'Comercial', canal: 'Formulario web', fecha: '2026-06-20', ultimaAccion: 'Lead recibido', proximaAccion: 'Evaluar perfil para red comercial', status: 'contactado' },
  { id: 'l9', nombre: 'Julio Lois', email: 'juliolois2014@gmail.com', mensaje: 'Uruguayo en Paraguay, bueno en ventas, contactos Brasil SP', tipo: 'Comercial', canal: 'Formulario web', fecha: '2026-06-20', ultimaAccion: 'Lead recibido', proximaAccion: 'Evaluar como comercial zona Sur/Brasil', status: 'contactado' },
  { id: 'l10', nombre: 'Fabio Duré', email: 'fabio.dure@hotmail.com', mensaje: 'A qué número puedo contactar', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-21', ultimaAccion: 'Lead recibido', proximaAccion: 'Responder con WhatsApp + catálogo', status: 'contactado' },
  { id: 'l11', nombre: 'Sdriano Alvarez', email: 'alvarezadriano57@gmail.com', mensaje: 'Adquirir vinos y aceites españoles', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-22', ultimaAccion: 'Lead recibido', proximaAccion: 'Enviar catálogo + precios', status: 'contactado' },
];

const INITIAL_TRACKER: TrackerEntry[] = [
  { id: 't1', empresa: 'Caminos del Vino', tipo: 'Distribuidor vinos premium', ciudad: 'Asunción', zona: 'Asunción', status: 'sin_contactar', web: 'caminosdelvino.com.py', proximoPaso: 'Email de presentación' },
  { id: 't2', empresa: 'London Import S.A.', tipo: 'Importador premium', ciudad: 'Asunción', zona: 'Asunción', status: 'sin_contactar', web: 'londonimport.com.py', proximoPaso: 'Email de presentación' },
  { id: 't3', empresa: 'Frutos de los Andes S.R.L.', tipo: 'Importador alta gama', ciudad: 'Lambaré', zona: 'Asunción', status: 'sin_contactar', contacto: '+595 21 30 2239', proximoPaso: 'Llamada + email' },
  { id: 't4', empresa: 'Distribuidora Gloria S.A.', tipo: 'Distribuidor nacional', ciudad: 'Asunción', zona: 'Asunción', status: 'sin_contactar', contacto: '+595 21 600 083', proximoPaso: 'Email de presentación' },
  { id: 't5', empresa: 'El Imperio S.A.', tipo: 'Multi-canal HORECA', ciudad: 'Asunción', zona: 'Asunción', status: 'sin_contactar', web: 'elimperio.com.py', proximoPaso: 'Email de presentación' },
  { id: 't6', empresa: 'Casa Módiga', tipo: 'Distribuidor regional', ciudad: 'Ciudad del Este', zona: 'Sur', status: 'sin_contactar', web: 'modiga.com.py', proximoPaso: 'Email de presentación' },
  { id: 't7', empresa: 'EDESA', tipo: 'Distribuidor CDE', ciudad: 'Ciudad del Este', zona: 'Sur', status: 'sin_contactar', proximoPaso: 'Localizar contacto + email' },
  { id: 't8', empresa: 'Monalisa', tipo: 'Lujo y alta gama frontera', ciudad: 'Pedro Juan Caballero', zona: 'Norte', status: 'sin_contactar', proximoPaso: 'Email de presentación' },
];

const INITIAL_CATALOG: CatalogItem[] = [
  { id: 'c1', nombre: 'Ivanto Crianza', do: 'D.O. Rioja', bodega: 'DISXUQUER', tipo: 'Tinto', stock: 'disponible' },
  { id: 'c2', nombre: 'Ivanto Reserva', do: 'D.O. Rioja', bodega: 'DISXUQUER', tipo: 'Tinto', stock: 'bajo_pedido' },
  { id: 'c3', nombre: 'Torremorón', do: 'D.O. Ribera del Duero', tipo: 'Tinto', stock: 'disponible' },
  { id: 'c4', nombre: 'Siete Siete', do: 'D.O. Ribera del Duero', tipo: 'Tinto', stock: 'bajo_pedido' },
  { id: 'c5', nombre: 'Urzante AOVE', do: 'DOP Olivar de la Ribera (Navarra)', bodega: 'Urzante', tipo: 'Aceite AOVE', stock: 'disponible' },
];

const INITIAL_COMERCIALES: Comercial[] = [
  { id: 'com1', nombre: 'Por contratar', zona: 'Asunción', leadsAsignados: 5, contactosMes: 0, cierresMes: 0, proximaAccion: 'Contratar comercial zona Gran Asunción' },
  { id: 'com2', nombre: 'Por contratar', zona: 'Interior PY', leadsAsignados: 2, contactosMes: 0, cierresMes: 0, proximaAccion: 'Evaluar Gricelda Boggino + Julio Lois' },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const VINO = '#722F37';
const VINO_DIM = 'rgba(114,47,55,0.12)';
const VINO_BORDER = 'rgba(114,47,55,0.3)';
const GOLD = '#C8A97E';
const GOOGLE_ADS_CUSTOMER_ID = '9497091021';

const PIPELINE_COLS: { key: LeadStatus; label: string }[] = [
  { key: 'nuevo',      label: 'NUEVO' },
  { key: 'contactado', label: 'CONTACTADO' },
  { key: 'interesado', label: 'INTERESADO' },
  { key: 'propuesta',  label: 'PROPUESTA' },
  { key: 'cerrado',    label: 'CERRADO' },
];

const TRACKER_STATES: { key: TrackerStatus; label: string; color: string }[] = [
  { key: 'sin_contactar',    label: '🔴 Sin contactar',      color: '#E74C3C' },
  { key: 'primer_contacto',  label: '🟡 Primer contacto',    color: '#F39C12' },
  { key: 'en_conversacion',  label: '🟠 En conversación',    color: '#E67E22' },
  { key: 'muestra_enviada',  label: '🟢 Muestra enviada',    color: '#27AE60' },
  { key: 'propuesta_enviada',label: '💜 Propuesta enviada',  color: '#8E44AD' },
  { key: 'activo',           label: '✅ Distribuidor activo', color: '#1ABC9C' },
  { key: 'descartado',       label: '❌ Descartado',          color: '#7F8C8D' },
];

const TIPO_COLORS: Record<string, string> = {
  Distribuidor: '#722F37',
  HORECA:       '#8E44AD',
  Minorista:    '#2980B9',
  Comercial:    '#27AE60',
  Proveedor:    '#7F8C8D',
};

const STOCK_LABELS: Record<StockStatus, { label: string; color: string }> = {
  disponible:    { label: '✅ Stock Paraguay',        color: '#27AE60' },
  bajo_pedido:   { label: '📦 Disponible bajo pedido', color: '#F39C12' },
  no_disponible: { label: '❌ No disponible',           color: '#E74C3C' },
};

const LM_SYSTEM_PROMPT = `Eres el asistente comercial de Last Mile Distribution, importadora de vinos españoles con Denominación de Origen (Rioja, Ribera del Duero, Rueda, Navarra) y aceite de oliva AOVE para el mercado paraguayo. El tono es profesional y cercano. Siempre enfatizar: origen español, D.O. certificada, respaldo de DISXUQUER (+20 años de experiencia), stock disponible en Paraguay, acompañamiento comercial continuo. Nunca competir en precio — competir en calidad y prestigio. Firma siempre como "Last Mile Distribution | info@lastmiledist.com".`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const LABEL_S: React.CSSProperties = { fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' };
const CARD_S: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' };

function useLocalStorage<T>(key: string, init: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [val, setVal] = useState<T>(init);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setVal(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [key]);
  const setter = useCallback((v: T | ((prev: T) => T)) => {
    setVal(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, [key]);
  return [val, setter];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ ...CARD_S, textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: VINO, fontFamily: "'Space Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LastMilePage() {
  const [tab, setTab] = useState<TabType>('Resumen');
  const [leads, setLeads] = useLocalStorage<Lead[]>('lm_leads', INITIAL_LEADS);
  const [tracker, setTracker] = useLocalStorage<TrackerEntry[]>('lm_tracker', INITIAL_TRACKER);
  const [catalog, setCatalog] = useLocalStorage<CatalogItem[]>('lm_catalogo', INITIAL_CATALOG);
  const [comerciales, setComerciales] = useLocalStorage<Comercial[]>('lm_comerciales', INITIAL_COMERCIALES);
  const [notaMes, setNotaMes] = useLocalStorage<string>('lm_nota', '');

  // Google Ads state
  const [adsData, setAdsData] = useState<Record<string, string> | null>(null);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);

  // Email generator state
  const [emailTipo, setEmailTipo] = useState('presentacion');
  const [emailDestinatario, setEmailDestinatario] = useState('');
  const [emailEmpresa, setEmailEmpresa] = useState('');
  const [emailTipoContacto, setEmailTipoContacto] = useState('Distribuidor');
  const [emailIdioma, setEmailIdioma] = useState('Español');
  const [emailContexto, setEmailContexto] = useState('');
  const [emailResult, setEmailResult] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Lead modal
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({ tipo: 'Distribuidor', canal: 'Formulario web', status: 'nuevo' });

  // Catalog result
  const [fichaResult, setFichaResult] = useState<{ id: string; text: string } | null>(null);
  const [fichaLoading, setFichaLoading] = useState(false);

  // Load ads on mount
  useEffect(() => { loadAds(); }, []);

  async function loadAds() {
    setAdsLoading(true); setAdsError(null);
    try {
      const r = await fetch('/api/google/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: GOOGLE_ADS_CUSTOMER_ID, days: 30 }) });
      const d = await r.json();
      if (d._pending) { setAdsError('developer_token'); } else if (d.error) { setAdsError(d.error); } else { setAdsData(d); }
    } catch { setAdsError('conexion'); }
    setAdsLoading(false);
  }

  async function generarEmail() {
    if (!emailDestinatario) return;
    const tipos: Record<string, string> = {
      presentacion: 'email de presentación inicial',
      seguimiento:  'email de seguimiento (ya enviamos presentación, no respondió)',
      catalogo:     'email enviando catálogo y lista de precios',
      recuperacion: 'email de recuperación de lead frío (no respondió en 30 días)',
      distribuidor: 'email para incorporar como distribuidor oficial en su zona',
      comercial:    'email para incorporar como comercial independiente de Last Mile',
    };
    const prompt = `${LM_SYSTEM_PROMPT}\n\nRedacta un ${tipos[emailTipo]} para:\n- Destinatario: ${emailDestinatario}\n- Empresa: ${emailEmpresa || 'no especificado'}\n- Tipo: ${emailTipoContacto}\n- Idioma: ${emailIdioma}\n${emailContexto ? `- Contexto adicional: ${emailContexto}` : ''}\n\nFormato:\nASUNTO: [asunto del email]\nPREHEADER: [preheader 1 línea]\n\n[cuerpo del email]\n\nMáximo 180 palabras en el cuerpo. Firma como Last Mile Distribution.`;
    setEmailLoading(true); setEmailResult('');
    try {
      const r = await fetch('/api/claude/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'custom', data: { prompt } }) });
      const d = await r.json();
      setEmailResult(d.content || d.error || 'Error generando email');
    } catch { setEmailResult('Error de conexión'); }
    setEmailLoading(false);
  }

  async function generarFicha(item: CatalogItem) {
    const prompt = `${LM_SYSTEM_PROMPT}\n\nGenera una ficha comercial completa para:\n- Producto: ${item.nombre}\n- Denominación: ${item.do}\n${item.bodega ? `- Bodega: ${item.bodega}` : ''}\n- Tipo: ${item.tipo}\n\nIncluye: descripción atractiva (2-3 frases), perfil organoléptico, maridaje sugerido, argumento de venta B2B para distribuidores HORECA en Paraguay. Máximo 120 palabras. Formato para incluir en email o catálogo.`;
    setFichaLoading(true); setFichaResult(null);
    try {
      const r = await fetch('/api/claude/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'custom', data: { prompt } }) });
      const d = await r.json();
      setFichaResult({ id: item.id, text: d.content || 'Error' });
    } catch { setFichaResult({ id: item.id, text: 'Error de conexión' }); }
    setFichaLoading(false);
  }

  function addLead() {
    if (!newLead.nombre || !newLead.email) return;
    const lead: Lead = { id: `l${Date.now()}`, nombre: newLead.nombre!, email: newLead.email!, empresa: newLead.empresa, telefono: newLead.telefono, mensaje: newLead.mensaje || '', tipo: newLead.tipo as Lead['tipo'] || 'Minorista', canal: newLead.canal || 'Manual', fecha: new Date().toISOString().split('T')[0], ultimaAccion: 'Lead añadido manualmente', proximaAccion: newLead.proximaAccion || 'Contactar', status: newLead.status as LeadStatus || 'nuevo' };
    setLeads(prev => [lead, ...prev]);
    setShowAddLead(false);
    setNewLead({ tipo: 'Distribuidor', canal: 'Formulario web', status: 'nuevo' });
  }

  function moveLead(id: string, status: LeadStatus) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, ultimaAccion: `Movido a ${status} — ${new Date().toLocaleDateString('es-ES')}` } : l));
  }

  function updateTrackerStatus(id: string, status: TrackerStatus) {
    setTracker(prev => prev.map(t => t.id === id ? { ...t, status, ultimoContacto: new Date().toISOString().split('T')[0] } : t));
  }

  function updateStockStatus(id: string, stock: StockStatus) {
    setCatalog(prev => prev.map(c => c.id === id ? { ...c, stock } : c));
  }

  // Derived KPIs
  const kpis = { total: leads.length, contactados: leads.filter(l => l.status !== 'nuevo').length, interesados: leads.filter(l => l.status === 'interesado' || l.status === 'propuesta').length, cerrados: leads.filter(l => l.status === 'cerrado').length };
  const nuevosUrgentes = leads.filter(l => l.status === 'nuevo');
  const tareasUrgentes = [...nuevosUrgentes.slice(0, 3).map(l => ({ texto: `Contactar a ${l.nombre}`, urgencia: '🔴' })), { texto: 'Subir catálogo PDF a lastmiledist.com', urgencia: '🟡' }, { texto: 'Configurar Brevo SMTP en WordPress', urgencia: '🟡' }, { texto: 'Crear página /gracias para tracking Google Ads', urgencia: '🟡' }].slice(0, 5);

  const TABS: TabType[] = ['Resumen', 'Pipeline', 'Emails', 'Tracker', 'Catálogo', 'Comerciales'];

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1400px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: VINO, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: "'Space Mono', monospace" }}>LM</span>
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Last Mile Distribution</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: "'Space Mono', monospace" }}>B2B · Vinos & Aceite D.O. · Paraguay</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <a href="https://lastmiledist.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: `1px solid ${VINO_BORDER}`, color: VINO, textDecoration: 'none', background: VINO_DIM }}>lastmiledist.com ↗</a>
          <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(39,174,96,0.1)', color: '#27AE60', border: '1px solid rgba(39,174,96,0.25)', fontWeight: 600 }}>EN CURSO</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)', marginBottom: '28px', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab === t ? 600 : 400, background: 'transparent', color: tab === t ? VINO : 'var(--text-muted)', borderBottom: tab === t ? `2px solid ${VINO}` : '2px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
            {t}
            {t === 'Pipeline' && <span style={{ marginLeft: '6px', fontSize: '11px', background: VINO_DIM, color: VINO, padding: '1px 6px', borderRadius: '10px' }}>{leads.length}</span>}
            {t === 'Tracker' && <span style={{ marginLeft: '6px', fontSize: '11px', background: 'rgba(231,76,60,0.1)', color: '#E74C3C', padding: '1px 6px', borderRadius: '10px' }}>{tracker.filter(t => t.status === 'sin_contactar').length}</span>}
          </button>
        ))}
      </div>

      {/* ─────────────────── PESTAÑA 1: RESUMEN ─────────────────────── */}
      {tab === 'Resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <KpiCard label="Leads totales" value={kpis.total} sub="en pipeline" />
            <KpiCard label="Contactados" value={kpis.contactados} sub={`${Math.round(kpis.contactados / kpis.total * 100)}% del total`} />
            <KpiCard label="En negociación" value={kpis.interesados} sub="interesados + propuesta" />
            <KpiCard label="Cerrados" value={kpis.cerrados} sub="distribuidores activos" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Urgentes */}
            <div style={CARD_S}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Próximas acciones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tareasUrgentes.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', background: 'var(--surface)' }}>
                    <span style={{ fontSize: '14px' }}>{t.urgencia}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text)' }}>{t.texto}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Ads widget */}
            <div style={{ ...CARD_S, borderTop: `3px solid ${VINO}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Google Ads · Cuenta {GOOGLE_ADS_CUSTOMER_ID.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}</div>
                <button onClick={loadAds} disabled={adsLoading} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>{adsLoading ? '...' : '↻'}</button>
              </div>

              {adsLoading && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Cargando...</div>}

              {adsError === 'developer_token' && (
                <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.25)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#F39C12', marginBottom: '6px' }}>⚠ Developer Token pendiente</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Para conectar Google Ads API:<br/>
                    1. Google Ads → Tools → API Center<br/>
                    2. Apply for Basic Access (inmediato)<br/>
                    3. Copia el Developer Token<br/>
                    4. Añadir en Vercel: <code style={{ color: '#F39C12' }}>GOOGLE_ADS_DEVELOPER_TOKEN</code>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <div><strong>Campañas activas (manual):</strong></div>
                    <div>· Búsqueda directa distribuidores — <span style={{ color: '#27AE60' }}>ACTIVA</span></div>
                    <div>· Distribución Vinos en Paraguay — <span style={{ color: 'var(--text-muted)' }}>PAUSADA</span></div>
                    <div style={{ marginTop: '4px' }}>Nivel opt.: <strong>66.6%</strong> — mejorable</div>
                  </div>
                </div>
              )}

              {adsError && adsError !== 'developer_token' && (
                <div style={{ fontSize: '12px', color: '#E74C3C' }}>Error: {adsError}</div>
              )}

              {adsData && !adsLoading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[['Inversión', adsData.inversion], ['CPL', adsData.cpl], ['CTR', adsData.ctr], ['Clics', adsData.clics], ['Impresiones', adsData.impresiones], ['Leads', adsData.leads]].map(([k, v]) => (
                    <div key={k} style={{ textAlign: 'center', padding: '8px', background: 'var(--surface)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', fontFamily: "'Space Mono', monospace" }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nota del mes */}
          <div style={CARD_S}>
            <label style={LABEL_S}>Nota del mes (se guarda automáticamente)</label>
            <textarea value={notaMes} onChange={e => setNotaMes(e.target.value)} placeholder="Ej: Junio — 11 leads recibidos. Martina y Le Club son los más calientes. Pendiente catálogo PDF. Revisar campaña Google Ads en semana 2." style={{ ...INPUT, resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', lineHeight: 1.6 }} />
          </div>

          {/* Pendientes WordPress / Brevo */}
          <div style={{ ...CARD_S, borderLeft: `3px solid #E74C3C` }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#E74C3C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Acciones técnicas pendientes (lastmiledist.com)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { estado: '🔴', text: 'Activar Brevo como mailer en WordPress (plugin Brevo → Activate: YES)' },
                { estado: '🔴', text: 'Corregir error de configuración en Contact Form 7 ("Contact form 1_copy")' },
                { estado: '🟡', text: 'Crear página /gracias → dispara conversión Google Ads' },
                { estado: '🟡', text: 'Añadir snippet conversión Google Ads en /gracias' },
                { estado: '🟡', text: 'Configurar WP Mail SMTP o desactivarlo (conflicto con Brevo)' },
                { estado: '🟢', text: 'Reactivar campaña "Distribución Vinos en Paraguay" cuando tracking esté listo' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: 'var(--text-muted)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{item.estado}</span><span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── PESTAÑA 2: PIPELINE ─────────────────────── */}
      {tab === 'Pipeline' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{leads.length} leads en pipeline · {nuevosUrgentes.length} sin contactar</div>
            <button onClick={() => setShowAddLead(true)} style={{ padding: '8px 16px', borderRadius: '6px', background: VINO, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>+ Añadir lead</button>
          </div>

          {showAddLead && (
            <div style={{ ...CARD_S, marginBottom: '20px', borderLeft: `3px solid ${VINO}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[['nombre', 'Nombre *'], ['email', 'Email *'], ['empresa', 'Empresa'], ['telefono', 'Teléfono'], ['mensaje', 'Mensaje recibido'], ['proximaAccion', 'Próxima acción']].map(([k, l]) => (
                  <div key={k}>
                    <label style={LABEL_S}>{l}</label>
                    <input style={INPUT} value={(newLead as Record<string, string>)[k] || ''} onChange={e => setNewLead(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={LABEL_S}>Tipo</label>
                  <select style={{ ...INPUT, cursor: 'pointer' }} value={newLead.tipo} onChange={e => setNewLead(p => ({ ...p, tipo: e.target.value as Lead['tipo'] }))}>
                    {['Distribuidor', 'HORECA', 'Minorista', 'Comercial', 'Proveedor'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={LABEL_S}>Canal</label>
                  <select style={{ ...INPUT, cursor: 'pointer' }} value={newLead.canal} onChange={e => setNewLead(p => ({ ...p, canal: e.target.value }))}>
                    {['Formulario web', 'WhatsApp', 'Email', 'Referido', 'Manual'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addLead} style={{ padding: '8px 20px', borderRadius: '6px', background: VINO, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Guardar lead</button>
                <button onClick={() => setShowAddLead(false)} style={{ padding: '8px 16px', borderRadius: '6px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Kanban columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', overflowX: 'auto' }}>
            {PIPELINE_COLS.map(col => {
              const colLeads = leads.filter(l => l.status === col.key);
              return (
                <div key={col.key} style={{ background: 'var(--surface)', borderRadius: '8px', padding: '12px', minHeight: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: col.key === 'nuevo' ? '#E74C3C' : col.key === 'cerrado' ? '#27AE60' : 'var(--text-muted)' }}>{col.label}</span>
                    <span style={{ fontSize: '11px', background: 'var(--card)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '10px', border: '1px solid var(--border)' }}>{colLeads.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {colLeads.map(lead => (
                      <div key={lead.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', cursor: 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: `${TIPO_COLORS[lead.tipo]}20`, color: TIPO_COLORS[lead.tipo], fontWeight: 600 }}>{lead.tipo}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{lead.nombre}</div>
                        {lead.empresa && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lead.empresa}</div>}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{lead.mensaje.slice(0, 60)}{lead.mensaje.length > 60 ? '...' : ''}</div>
                        <div style={{ fontSize: '10px', color: VINO, marginTop: '6px', fontWeight: 500 }}>→ {lead.proximaAccion.slice(0, 50)}</div>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {PIPELINE_COLS.filter(c => c.key !== col.key).map(c => (
                            <button key={c.key} onClick={() => moveLead(lead.id, c.key)} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>→ {c.label}</button>
                          ))}
                          <button onClick={() => { setTab('Emails'); setEmailDestinatario(lead.nombre); setEmailEmpresa(lead.empresa || ''); setEmailTipoContacto(lead.tipo); }} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', border: `1px solid ${VINO_BORDER}`, background: VINO_DIM, color: VINO, cursor: 'pointer' }}>✉ Email</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────── PESTAÑA 3: EMAILS ─────────────────────── */}
      {tab === 'Emails' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ ...CARD_S }}>
              <div style={{ fontSize: '12px', color: GOLD, fontWeight: 600, marginBottom: '12px', padding: '6px 10px', borderRadius: '4px', background: 'rgba(200,169,126,0.1)', border: '1px solid rgba(200,169,126,0.2)' }}>⚠ Genera email con Claude API (consume créditos)</div>

              <div style={{ marginBottom: '12px' }}>
                <label style={LABEL_S}>Tipo de email</label>
                <select style={{ ...INPUT, cursor: 'pointer' }} value={emailTipo} onChange={e => setEmailTipo(e.target.value)}>
                  <option value="presentacion">Presentación inicial</option>
                  <option value="seguimiento">Seguimiento (no respondió)</option>
                  <option value="catalogo">Envío de catálogo</option>
                  <option value="recuperacion">Recuperación lead frío</option>
                  <option value="distribuidor">Propuesta de distribuidor</option>
                  <option value="comercial">Propuesta de comercial</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={LABEL_S}>Nombre del destinatario *</label>
                <input style={INPUT} value={emailDestinatario} onChange={e => setEmailDestinatario(e.target.value)} placeholder="Ej: Martina Castillo" />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={LABEL_S}>Empresa</label>
                <input style={INPUT} value={emailEmpresa} onChange={e => setEmailEmpresa(e.target.value)} placeholder="Ej: Distribuidora XY" />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={LABEL_S}>Tipo de contacto</label>
                <select style={{ ...INPUT, cursor: 'pointer' }} value={emailTipoContacto} onChange={e => setEmailTipoContacto(e.target.value)}>
                  {['Distribuidor', 'HORECA', 'Minorista', 'Comercial', 'Proveedor'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={LABEL_S}>Idioma</label>
                <select style={{ ...INPUT, cursor: 'pointer' }} value={emailIdioma} onChange={e => setEmailIdioma(e.target.value)}>
                  <option>Español</option>
                  <option>Inglés</option>
                  <option>Guaraní básico</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={LABEL_S}>Contexto adicional</label>
                <textarea style={{ ...INPUT, minHeight: '70px', resize: 'vertical', lineHeight: 1.5 }} value={emailContexto} onChange={e => setEmailContexto(e.target.value)} placeholder="Ej: Preguntó específicamente por el aceite Urzante, interesado en compra mínima de 24 unidades" />
              </div>

              <button onClick={generarEmail} disabled={emailLoading || !emailDestinatario} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: emailLoading || !emailDestinatario ? 'var(--border)' : VINO, color: '#fff', border: 'none', cursor: emailLoading || !emailDestinatario ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}>
                {emailLoading ? 'Generando...' : '✉ Generar email'}
              </button>
            </div>
          </div>

          <div>
            {emailResult ? (
              <div style={{ ...CARD_S, height: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Email generado</span>
                  <button onClick={() => navigator.clipboard.writeText(emailResult)} style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>Copiar</button>
                </div>
                <pre style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{emailResult}</pre>
              </div>
            ) : (
              <div style={{ ...CARD_S, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✉</div>
                <div style={{ fontSize: '14px' }}>Rellena el formulario y pulsa "Generar email"</div>
                <div style={{ fontSize: '12px', marginTop: '6px', color: VINO }}>Prompt optimizado para vinos D.O. Paraguay B2B</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────── PESTAÑA 4: TRACKER ─────────────────────── */}
      {tab === 'Tracker' && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>{tracker.filter(t => t.status === 'sin_contactar').length} sin contactar · {tracker.filter(t => t.status === 'activo').length} distribuidores activos</div>
          <div style={{ ...CARD_S, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Empresa', 'Tipo', 'Ciudad · Zona', 'Estado', 'Contacto / Web', 'Próximo paso', ''].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tracker.map(entry => {
                  const stateInfo = TRACKER_STATES.find(s => s.key === entry.status);
                  return (
                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{entry.empresa}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{entry.tipo}</td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{entry.ciudad}<br/><span style={{ fontSize: '10px', color: VINO }}>{entry.zona}</span></td>
                      <td style={{ padding: '12px 14px' }}>
                        <select value={entry.status} onChange={e => updateTrackerStatus(entry.id, e.target.value as TrackerStatus)} style={{ fontSize: '11px', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: stateInfo?.color || 'var(--text)', cursor: 'pointer', outline: 'none' }}>
                          {TRACKER_STATES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {entry.contacto && <div>{entry.contacto}</div>}
                        {entry.web && <a href={`https://${entry.web}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00C8FF', textDecoration: 'none' }}>{entry.web}</a>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>{entry.proximoPaso || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={() => { setTab('Emails'); setEmailEmpresa(entry.empresa); setEmailTipoContacto('Distribuidor'); }} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${VINO_BORDER}`, background: VINO_DIM, color: VINO, cursor: 'pointer', whiteSpace: 'nowrap' }}>✉ Generar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────── PESTAÑA 5: CATÁLOGO ─────────────────────── */}
      {tab === 'Catálogo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{catalog.filter(c => c.stock === 'disponible').length} referencias con stock en Paraguay</div>
          {catalog.map(item => {
            const stockInfo = STOCK_LABELS[item.stock];
            const isGenerating = fichaLoading && fichaResult?.id === item.id;
            return (
              <div key={item.id} style={{ ...CARD_S, display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: item.tipo === 'Aceite AOVE' ? 'rgba(200,169,126,0.15)' : VINO_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
                  {item.tipo === 'Aceite AOVE' ? '🫒' : '🍷'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{item.nombre}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: VINO_DIM, color: VINO }}>{item.do}</span>
                    {item.bodega && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.bodega}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.tipo}</span>
                    <select value={item.stock} onChange={e => updateStockStatus(item.id, e.target.value as StockStatus)} style={{ fontSize: '11px', padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: stockInfo.color, cursor: 'pointer', outline: 'none' }}>
                      {Object.entries(STOCK_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  {fichaResult?.id === item.id && fichaResult.text && (
                    <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: VINO }}>Ficha comercial</span>
                        <button onClick={() => navigator.clipboard.writeText(fichaResult.text)} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Copiar</button>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>{fichaResult.text}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => generarFicha(item)} disabled={fichaLoading} style={{ padding: '7px 14px', borderRadius: '6px', border: `1px solid ${VINO_BORDER}`, background: VINO_DIM, color: VINO, cursor: fichaLoading ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {isGenerating ? '...' : '✦ Ficha'}
                </button>
              </div>
            );
          })}
          <div style={{ ...CARD_S, background: 'rgba(200,169,126,0.05)', borderColor: VINO_BORDER, fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: GOLD }}>DISXUQUER</strong> · Distribuidor oficial en Paraguay · +20 años de experiencia · Stock real disponible · Respaldo técnico y comercial incluido
          </div>
        </div>
      )}

      {/* ─────────────────── PESTAÑA 6: COMERCIALES ─────────────────────── */}
      {tab === 'Comerciales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ ...CARD_S, overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nombre', 'Zona', 'Leads asignados', 'Contactos mes', 'Cierres mes', 'Próxima acción'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comerciales.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{c.nombre}</td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{c.zona}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: "'Space Mono', monospace" }}>{c.leadsAsignados}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: "'Space Mono', monospace" }}>{c.contactosMes}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: c.cierresMes > 0 ? '#27AE60' : 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>{c.cierresMes}</td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: VINO }}>{c.proximaAccion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Protocolo */}
          <div style={{ ...CARD_S, borderTop: `3px solid ${VINO}` }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: VINO, marginBottom: '16px' }}>Protocolo Comercial Last Mile</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['01', 'Lead nuevo → responder en máximo 24h', '#E74C3C'],
                ['02', 'Primer contacto → WhatsApp + email (nunca solo email)', '#E67E22'],
                ['03', 'Visita → llevar muestras físicas siempre', '#F39C12'],
                ['04', 'Seguimiento → máximo 7 días sin contacto', '#27AE60'],
                ['05', 'Propuesta → incluir ficha de producto + simulación de margen en guaraníes', '#8E44AD'],
              ].map(([num, text, color]) => (
                <div key={num} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '10px 14px', borderRadius: '6px', background: 'var(--surface)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color, fontFamily: "'Space Mono', monospace", flexShrink: 0, marginTop: '1px' }}>{num}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leads candidatos a comercial */}
          <div style={CARD_S}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Candidatos a comercial (de leads recibidos)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { nombre: 'Gricelda Boggino', nota: 'Vendedores independientes del interior Paraguay — evaluar para zona interior', email: 'lis59boggino@gmail.com' },
                { nombre: 'Julio Lois', nota: 'Uruguayo en Paraguay, bueno en ventas, contactos Brasil/SP — evaluar para zona Sur + Brasil', email: 'juliolois2014@gmail.com' },
              ].map(c => (
                <div key={c.email} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px', borderRadius: '6px', background: 'var(--surface)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{c.nombre}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.nota}</div>
                    <div style={{ fontSize: '11px', color: '#00C8FF', marginTop: '2px' }}>{c.email}</div>
                  </div>
                  <button onClick={() => { setTab('Emails'); setEmailDestinatario(c.nombre); setEmailTipo('comercial'); setEmailTipoContacto('Comercial'); }} style={{ padding: '5px 10px', borderRadius: '4px', border: `1px solid ${VINO_BORDER}`, background: VINO_DIM, color: VINO, cursor: 'pointer', fontSize: '11px', flexShrink: 0 }}>✉ Propuesta</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
