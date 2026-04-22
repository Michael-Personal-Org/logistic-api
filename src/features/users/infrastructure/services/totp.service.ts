import type { ITotpPort, TotpSetup } from '@/features/users/application/ports/totp.port'
import { generateSecret, generateURI, verify } from 'otplib'
import QRCode from 'qrcode'

const APP_NAME = 'Logistic API'

export class TotpService implements ITotpPort {
  async generateSetup(email: string): Promise<TotpSetup> {
    const secret = generateSecret()

    const otpauthUrl = generateURI({
      issuer: APP_NAME,
      label: email,
      secret,
    })

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
    }
  }

  async verifyToken(token: string, secret: string): Promise<boolean> {
    try {
      const result = await verify({ secret, token })
      return result.valid
    } catch {
      return false
    }
  }
}
