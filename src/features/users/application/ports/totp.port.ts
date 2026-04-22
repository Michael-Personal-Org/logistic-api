export interface TotpSetup {
  secret: string
  otpauthUrl: string
  qrCodeDataUrl: string
}

export interface ITotpPort {
  generateSetup(email: string): Promise<TotpSetup>
  verifyToken(token: string, secret: string): Promise<boolean>
}
