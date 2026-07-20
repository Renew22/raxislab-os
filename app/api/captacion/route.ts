import { NextRequest, NextResponse } from "next/server";

const PLACES_KEY = process.env.PLACES_KEY;
const SOCIAL_HOSTS = ["instagram.com", "facebook.com", "twitter.com", "tiktok.com", "linkedin.com", "youtube.com"];

function hasRealWebsite(url?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return !SOCIAL_HOSTS.some((h) => u.hostname.includes(h));
  } catch { return false; }
}

function getRootUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (SOCIAL_HOSTS.some((h) => u.hostname.includes(h))) return null;
    return u.origin;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const { category, city, maxResults = 15 } = await req.json();
  if (!category || !city)
    return NextResponse.json({ error: "category y city requeridos" }, { status: 400 });
  if (!PLACES_KEY)
    return NextResponse.json({ error: "PLACES_KEY no configurado" }, { status: 503 });

  // 1. Text Search — busca negocios de la categoría en la ciudad
  const query = `${category} ${city}`;
  const tsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=es&key=${PLACES_KEY}`,
    { signal: AbortSignal.timeout(12000) }
  );
  const tsData = await tsRes.json();

  if (!tsData.results?.length)
    return NextResponse.json({ results: [], total: 0 });

  const candidates = tsData.results.slice(0, Math.min(maxResults + 10, 30));

  // 2. Detail call por cada candidato (parallel) para obtener website + phone
  const details = await Promise.allSettled(
    candidates.map(async (p: { place_id: string; name: string; formatted_address: string; rating?: number; user_ratings_total?: number }) => {
      const dRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&language=es&key=${PLACES_KEY}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const dData = await dRes.json();
      const d = dData.result;
      return {
        placeId: p.place_id,
        name: d?.name || p.name,
        address: d?.formatted_address || p.formatted_address,
        phone: d?.formatted_phone_number || null,
        rating: d?.rating ?? p.rating ?? null,
        reviewsTotal: d?.user_ratings_total ?? p.user_ratings_total ?? 0,
        websiteRaw: d?.website || null,
        hasRealWebsite: hasRealWebsite(d?.website),
        rootUrl: getRootUrl(d?.website),
        socialLink: d?.website && !hasRealWebsite(d?.website) ? d.website : null,
      };
    })
  );

  // 3. Filtra: sin web real → leads potenciales
  const results = details
    .filter((r): r is PromiseFulfilledResult<typeof r extends PromiseFulfilledResult<infer T> ? T : never> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((b) => !b.hasRealWebsite)
    .slice(0, maxResults);

  return NextResponse.json({ results, total: results.length });
}
