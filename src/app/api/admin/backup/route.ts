import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { zipSync, strToU8, type Zippable } from 'fflate';
import prisma from '@/lib/db';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { getUploadsRoot } from '@/lib/data-dir';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** CSV cell: quote + escape; prefix formula-looking values so Excel won't execute them. */
function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}
function csv(headers: string[], rows: unknown[][]): Uint8Array {
  const lines = [headers.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))];
  // BOM so Excel opens Bangla/UTF-8 text correctly
  return strToU8('﻿' + lines.join('\r\n'));
}
const parse = (s: string | null | undefined) => {
  try {
    return JSON.parse(s || '{}');
  } catch {
    return {};
  }
};

function addImages(dir: string, prefix: string, out: Zippable, seen: Set<string>) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) addImages(full, rel, out, seen);
    else if (/\.(webp|png|jpe?g|gif|avif|svg|ico)$/i.test(entry.name) && !seen.has(rel)) {
      seen.add(rel);
      // images are already compressed: store without re-compressing (fast, low CPU)
      out[rel] = [new Uint8Array(fs.readFileSync(full)), { level: 0 }];
    }
  }
}

/**
 * GET /api/admin/backup            → full backup ZIP (owner only)
 * GET /api/admin/backup?only=orders → orders + order items + customers CSV ZIP
 */
export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session || session.role !== 'OWNER') {
    return NextResponse.json({ success: false, error: 'Only the owner can download backups.' }, { status: 403 });
  }
  const onlyOrders = new URL(req.url).searchParams.get('only') === 'orders';
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const files: Zippable = {};

  // ---------- orders / customers ----------
  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
  files['orders.csv'] = csv(
    ['Order No', 'Date', 'Status', 'Payment', 'Payment status', 'Incomplete', 'Trashed', 'Customer', 'Phone', 'Email',
      'Address', 'City', 'Division', 'Delivery', 'Items', 'Subtotal', 'Discount', 'Coupon', 'Shipping', 'Total',
      'Courier', 'Tracking', 'Customer note', 'Internal note'],
    orders.map((o) => {
      const a = parse(o.shippingAddress);
      return [
        o.orderNumber, o.createdAt, o.fulfillmentStatus, o.paymentMethod, o.paymentStatus, o.isIncomplete ? 'YES' : '',
        o.isTrashed ? 'YES' : '', o.customerName, o.customerPhone, o.customerEmail, a.address, a.city, a.division,
        o.deliveryMethod, o.items.map((i) => `${i.productName} ${i.size} x${i.quantity}`).join('; '), o.subtotal,
        o.discount, o.couponCode, o.shippingFee, o.total, o.courierProvider, o.courierTrackingNumber, o.customerNotes,
        o.internalNotes,
      ];
    })
  );
  files['order-items.csv'] = csv(
    ['Order No', 'Date', 'Product', 'Size', 'SKU', 'Qty', 'Unit price', 'Line total', 'Unit cost'],
    orders.flatMap((o) =>
      o.items.map((i) => [o.orderNumber, o.createdAt, i.productName, i.size, i.variantSku, i.quantity, i.unitPrice, i.totalPrice, i.purchaseCost])
    )
  );
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  files['customers.csv'] = csv(
    ['Name', 'Phone', 'Email', 'Address', 'City', 'Division', 'Total orders', 'Total spent', 'First order', 'Last order', 'Note'],
    customers.map((c) => [c.name, c.phone, c.email, c.address, c.city, c.division, c.totalOrders, c.totalSpent, c.firstOrderAt, c.lastOrderAt, c.internalNotes])
  );

  if (!onlyOrders) {
    // ---------- catalog ----------
    const products = await prisma.product.findMany({
      include: { category: true, scentFamily: true, variants: true },
      orderBy: { name: 'asc' },
    });
    files['products.csv'] = csv(
      ['Product', 'Slug', 'Status', 'Category', 'Scent family', 'Size', 'SKU', 'Price', 'Compare price', 'Cost', 'Stock', 'Reserved', 'Active', 'Images'],
      products.flatMap((p) =>
        p.variants.map((v) => [
          p.name, p.slug, p.status, p.category?.name, p.scentFamily?.name, v.size, v.sku, v.sellingPrice, v.originalPrice,
          v.purchaseCost, v.stock, v.reservedStock, v.isActive ? 'YES' : 'NO', (parse(p.images) as any[]).join?.(' | ') ?? '',
        ])
      )
    );

    // ---------- website content & settings (secrets left out of the JSON) ----------
    const sections = await prisma.websiteSection.findMany({ orderBy: { sortOrder: 'asc' } });
    const settings = await prisma.storeSetting.findMany();
    files['website-content.json'] = strToU8(
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          sections: sections.map((s) => ({ ...s, content: parse(s.contentJson), contentJson: undefined })),
          settings: Object.fromEntries(
            settings
              .filter((s) => !/(key|secret|password|token)/i.test(s.key))
              .map((s) => [s.key, parse(s.valueJson) ?? s.valueJson])
          ),
        },
        null,
        2
      )
    );

    // ---------- images: uploaded (persistent) + bundled ----------
    const seen = new Set<string>();
    addImages(path.join(getUploadsRoot(), 'images'), 'images', files, seen);
    addImages(path.join(process.cwd(), 'public', 'images'), 'images', files, seen);

    // ---------- full database snapshot (consistent copy) ----------
    const tmp = path.join(os.tmpdir(), `sp-backup-${Date.now()}.db`);
    try {
      await prisma.$executeRawUnsafe(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
      files['database/scentpalace.db'] = new Uint8Array(fs.readFileSync(tmp));
    } catch (e) {
      console.error('Backup DB snapshot failed:', e);
    } finally {
      fs.rmSync(tmp, { force: true });
    }

    files['README.txt'] = strToU8(
      [
        `Scent Palace BD backup — ${new Date().toISOString()}`,
        '',
        'orders.csv, order-items.csv, customers.csv, products.csv  → open in Excel / Google Sheets',
        'website-content.json  → all Website Content sections and store settings (API keys excluded)',
        'images/               → every product, banner and uploaded image (same paths as on the website)',
        'database/scentpalace.db → complete database copy for a full restore.',
        '',
        'KEEP THIS FILE PRIVATE: the database copy contains customer details, admin accounts and',
        'any API keys saved in Integrations.',
      ].join('\r\n')
    );
  }

  const zipped = zipSync(files, { level: 6 });

  await prisma.auditLog
    .create({
      data: {
        userId: session.id,
        userName: session.name,
        action: onlyOrders ? 'EXPORT_ORDERS' : 'FULL_BACKUP',
        entity: 'System',
        entityId: 'backup',
        details: JSON.stringify({ orders: orders.length, bytes: zipped.length }),
      },
    })
    .catch(() => {});

  const name = onlyOrders ? `scentpalace-orders-${stamp}.zip` : `scentpalace-backup-${stamp}.zip`;
  return new NextResponse(Buffer.from(zipped), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Content-Length': String(zipped.length),
      'Cache-Control': 'no-store',
    },
  });
}
