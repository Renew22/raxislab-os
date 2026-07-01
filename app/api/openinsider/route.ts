import { NextResponse } from "next/server";

export interface InsiderBuy {
  filingDate: string;
  tradeDate: string;
  ticker: string;
  company: string;
  insiderName: string;
  title: string;
  value: number;
  qty: number;
  price: number;
  score: number; // 1-3 based on title + value
}

// Score insider: CEO/CFO/Founder/President = 3, Director/SVP = 2, other = 1
function insiderScore(title: string, value: number): number {
  const t = title.toUpperCase();
  let base = 1;
  if (t.includes("CEO") || t.includes("C.E.O") || t.includes("CHIEF EXEC") ||
      t.includes("CFO") || t.includes("CHIEF FIN") || t.includes("PRESIDENT") ||
      t.includes("FOUNDER") || t.includes("CHAIRMAN")) {
    base = 3;
  } else if (t.includes("DIRECTOR") || t.includes("SVP") || t.includes("EVP") ||
             t.includes("CHIEF") || t.includes("COO") || t.includes("CTO")) {
    base = 2;
  }
  // Bonus for large purchases
  if (value >= 1_000_000) return Math.min(base + 1, 3);
  return base;
}

export async function GET() {
  try {
    const url =
      "http://openinsider.com/screener?s=&o=&pl=100000&ph=&ll=&lh=&fd=14" +
      "&td=&tdr=&fdlyl=&fdlyh=&daysago=&xp=1&xs=1&vl=100&vh=&ocl=&och=" +
      "&sic1=-1&sicl=100&sich=9999&grp=0&nfl=&nfh=&nil=&nih=&nol=&noh=" +
      "&v2l=&v2h=&oc2l=&oc2h=&sortcol=0&cnt=50&action=1";

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
        "Accept": "text/html,application/xhtml+xml",
      },
      next: { revalidate: 1800 }, // cache 30 min
    });

    if (!res.ok) throw new Error(`OpenInsider HTTP ${res.status}`);
    const html = await res.text();

    // Parse table rows — each row is a <tr class="odd"> or <tr class="even">
    const rows: InsiderBuy[] = [];
    const rowRe = /<tr[^>]*class="(?:odd|even)"[^>]*>([\s\S]*?)<\/tr>/gi;
    const tdRe  = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").trim();

    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRe.exec(html)) !== null) {
      const cells: string[] = [];
      let tdMatch: RegExpExecArray | null;
      const cellRe = new RegExp(tdRe.source, "gi");
      while ((tdMatch = cellRe.exec(rowMatch[1])) !== null) {
        cells.push(stripTags(tdMatch[1]));
      }
      // Columns: X | Filing Date | Trade Date | Ticker | Company | Insider Name | Title | Trade Type | Price | Qty | Owned | ΔOwn | Value
      if (cells.length < 13) continue;
      const tradeType = cells[7] ?? "";
      if (!tradeType.includes("P -") && !tradeType.includes("Purchase")) continue; // only purchases

      const valueStr = (cells[12] ?? "").replace(/[$,+]/g, "");
      const value    = parseFloat(valueStr) || 0;
      if (value < 100_000) continue;

      const ticker   = cells[3]?.replace(/[^A-Z]/g, "") ?? "";
      if (!ticker) continue;

      const qty   = parseInt((cells[9] ?? "").replace(/[,+]/g, ""), 10) || 0;
      const price = parseFloat((cells[8] ?? "").replace(/[$,]/g, "")) || 0;
      const title = cells[6] ?? "";

      rows.push({
        filingDate:  cells[1] ?? "",
        tradeDate:   cells[2] ?? "",
        ticker,
        company:     cells[4] ?? "",
        insiderName: cells[5] ?? "",
        title,
        value,
        qty,
        price,
        score: insiderScore(title, value),
      });
    }

    // Sort by value desc, take top 30
    rows.sort((a, b) => b.value - a.value);
    return NextResponse.json({ insiders: rows.slice(0, 30), total: rows.length, ts: new Date().toISOString() });
  } catch (err) {
    console.error("[openinsider]", err);
    return NextResponse.json({ error: String(err), insiders: [] }, { status: 500 });
  }
}
