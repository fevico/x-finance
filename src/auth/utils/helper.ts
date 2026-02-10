/**
 * Generates a random alphanumeric invoice number.
 * Example output: "A1B2C3D4" or "X9Y8Z7W6"
 *
 * @param length - Optional length of the alphanumeric part (default: 8)
 * @returns A random uppercase alphanumeric string
 */
export function generateRandomInvoiceNumber(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateJournalReference(prefix: string = 'JRNL'): string {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `${prefix}${datePart}${randomPart}`;
  // Example: JRNL250410K7N4P9
}
