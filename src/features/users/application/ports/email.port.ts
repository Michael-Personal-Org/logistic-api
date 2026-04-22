export interface WelcomeEmailPayload {
  to: string
  firstName: string
  activationToken: string
}

export interface PasswordResetEmailPayload {
  to: string
  firstName: string
  resetToken: string
}

export interface IEmailPort {
  sendWelcome(payload: WelcomeEmailPayload): Promise<void>
  sendPasswordReset(payload: PasswordResetEmailPayload): Promise<void>
}
