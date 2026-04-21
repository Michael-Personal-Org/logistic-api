import { ClientProfileEntity } from '@/features/profiles/domain/client-profile.entity'
import type { ClientProfileProps } from '@/features/profiles/domain/client-profile.entity'
import { DriverProfileEntity } from '@/features/profiles/domain/driver-profile.entity'
import type { DriverProfileProps } from '@/features/profiles/domain/driver-profile.entity'
import type { IProfileRepository } from '@/features/profiles/domain/profile.repository'
import type { Database } from '@/shared/config/database'
import { DatabaseError } from '@/shared/errors/app.error'
import { eq } from 'drizzle-orm'
import { clientProfiles, driverProfiles } from './profile.schema'

export class ProfileRepositoryImpl implements IProfileRepository {
  constructor(private readonly db: Database) {}

  // ─── Mappers ─────────────────────────────────────────────

  private toClientEntity(row: typeof clientProfiles.$inferSelect): ClientProfileEntity {
    const props: ClientProfileProps = {
      id: row.id,
      userId: row.userId,
      companyName: row.companyName,
      rnc: row.rnc ?? null,
      isApproved: row.isApproved,
      approvedBy: row.approvedBy ?? null,
      approvedAt: row.approvedAt ?? null,
      emergencyContact: row.emergencyContact ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
    return ClientProfileEntity.create(props)
  }

  private toDriverEntity(row: typeof driverProfiles.$inferSelect): DriverProfileEntity {
    const props: DriverProfileProps = {
      id: row.id,
      userId: row.userId,
      vehiclePlate: row.vehiclePlate,
      licenseNumber: row.licenseNumber,
      licenseType: row.licenseType,
      isAvailable: row.isAvailable,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
    return DriverProfileEntity.create(props)
  }

  // ─── Client Profiles ─────────────────────────────────────

  async findClientProfileByUserId(userId: string): Promise<ClientProfileEntity | null> {
    try {
      const result = await this.db
        .select()
        .from(clientProfiles)
        .where(eq(clientProfiles.userId, userId))
        .limit(1)

      const row = result[0]
      return row ? this.toClientEntity(row) : null
    } catch (error) {
      throw new DatabaseError(`Error al buscar perfil de cliente: ${error}`)
    }
  }

  async saveClientProfile(profile: ClientProfileEntity): Promise<void> {
    try {
      const data = profile.toObject()
      await this.db.insert(clientProfiles).values({
        id: data.id,
        userId: data.userId,
        companyName: data.companyName,
        rnc: data.rnc,
        isApproved: data.isApproved,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt,
        emergencyContact: data.emergencyContact,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    } catch (error) {
      throw new DatabaseError(`Error al guardar perfil de cliente: ${error}`)
    }
  }

  async updateClientProfile(profile: ClientProfileEntity): Promise<void> {
    try {
      const data = profile.toObject()
      await this.db
        .update(clientProfiles)
        .set({
          companyName: data.companyName,
          rnc: data.rnc,
          isApproved: data.isApproved,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt,
          emergencyContact: data.emergencyContact,
          updatedAt: new Date(),
        })
        .where(eq(clientProfiles.userId, data.userId))
    } catch (error) {
      throw new DatabaseError(`Error al actualizar perfil de cliente: ${error}`)
    }
  }

  // ─── Driver Profiles ─────────────────────────────────────

  async findDriverProfileByUserId(userId: string): Promise<DriverProfileEntity | null> {
    try {
      const result = await this.db
        .select()
        .from(driverProfiles)
        .where(eq(driverProfiles.userId, userId))
        .limit(1)

      const row = result[0]
      return row ? this.toDriverEntity(row) : null
    } catch (error) {
      throw new DatabaseError(`Error al buscar perfil de conductor: ${error}`)
    }
  }

  async saveDriverProfile(profile: DriverProfileEntity): Promise<void> {
    try {
      const data = profile.toObject()
      await this.db.insert(driverProfiles).values({
        id: data.id,
        userId: data.userId,
        vehiclePlate: data.vehiclePlate,
        licenseNumber: data.licenseNumber,
        licenseType: data.licenseType,
        isAvailable: data.isAvailable,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    } catch (error) {
      throw new DatabaseError(`Error al guardar perfil de conductor: ${error}`)
    }
  }

  async updateDriverProfile(profile: DriverProfileEntity): Promise<void> {
    try {
      const data = profile.toObject()
      await this.db
        .update(driverProfiles)
        .set({
          vehiclePlate: data.vehiclePlate,
          licenseNumber: data.licenseNumber,
          licenseType: data.licenseType,
          isAvailable: data.isAvailable,
          updatedAt: new Date(),
        })
        .where(eq(driverProfiles.userId, data.userId))
    } catch (error) {
      throw new DatabaseError(`Error al actualizar perfil de conductor: ${error}`)
    }
  }
}
