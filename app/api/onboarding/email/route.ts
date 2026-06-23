import { NextResponse } from 'next/server';

// Genera el email de onboarding para que un cliente nuevo dé accesos
export async function POST(req: Request) {
  const { clientName, services = [] } = await req.json();

  if (!clientName) {
    return NextResponse.json({ error: 'clientName requerido' }, { status: 400 });
  }

  const bm    = process.env.META_BUSINESS_MANAGER_ID ?? '[TU_BUSINESS_MANAGER_ID]';
  const mcc   = process.env.GOOGLE_ADS_MCC_ID        ?? '[TU_MCC_DE_GOOGLE_ADS]';
  const email = process.env.RAXISLAB_GOOGLE_EMAIL     ?? '[TU_EMAIL_GOOGLE]';

  const needsMeta   = services.includes('Meta Ads')    || services.length === 0;
  const needsGoogle = services.includes('Google Ads')  || services.length === 0;
  const needsGBP    = services.includes('GMB')         || services.length === 0;
  const needsGA     = services.includes('Web')         || services.length === 0;

  const sections: string[] = [];

  if (needsMeta) {
    sections.push(`📘 META ADS
Para que gestionemos tus campañas en Meta, necesitamos acceso a tu Business Manager:

1. Entra en business.facebook.com
2. Ve a Configuración → Socios
3. Haz clic en "Añadir socio"
4. Introduce el ID de socio: ${bm}
5. Selecciona las cuentas publicitarias que quieres incluir
6. Asigna el rol "Anunciante"
7. Confirma la solicitud`);
  }

  if (needsGoogle) {
    sections.push(`🔵 GOOGLE ADS
Para acceder a tus campañas de Google:

1. Entra en ads.google.com
2. Ve a Herramientas → Acceso y seguridad → Managers
3. Haz clic en "Vincular a una cuenta de administrador"
4. Introduce el ID de administrador: ${mcc}
5. Acepta la solicitud de vinculación`);
  }

  if (needsGBP) {
    sections.push(`📍 GOOGLE BUSINESS PROFILE
Para gestionar tu ficha de Google:

1. Entra en business.google.com
2. Abre tu ficha → ve a Usuarios (ícono de persona)
3. Haz clic en "Añadir usuarios"
4. Introduce el email: ${email}
5. Selecciona el rol: Gestor
6. Confirma`);
  }

  if (needsGA) {
    sections.push(`📊 GOOGLE ANALYTICS (si tienes GA4)
Para acceder a tus estadísticas web:

1. Entra en analytics.google.com
2. Ve a Administración → Gestión de acceso a la cuenta
3. Haz clic en el ícono "+"
4. Introduce: ${email}
5. Selecciona el rol: Analista
6. Confirma`);
  }

  const emailText = `Hola,

Para comenzar a gestionar tu presencia digital, necesitamos que nos des acceso a las siguientes plataformas. El proceso es sencillo y te llevará menos de 10 minutos en total.

${sections.join('\n\n---\n\n')}

---

Si tienes cualquier duda, responde a este email o escríbenos directamente.

¡Muchas gracias y bienvenido a RaxisLab!

Saludos,
El equipo de RaxisLab`;

  const subject = `RaxisLab × ${clientName} — Accesos necesarios para empezar`;

  return NextResponse.json({ subject, body: emailText, clientName });
}
