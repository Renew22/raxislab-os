"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'nuevo' | 'contactado' | 'interesado' | 'propuesta' | 'cerrado';
type TrackerStatus = 'sin_contactar' | 'primer_contacto' | 'en_conversacion' | 'muestra_enviada' | 'propuesta_enviada' | 'activo' | 'descartado';
type StockStatus = 'disponible' | 'bajo_pedido' | 'no_disponible';
type TabType = 'Resumen' | 'Pipeline' | 'Emails' | 'Tracker' | 'Catálogo' | 'Comerciales' | 'Precios';
type UserRole = 'admin' | 'comercial' | 'dueno';

interface LMUser {
  id: string;
  nombre: string;
  role: UserRole;
  password: string;
  comercialId?: string;
}

const LM_USERS: LMUser[] = [
  { id: 'admin',   nombre: 'René (Admin)',   role: 'admin',    password: 'raxis2026' },
  { id: 'com1',    nombre: 'Comercial 1',    role: 'comercial', password: 'lm2026', comercialId: 'com1' },
  { id: 'com2',    nombre: 'Comercial 2',    role: 'comercial', password: 'lm2026b', comercialId: 'com2' },
  { id: 'juan',    nombre: 'Juan (Dueño)',   role: 'dueno',    password: 'juan2026' },
];

function getTabs(role: UserRole): TabType[] {
  if (role === 'admin')    return ['Resumen', 'Pipeline', 'Emails', 'Tracker', 'Catálogo', 'Comerciales', 'Precios'];
  if (role === 'comercial') return ['Pipeline', 'Emails', 'Catálogo'];
  return ['Resumen', 'Pipeline', 'Precios'];
}
type NivelPrecio = 'A' | 'B' | 'C';
type MonedaPres = 'EUR' | 'PYG';
type EstadoPres = 'Enviado' | 'Visto' | 'Aceptado' | 'Rechazado' | 'Expirado';

interface FilaPresupuesto { productoId: string; }

interface Presupuesto {
  id: string;
  numero: string;
  cliente: string;
  empresa?: string;
  email?: string;
  mercado: string;
  moneda: MonedaPres;
  validez: '30' | '60' | '90';
  filas: FilaPresupuesto[];
  notas: string;
  condiciones: string;
  fecha: string;
  fechaValidez: string;
  estado: EstadoPres;
  contenido?: string;
}

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
  proximaAccionFecha?: string;
  ultimoContactoFecha?: string;
  status: LeadStatus;
  asignadoA?: string;
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
  { id: 'l1', nombre: 'Martina Castillo', email: 'marticast1175@gmail.com', mensaje: 'Quiero ser distribuidora en Paraguay', tipo: 'Distribuidor', canal: 'Formulario web', fecha: '2026-06-20', ultimaAccion: 'Contactada — catálogo enviado', proximaAccion: 'Seguimiento 7 días', status: 'contactado' },
  { id: 'l2', nombre: 'Pablo (Le Club)', empresa: 'Le Club', email: 'lionsbrokerspablo@gmail.com', telefono: '0992 323308', mensaje: 'Quiero WhatsApp, mi número es 0992 323308', tipo: 'HORECA', canal: 'Formulario web', fecha: '2026-06-21', ultimaAccion: 'Contactado — WhatsApp + catálogo', proximaAccion: 'Seguimiento precio por copa', status: 'contactado' },
  { id: 'l3', nombre: 'Carlos Ramos Huertas', email: 'ramoshuertascarlos@gmail.com', mensaje: 'Restaurante en Luque, interesado en vinos', tipo: 'HORECA', canal: 'Formulario web', fecha: '2026-06-24', ultimaAccion: 'Lead recibido — contactado', proximaAccion: 'Enviar propuesta carta de vinos', status: 'contactado' },
  { id: 'l4', nombre: 'Fabricio Beckelmann', email: 'sebastian.beckelmann@protonmail.com', mensaje: 'Interesado en colaboración comercial', tipo: 'Comercial', canal: 'Formulario web', fecha: '2026-06-25', ultimaAccion: 'Lead recibido — contactado', proximaAccion: 'Evaluar perfil para zona Este', status: 'contactado' },
  { id: 'l5', nombre: 'Sonia Barreto', email: 'soniaelizabethbarreto2@gmail.com', mensaje: 'Mayorista vinos, solicita catálogo', tipo: 'Distribuidor', canal: 'Formulario web', fecha: '2026-06-25', ultimaAccion: 'Lead recibido — contactado', proximaAccion: 'Enviar catálogo + condiciones mayorista', status: 'contactado' },
  { id: 'l6', nombre: 'Julio Lois', email: 'juliolois2014@gmail.com', mensaje: 'Uruguayo en Paraguay, bueno en ventas, contactos Brasil SP', tipo: 'Comercial', canal: 'Formulario web', fecha: '2026-06-20', ultimaAccion: 'Contactado', proximaAccion: 'Evaluar como comercial zona Sur/Brasil', status: 'contactado' },
  { id: 'l7', nombre: 'A.J. Vierci (Yamil + María Liz)', empresa: 'A.J. Vierci', email: 'contacto@ajvierci.com.py', mensaje: 'Distribuidor nacional interesado en exclusividad', tipo: 'Distribuidor', canal: 'Referido', fecha: '2026-06-15', ultimaAccion: 'Reunión inicial — muy interesados', proximaAccion: 'Enviar propuesta distribuidor exclusivo', status: 'interesado' },
  { id: 'l8', nombre: 'Manuel Mejías', email: 'mejiasmanuel006@gmail.com', mensaje: 'Más información de productos', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-18', ultimaAccion: 'Contactado — catálogo enviado', proximaAccion: 'Seguimiento esta semana', status: 'contactado' },
  { id: 'l9', nombre: 'Gricelda Boggino', email: 'lis59boggino@gmail.com', mensaje: 'Vendedores independientes del interior Paraguay', tipo: 'Comercial', canal: 'Formulario web', fecha: '2026-06-20', ultimaAccion: 'Contactada', proximaAccion: 'Evaluar perfil para red comercial interior', status: 'contactado' },
  { id: 'l10', nombre: 'Guillermo Torres', email: 'gtamd@email.com', mensaje: 'Lista precios aceites, compra mínima', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-23', ultimaAccion: 'Contactado — precios enviados', proximaAccion: 'Confirmar pedido inicial', status: 'contactado' },
  { id: 'l11', nombre: 'Hernán Candia', email: 'hercand@gmail.com', mensaje: 'Favor enviar catálogo y precios', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-22', ultimaAccion: 'Contactado — catálogo enviado', proximaAccion: 'Seguimiento 7 días', status: 'contactado' },
  { id: 'l12', nombre: 'Marcos Griffith', email: 'marcos.griffith@gmail.com', mensaje: 'Catálogo y precios aceite y vinos, minorista', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-22', ultimaAccion: 'Contactado — catálogo enviado', proximaAccion: 'Enviar lista de precios', status: 'contactado' },
  { id: 'l13', nombre: 'Fabio Duré', email: 'fabio.dure@hotmail.com', mensaje: 'A qué número puedo contactar', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-21', ultimaAccion: 'Contactado — WhatsApp enviado', proximaAccion: 'Esperar respuesta WA', status: 'contactado' },
  { id: 'l14', nombre: 'Sdriano Alvarez', email: 'alvarezadriano57@gmail.com', mensaje: 'Adquirir vinos y aceites españoles', tipo: 'Minorista', canal: 'Formulario web', fecha: '2026-06-22', ultimaAccion: 'Contactado — catálogo enviado', proximaAccion: 'Seguimiento pedido', status: 'contactado' },
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
  { id: 't9', empresa: 'A.J. Vierci', tipo: 'Distribuidor nacional multi-canal', ciudad: 'Asunción', zona: 'Asunción', status: 'en_conversacion', web: 'ajvierci.com.py', contacto: 'Yamil + María Liz', ultimoContacto: '2026-06-15', proximoPaso: 'Enviar propuesta distribuidor exclusivo' },
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

const PRODUCTOS_PRECIOS: { id: string; nombre: string; do: string; formato: string; A: number; B: number; C: number }[] = [
  { id: 'ivanto_joven',      nombre: 'D.O. Rioja Ivanto Joven 75cl',                    do: 'D.O. Rioja',              formato: '75cl', A: 6.75,  B: 6.30,  C: 5.85  },
  { id: 'ivanto_crianza',    nombre: 'D.O. Rioja Ivanto Crianza 75cl',                  do: 'D.O. Rioja',              formato: '75cl', A: 7.50,  B: 7.00,  C: 6.50  },
  { id: 'torremoron_joven',  nombre: 'D.O. Ribera del Duero Torremorón Joven 75cl',     do: 'D.O. Ribera del Duero',   formato: '75cl', A: 9.75,  B: 9.10,  C: 8.45  },
  { id: 'torremoron_crianza',nombre: 'D.O. Ribera del Duero Torremorón Crianza 75cl',   do: 'D.O. Ribera del Duero',   formato: '75cl', A: 13.50, B: 12.75, C: 11.05 },
  { id: 'navarra_rosado',    nombre: 'D.O. Navarra Rosado 75cl',                        do: 'D.O. Navarra',            formato: '75cl', A: 6.15,  B: 5.74,  C: 5.33  },
  { id: 'rueda_verdejo',     nombre: 'D.O. Rueda Verdejo Blanco 75cl',                  do: 'D.O. Rueda',              formato: '75cl', A: 6.15,  B: 5.74,  C: 5.33  },
  { id: 'aove_ev_1l',        nombre: 'Urzante AOVE Extra Virgen 1L',                    do: 'DOP Navarra',             formato: '1L',   A: 4.40,  B: 3.85,  C: 3.30  },
  { id: 'aove_cristal_500',  nombre: 'Urzante AOVE Premium Cristal 500ml',              do: 'DOP Navarra',             formato: '500ml',A: 7.69,  B: 6.72,  C: 5.76  },
  { id: 'aove_cristal_250',  nombre: 'Urzante AOVE Premium Cristal 250ml',              do: 'DOP Navarra',             formato: '250ml',A: 8.61,  B: 7.53,  C: 6.65  },
  { id: 'aove_pet_1l',       nombre: 'Urzante AOVE Premium PET 1L',                     do: 'DOP Navarra',             formato: '1L',   A: 14.92, B: 12.57, C: 10.73 },
  { id: 'girasol',           nombre: 'Urzante Refinado Girasol Alto Oleico',             do: 'DOP Navarra',             formato: '1L',   A: 5.44,  B: 4.78,  C: 4.08  },
];

const PVP_MULTIPLIER: Record<string, number> = {
  'Distribuidor regional':                 1.40,
  'HORECA directo (restaurante/hotel)':    2.80,
  'Vinoteca/retail':                       1.65,
  'Exportación (Colombia, EEUU, etc.)':    1.20,
};

const DEFAULT_CONDICIONES = '30% anticipo al confirmar pedido.\n70% contra entrega. FOB Paraguay.';

const MERCADOS: { label: string; moneda: MonedaPres }[] = [
  { label: 'Paraguay',        moneda: 'PYG' },
  { label: 'Colombia',        moneda: 'EUR' },
  { label: 'EEUU',            moneda: 'EUR' },
  { label: 'Rep. Dominicana', moneda: 'EUR' },
  { label: 'Otro',            moneda: 'EUR' },
];

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

const LM_SYSTEM_PROMPT = `Eres el asistente comercial de Last Mile Distribution, importadora directa de vinos y aceites españoles D.O. para Paraguay. Canal B2B puro. Tono: profesional y cercano. Siempre en español. Énfasis en: D.O. certificada, respaldo DISXUQUER +20 años, stock Paraguay, entrega inmediata, nunca competir en precio sino en calidad y prestigio. WhatsApp comercial: +34 654835593. Email: ventas@lastmiledist.com. Web: lastmiledist.com`;

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

function LoginScreen({ onLogin }: { onLogin: (user: LMUser) => void }) {
  const [sel, setSel] = useState('admin');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  function handleLogin() {
    const user = LM_USERS.find(u => u.id === sel);
    if (!user || user.password !== pwd) { setErr('Contraseña incorrecta'); return; }
    setErr('');
    onLogin(user);
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ ...CARD_S, width: 340, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: VINO, letterSpacing: '-0.04em' }}>Last Mile</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Panel comercial — acceso privado</div>
        </div>
        <label style={LABEL_S}>Usuario</label>
        <select value={sel} onChange={e => setSel(e.target.value)} style={{ ...INPUT, marginBottom: 12 }}>
          {LM_USERS.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
        <label style={LABEL_S}>Contraseña</label>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="••••••••" style={{ ...INPUT, marginBottom: 16 }} />
        {err && <div style={{ fontSize: 12, color: '#E74C3C', marginBottom: 12 }}>{err}</div>}
        <button onClick={handleLogin} style={{ width: '100%', background: VINO, color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Entrar
        </button>
      </div>
    </div>
  );
}

function UrgenciaBadge({ lead }: { lead: Lead }) {
  const now = new Date();
  const fechaUltimo = lead.ultimoContactoFecha ? new Date(lead.ultimoContactoFecha) : new Date(lead.fecha);
  const diffH = (now.getTime() - fechaUltimo.getTime()) / (1000 * 3600);
  if (diffH > 168) return <span style={{ fontSize: 10, background: '#E74C3C', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>🔴 +7d sin contacto</span>;
  if (diffH > 48)  return <span style={{ fontSize: 10, background: '#F39C12', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>🟡 +48h sin contacto</span>;
  return <span style={{ fontSize: 10, background: '#27AE60', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>🟢 Al día</span>;
}

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
  const [activeUser, setActiveUser] = useLocalStorage<LMUser | null>('lm_usuario_activo', null);
  const role: UserRole = activeUser?.role ?? 'admin';
  const TABS = getTabs(role);
  const [tab, setTab] = useState<TabType>('Resumen');
  const [leads, setLeads] = useLocalStorage<Lead[]>('lm_leads', INITIAL_LEADS);
  const [tracker, setTracker] = useLocalStorage<TrackerEntry[]>('lm_tracker', INITIAL_TRACKER);
  const [catalog, setCatalog] = useLocalStorage<CatalogItem[]>('lm_catalogo', INITIAL_CATALOG);
  const [comerciales, setComerciales] = useLocalStorage<Comercial[]>('lm_comerciales', INITIAL_COMERCIALES);
  const [notaMes, setNotaMes] = useLocalStorage<string>('lm_nota', '');

  // ── Precios & Presupuestos state ──
  const [tipoCambio, setTipoCambio] = useLocalStorage<number>('lm_tipo_cambio', 7800);
  const [presupuestos, setPresupuestos] = useLocalStorage<Presupuesto[]>('lm_presupuestos', []);
  const [presCounter, setPresCounter] = useLocalStorage<number>('lm_pres_num', 0);

  // Calculadora
  const [calcProd, setCalcProd] = useState('ivanto_crianza');
  const [calcNivel, setCalcNivel] = useState<NivelPrecio>('B');
  const [calcCliente, setCalcCliente] = useState('Distribuidor regional');

  // Formulario presupuesto
  const [presCliente, setPresCliente] = useState('');
  const [presEmpresa, setPresEmpresa] = useState('');
  const [presEmail, setPresEmail] = useState('');
  const [presMercado, setPresMercado] = useState('Paraguay');
  const [presMoneda, setPresMoneda] = useState<MonedaPres>('PYG');
  const [presValidez, setPresValidez] = useState<'30'|'60'|'90'>('30');
  const [presNotas, setPresNotas] = useState('');
  const [presCondiciones, setPresCondiciones] = useState(DEFAULT_CONDICIONES);
  const [presFilas, setPresFilas] = useState<FilaPresupuesto[]>([{ productoId: 'ivanto_crianza' }]);
  const [presLoading, setPresLoading] = useState(false);
  const [presError, setPresError] = useState('');
  const [emailSending, setEmailSending] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Presupuesto | null>(null);

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

  // Pipeline
  const [pipelineFiltro, setPipelineFiltro] = useState('todos');

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

  // ── Helpers precios ──
  function precioProducto(id: string, nivel: NivelPrecio): number {
    const p = PRODUCTOS_PRECIOS.find(x => x.id === id);
    return p ? p[nivel] : 0;
  }

  function fmtGs(n: number) { return new Intl.NumberFormat('es-PY').format(Math.round(n)) + ' Gs'; }
  function fmtEur(n: number) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }

  function buildPdfHtml(p: Presupuesto, contenido: string): string {
    const logoUrl = window.location.origin + '/logo-lastmile.png';
    const introMatch  = contenido.match(/INTRO:\s*([\s\S]*?)(?=CIERRE:|$)/);
    const cierreMatch = contenido.match(/CIERRE:\s*([\s\S]*?)$/);
    const intro  = introMatch?.[1]?.trim()  || '';
    const cierre = cierreMatch?.[1]?.trim() || '';

    const showGs = p.moneda === 'PYG';
    const price  = (eur: number) => showGs
      ? `${fmtGs(eur * tipoCambio)}<br/><small style="color:#888">${fmtEur(eur)}</small>`
      : fmtEur(eur);

    const rows = p.filas.map(f => {
      const prod = PRODUCTOS_PRECIOS.find(x => x.id === f.productoId)!;
      return `<tr>
        <td><strong>${prod.nombre}</strong></td>
        <td>${prod.do}</td>
        <td style="text-align:center">${price(prod.A)}</td>
        <td style="text-align:center">${price(prod.B)}</td>
        <td style="text-align:center">${price(prod.C)}</td>
      </tr>`;
    }).join('');

    const clientInfo = [p.mercado, p.email].filter(Boolean).join(' · ');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Presupuesto ${p.numero}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; color: #222; font-size: 13px; line-height: 1.6; padding: 40px 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .logo { max-width: 140px; max-height: 60px; object-fit: contain; }
  .title-block { text-align: right; }
  .title-block h1 { font-size: 20px; color: #722F37; letter-spacing: 0.05em; }
  .title-block .num { font-size: 13px; color: #555; margin-top: 4px; }
  .title-block .dates { font-size: 12px; color: #888; margin-top: 2px; }
  .divider { border: none; border-top: 2px solid #722F37; margin: 24px 0; }
  .client-block { margin-bottom: 24px; }
  .client-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 6px; }
  .client-block p { font-size: 14px; font-weight: bold; color: #222; }
  .client-block span { font-size: 12px; color: #555; }
  .intro { margin-bottom: 24px; font-size: 13px; color: #333; line-height: 1.8; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #722F37; color: #fff; padding: 10px 12px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; line-height: 1.4; }
  th:first-child, th:nth-child(2) { text-align: left; }
  td { padding: 10px 12px; border-bottom: 1px solid #e8e8e8; font-size: 12px; text-align: center; vertical-align: middle; }
  td:first-child, td:nth-child(2) { text-align: left; }
  tr:nth-child(even) td { background: #faf8f6; }
  .note-nivel { font-size: 10px; color: #aaa; font-weight: normal; display: block; margin-top: 2px; }
  .conditions { margin-bottom: 20px; }
  .conditions h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 6px; }
  .conditions p { font-size: 12px; color: #444; white-space: pre-line; }
  .cierre { font-size: 13px; color: #333; line-height: 1.8; margin-bottom: 32px; }
  .footer { border-top: 1px solid #ddd; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .footer .info { font-size: 11px; color: #888; line-height: 1.8; }
  .footer .valid { font-size: 11px; color: #722F37; font-weight: bold; }
  @media print { body { padding: 24px 32px; } }
</style>
</head>
<body>
  <div class="header">
    <img class="logo" src="${logoUrl}" alt="Last Mile Distribution" onerror="this.style.display='none'" />
    <div class="title-block">
      <h1>PRESUPUESTO COMERCIAL</h1>
      <div class="num">${p.numero}</div>
      <div class="dates">Fecha de emisión: ${p.fecha}<br/>Válido hasta: ${p.fechaValidez}</div>
    </div>
  </div>
  <hr class="divider"/>
  <div class="client-block">
    <h3>Preparado para</h3>
    <p>${p.cliente}${p.empresa ? ' — ' + p.empresa : ''}</p>
    ${clientInfo ? `<span>${clientInfo}</span>` : ''}
  </div>
  ${intro ? `<div class="intro">${intro.replace(/\n/g, '<br/>')}</div>` : ''}
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>D.O.</th>
        <th>Nivel A<span class="note-nivel">1 pallet</span></th>
        <th>Nivel B<span class="note-nivel">1–6 pallets</span></th>
        <th>Nivel C<span class="note-nivel">Contenedor</span></th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="conditions">
    <h3>Condiciones de pago y entrega</h3>
    <p>${p.condiciones}</p>
  </div>
  ${p.notas ? `<div class="conditions"><h3>Notas adicionales</h3><p>${p.notas}</p></div>` : ''}
  ${cierre ? `<div class="cierre">${cierre.replace(/\n/g, '<br/>')}</div>` : ''}
  <div class="footer">
    <div class="info">
      Last Mile Distribution<br/>
      ventas@lastmiledist.com · +34 654835593<br/>
      lastmiledist.com
    </div>
    <div class="valid">Presupuesto válido hasta ${p.fechaValidez}</div>
  </div>
</body>
</html>`;
  }

  async function generarPresupuesto() {
    if (!presCliente) { setPresError('El nombre del cliente es obligatorio'); return; }
    if (presFilas.length === 0) { setPresError('Añade al menos un producto'); return; }

    setPresError('');
    setPresLoading(true);

    const num = presCounter + 1;
    setPresCounter(num);
    const numero = `LM-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
    const hoy = new Date().toISOString().split('T')[0];
    const fv  = new Date(); fv.setDate(fv.getDate() + parseInt(presValidez));
    const fechaValidez = fv.toISOString().split('T')[0];

    const listaProductos = presFilas.map(f => {
      const prod = PRODUCTOS_PRECIOS.find(x => x.id === f.productoId)!;
      return `- ${prod.nombre} (${prod.do})`;
    }).join('\n');

    const prompt = `Eres el asistente comercial de Last Mile Distribution. Genera el contenido para un presupuesto formal. Responde EXACTAMENTE en este formato (sin texto adicional):

INTRO: [párrafo de saludo personalizado dirigido a "${presCliente}"${presEmpresa ? ' de "' + presEmpresa + '"' : ''}, mercado ${presMercado}. Presentar brevemente los productos incluidos, destacando las denominaciones de origen. Tono corporativo. 3-4 frases.]

CIERRE: [párrafo de cierre invitando a confirmar y resolver dudas. Mencionar que los precios se muestran en 3 niveles según volumen. Firma como ventas@lastmiledist.com. 2 frases.]

Productos incluidos:
${listaProductos}`;

    try {
      const r = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'custom', data: { prompt } }),
      });
      const d = await r.json();
      const contenido = d.content || '';

      const pres: Presupuesto = {
        id: `pres-${Date.now()}`,
        numero,
        cliente: presCliente,
        empresa: presEmpresa || undefined,
        email: presEmail || undefined,
        mercado: presMercado,
        moneda: presMoneda,
        validez: presValidez,
        filas: [...presFilas],
        notas: presNotas,
        condiciones: presCondiciones,
        fecha: hoy,
        fechaValidez,
        estado: 'Enviado',
        contenido,
      };

      setPresupuestos(prev => [pres, ...prev]);
      setLastGenerated(pres);

      const html = buildPdfHtml(pres, contenido);
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      const win  = window.open(url, '_blank');
      if (win) setTimeout(() => win.print(), 800);
    } catch {
      setPresError('Error generando presupuesto');
    }
    setPresLoading(false);
  }

  async function enviarPorEmail(p: Presupuesto) {
    if (!p.contenido || !p.email) return;
    setEmailSending(p.id);
    const html = buildPdfHtml(p, p.contenido);
    try {
      await fetch('/api/lastmile/send-presupuesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: p.email,
          clientName: p.cliente,
          subject: `Presupuesto Last Mile Distribution - ${p.cliente}`,
          htmlContent: html,
        }),
      });
      setPresupuestos(prev => prev.map(x => x.id === p.id ? { ...x, estado: 'Enviado' } : x));
    } catch { /* ignore */ }
    setEmailSending(null);
  }

  function abrirPdf(p: Presupuesto) {
    if (!p.contenido) return;
    const html = buildPdfHtml(p, p.contenido);
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  }

  function addFilaPresupuesto() {
    setPresFilas(prev => [...prev, { productoId: PRODUCTOS_PRECIOS[0].id }]);
  }

  function updateFilaProd(i: number, productoId: string) {
    setPresFilas(prev => prev.map((f, idx) => idx === i ? { productoId } : f));
  }

  function removeFila(i: number) {
    setPresFilas(prev => prev.filter((_, idx) => idx !== i));
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

  if (!activeUser) return <LoginScreen onLogin={u => { setActiveUser(u); setTab(getTabs(u.role)[0]); }} />;

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
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 10px' }}>{activeUser.nombre}</span>
          <a href="https://lastmiledist.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: `1px solid ${VINO_BORDER}`, color: VINO, textDecoration: 'none', background: VINO_DIM }}>lastmiledist.com ↗</a>
          <button onClick={() => setActiveUser(null)} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>Salir</button>
          {role === 'admin' && <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: 'rgba(39,174,96,0.1)', color: '#27AE60', border: '1px solid rgba(39,174,96,0.25)', fontWeight: 600 }}>EN CURSO</span>}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{leads.length} leads en pipeline · {nuevosUrgentes.length} sin contactar</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {role === 'admin' && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[['todos', 'Todos'], ['sin', 'Sin asignar'], ['com1', 'Comercial 1'], ['com2', 'Comercial 2']].map(([k, l]) => (
                    <button key={k} onClick={() => setPipelineFiltro(k)} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', border: `1px solid ${pipelineFiltro === k ? VINO : 'var(--border)'}`, background: pipelineFiltro === k ? VINO_DIM : 'transparent', color: pipelineFiltro === k ? VINO : 'var(--text-muted)', cursor: 'pointer', fontWeight: pipelineFiltro === k ? 600 : 400 }}>{l}</button>
                  ))}
                </div>
              )}
              {role === 'admin' && <button onClick={() => setShowAddLead(true)} style={{ padding: '8px 16px', borderRadius: '6px', background: VINO, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>+ Añadir lead</button>}
            </div>
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
              let colLeads = leads.filter(l => l.status === col.key);
              if (role === 'comercial') colLeads = colLeads.filter(l => l.asignadoA === activeUser?.comercialId);
              else if (pipelineFiltro === 'sin') colLeads = colLeads.filter(l => !l.asignadoA);
              else if (pipelineFiltro === 'com1') colLeads = colLeads.filter(l => l.asignadoA === 'com1');
              else if (pipelineFiltro === 'com2') colLeads = colLeads.filter(l => l.asignadoA === 'com2');
              return (
                <div key={col.key} style={{ background: 'var(--surface)', borderRadius: '8px', padding: '12px', minHeight: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: col.key === 'nuevo' ? '#E74C3C' : col.key === 'cerrado' ? '#27AE60' : 'var(--text-muted)' }}>{col.label}</span>
                    <span style={{ fontSize: '11px', background: 'var(--card)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '10px', border: '1px solid var(--border)' }}>{colLeads.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {colLeads.map(lead => (
                      <div key={lead.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', cursor: 'default' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: `${TIPO_COLORS[lead.tipo]}20`, color: TIPO_COLORS[lead.tipo], fontWeight: 600 }}>{lead.tipo}</span>
                          <UrgenciaBadge lead={lead} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{lead.nombre}</div>
                        {lead.empresa && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lead.empresa}</div>}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>{lead.mensaje.slice(0, 60)}{lead.mensaje.length > 60 ? '...' : ''}</div>
                        <div style={{ fontSize: '10px', color: VINO, marginTop: '6px', fontWeight: 500 }}>→ {lead.proximaAccion.slice(0, 50)}</div>
                        {role === 'admin' && (
                          <div style={{ marginTop: '8px' }}>
                            <select value={lead.asignadoA || ''} onChange={e => setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, asignadoA: e.target.value || undefined } : l))}
                              style={{ ...INPUT, fontSize: '10px', padding: '3px 6px', color: lead.asignadoA ? VINO : 'var(--text-muted)' }}>
                              <option value="">Sin asignar</option>
                              <option value="com1">Comercial 1</option>
                              <option value="com2">Comercial 2</option>
                            </select>
                          </div>
                        )}
                        {lead.asignadoA && role !== 'admin' && (
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>👤 {lead.asignadoA === 'com1' ? 'Comercial 1' : 'Comercial 2'}</div>
                        )}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{catalog.filter(c => c.stock === 'disponible').length} referencias con stock en Paraguay</div>
            <button
              onClick={() => {
                const items = catalog.map(i => `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0e6e6">${i.tipo === 'Aceite AOVE' ? '🫒' : '🍷'} <strong>${i.nombre}</strong></td><td style="padding:8px 12px;border-bottom:1px solid #f0e6e6;color:#666">${i.do}${i.bodega ? ` · ${i.bodega}` : ''}</td><td style="padding:8px 12px;border-bottom:1px solid #f0e6e6;font-size:12px;color:${i.stock === 'disponible' ? '#16a34a' : '#ca8a04'}">${i.stock === 'disponible' ? '✅ Stock Paraguay' : i.stock === 'bajo_pedido' ? '📦 Bajo pedido' : '—'}</td></tr>`).join('');
                const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Catálogo Last Mile 2026</title><style>body{font-family:Georgia,serif;color:#1a1a1a;margin:0;padding:40px}h1{color:#722F37;font-size:28px;margin-bottom:4px}.sub{color:#666;font-size:14px;margin-bottom:32px}table{width:100%;border-collapse:collapse}th{text-align:left;padding:10px 12px;background:#722F37;color:#fff;font-size:13px}@media print{button{display:none}}</style></head><body><h1>Catálogo de Productos 2026</h1><p class="sub">Distribuidora de Vinos y Aceites Españoles D.O. · ventas@lastmiledist.com · +34 654835593</p><table><thead><tr><th>Producto</th><th>D.O. / Bodega</th><th>Disponibilidad</th></tr></thead><tbody>${items}</tbody></table><p style="margin-top:40px;font-size:12px;color:#999">Precios disponibles bajo solicitud · lastmiledist.com</p><button onclick="window.print()" style="margin-top:20px;padding:10px 24px;background:#722F37;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">🖨 Imprimir / Guardar PDF</button></body></html>`;
                const w = window.open('', '_blank');
                if (w) { w.document.write(html); w.document.close(); }
              }}
              style={{ padding: '8px 18px', borderRadius: '6px', background: VINO, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
            >
              ⬇ Descargar PDF para cliente
            </button>
          </div>
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

      {/* ─────────────────── PESTAÑA 7: PRECIOS Y PRESUPUESTOS ──────────── */}
      {tab === 'Precios' && (() => {
        const calcData  = PRODUCTOS_PRECIOS.find(p => p.id === calcProd) || PRODUCTOS_PRECIOS[0];
        const precioEur = calcData[calcNivel];
        const precioGs  = precioEur * tipoCambio;
        const mult      = PVP_MULTIPLIER[calcCliente] ?? 1.40;
        const pvpGs     = precioGs * mult;
        const esHoreca  = calcCliente.startsWith('HORECA');
        const pvpCopa   = precioGs * 2.80 / 5;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── SECCIÓN A: Tipo de cambio ── */}
            <div style={{ ...CARD_S, borderLeft: `3px solid ${GOLD}` }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: GOLD, marginBottom: '12px' }}>A — Tipo de Cambio</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>1€ =</span>
                  <input
                    type="number"
                    value={tipoCambio}
                    onChange={e => setTipoCambio(Number(e.target.value))}
                    style={{ ...INPUT, width: '110px', fontSize: '18px', fontWeight: 700, color: VINO, fontFamily: "'Space Mono', monospace", textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Gs</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Actualizar mensualmente según cambio real</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>

              {/* ── SECCIÓN B izquierda: inputs calculadora ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ ...CARD_S }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: VINO, marginBottom: '14px' }}>B — Calculadora de Precio y Margen</div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={LABEL_S}>Producto</label>
                    <select style={{ ...INPUT, cursor: 'pointer' }} value={calcProd} onChange={e => setCalcProd(e.target.value)}>
                      <optgroup label="── VINOS ──">
                        {PRODUCTOS_PRECIOS.slice(0, 6).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </optgroup>
                      <optgroup label="── ACEITES ──">
                        {PRODUCTOS_PRECIOS.slice(6).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </optgroup>
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={LABEL_S}>Nivel de precio</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['A', 'B', 'C'] as NivelPrecio[]).map(n => (
                        <button key={n} onClick={() => setCalcNivel(n)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: `1px solid ${calcNivel === n ? VINO : 'var(--border)'}`, background: calcNivel === n ? VINO : 'var(--surface)', color: calcNivel === n ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          {n === 'A' ? 'A · 1 pallet' : n === 'B' ? 'B · 1–6 pallets' : 'C · Contenedor'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={LABEL_S}>Tipo de cliente</label>
                    <select style={{ ...INPUT, cursor: 'pointer' }} value={calcCliente} onChange={e => setCalcCliente(e.target.value)}>
                      {Object.keys(PVP_MULTIPLIER).map(k => <option key={k}>{k}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── SECCIÓN B derecha: outputs ── */}
              <div style={{ ...CARD_S, background: 'var(--surface)', borderLeft: `3px solid ${VINO}` }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: VINO, marginBottom: '16px' }}>Resultado — {calcData.nombre}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Precio Last Mile</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: VINO, fontFamily: "'Space Mono', monospace" }}>{fmtEur(precioEur)}<span style={{ fontSize: '12px', fontWeight: 400 }}>/ud</span></div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: "'Space Mono', monospace" }}>{fmtGs(precioGs)}<span style={{ fontSize: '11px' }}>/ud</span></div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(200,169,126,0.08)', border: `1px solid ${VINO_BORDER}` }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>PVP Recomendado <span style={{ color: GOLD }}>(×{mult})</span></div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: GOLD, fontFamily: "'Space Mono', monospace" }}>{fmtGs(pvpGs)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{fmtEur(pvpGs / tipoCambio)}</div>
                    {esHoreca && <div style={{ fontSize: '11px', color: GOLD, marginTop: '6px' }}>Por copa (150ml): <strong>{fmtGs(pvpCopa)}</strong></div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.2)' }}>
                    <div style={{ fontSize: '10px', color: '#27AE60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Margen del cliente</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#27AE60', fontFamily: "'Space Mono', monospace" }}>{fmtGs(pvpGs - precioGs)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>+{Math.round((mult - 1) * 100)}% sobre compra</div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(114,47,55,0.06)', border: `1px solid ${VINO_BORDER}` }}>
                    <div style={{ fontSize: '10px', color: VINO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Margen Last Mile</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: VINO, fontFamily: "'Space Mono', monospace" }}>~67%</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>sobre coste estimado</div>
                  </div>
                </div>

                {/* Tabla referencia todos los niveles */}
                <div style={{ marginTop: '16px', padding: '12px', borderRadius: '6px', background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Todos los niveles — {calcData.do}</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(['A', 'B', 'C'] as NivelPrecio[]).map(n => (
                      <div key={n} style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: '4px', background: calcNivel === n ? VINO_DIM : 'transparent', border: calcNivel === n ? `1px solid ${VINO_BORDER}` : '1px solid transparent' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{n === 'A' ? '1 pallet' : n === 'B' ? '1-6 pallets' : 'Contenedor'}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: VINO, fontFamily: "'Space Mono', monospace", marginTop: '2px' }}>{fmtEur(calcData[n])}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmtGs(calcData[n] * tipoCambio)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECCIÓN C: Generador de presupuesto ── */}
            <div style={{ ...CARD_S }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: VINO, marginBottom: '16px' }}>C — Generar Presupuesto para Cliente</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={LABEL_S}>Nombre cliente / empresa *</label>
                  <input style={INPUT} value={presCliente} onChange={e => setPresCliente(e.target.value)} placeholder="Ej: Martina Castillo" />
                </div>
                <div>
                  <label style={LABEL_S}>Empresa <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input style={INPUT} value={presEmpresa} onChange={e => setPresEmpresa(e.target.value)} placeholder="Ej: Distribuidora XY" />
                </div>
                <div>
                  <label style={LABEL_S}>Email cliente <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input style={INPUT} type="email" value={presEmail} onChange={e => setPresEmail(e.target.value)} placeholder="cliente@email.com" />
                </div>
                <div>
                  <label style={LABEL_S}>Mercado</label>
                  <select
                    style={{ ...INPUT, cursor: 'pointer' }}
                    value={presMercado}
                    onChange={e => {
                      const m = MERCADOS.find(x => x.label === e.target.value);
                      setPresMercado(e.target.value);
                      if (m) setPresMoneda(m.moneda);
                    }}
                  >
                    {MERCADOS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LABEL_S}>Moneda del presupuesto</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['EUR', 'PYG'] as MonedaPres[]).map(m => (
                      <button key={m} onClick={() => setPresMoneda(m)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: `1px solid ${presMoneda === m ? VINO : 'var(--border)'}`, background: presMoneda === m ? VINO : 'var(--surface)', color: presMoneda === m ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        {m === 'EUR' ? '€ Euros' : 'Gs Guaraníes'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabla de productos */}
              <div style={{ marginBottom: '12px' }}>
                <label style={LABEL_S}>Productos a incluir</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {presFilas.map((fila, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        style={{ ...INPUT, flex: 1, cursor: 'pointer' }}
                        value={fila.productoId}
                        onChange={e => updateFilaProd(i, e.target.value)}
                      >
                        <optgroup label="── VINOS ──">
                          {PRODUCTOS_PRECIOS.slice(0, 6).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </optgroup>
                        <optgroup label="── ACEITES ──">
                          {PRODUCTOS_PRECIOS.slice(6).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </optgroup>
                      </select>
                      {presFilas.length > 1 && (
                        <button onClick={() => removeFila(i)} style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: '#E74C3C', cursor: 'pointer', fontSize: '13px' }}>✕</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addFilaPresupuesto} style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '6px', border: `1px dashed ${VINO_BORDER}`, background: VINO_DIM, color: VINO, cursor: 'pointer', fontSize: '12px' }}>+ Añadir producto</button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  El PDF mostrará los 3 niveles de precio (A/B/C) para cada producto seleccionado.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={LABEL_S}>Validez</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['30', '60', '90'] as const).map(v => (
                      <button key={v} onClick={() => setPresValidez(v)} style={{ flex: 1, padding: '7px', borderRadius: '6px', border: `1px solid ${presValidez === v ? VINO : 'var(--border)'}`, background: presValidez === v ? VINO : 'var(--surface)', color: presValidez === v ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
                        {v} días
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={LABEL_S}>Notas adicionales <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input style={INPUT} value={presNotas} onChange={e => setPresNotas(e.target.value)} placeholder="Ej: Muestras enviadas el 01/07..." />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={LABEL_S}>Condiciones de pago y entrega</label>
                <textarea style={{ ...INPUT, minHeight: '60px', resize: 'vertical', lineHeight: 1.6 }} value={presCondiciones} onChange={e => setPresCondiciones(e.target.value)} />
              </div>

              {presError && <div style={{ marginBottom: '10px', fontSize: '12px', color: '#E74C3C', padding: '8px 12px', borderRadius: '4px', background: 'rgba(231,76,60,0.08)' }}>{presError}</div>}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: lastGenerated ? '16px' : 0 }}>
                <button onClick={generarPresupuesto} disabled={presLoading} style={{ padding: '10px 24px', borderRadius: '6px', background: presLoading ? 'var(--border)' : VINO, color: '#fff', border: 'none', cursor: presLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700 }}>
                  {presLoading ? 'Generando...' : '📄 Generar presupuesto'}
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Solo "Nombre cliente" es obligatorio · Claude redacta el contenido</span>
              </div>

              {lastGenerated && (
                <div style={{ padding: '16px 20px', borderRadius: '8px', background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#27AE60' }}>✅ {lastGenerated.numero} generado</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{lastGenerated.cliente}{lastGenerated.empresa ? ` — ${lastGenerated.empresa}` : ''} · {lastGenerated.mercado}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => abrirPdf(lastGenerated)}
                      style={{ padding: '8px 18px', borderRadius: '6px', background: VINO, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                    >
                      ⬇ Descargar PDF
                    </button>
                    {lastGenerated.email && (
                      <button
                        onClick={async () => {
                          setEmailSending(lastGenerated.id);
                          await enviarPorEmail(lastGenerated);
                        }}
                        disabled={emailSending === lastGenerated.id}
                        style={{ padding: '8px 18px', borderRadius: '6px', background: '#27AE60', color: '#fff', border: 'none', cursor: emailSending === lastGenerated.id ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 700 }}
                      >
                        {emailSending === lastGenerated.id ? 'Enviando...' : '✉ Enviar al cliente'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setLastGenerated(null);
                        setPresCliente(''); setPresEmpresa(''); setPresEmail('');
                        setPresFilas([{ productoId: 'ivanto_crianza' }]); setPresNotas('');
                      }}
                      style={{ padding: '8px 14px', borderRadius: '6px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      + Nuevo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECCIÓN D: Historial ── */}
            {presupuestos.length > 0 && (
              <div style={{ ...CARD_S, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  D — Historial de Presupuestos ({presupuestos.length})
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Nº', 'Cliente', 'Productos', 'Fecha', 'Estado', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {presupuestos.map(p => {
                      const estadoColor: Record<EstadoPres, string> = { Enviado: '#F39C12', Visto: '#3498DB', Aceptado: '#27AE60', Rechazado: '#E74C3C', Expirado: '#7F8C8D' };
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 14px', fontSize: '12px', fontFamily: "'Space Mono', monospace", color: VINO, fontWeight: 600 }}>{p.numero}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{p.cliente}</div>
                            {p.empresa && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.empresa}</div>}
                            {p.email && <div style={{ fontSize: '11px', color: '#00C8FF' }}>{p.email}</div>}
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.mercado}</div>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {p.filas.slice(0, 3).map(f => {
                              const prod = PRODUCTOS_PRECIOS.find(x => x.id === f.productoId);
                              return <div key={f.productoId}>· {prod?.nombre.split(' ').slice(0, 4).join(' ')}</div>;
                            })}
                            {p.filas.length > 3 && <div>+{p.filas.length - 3} más</div>}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <div>{p.fecha}</div>
                            <div style={{ fontSize: '10px' }}>válido hasta {p.fechaValidez}</div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <select
                              value={p.estado}
                              onChange={e => setPresupuestos(prev => prev.map(x => x.id === p.id ? { ...x, estado: e.target.value as EstadoPres } : x))}
                              style={{ fontSize: '11px', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: estadoColor[p.estado], cursor: 'pointer', outline: 'none' }}
                            >
                              {(['Enviado', 'Visto', 'Aceptado', 'Rechazado', 'Expirado'] as EstadoPres[]).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button onClick={() => abrirPdf(p)} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${VINO_BORDER}`, background: VINO_DIM, color: VINO, cursor: 'pointer' }}>Ver PDF</button>
                              {p.email && (
                                <button onClick={() => enviarPorEmail(p)} disabled={emailSending === p.id} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                  {emailSending === p.id ? '...' : '✉ Reenviar'}
                                </button>
                              )}
                              <button onClick={() => {
                                setPresCliente(p.cliente); setPresEmpresa(p.empresa || ''); setPresEmail(p.email || '');
                                setPresMercado(p.mercado); setPresMoneda(p.moneda);
                                setPresValidez(p.validez); setPresFilas([...p.filas]);
                                setPresCondiciones(p.condiciones); setPresNotas(p.notas);
                              }} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}>Duplicar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

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
