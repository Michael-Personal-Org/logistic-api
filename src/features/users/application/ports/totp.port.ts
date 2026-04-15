export interface TotpSetup {
  secret: string
  otpauthUrl: string
  qrCodeDataUrl: string
}

export interface ITotpPrt {
  generateSetup(email: string): Promise<TotpSetup>
  verifyToken(token: string, secret: string): boolean
}
