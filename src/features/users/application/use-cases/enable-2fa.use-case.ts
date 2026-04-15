import { UserEntity } from '@/features/users/domain/user.entity'
import {
  UserNotFoundError,
  TwoFactorAlreadyEnabledError,
  AccountNotActiveError,
} from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { ITotpPort } from '@/features/users/application/ports/totp.port'

export interface Enable2FAInput {
  userId: string
}

export interface Enable2FAOutput {
  secret: string
  qrCodeDataUrl: string
  message: string
}

export class Enable2FAUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly totpPort: ITotpPort
  ) {}

  async execute(input: Enable2FAInput): Promise<Enable2FAOutput> {
    // 1. Buscar el usuario
    const user = await this.userRepository.findById(input.userId)
    if (!user) {
      throw new UserNotFoundError(input.userId)
    }

    // 2. SOlo cuentas activas pueden habilitar 2FA
    if (!user.isActive()) {
      throw new AccountNotActiveError()
    }

    // 3. Verificar que no tenga 2FA ya habilitado
    if (user.hasTwoFactorEnabled()) {
      throw new TwoFactorAlreadyEnabledError()
    }

    // 4. GEnerar secret y QR code
    const totpSetup = await this.totpPort.generateSetup(user.email)

    // 5. Guardar el secret en el formulario pero NO habilitar 2FA aun
    // el 2FA solo se activa cuando el usuario verifica el primer codigo
    // Esto evita que se queda con 2FA "a medias" si nunca escanea el QR
    const updatedUser = UserEntity.create({
      ...user.toObject(),
      twoFactorSecret: totpSetup.secret,
      twoFactorEnabled: false,
      updatedAt: new Date(),
    })

    await this.userRepository.update(updatedUser)

    return {
      secret: totpSetup.secret,
      qrCodeDataUrl: totpSetup.qrCodeDataUrl,
      message:
        'Escanea el QR con tu app de autenticacion y verifica el codigo para activar el 2FA.',
    }
  }
}
