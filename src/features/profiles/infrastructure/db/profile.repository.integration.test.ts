import { ClientProfileEntity } from '@/features/profiles/domain/client-profile.entity'
import { DriverProfileEntity } from '@/features/profiles/domain/driver-profile.entity'
import { userTokens, users } from '@/features/users/infrastructure/db/user.schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ProfileRepositoryImpl } from './profile.repository.impl'
import { clientProfiles, driverProfiles } from './profile.schema'

// ─── Setup ───────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL no está definida')

const client = postgres(databaseUrl)
const db = drizzle(client, { schema: { users, userTokens, clientProfiles, driverProfiles } })
const repository = new ProfileRepositoryImpl(db)

// ─── Helpers ─────────────────────────────────────────────
async function createTestUser(role: 'CLIENT' | 'DRIVER' | 'OPERATOR' | 'ADMIN' = 'CLIENT') {
  const id = crypto.randomUUID()
  await db.insert(users).values({
    id,
    email: `test-${crypto.randomUUID()}@example.com`,
    passwordHash: 'hash',
    firstName: 'Test',
    lastName: 'User',
    status: 'active',
    role,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return id
}

function makeClientProfile(userId: string) {
  return ClientProfileEntity.create({
    id: crypto.randomUUID(),
    userId,
    companyName: 'Test Company S.A.',
    rnc: '123456789',
    isApproved: false,
    approvedBy: null,
    approvedAt: null,
    emergencyContact: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

function makeDriverProfile(userId: string) {
  return DriverProfileEntity.create({
    id: crypto.randomUUID(),
    userId,
    vehiclePlate: 'A123456',
    licenseNumber: 'LIC12345',
    licenseType: 'B',
    isAvailable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

// ─── Setup / Teardown ─────────────────────────────────────
beforeAll(async () => {
  await migrate(db, { migrationsFolder: './src/db/migrations' })
})

beforeEach(async () => {
  await db.delete(clientProfiles)
  await db.delete(driverProfiles)
  await db.delete(users)
})

afterAll(async () => {
  await client.end()
})

// ─── Tests ───────────────────────────────────────────────
describe('ProfileRepositoryImpl', () => {
  describe('Client Profiles', () => {
    it('debe guardar y recuperar un perfil de cliente', async () => {
      const userId = await createTestUser('CLIENT')
      const profile = makeClientProfile(userId)

      await repository.saveClientProfile(profile)

      const found = await repository.findClientProfileByUserId(userId)
      expect(found).not.toBeNull()
      expect(found?.companyName).toBe('Test Company S.A.')
      expect(found?.isApproved).toBe(false)
    })

    it('debe retornar null si no existe perfil', async () => {
      const found = await repository.findClientProfileByUserId(crypto.randomUUID())
      expect(found).toBeNull()
    })

    it('debe actualizar el perfil de cliente', async () => {
      const userId = await createTestUser('CLIENT')
      const operatorId = await createTestUser('OPERATOR')
      const profile = makeClientProfile(userId)
      await repository.saveClientProfile(profile)

      const updated = ClientProfileEntity.create({
        ...profile.toObject(),
        companyName: 'Nueva Empresa S.A.',
        isApproved: true,
        approvedBy: operatorId, // ← UUID que existe en DB
        approvedAt: new Date(),
        updatedAt: new Date(),
      })

      await repository.updateClientProfile(updated)

      const found = await repository.findClientProfileByUserId(userId)
      expect(found?.companyName).toBe('Nueva Empresa S.A.')
      expect(found?.isApproved).toBe(true)
    })

    describe('Driver Profiles', () => {
      it('debe guardar y recuperar un perfil de conductor', async () => {
        const userId = await createTestUser('DRIVER')
        const profile = makeDriverProfile(userId)

        await repository.saveDriverProfile(profile)

        const found = await repository.findDriverProfileByUserId(userId)
        expect(found).not.toBeNull()
        expect(found?.vehiclePlate).toBe('A123456')
        expect(found?.isAvailable).toBe(false)
      })

      it('debe retornar null si no existe perfil', async () => {
        const found = await repository.findDriverProfileByUserId(crypto.randomUUID())
        expect(found).toBeNull()
      })

      it('debe actualizar disponibilidad del conductor', async () => {
        const userId = await createTestUser('DRIVER')
        const profile = makeDriverProfile(userId)
        await repository.saveDriverProfile(profile)

        const updated = DriverProfileEntity.create({
          ...profile.toObject(),
          isAvailable: true,
          updatedAt: new Date(),
        })

        await repository.updateDriverProfile(updated)

        const found = await repository.findDriverProfileByUserId(userId)
        expect(found?.isAvailable).toBe(true)
      })

      it('debe actualizar placa del conductor', async () => {
        const userId = await createTestUser('DRIVER')
        const profile = makeDriverProfile(userId)
        await repository.saveDriverProfile(profile)

        const updated = DriverProfileEntity.create({
          ...profile.toObject(),
          vehiclePlate: 'B654321',
          updatedAt: new Date(),
        })

        await repository.updateDriverProfile(updated)

        const found = await repository.findDriverProfileByUserId(userId)
        expect(found?.vehiclePlate).toBe('B654321')
      })
    })
  })
})
