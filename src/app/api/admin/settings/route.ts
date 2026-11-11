import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, canAccessModule } from "@/lib/auth";
import { revalidateStorefront } from "@/lib/revalidate";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || !canAccessModule(session.role, "settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.storeSetting.findMany({
      orderBy: { group: "asc" },
    });

    // Provide default structured object if empty
    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      try {
        settingsMap[s.key] = JSON.parse(s.valueJson);
      } catch {
        settingsMap[s.key] = s.valueJson;
      }
    }

    const response = {
      storeName: settingsMap["storeName"] || "Scent Palace BD",
      storeEmail: settingsMap["storeEmail"] || "concierge@scentpalacebd.com",
      storePhone: settingsMap["storePhone"] || "+880 1711-000000",
      storeAddress: settingsMap["storeAddress"] || "Road 11, Block D, Banani / Gulshan-2, Dhaka 1213, Bangladesh",
      currency: "BDT",
      currencySymbol: "৳",
      shippingFeeDhaka: settingsMap["shippingFeeDhaka"] ?? 80,
      shippingFeeOutside: settingsMap["shippingFeeOutside"] ?? 150,
      freeShippingThreshold: settingsMap["freeShippingThreshold"] ?? 5000,
      orderNotificationEmail: settingsMap["orderNotificationEmail"] || "orders@scentpalacebd.com",
      lowStockThresholdDefault: settingsMap["lowStockThresholdDefault"] ?? 10,
      bkashMerchantNumber: settingsMap["bkashMerchantNumber"] || "01711000000",
      allowGuestCheckout: settingsMap["allowGuestCheckout"] ?? true,
      maintenanceMode: settingsMap["maintenanceMode"] ?? false,
      // Branding
      storefrontLogoUrl: settingsMap["storefrontLogoUrl"] || "",
      storefrontLogoDarkUrl: settingsMap["storefrontLogoDarkUrl"] || "",
      faviconUrl: settingsMap["faviconUrl"] || "",
      adminLogoUrl: settingsMap["adminLogoUrl"] || "",
      adminBrandTitle: settingsMap["adminBrandTitle"] || settingsMap["storeName"] || "Scent Palace BD",
      adminBrandSubtitle: settingsMap["adminBrandSubtitle"] || "Admin Console",
      adminHideText: settingsMap["adminHideText"] === true || settingsMap["adminHideText"] === "true",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || !canAccessModule(session.role, "settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.storeName && (!body.adminBrandTitle || body.adminBrandTitle === 'Rāwdah Atelier')) {
      body.adminBrandTitle = body.storeName;
    }

    const keysToSave = [
      { key: "storeName", group: "GENERAL" },
      { key: "storeEmail", group: "GENERAL" },
      { key: "storePhone", group: "GENERAL" },
      { key: "storeAddress", group: "GENERAL" },
      { key: "shippingFeeDhaka", group: "SHIPPING" },
      { key: "shippingFeeOutside", group: "SHIPPING" },
      { key: "freeShippingThreshold", group: "SHIPPING" },
      { key: "orderNotificationEmail", group: "NOTIFICATIONS" },
      { key: "lowStockThresholdDefault", group: "GENERAL" },
      { key: "bkashMerchantNumber", group: "PAYMENTS" },
      { key: "allowGuestCheckout", group: "SECURITY" },
      { key: "maintenanceMode", group: "GENERAL" },
      // Branding
      { key: "storefrontLogoUrl", group: "BRANDING" },
      { key: "storefrontLogoDarkUrl", group: "BRANDING" },
      { key: "faviconUrl", group: "BRANDING" },
      { key: "adminLogoUrl", group: "BRANDING" },
      { key: "adminBrandTitle", group: "BRANDING" },
      { key: "adminBrandSubtitle", group: "BRANDING" },
      { key: "adminHideText", group: "BRANDING" },
    ];

    for (const item of keysToSave) {
      if (body[item.key] !== undefined) {
        await prisma.storeSetting.upsert({
          where: { key: item.key },
          update: {
            valueJson: JSON.stringify(body[item.key]),
            group: item.group,
          },
          create: {
            key: item.key,
            valueJson: JSON.stringify(body[item.key]),
            group: item.group,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UPDATE",
        entity: "StoreSetting",
        details: JSON.stringify({ updatedKeys: Object.keys(body) }),
      },
    });

    revalidateStorefront();

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

