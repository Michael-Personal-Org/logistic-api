import { createApp } from '@/app'
import {
  operatorOrganizations,
  organizationInvitations,
  organizations,
} from '@/features/organizations/infrastructure/db/organization.schema'
import { driverProfiles } from '@/features/profiles/infrastructure/db/profile.schema'
import { userTokens, users } from '@/features/users/infrastructure/db/user.schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/users/infrastructure/services/resend.email.service', () => ({
  ResendEmailService: vi.fn(
    class ResendEmailService {
      sendWelcome = vi.fn().mockResolvedValue(undefined)
      sendPasswordReset = vi.fn().mockResolvedValue(undefined)
    }
  ),
}))

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL no está definida')

const client = postgres(databaseUrl)
const db = drizzle(client, {
  schema: {
    users,
    userTokens,
    driverProfiles,
    organizations,
    organizationInvitations,
    operatorOrganizations,
  },
})
const app = createApp()

beforeAll(async () => {
  await migrate(db, { migrationsFolder: './src/db/migrations' })
})

beforeEach(async () => {
  await db.delete(driverProfiles)
  await db.delete(userTokens)
  await db.delete(users)
})

afterAll(async () => {
  await client.end()
})

async function createAndLoginDriver() {
  const email = `driver-${crypto.randomUUID()}@example.com`
  const password = 'Password1!'

  await db.insert(users).values({
    id: crypto.randomUUID(),
    email,
    passwordHash: '',
    firstName: 'Driver',
    lastName: 'Test',
    phone: null,
    jobTitle: null,
    organizationId: null,
    mustChangePassword: false,
    status: 'active',
    role: 'DRIVER',
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const { hash } = await import('argon2')
  const passwordHash = await hash(password)
  await db
    .update(users)
    .set({ passwordHash })
    .where((await import('drizzle-orm')).eq(users.email, email))

  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password })
  const accessToken = loginRes.body.data.accessToken

  return { accessToken, email }
}

describe('Profiles E2E — Driver', () => {
  describe('POST /api/v1/profiles/driver', () => {
    it('debe crear perfil de conductor correctamente', async () => {
      const { accessToken } = await createAndLoginDriver()

      const res = await request(app)
        .post('/api/v1/profiles/driver')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          vehiclePlate: 'A123456',
          licenseNumber: 'LIC12345',
          licenseType: 'B',
        })

      expect(res.status).toBe(201)
      expect(res.body.data.profileId).toBeDefined()
    })

    it('debe retornar 403 si no es DRIVER', async () => {
      // Crear un usuario no-DRIVER
      const email = `org-${crypto.randomUUID()}@example.com`
      const password = 'Password1!'

      await db.insert(users).values({
        id: crypto.randomUUID(),
        email,
        passwordHash: '',
        firstName: 'Org',
        lastName: 'Admin',
        phone: null,
        jobTitle: null,
        organizationId: null,
        mustChangePassword: false,
        status: 'active',
        role: 'ORG_ADMIN',
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const { hash } = await import('argon2')
      const passwordHash = await hash(password)
      await db
        .update(users)
        .set({ passwordHash })
        .where((await import('drizzle-orm')).eq(users.email, email))

      const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password })
      const accessToken = loginRes.body.data.accessToken

      const res = await request(app)
        .post('/api/v1/profiles/driver')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          vehiclePlate: 'A123456',
          licenseNumber: 'LIC12345',
          licenseType: 'B',
        })

      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/v1/profiles/driver', () => {
    it('debe retornar el perfil del conductor', async () => {
      const { accessToken } = await createAndLoginDriver()

      await request(app)
        .post('/api/v1/profiles/driver')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          vehiclePlate: 'A123456',
          licenseNumber: 'LIC12345',
          licenseType: 'B',
        })

      const res = await request(app)
        .get('/api/v1/profiles/driver')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.vehiclePlate).toBe('A123456')
      expect(res.body.data.isAvailable).toBe(false)
    })
  })
})
