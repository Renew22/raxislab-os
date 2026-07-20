import { NextRequest, NextResponse } from "next/server";

const CLIENTS: Record<string, { url: string; auth: string }> = {
  desancho: {
    url: "https://desancho.com",
    auth: "Basic RGVTYW5jaG86Q20xdCBqazdYIHpxYmEgT1pTUCB5TUxtIDR5MUI=",
  },
  identity: {
    url: "https://identitypeluqueros.com",
    auth: "Basic cmVuZWJlbmVnYXM6ZjZKZCA5bzMxIDJ5dG4gdTFHNiA1TUVpIDBtSzk=",
  },
  lastmile: {
    url: "https://lastmiledist.com",
    auth: "Basic cmVuZWJlbmVnYXMucmJAZ21haWwuY29tOlNKMmggd3lLUyAyN1h0IEo2bzQgVXk3TyBrdlZZ",
  },
};

export async function GET(req: NextRequest) {
  const client = req.nextUrl.searchParams.get("client") ?? "desancho";
  const cfg = CLIENTS[client];
  if (!cfg) return NextResponse.json({ error: "Unknown client" }, { status: 400 });

  try {
    // Fetch scheduled + future posts
    const [sched, drafts] = await Promise.all([
      fetch(`${cfg.url}/wp-json/wp/v2/posts?status=future&per_page=20&orderby=date&order=asc&_fields=id,title,date,status,link,excerpt`, {
        headers: { Authorization: cfg.auth, "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      }),
      fetch(`${cfg.url}/wp-json/wp/v2/posts?status=draft&per_page=10&orderby=modified&order=desc&_fields=id,title,modified,status,link,excerpt`, {
        headers: { Authorization: cfg.auth, "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      }),
    ]);

    const schedPosts = sched.ok ? await sched.json() : [];
    const draftPosts = drafts.ok ? await drafts.json() : [];

    return NextResponse.json({
      scheduled: Array.isArray(schedPosts) ? schedPosts : [],
      drafts: Array.isArray(draftPosts) ? draftPosts : [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), scheduled: [], drafts: [] });
  }
}
