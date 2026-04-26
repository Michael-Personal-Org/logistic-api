import { createApp } from '@/app'
import {
  operatorOrganizations,
  organizationInvitations,
  organizations,
} from '@/features/organizations/infrastructure/db/organization.schema'
import {
  clientProfiles,
  driverProfiles,
} from '@/features/profiles/infrastructure/db/profile.schema'
import { userTokens, users } from '@/features/users/infrastructure/db/user.schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mock email ──────────────────────────────────────────
vi.mock('@/features/users/infrastructure/services/resend.email.service', () => ({
  ResendEmailService: vi.fn(
    class ResendEmailService {
      sendWelcome = vi.fn().mockResolvedValue(undefined)
      sendPasswordReset = vi.fn().mockResolvedValue(undefined)
    }
  ),
}))

// ─── Setup ───────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL no está definida')

const client = postgres(databaseUrl)
const db = drizzle(client, {
  schema: {
    users,
    userTokens,
    clientProfiles,
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
  await db.delete(clientProfiles)
  await db.delete(driverProfiles)
  await db.delete(userTokens)
  await db.delete(users)
})

afterAll(async () => {
  await client.end()
})

// ─── Helpers ─────────────────────────────────────────────
async function createAndLoginUser(
  role: 'ORG_ADMIN' | 'DRIVER' | 'ADMIN' | 'OPERATOR' = 'ORG_ADMIN'
) {
  const email = `test-${crypto.randomUUID()}@example.com`
  const password = 'Password1!'

  // Insertar usuario directamente con status active y el rol deseado
  await db.insert(users).values({
    id: crypto.randomUUID(),
    email,
    passwordHash: '',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    jobTitle: null,
    organizationId: null,
    mustChangePassword: false,
    status: 'active',
    role,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Hashear password y actualizar
  const { hash } = await import('argon2')
  const passwordHash = await hash(password)
  await db
    .update(users)
    .set({ passwordHash })
    .where((await import('drizzle-orm')).eq(users.email, email))

  // Login
  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password })

  const accessToken = loginRes.body.data.accessToken
  const userId = loginRes.body.data.user.id

  return { accessToken, userId, email }
}

// ─── Tests ───────────────────────────────────────────────
describe('Profiles E2E', () => {
  describe('POST /api/v1/profiles/client', () => {
    it('debe crear perfil de cliente correctamente', async () => {
      const { accessToken } = await createAndLoginUser('ORG_ADMIN')

      const res = await request(app)
        .post('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          companyName: 'Mi Empresa S.A.',
          rnc: '123456789',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.profileId).toBeDefined()
    })

    it('debe retornar 409 si ya tiene perfil', async () => {
      const { accessToken } = await createAndLoginUser('ORG_ADMIN')

      await request(app)
        .post('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyName: 'Mi Empresa S.A.' })

      const res = await request(app)
        .post('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyName: 'Mi Empresa S.A.' })

      expect(res.status).toBe(409)
    })

    it('debe retornar 403 si no es CLIENT', async () => {
      const { accessToken } = await createAndLoginUser('DRIVER')

      const res = await request(app)
        .post('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyName: 'Mi Empresa S.A.' })

      expect(res.status).toBe(403)
    })

    it('debe retornar 401 sin token', async () => {
      const res = await request(app)
        .post('/api/v1/profiles/client')
        .send({ companyName: 'Mi Empresa S.A.' })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/v1/profiles/client', () => {
    it('debe retornar el perfil del cliente', async () => {
      const { accessToken } = await createAndLoginUser('ORG_ADMIN')

      await request(app)
        .post('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyName: 'Mi Empresa S.A.' })

      const res = await request(app)
        .get('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.companyName).toBe('Mi Empresa S.A.')
      expect(res.body.data.isApproved).toBe(false)
    })

    it('debe retornar 404 si no tiene perfil', async () => {
      const { accessToken } = await createAndLoginUser('ORG_ADMIN')

      const res = await request(app)
        .get('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/v1/profiles/client', () => {
    it('debe actualizar el perfil del cliente', async () => {
      const { accessToken } = await createAndLoginUser('ORG_ADMIN')

      await request(app)
        .post('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyName: 'Mi Empresa S.A.' })

      const res = await request(app)
        .put('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyName: 'Empresa Actualizada S.A.' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('PATCH /api/v1/profiles/client/:userId/approve', () => {
    it('debe aprobar el perfil de un cliente', async () => {
      const { accessToken: clientToken, userId: clientId } = await createAndLoginUser('ORG_ADMIN')
      const { accessToken: operatorToken } = await createAndLoginUser('OPERATOR')

      await request(app)
        .post('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ companyName: 'Mi Empresa S.A.' })

      const res = await request(app)
        .patch(`/api/v1/profiles/client/${clientId}/approve`)
        .set('Authorization', `Bearer ${operatorToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('debe retornar 403 si es CLIENT', async () => {
      const { accessToken: clientToken, userId: clientId } = await createAndLoginUser('ORG_ADMIN')

      await request(app)
        .post('/api/v1/profiles/client')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ companyName: 'Mi Empresa S.A.' })

      const res = await request(app)
        .patch(`/api/v1/profiles/client/${clientId}/approve`)
        .set('Authorization', `Bearer ${clientToken}`)

      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/v1/profiles/driver', () => {
    it('debe crear perfil de conductor correctamente', async () => {
      const { accessToken } = await createAndLoginUser('DRIVER')

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
      const { accessToken } = await createAndLoginUser('ORG_ADMIN')

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
      const { accessToken } = await createAndLoginUser('DRIVER')

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

      console.log('RESPONSE BODY:', JSON.stringify(res.body, null, 2))

      expect(res.status).toBe(200)
      expect(res.body.data.vehiclePlate).toBe('A123456')
      expect(res.body.data.isAvailable).toBe(false)
    })
  })
})
