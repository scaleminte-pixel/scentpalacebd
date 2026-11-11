import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await prisma.storeSetting.findMany();

    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      try {
        settingsMap[s.key] = JSON.parse(s.valueJson);
      } catch {
        settingsMap[s.key] = s.valueJson;
      }
    }

    const storeName = settingsMap["storeName"] || "Rāwdah Haute Parfumerie";
    const storeAddress = settingsMap["storeAddress"] || "Road 11, Block D, Banani / Gulshan-2, Dhaka 1213, Bangladesh";
    const storeEmail = settingsMap["storeEmail"] || "concierge@rawdahperfumes.com";
    const storePhone = settingsMap["storePhone"] || "+880 1711-000000";

    return NextResponse.json(
      {
        storefrontLogoUrl: settingsMap["storefrontLogoUrl"] || "",
        storefrontLogoDarkUrl: settingsMap["storefrontLogoDarkUrl"] || "",
        faviconUrl: settingsMap["faviconUrl"] || "",
        adminLogoUrl: settingsMap["adminLogoUrl"] || "",
        adminBrandTitle: settingsMap["adminBrandTitle"] || storeName || "Rāwdah Atelier",
        adminBrandSubtitle: settingsMap["adminBrandSubtitle"] || "Admin Console",
        adminHideText: settingsMap["adminHideText"] === true || settingsMap["adminHideText"] === "true",
        storeName,
        storeAddress,
        storeEmail,
        storePhone,
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
      {
        storefrontLogoUrl: "",
        storefrontLogoDarkUrl: "",
        faviconUrl: "",
        adminLogoUrl: "",
        adminBrandTitle: "Rāwdah Atelier",
        adminBrandSubtitle: "Admin Console",
        adminHideText: false,
        storeName: "Rāwdah Haute Parfumerie",
        storeAddress: "Road 11, Block D, Banani / Gulshan-2, Dhaka 1213, Bangladesh",
      },
      { status: 200 }
    );
  }
}
