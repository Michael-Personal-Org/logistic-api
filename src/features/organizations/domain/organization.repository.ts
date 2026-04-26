import type { OrganizationInvitationEntity } from './organization-invitation.entity'
import type { OrganizationEntity } from './organization.entity'

export interface FindManyOrganizationsParams {
  status?: 'pending' | 'active' | 'suspended' | undefined
  operatorId?: string
  page?: number
  limit?: number
}

export interface FindManyOrganizationsResult {
  organizations: OrganizationEntity[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IOrganizationRepository {
  findById(id: string): Promise<OrganizationEntity | null>
  findByEmail(email: string): Promise<OrganizationEntity | null>
  findByRnc(rnc: string): Promise<OrganizationEntity | null>
  findMany(params: FindManyOrganizationsParams): Promise<FindManyOrganizationsResult>
  save(organization: OrganizationEntity): Promise<void>
  update(organization: OrganizationEntity): Promise<void>

  // Invitaciones
  saveInvitation(invitation: OrganizationInvitationEntity): Promise<void>
  findInvitationByToken(token: string): Promise<OrganizationInvitationEntity | null>
  updateInvitation(invitation: OrganizationInvitationEntity): Promise<void>

  // Operator assignments
  assignOperator(operatorId: string, organizationId: string): Promise<void>
  isOperatorAssigned(operatorId: string, organizationId: string): Promise<boolean>
  findOperatorOrganizationIds(operatorId: string): Promise<string[]>
}
