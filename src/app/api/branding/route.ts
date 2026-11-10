import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await prisma.storeSetting.findMany({
      where: { group: "BRANDING" },
    });

    const brandingMap: Record<string, string> = {};
    for (const s of settings) {
      try {
        brandingMap[s.key] = JSON.parse(s.valueJson);
      } catch {
        brandingMap[s.key] = s.valueJson;
      }
    }

    return NextResponse.json(
      {
        storefrontLogoUrl: brandingMap["storefrontLogoUrl"] || "",
        storefrontLogoDarkUrl: brandingMap["storefrontLogoDarkUrl"] || "",
        faviconUrl: brandingMap["faviconUrl"] || "",
        adminLogoUrl: brandingMap["adminLogoUrl"] || "",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET branding error:", error);
    return NextResponse.json(
      { storefrontLogoUrl: "", storefrontLogoDarkUrl: "", faviconUrl: "", adminLogoUrl: "" },
      { status: 200 }
    );
  }
}

