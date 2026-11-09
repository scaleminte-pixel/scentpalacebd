import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const settings = await prisma.storeSetting.findMany({
      where: { group: 'INTEGRATION' },
    });

    const configMap: Record<string, any> = {};
    for (const s of settings) {
      try {
        configMap[s.key] = JSON.parse(s.valueJson);
      } catch {
        configMap[s.key] = s.valueJson;
      }
    }

    // COD is enabled by default unless explicitly disabled
    const codEnabled = configMap['cod_enabled'] !== false;
    const bkashEnabled = configMap['bkash_enabled'] === true;
    const nagadEnabled = configMap['nagad_enabled'] === true;
    const sslcommerzEnabled = configMap['sslcommerz_enabled'] === true;

    const insideDhakaFee = typeof configMap['cod_insideDhakaFee'] === 'number' ? configMap['cod_insideDhakaFee'] : 60;
    const outsideDhakaFee = typeof configMap['cod_outsideDhakaFee'] === 'number' ? configMap['cod_outsideDhakaFee'] : 120;

    const methods = [];

    if (codEnabled) {
      methods.push({
        id: 'cod',
        name: 'Cash on Delivery (COD)',
        description: 'Pay with cash directly to the courier agent upon receiving your luxury parcel.',
        enabled: true,
      });
    }

    if (bkashEnabled || nagadEnabled) {
      methods.push({
        id: 'bkash',
        name: 'bKash / Nagad Mobile Banking',
        description: 'Instant mobile transaction with OTP & PIN verification.',
        enabled: true,
      });
    }

    if (sslcommerzEnabled) {
      methods.push({
        id: 'card',
        name: 'Visa / Mastercard / Amex (SSLCOMMERZ)',
        description: '256-bit encrypted card checkout via local and international bank cards.',
        enabled: true,
      });
    }

    // Fallback: If all are turned off, keep COD enabled so customers can always order
    if (methods.length === 0) {
      methods.push({
        id: 'cod',
        name: 'Cash on Delivery (COD)',
        description: 'Pay with cash directly to the courier agent upon receiving your luxury parcel.',
        enabled: true,
      });
    }

    return NextResponse.json({
      success: true,
      deliveryFees: {
        insideDhaka: insideDhakaFee,
        outsideDhaka: outsideDhakaFee,
        freeThreshold: 5000,
      },
      paymentMethods: methods,
    });
  } catch (error: any) {
    console.error('Payment methods error:', error);
    return NextResponse.json({
      success: false,
      deliveryFees: {
        insideDhaka: 60,
        outsideDhaka: 120,
        freeThreshold: 5000,
      },
      paymentMethods: [
        {
          id: 'cod',
          name: 'Cash on Delivery (COD)',
          description: 'Pay with cash directly to the courier agent upon receiving your luxury parcel.',
          enabled: true,
        },
      ],
    });
  }
}
