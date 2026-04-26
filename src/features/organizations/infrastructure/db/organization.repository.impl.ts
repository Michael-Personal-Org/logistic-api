import { OrganizationInvitationEntity } from '@/features/organizations/domain/organization-invitation.entity'
import { OrganizationEntity } from '@/features/organizations/domain/organization.entity'
import type {
  FindManyOrganizationsParams,
  FindManyOrganizationsResult,
  IOrganizationRepository,
} from '@/features/organizations/domain/organization.repository'
import type { db as dbInstance } from '@/shared/config/database'
type DbType = typeof dbInstance
import { and, count, eq, ilike, inArray } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import {
  operatorOrganizations,
  organizationInvitations,
  organizations,
} from '../db/organization.schema'

export class OrganizationRepositoryImpl implements IOrganizationRepository {
  constructor(private readonly db: DbType) {}

  async findById(id: string): Promise<OrganizationEntity | null> {
    const rows = await this.db.select().from(organizations).where(eq(organizations.id, id)).limit(1)
    return rows[0] ? this.toEntity(rows[0]) : null
  }

  async findByEmail(email: string): Promise<OrganizationEntity | null> {
    const rows = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.email, email))
      .limit(1)
    return rows[0] ? this.toEntity(rows[0]) : null
  }

  async findByRnc(rnc: string): Promise<OrganizationEntity | null> {
    const rows = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.rnc, rnc))
      .limit(1)
    return rows[0] ? this.toEntity(rows[0]) : null
  }

  async findMany(params: FindManyOrganizationsParams): Promise<FindManyOrganizationsResult> {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const offset = (page - 1) * limit

    const filters = []
    if (params.status) filters.push(eq(organizations.status, params.status))

    // Si es OPERATOR, filtrar por organizaciones asignadas
    if (params.operatorId) {
      const assignedIds = await this.findOperatorOrganizationIds(params.operatorId)
      if (assignedIds.length === 0) {
        return { organizations: [], total: 0, page, limit, totalPages: 0 }
      }
      filters.push(inArray(organizations.id, assignedIds))
    }

    const where = filters.length > 0 ? and(...filters) : undefined

    const [rows, totalRows] = await Promise.all([
      this.db.select().from(organizations).where(where).limit(limit).offset(offset),
      this.db.select({ count: count() }).from(organizations).where(where),
    ])

    const total = totalRows[0]?.count ?? 0

    return {
      organizations: rows.map((r) => this.toEntity(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async save(organization: OrganizationEntity): Promise<void> {
    const obj = organization.toObject()
    await this.db.insert(organizations).values({
      id: obj.id,
      name: obj.name,
      rnc: obj.rnc,
      phone: obj.phone,
      email: obj.email,
      address: obj.address,
      industry: obj.industry,
      status: obj.status,
      isApproved: obj.isApproved,
      approvedAt: obj.approvedAt,
      approvedBy: obj.approvedBy,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    })
  }

  async update(organization: OrganizationEntity): Promise<void> {
    const obj = organization.toObject()
    await this.db
      .update(organizations)
      .set({
        name: obj.name,
        rnc: obj.rnc,
        phone: obj.phone,
        email: obj.email,
        address: obj.address,
        industry: obj.industry,
        status: obj.status,
        isApproved: obj.isApproved,
        approvedAt: obj.approvedAt,
        approvedBy: obj.approvedBy,
        updatedAt: obj.updatedAt,
      })
      .where(eq(organizations.id, obj.id))
  }

  async saveInvitation(invitation: OrganizationInvitationEntity): Promise<void> {
    const obj = invitation.toObject()
    await this.db.insert(organizationInvitations).values({
      id: obj.id,
      organizationId: obj.organizationId,
      email: obj.email,
      role: obj.role,
      token: obj.token,
      status: obj.status,
      invitedBy: obj.invitedBy,
      expiresAt: obj.expiresAt,
      createdAt: obj.createdAt,
    })
  }

  async findInvitationByToken(token: string): Promise<OrganizationInvitationEntity | null> {
    const rows = await this.db
      .select()
      .from(organizationInvitations)
      .where(eq(organizationInvitations.token, token))
      .limit(1)
    return rows[0] ? this.toInvitationEntity(rows[0]) : null
  }

  async updateInvitation(invitation: OrganizationInvitationEntity): Promise<void> {
    const obj = invitation.toObject()
    await this.db
      .update(organizationInvitations)
      .set({ status: obj.status })
      .where(eq(organizationInvitations.id, obj.id))
  }

  async assignOperator(operatorId: string, organizationId: string): Promise<void> {
    await this.db.insert(operatorOrganizations).values({
      operatorId,
      organizationId,
    })
  }

  async isOperatorAssigned(operatorId: string, organizationId: string): Promise<boolean> {
    const rows = await this.db
      .select()
      .from(operatorOrganizations)
      .where(
        and(
          eq(operatorOrganizations.operatorId, operatorId),
          eq(operatorOrganizations.organizationId, organizationId)
        )
      )
      .limit(1)
    return rows.length > 0
  }

  async findOperatorOrganizationIds(operatorId: string): Promise<string[]> {
    const rows = await this.db
      .select({ organizationId: operatorOrganizations.organizationId })
      .from(operatorOrganizations)
      .where(eq(operatorOrganizations.operatorId, operatorId))
    return rows.map((r) => r.organizationId)
  }

  private toEntity(row: typeof organizations.$inferSelect): OrganizationEntity {
    return OrganizationEntity.create({
      id: row.id,
      name: row.name,
      rnc: row.rnc,
      phone: row.phone,
      email: row.email,
      address: row.address,
      industry: row.industry,
      status: row.status,
      isApproved: row.isApproved,
      approvedAt: row.approvedAt,
      approvedBy: row.approvedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }

  private toInvitationEntity(
    row: typeof organizationInvitations.$inferSelect
  ): OrganizationInvitationEntity {
    return OrganizationInvitationEntity.create({
      id: row.id,
      organizationId: row.organizationId,
      email: row.email,
      role: row.role,
      token: row.token,
      status: row.status,
      invitedBy: row.invitedBy,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    })
  }
}
