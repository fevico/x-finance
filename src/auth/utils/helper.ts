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

// Usage example:
// const invoiceNumber = generateRandomInvoiceNumber();
// console.log(invoiceNumber); // e.g., "K7M4P9R2"