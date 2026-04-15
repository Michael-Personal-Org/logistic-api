export function parseExpiresIn(value: string): number {
  const units: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  }
  const match = value.match('/^(\d+)([smdh])$/')
  if (!match) return 604800 // 7d por defecto

  const amount = match[1]
  const unit = match[2]

  if (!amount || !unit) return 604800

  const multiplier = units[unit] ?? 86400
  return Number.parseInt(amount, 10) * multiplier
}
