import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, canAccessModule } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession(req);
    if (!session || !canAccessModule(session.role, "Reports")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "sales"; // sales, inventory, courier, pnl
    const format = searchParams.get("format"); // "csv" or json

    if (type === "sales") {
      const orders = await prisma.order.findMany({
        include: { items: true, customer: true, paymentTransactions: true },
        orderBy: { createdAt: "desc" },
      });

      if (format === "csv") {
        const rows = [
          ["Order Number", "Date", "Customer", "Phone", "Status", "Payment Method", "Payment Status", "Subtotal (BDT)", "Discount", "Delivery Fee", "Total (BDT)"],
          ...orders.map((o) => [
            o.orderNumber,
            new Date(o.createdAt).toISOString().split("T")[0],
            `"${o.customerName}"`,
            o.customerPhone,
            o.fulfillmentStatus,
            o.paymentMethod,
            o.paymentStatus,
            o.subtotal.toString(),
            o.discount.toString(),
            o.shippingFee.toString(),
            o.total.toString(),
          ]),
        ];
        const csvContent = rows.map((r) => r.join(",")).join("\n");
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="scentpalace-sales-report-${Date.now()}.csv"`,
          },
        });
      }

      const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
      const deliveredRevenue = orders
        .filter((o) => o.fulfillmentStatus === "DELIVERED")
        .reduce((acc, o) => acc + o.total, 0);

      return NextResponse.json({
        reportName: "Executive Sales & Revenue Report",
        period: "All Time",
        orderCount: orders.length,
        totalGrossOrdersBDT: totalRevenue,
        deliveredSalesBDT: deliveredRevenue,
        orders: orders.slice(0, 50),
      });
    }

    if (type === "inventory") {
      const variants = await prisma.productVariant.findMany({
        include: { product: true },
        orderBy: { stock: "asc" },
      });

      if (format === "csv") {
        const rows = [
          ["SKU", "Product Name", "Size", "Physical Stock", "Reserved Stock", "Available Stock", "Unit Cost (BDT)", "Retail Price (BDT)", "Total Valuation (BDT)"],
          ...variants.map((v) => [
            v.sku,
            `"${v.product.name}"`,
            v.size,
            v.stock.toString(),
            v.reservedStock.toString(),
            (v.stock - v.reservedStock).toString(),
            v.purchaseCost.toString(),
            v.sellingPrice.toString(),
            (v.stock * v.purchaseCost).toString(),
          ]),
        ];
        const csvContent = rows.map((r) => r.join(",")).join("\n");
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="scentpalace-inventory-valuation-${Date.now()}.csv"`,
          },
        });
      }

      const totalValuation = variants.reduce((acc, v) => acc + v.stock * v.purchaseCost, 0);
      const totalUnits = variants.reduce((acc, v) => acc + v.stock, 0);

      return NextResponse.json({
        reportName: "Warehouse Stock Valuation Report",
        totalUnits,
        totalValuationBDT: totalValuation,
        variants,
      });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
