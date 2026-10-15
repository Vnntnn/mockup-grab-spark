export function formatGuaranteeBaht(amount: number): string {
  return `฿ ${amount.toLocaleString('th-TH')} บาท`
}
