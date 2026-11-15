/**
 * Courier Logistics Integration (Steadfast Courier & Pathao)
 * Handles automatic parcel dispatch booking, consignment tracking, and
 * Cash on Delivery (COD) settlement reconciliation.
 */

export interface ConsignmentRequest {
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: number; // 0 if already paid online
  note?: string;
}

export interface ConsignmentResponse {
  success: boolean;
  consignmentId: string;
  trackingCode: string;
  status: string;
  message: string;
  isMock: boolean;
}

import prisma from '@/lib/db';

const DEFAULT_STEADFAST_URL = 'https://portal.packzy.com/api/v1';

export interface SteadfastConfig {
  enabled: boolean;
  mode: 'sandbox' | 'production';
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

/** Steadfast settings: admin Integrations page first, then environment variables. */
export async function getSteadfastConfig(): Promise<SteadfastConfig> {
  const rows = await prisma.storeSetting.findMany({ where: { key: { startsWith: 'steadfast_' } } });
  const m: Record<string, any> = {};
  for (const r of rows) {
    try {
      m[r.key] = JSON.parse(r.valueJson);
    } catch {
      m[r.key] = r.valueJson;
    }
  }
  const apiKey = String(m.steadfast_apiKey || process.env.STEADFAST_API_KEY || '').trim();
  const secretKey = String(m.steadfast_secretKey || process.env.STEADFAST_SECRET_KEY || '').trim();
  return {
    enabled: m.steadfast_enabled !== false,
    mode: m.steadfast_mode === 'production' ? 'production' : 'sandbox',
    apiKey,
    secretKey,
    baseUrl: String(m.steadfast_baseUrl || process.env.STEADFAST_BASE_URL || DEFAULT_STEADFAST_URL).replace(/\/$/, ''),
  };
}

async function steadfastFetch(cfg: SteadfastConfig, path: string, init: RequestInit = {}) {
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': cfg.apiKey,
      'Secret-Key': cfg.secretKey,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  return { httpStatus: res.status, data };
}

/** Real connection check (used by admin "Test connection"). */
export async function testSteadfastConnection(): Promise<{ success: boolean; message: string }> {
  const cfg = await getSteadfastConfig();
  if (!cfg.apiKey || !cfg.secretKey) return { success: false, message: 'Steadfast API key and secret key are not set.' };
  try {
    const { httpStatus, data } = await steadfastFetch(cfg, '/get_balance', { method: 'GET' });
    if (httpStatus === 200 && (data?.status === 200 || data?.current_balance !== undefined)) {
      return { success: true, message: `Connected to Steadfast. Current balance: ৳${data.current_balance ?? '—'}.` };
    }
    return { success: false, message: `Steadfast rejected the credentials (HTTP ${httpStatus}): ${data?.message || data?.raw || 'unknown error'}` };
  } catch (err: any) {
    return { success: false, message: `Could not reach Steadfast: ${err?.message || err}` };
  }
}

/**
 * Book a parcel with Steadfast.
 * - sandbox mode: returns a clearly-labelled test booking (no real parcel).
 * - production mode: calls the real API; on any failure returns success:false
 *   (the order must NOT be marked shipped with a made-up tracking number).
 */
export async function bookCourierParcel(req: ConsignmentRequest): Promise<ConsignmentResponse> {
  const cfg = await getSteadfastConfig();

  if (cfg.mode !== 'production') {
    const n = Date.now().toString().slice(-6);
    return {
      success: true,
      consignmentId: `SANDBOX-CN-${n}`,
      trackingCode: `SANDBOX-${n}`,
      status: 'SANDBOX',
      message: 'Steadfast is in SANDBOX mode — test booking only, no real parcel was created.',
      isMock: true,
    };
  }

  if (!cfg.apiKey || !cfg.secretKey) {
    return failure('Steadfast API key / secret key are missing. Add them in Admin → Integrations.');
  }

  try {
    const { httpStatus, data } = await steadfastFetch(cfg, '/create_order', {
      method: 'POST',
      body: JSON.stringify({
        invoice: req.orderNumber,
        recipient_name: req.recipientName,
        recipient_phone: req.recipientPhone,
        recipient_address: req.recipientAddress,
        cod_amount: Math.round(req.codAmount),
        note: req.note || 'Handle with care — fragrance',
      }),
    });

    if (data?.status === 200 && data?.consignment) {
      return {
        success: true,
        consignmentId: String(data.consignment.consignment_id),
        trackingCode: String(data.consignment.tracking_code),
        status: String(data.consignment.status || 'in_review').toUpperCase(),
        message: 'Parcel booked with Steadfast Courier.',
        isMock: false,
      };
    }
    const detail = data?.errors ? JSON.stringify(data.errors) : data?.message || data?.raw || 'unknown error';
    return failure(`Steadfast did not accept the parcel (HTTP ${httpStatus}): ${detail}`);
  } catch (err: any) {
    return failure(`Could not reach Steadfast: ${err?.message || err}`);
  }
}

function failure(message: string): ConsignmentResponse {
  return { success: false, consignmentId: '', trackingCode: '', status: 'FAILED', message, isMock: false };
}

/**
 * Calculate Steadfast COD Settlement Reconciliation
 * Steadfast charges 1% COD fee inside Dhaka and standard delivery charge.
 */
export function calculateCodReconciliation(
  collectedAmount: number,
  deliveryCharge: number = 60,
  codFeePercent: number = 1.0
) {
  const codFee = Math.round((collectedAmount * codFeePercent) / 100);
  const totalDeductions = deliveryCharge + codFee;
  const netRemittance = Math.max(0, collectedAmount - totalDeductions);

  return {
    collectedAmount,
    deliveryCharge,
    codFee,
    totalDeductions,
    netRemittance,
  };
}

