import crypto from 'crypto';

/** Non-guessable order number, e.g. RDH-48213907 (8 random digits, unique). */
export async function generateOrderNumber(tx: any): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const n = crypto.randomInt(10_000_000, 100_000_000);
    const candidate = `RDH-${n}`;
    const exists = await tx.order.findUnique({ where: { orderNumber: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  throw new Error('Could not generate a unique order number');
}
