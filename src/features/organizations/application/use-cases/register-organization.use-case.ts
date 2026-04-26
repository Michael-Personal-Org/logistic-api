import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '@/features/audit/domain/audit-log.constants'
import type { IEmailPort } from '@/features/users/application/ports/email.port'
import type { ITokenPort } from '@/features/users/application/ports/token.port'
import { UserEntity, UserTokenEntity } from '@/features/users/domain/user.entity'
import { UserAlreadyExistsError } from '@/features/users/domain/user.errors'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { AuditService } from '@/shared/services/audit.service'
import { passwordUtils } from '@/shared/utils/password.utils'
import { OrganizationEntity } from '../../domain/organization.entity'
import { OrganizationAlreadyExistsError } from '../../domain/organization.errors'
import type { IOrganizationRepository } from '../../domain/organization.repository'

export interface RegisterOrganizationInput {
  // Datos de la empresa
  orgName: string
  rnc: string
  orgPhone: string
  orgEmail: string
  address: string
  industry?: string

  // Datos del admin principal
  firstName: string
  lastName: string
  adminEmail: string
  adminPhone: string
  jobTitle?: string
  password: string

  // Metadata
  ipAddress?: string | undefined
}

export interface RegisterOrganizationOutput {
  organizationId: string
  userId: string
  message: string
}

export class RegisterOrganizationUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly userRepository: IUserRepository,
    private readonly emailPort: IEmailPort,
    private readonly tokenPort: ITokenPort,
    private readonly auditService: AuditService
  ) {}

  async execute(input: RegisterOrganizationInput): Promise<RegisterOrganizationOutput> {
    // 1. Verificar que no exista la organización
    if (input.rnc) {
      const existingRnc = await this.organizationRepository.findByRnc(input.rnc)
      if (existingRnc) throw new OrganizationAlreadyExistsError('RNC')
    }

    const existingOrgEmail = await this.organizationRepository.findByEmail(input.orgEmail)
    if (existingOrgEmail) throw new OrganizationAlreadyExistsError('email empresarial')

    // 2. Verificar que no exista el usuario admin
    const existingUser = await this.userRepository.findByEmail(input.adminEmail)
    if (existingUser) throw new UserAlreadyExistsError(input.adminEmail)

    const now = new Date()

    // 3. Crear organización
    const organization = OrganizationEntity.create({
      id: crypto.randomUUID(),
      name: input.orgName.trim(),
      rnc: input.rnc?.trim() ?? null,
      phone: input.orgPhone.trim(),
      email: input.orgEmail.toLowerCase().trim(),
      address: input.address.trim(),
      industry: input.industry?.trim() ?? null,
      status: 'pending',
      isApproved: false,
      approvedAt: null,
      approvedBy: null,
      createdAt: now,
      updatedAt: now,
    })

    await this.organizationRepository.save(organization)

    // 4. Crear usuario ORG_ADMIN
    const passwordHash = await passwordUtils.hash(input.password)

    const user = UserEntity.create({
      id: crypto.randomUUID(),
      email: input.adminEmail.toLowerCase().trim(),
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.adminPhone.trim(),
      jobTitle: input.jobTitle?.trim() ?? null,
      organizationId: organization.id,
      mustChangePassword: false,
      status: 'pending',
      role: 'ORG_ADMIN',
      twoFactorSecret: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })

    await this.userRepository.save(user)

    // 5. Generar token de activación
    const activationToken = this.tokenPort.generateSecureToken()
    const expiresAt = this.tokenPort.getExpirationDate(60 * 48)

    const userToken = UserTokenEntity.create({
      id: crypto.randomUUID(),
      userId: user.id,
      token: activationToken,
      type: 'activation',
      expiresAt,
      usedAt: null,
      createdAt: now,
    })

    await this.userRepository.saveToken(userToken)

    // 6. Enviar email de activación
    await this.emailPort.sendWelcome({
      to: user.email,
      firstName: user.firstName,
      activationToken,
    })

    // 7. Audit log
    await this.auditService.log(
      { userId: user.id, ipAddress: input.ipAddress },
      AUDIT_ACTIONS.ORGANIZATION_CREATED,
      AUDIT_RESOURCES.ORGANIZATION,
      organization.id
    )

    return {
      organizationId: organization.id,
      userId: user.id,
      message: 'Organización registrada. Revisa tu email para activar tu cuenta.',
    }
  }
}
