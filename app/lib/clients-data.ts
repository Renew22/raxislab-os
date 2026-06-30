export interface ClientEvento {
  tipo: string;
  fecha: string;
  estado_prospecto: string;
  url_pagina?: string;
  url_galeria?: string;
  notas?: string;
}

export interface ClientAdAccounts {
  metaAccountId?: string;      // formato: act_XXXXXXXXX
  googleCustomerId?: string;   // formato: XXX-XXX-XXXX
  googleSiteUrl?: string;      // Search Console: https://domain.com/ o sc-domain:domain.com
  ga4PropertyId?: string;      // GA4 numeric property ID
  fresha?: boolean;
}

export interface Client {
  id: string;
  name: string;
  sector: string;
  mrr: number;
  status: 'activo' | 'en_curso' | 'pausado';
  startDate: string;
  contact: { name: string; phone?: string; email?: string };
  services: string[];
  adAccounts: ClientAdAccounts;
  evento?: ClientEvento;
  createdAt: string;
}

export const SEED_CLIENTS: Client[] = [
  {
    id: 'identity-peluqueros',
    name: 'Identity Peluqueros',
    sector: 'Peluquería/Estética',
    mrr: 550,
    status: 'activo',
    startDate: '2025-01-01',
    contact: { name: 'Identity Peluqueros' },
    services: ['Meta Ads', 'Google Ads', 'GMB'],
    adAccounts: { metaAccountId: 'act_1784662885533732' },
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'desancho-estilistas',
    name: 'Desancho Estilistas',
    sector: 'Peluquería/Estética',
    mrr: 550,
    status: 'activo',
    startDate: '2025-03-01',
    contact: { name: 'Desancho Estilistas' },
    services: ['Meta Ads', 'GMB'],
    adAccounts: { metaAccountId: 'act_386268642951204' },
    createdAt: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 'last-mile-distribution',
    name: 'Last Mile Distribution',
    sector: 'Importación / Distribución B2B',
    mrr: 0,
    status: 'en_curso',
    startDate: '2026-01-01',
    contact: { name: 'Last Mile Distribution', email: 'info@lastmiledist.com' },
    services: ['Google Ads', 'Web', 'Email Marketing', 'CRM B2B'],
    adAccounts: { metaAccountId: 'act_1244692137856631', googleCustomerId: '949-709-1021' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'malvarrosa-cf',
    name: 'Malvarrosa CF',
    sector: 'Deporte',
    mrr: 300,
    status: 'activo',
    startDate: '2025-02-01',
    contact: { name: 'Malvarrosa CF' },
    services: ['Meta Ads', 'Contenido redes'],
    adAccounts: { metaAccountId: 'act_925429943227041' },
    createdAt: '2025-02-01T00:00:00.000Z',
    evento: {
      tipo: 'evento fotografiado',
      fecha: '2026-06-27',
      estado_prospecto: 'prospecto — padres del evento son el target',
      url_galeria: '',
      url_pagina: 'raxislab.com/eventos/malvarrosa',
      notas: 'Fiesta Fin de Temporada 27/06/2026. Las familias que escaneen el QR son leads de Raxislab.',
    },
  },
  {
    id: 'matias-benegas-tattoo',
    name: 'Matías Benegas Tattoo',
    sector: 'Estudio Tattoo',
    mrr: 300,
    status: 'activo',
    startDate: '2025-04-01',
    contact: { name: 'Matías Benegas' },
    services: ['Meta Ads', 'GMB', 'Contenido'],
    adAccounts: { metaAccountId: 'act_933810958804673' },
    createdAt: '2025-04-01T00:00:00.000Z',
  },
  {
    id: 'marta-sarmiento',
    name: 'Marta Sarmiento',
    sector: 'Negocio local',
    mrr: 0,
    status: 'activo',
    startDate: '2025-01-01',
    contact: { name: 'Marta Sarmiento' },
    services: ['Meta Ads'],
    adAccounts: {},
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'ripieno-ibiza',
    name: 'Ripieno Ibiza',
    sector: 'Restaurante',
    mrr: 0,
    status: 'en_curso',
    startDate: '2026-06-25',
    contact: { name: 'Ripieno Ibiza', email: 'info@ripienoibiza.com' },
    services: ['Menú Digital', 'Sistema de Reservas'],
    adAccounts: {},
    createdAt: '2026-06-25T00:00:00.000Z',
  },
  {
    id: 'discobolos',
    name: 'Discóbolos',
    sector: 'Deporte / Club Atlético',
    mrr: 0,
    status: 'en_curso',
    startDate: '2026-07-01',
    contact: { name: 'Discóbolos' },
    services: ['Meta Ads', 'Contenido redes'],
    adAccounts: {},
    createdAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'campus-paco-alcacer',
    name: 'Campus Paco Alcácer',
    sector: 'Fútbol / Academia Deportiva',
    mrr: 0,
    status: 'en_curso',
    startDate: '2026-07-01',
    contact: { name: 'Campus Paco Alcácer' },
    services: ['Meta Ads', 'Contenido redes', 'Google Ads'],
    adAccounts: {},
    createdAt: '2026-07-01T00:00:00.000Z',
  },
];
