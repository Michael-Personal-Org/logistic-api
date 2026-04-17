import type {
  IEmailPort,
  PasswordResetEmailPayload,
  WelcomeEmailPayload,
} from '@/features/users/application/ports/email.port'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/utils/logger'
import { Resend } from 'resend'

export class ResendEmailService implements IEmailPort {
  private readonly resend: Resend

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY)
  }

  async sendWelcome(payload: WelcomeEmailPayload): Promise<void> {
    const activationUrl = `${env.APP_URL}/auth/activate?token=${payload.activationToken}`

    const { error } = await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to: payload.to,
      subject: 'Activa tu cuenta',
      html: this.welcomeTemplate(payload.firstName, activationUrl),
    })

    if (error) {
      logger.error('Resend: error al enviar email de bienvenida', { error })
      throw new Error(`Error al enviar email: ${error.message}`)
    }
  }

  async sendPasswordReset(payload: PasswordResetEmailPayload): Promise<void> {
    const resetUrl = `${env.APP_URL}/auth/reset-password?token=${payload.resetToken}`

    const { error } = await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to: payload.to,
      subject: 'Recupera tu contraseña',
      html: this.passwordResetTemplate(payload.firstName, resetUrl),
    })

    if (error) {
      logger.error('Resend: error al enviar email de reset', { error })
      throw new Error(`Error al enviar email: ${error.message}`)
    }
  }

  private welcomeTemplate(firstName: string, activationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Bienvenido, ${firstName} 👋</h2>
          <p>Gracias por registrarte. Activa tu cuenta haciendo click en el botón:</p>

            href="${activationUrl}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 16px 0;
            "
          >
            Activar cuenta
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            Este enlace expira en 24 horas.<br/>
            Si no creaste esta cuenta, ignora este email.
          </p>
        </body>
      </html>
    `
  }

  private passwordResetTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hola, ${firstName}</h2>
          <p>Recibimos una solicitud para recuperar tu contraseña:</p>

            href="${resetUrl}"
            style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 16px 0;
            "
          >
            Recuperar contraseña
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            Este enlace expira en 1 hora.<br/>
            Si no solicitaste esto, ignora este email.
          </p>
        </body>
      </html>
    `
  }
}
