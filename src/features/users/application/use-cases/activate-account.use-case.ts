import { InvalidOrExpiredTokenError } from '@/features/users/domain/user.errors'
import { UserNotFoundError } from '@/features/users/domain/user.errors'
import { AccountNotActiveError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import { UserEntity } from '@/features/users/domain/user.entity'
import { nanoid } from 'nanoid'

export interface ActivateAccountInput {
  token: string
}

export interface ActivateAccountOutput {
  message: string
}

export class ActivateAccountUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ActivateAccountInput): Promise<ActivateAccountOutput> {
    // 1. Buscar el token en la db
    const userToken = await this.userRepository.findToken(input.token, 'activation')
    if (!userToken) {
      throw new InvalidOrExpiredTokenError()
    }

    // 2. Validar que no este expirado ni usado
    if (!userToken.isValid()) {
      throw new InvalidOrExpiredTokenError()
    }

    // 3. Buscar el usuario asociado
    const user = await this.userRepository.findById(userToken.userId)
    if (!user) {
      throw new UserNotFoundError(userToken.userId)
    }

    // 4. Verificar que no este ya activo
    if (user.isActive()) {
      throw new AccountNotActiveError()
    }

    // 5. Crear usuario actualizado con status activo
    const activatedUser = UserEntity.create({
      ...user.toObject(),
      status: 'active',
      updatedAt: new Date(),
    })

    // 6. Persistir cambios
    await this.userRepository.update(activatedUser)

    // 7. Marcar token como usado
    await this.userRepository.markTokenAsUsed(userToken.id)

    return {
      message: 'Cuenta activada correctamente. Ya puedes iniciar sesion',
    }
  }
}
