import { NextResponse } from 'next/server';

const BREVO_API_KEY  = process.env.BREVO_API_KEY ?? '';
const NOTIFY_EMAIL   = 'info@lastmiledist.com';
const NOTIFY_NAME    = 'Last Mile Distribution';
const FROM_EMAIL     = 'info@lastmiledist.com';
const FROM_NAME      = 'Last Mile Web';

interface LeadPayload {
  nombre:    string;
  empresa:   string;
  negocio:   string;
  whatsapp:  string;
  email:     string;
  mensaje:   string;
}

async function sendBrevoEmail(lead: LeadPayload) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#722F37;border-bottom:2px solid #722F37;padding-bottom:8px;">
        🍷 Nuevo lead — Last Mile Distribution
      </h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;font-weight:bold;width:140px;">Nombre</td><td style="padding:8px;">${lead.nombre}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;">Empresa</td><td style="padding:8px;">${lead.empresa}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Tipo negocio</td><td style="padding:8px;">${lead.negocio}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;">WhatsApp</td><td style="padding:8px;"><a href="https://wa.me/${lead.whatsapp.replace(/\D/g,'')}">${lead.whatsapp}</a></td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;"><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;vertical-align:top;">Mensaje</td><td style="padding:8px;white-space:pre-wrap;">${lead.mensaje || '—'}</td></tr>
      </table>
      <hr style="margin:24px 0;border:none;border-top:1px solid #eee;"/>
      <p style="color:#999;font-size:12px;">Lead recibido desde lastmiledist.com · ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
    </div>
  `;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender:  { name: FROM_NAME, email: FROM_EMAIL },
      to:      [{ email: NOTIFY_EMAIL, name: NOTIFY_NAME }],
      replyTo: { email: lead.email, name: lead.nombre },
      subject: `Nuevo lead: ${lead.nombre} — ${lead.empresa}`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error ${res.status}: ${err}`);
  }
}

async function addBrevoContact(lead: LeadPayload) {
  if (!lead.email) return;

  await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify({
      email:      lead.email,
      updateEnabled: true,
      attributes: {
        FIRSTNAME: lead.nombre.split(' ')[0],
        LASTNAME:  lead.nombre.split(' ').slice(1).join(' '),
        COMPANY:   lead.empresa,
        SMS:       lead.whatsapp,
      },
      listIds: [3],  // Ajusta al ID de tu lista "Last Mile" en Brevo
    }),
  });
  // No lanzamos error si falla — el email ya fue enviado
}

export async function POST(req: Request) {
  // CORS — permite peticiones desde lastmiledist.com y localhost
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigins = ['https://lastmiledist.com', 'https://ads.lastmiledist.com', 'http://localhost', 'http://127.0.0.1'];
  const corsOrigin = allowedOrigins.some(o => origin.startsWith(o)) ? origin : 'https://lastmiledist.com';

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json() as Partial<LeadPayload>;

    if (!body.nombre || !body.whatsapp) {
      return NextResponse.json(
        { error: 'nombre y whatsapp son obligatorios' },
        { status: 400, headers: corsHeaders }
      );
    }

    const lead: LeadPayload = {
      nombre:   body.nombre   ?? '',
      empresa:  body.empresa  ?? 'Sin especificar',
      negocio:  body.negocio  ?? 'Sin especificar',
      whatsapp: body.whatsapp ?? '',
      email:    body.email    ?? '',
      mensaje:  body.mensaje  ?? '',
    };

    if (!BREVO_API_KEY) {
      console.warn('[lastmile/lead] BREVO_API_KEY no configurada — lead recibido pero no enviado:', lead);
      return NextResponse.json({ ok: true, warn: 'email_skipped' }, { headers: corsHeaders });
    }

    await sendBrevoEmail(lead);
    addBrevoContact(lead).catch(e => console.error('[lastmile/lead] addBrevoContact:', e));

    return NextResponse.json({ ok: true }, { headers: corsHeaders });

  } catch (err) {
    console.error('[lastmile/lead] error:', err);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Preflight CORS
export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin') ?? 'https://lastmiledist.com';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
