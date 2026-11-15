import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, canAccessModule } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || !canAccessModule(session.role, "Analytics")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d";

    let days = 7;
    if (range === "today") days = 1;
    if (range === "30d") days = 30;
    if (range === "90d") days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch analytics events
    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "asc" },
    });

    const totalPageViews = events.filter((e) => e.eventType === "PAGE_VIEW").length;
    const totalSessions = new Set(events.map((e) => e.sessionId)).size;
    const productViews = events.filter((e) => e.eventType === "PRODUCT_VIEW").length;
    const cartAdds = events.filter((e) => e.eventType === "ADD_TO_CART").length;
    const checkouts = events.filter((e) => e.eventType === "CHECKOUT_START").length;
    const ordersPlaced = events.filter((e) => e.eventType === "ORDER_PLACED").length;

    // Conversion rates
    const conversionRate = totalSessions > 0 ? ((ordersPlaced / totalSessions) * 100).toFixed(2) : "0.00";
    const cartConversionRate = productViews > 0 ? ((cartAdds / productViews) * 100).toFixed(2) : "0.00";
    const checkoutConversionRate = cartAdds > 0 ? ((checkouts / cartAdds) * 100).toFixed(2) : "0.00";

    // ---- Everything below is computed from real recorded events ----
    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
    const funnel = [
      { step: "Store Visits", count: totalSessions, percent: totalSessions > 0 ? 100 : 0 },
      { step: "Fragrance Views", count: productViews, percent: pct(productViews, totalSessions) },
      { step: "Added to Bag", count: cartAdds, percent: pct(cartAdds, totalSessions) },
      { step: "Initiated Checkout", count: checkouts, percent: pct(checkouts, totalSessions) },
      { step: "Completed Purchase", count: ordersPlaced, percent: pct(ordersPlaced, totalSessions) },
    ];

    // Per-session aggregation
    const sessions = new Map<string, { first: number; last: number; views: number; device: string; source: string }>();
    for (const e of events) {
      const t = new Date(e.createdAt).getTime();
      let s = sessions.get(e.sessionId);
      if (!s) {
        let source = "Direct";
        if (e.utmSource) source = e.utmSource;
        else if (e.referrer) {
          try {
            source = new URL(e.referrer).hostname.replace(/^www\./, "");
          } catch {
            source = "Referral";
          }
        }
        s = { first: t, last: t, views: 0, device: e.device || "desktop", source };
        sessions.set(e.sessionId, s);
      }
      s.first = Math.min(s.first, t);
      s.last = Math.max(s.last, t);
      if (e.eventType === "PAGE_VIEW") s.views++;
    }
    const sessionList = [...sessions.values()];

    const deviceLabels: Record<string, string> = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };
    const deviceCounts: Record<string, number> = {};
    for (const s of sessionList) deviceCounts[s.device] = (deviceCounts[s.device] || 0) + 1;
    const devices = Object.entries(deviceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ name: deviceLabels[k] || k, percentage: pct(v, totalSessions), visits: v }));

    const ordersBySession = new Set(events.filter((e) => e.eventType === "ORDER_PLACED").map((e) => e.sessionId));
    const sourceAgg: Record<string, { sessions: number; orders: number }> = {};
    for (const [id, s] of sessions) {
      const a = (sourceAgg[s.source] ||= { sessions: 0, orders: 0 });
      a.sessions++;
      if (ordersBySession.has(id)) a.orders++;
    }
    const sources = Object.entries(sourceAgg)
      .sort((a, b) => b[1].sessions - a[1].sessions)
      .slice(0, 8)
      .map(([channel, v]) => ({
        channel,
        sessions: v.sessions,
        share: totalSessions > 0 ? Number(((v.sessions / totalSessions) * 100).toFixed(1)) : 0,
        conversion: v.sessions > 0 ? `${((v.orders / v.sessions) * 100).toFixed(1)}%` : "0%",
      }));

    const pageCounts: Record<string, number> = {};
    for (const e of events) if (e.eventType === "PAGE_VIEW") pageCounts[e.path] = (pageCounts[e.path] || 0) + 1;
    const singlePage = sessionList.filter((s) => s.views <= 1).length;
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([path, views]) => ({ path, title: path, views, bounceRate: "—" }));

    const durations = sessionList.map((s) => s.last - s.first);
    const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const avgSessionDuration = `${Math.floor(avgMs / 60000)}m ${Math.round((avgMs % 60000) / 1000)}s`;
    const bounceRate = totalSessions > 0 ? `${((singlePage / totalSessions) * 100).toFixed(1)}%` : "0%";

    return NextResponse.json({
      metrics: {
        totalSessions,
        totalPageViews,
        conversionRate,
        cartConversionRate,
        checkoutConversionRate,
        avgSessionDuration,
        bounceRate,
      },
      funnel,
      devices,
      sources,
      topPages,
    });
  } catch (error) {
    console.error("GET analytics error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}

