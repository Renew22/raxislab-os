import { NextRequest, NextResponse } from "next/server";

const PLACES_KEY = process.env.PLACES_KEY;
const SOCIAL_HOSTS = ["instagram.com", "facebook.com", "twitter.com", "tiktok.com", "linkedin.com", "youtube.com"];

function isRealWebsite(url?: string): boolean {
  if (!url) return false;
  try {
    return !SOCIAL_HOSTS.some((h) => new URL(url).hostname.includes(h));
  } catch { return false; }
}

function getSocialLink(url?: string): string | null {
  if (!url) return null;
  try {
    return SOCIAL_HOSTS.some((h) => new URL(url).hostname.includes(h)) ? url : null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const { category, city, maxResults = 20, mode = "all" } = await req.json();
  if (!category || !city)
    return NextResponse.json({ error: "category y city requeridos" }, { status: 400 });
  if (!PLACES_KEY)
    return NextResponse.json({ error: "PLACES_KEY no configurado" }, { status: 503 });

  const query = `${category} en ${city}`;
  const tsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=es&key=${PLACES_KEY}`,
    { signal: AbortSignal.timeout(12000) }
  );
  const tsData = await tsRes.json();
  if (!tsData.results?.length) return NextResponse.json({ results: [], total: 0 });

  const candidates = tsData.results.slice(0, Math.min(maxResults + 10, 30));

  const details = await Promise.allSettled(
    candidates.map(async (p: { place_id: string; name: string; formatted_address: string; rating?: number; user_ratings_total?: number }) => {
      const dRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,business_status,opening_hours&language=es&key=${PLACES_KEY}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const d = (await dRes.json()).result;
      const website = d?.website || null;
      const hasWeb  = isRealWebsite(website);
      const social  = getSocialLink(website);
      const phone   = d?.formatted_phone_number || null;
      const rating  = d?.rating ?? p.rating ?? null;
      const reviews = d?.user_ratings_total ?? p.user_ratings_total ?? 0;

      // Score de presencia digital (0-100)
      let score = 0;
      if (hasWeb)   score += 40;
      if (social)   score += 15;
      if (phone)    score += 15;
      if (rating && rating >= 4.0) score += 20;
      else if (rating && rating >= 3.5) score += 10;
      if (reviews >= 50) score += 10;
      else if (reviews >= 20) score += 5;

      // Oportunidades de venta detectadas
      const oportunidades: string[] = [];
      if (!hasWeb)            oportunidades.push("Sin web — oportunidad website");
      if (hasWeb && score < 70) oportunidades.push("Web sin SEO/Ads");
      if (!social)            oportunidades.push("Sin redes sociales");
      if (reviews < 20)       oportunidades.push("Pocas reseñas — gestión GMB");
      if (rating && rating < 4.0) oportunidades.push("Rating bajo — reputación");

      return {
        placeId:       p.place_id,
        name:          d?.name || p.name,
        address:       d?.formatted_address || p.formatted_address,
        phone,
        rating,
        reviewsTotal:  reviews,
        hasRealWebsite: hasWeb,
        website:       hasWeb ? website : null,
        socialLink:    social,
        presenciaScore: score,
        oportunidades,
      };
    })
  );

  let results = details
    .filter((r): r is PromiseFulfilledResult<{ placeId: string; name: string; address: string; phone: string | null; rating: number | null; reviewsTotal: number; hasRealWebsite: boolean; website: string | null; socialLink: string | null; presenciaScore: number; oportunidades: string[]; }> => r.status === "fulfilled")
    .map((r) => r.value);

  if (mode === "sinweb") results = results.filter(b => !b.hasRealWebsite);
  // "all" devuelve todos ordenados por menor score primero (más oportunidad)
  results = results.sort((a, b) => a.presenciaScore - b.presenciaScore).slice(0, maxResults);

  return NextResponse.json({ results, total: results.length });
}
