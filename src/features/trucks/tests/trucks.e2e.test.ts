import { createApp } from '@/app'
import { auditLogs } from '@/features/audit/infrastructure/db/audit-log.schema'
import {
  clientProfiles,
  driverProfiles,
} from '@/features/profiles/infrastructure/db/profile.schema'
import { trucks } from '@/features/trucks/infrastructure/db/truck.schema'
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

// ─── Setup ───────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL no está definida')

const client = postgres(databaseUrl, { onnotice: () => {} })
const db = drizzle(client, {
  schema: { users, userTokens, clientProfiles, driverProfiles, auditLogs, trucks },
})
const app = createApp()

beforeAll(async () => {
  await migrate(db, { migrationsFolder: './src/db/migrations' })
})

beforeEach(async () => {
  await db.delete(auditLogs)
  await db.delete(trucks)
  await db.delete(clientProfiles)
  await db.delete(driverProfiles)
  await db.delete(userTokens)
  await db.delete(users)
})

afterAll(async () => {
  await client.end()
})

// ─── Helpers ─────────────────────────────────────────────
async function createAndLoginUser(role: 'CLIENT' | 'DRIVER' | 'ADMIN' | 'OPERATOR' = 'ADMIN') {
  const email = `test-${crypto.randomUUID()}@example.com`
  const password = 'Password1!'

  const { hash } = await import('argon2')
  const passwordHash = await hash(password)

  await db.insert(users).values({
    id: crypto.randomUUID(),
    email,
    passwordHash,
    firstName: 'Test',
    lastName: 'User',
    status: 'active',
    role,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password })

  return {
    accessToken: loginRes.body.data.accessToken,
    userId: loginRes.body.data.user.id,
  }
}

const validTruck = {
  plateNumber: 'ABC1234',
  model: 'Volvo FH16',
  capacity: '20 toneladas',
  allowedCargoTypes: ['GENERAL', 'FRAGILE'],
}

// ─── Tests ───────────────────────────────────────────────
describe('Trucks E2E', () => {
  describe('POST /api/v1/trucks', () => {
    it('debe crear un camión correctamente', async () => {
      const { accessToken } = await createAndLoginUser('ADMIN')

      const res = await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.truckId).toBeDefined()
    })

    it('debe retornar 409 si la placa ya existe', async () => {
      const { accessToken } = await createAndLoginUser('ADMIN')

      await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      const res = await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      expect(res.status).toBe(409)
    })

    it('debe retornar 403 si es CLIENT', async () => {
      const { accessToken } = await createAndLoginUser('CLIENT')

      const res = await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      expect(res.status).toBe(403)
    })

    it('debe retornar 401 sin token', async () => {
      const res = await request(app).post('/api/v1/trucks').send(validTruck)

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/v1/trucks', () => {
    it('debe listar camiones', async () => {
      const { accessToken } = await createAndLoginUser('ADMIN')

      await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      const res = await request(app)
        .get('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.trucks.length).toBe(1)
      expect(res.body.data.total).toBe(1)
    })

    it('debe filtrar por disponibilidad', async () => {
      const { accessToken } = await createAndLoginUser('OPERATOR')

      await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      const res = await request(app)
        .get('/api/v1/trucks?isAvailable=true')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.trucks.length).toBe(1)
    })
  })

  describe('GET /api/v1/trucks/:truckId', () => {
    it('debe retornar el detalle del camión', async () => {
      const { accessToken } = await createAndLoginUser('ADMIN')

      const createRes = await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      const truckId = createRes.body.data.truckId

      const res = await request(app)
        .get(`/api/v1/trucks/${truckId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.plateNumber).toBe('ABC1234')
    })

    it('debe retornar 404 si no existe', async () => {
      const { accessToken } = await createAndLoginUser('ADMIN')

      const res = await request(app)
        .get(`/api/v1/trucks/${crypto.randomUUID()}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/v1/trucks/:truckId', () => {
    it('debe actualizar el camión', async () => {
      const { accessToken } = await createAndLoginUser('ADMIN')

      const createRes = await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      const truckId = createRes.body.data.truckId

      const res = await request(app)
        .put(`/api/v1/trucks/${truckId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ model: 'Mercedes Actros' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('PATCH /api/v1/trucks/:truckId/assign-driver', () => {
    it('debe asignar un conductor al camión', async () => {
      const { accessToken } = await createAndLoginUser('ADMIN')
      const { userId: driverId } = await createAndLoginUser('DRIVER')

      const createRes = await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      const truckId = createRes.body.data.truckId

      const res = await request(app)
        .patch(`/api/v1/trucks/${truckId}/assign-driver`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ driverId })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('debe retornar 409 si el camión ya tiene conductor', async () => {
      const { accessToken } = await createAndLoginUser('ADMIN')
      const { userId: driverId1 } = await createAndLoginUser('DRIVER')
      const { userId: driverId2 } = await createAndLoginUser('DRIVER')

      const createRes = await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      const truckId = createRes.body.data.truckId

      await request(app)
        .patch(`/api/v1/trucks/${truckId}/assign-driver`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ driverId: driverId1 })

      const res = await request(app)
        .patch(`/api/v1/trucks/${truckId}/assign-driver`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ driverId: driverId2 })

      expect(res.status).toBe(409)
    })
  })

  describe('DELETE /api/v1/trucks/:truckId', () => {
    it('debe eliminar el camión', async () => {
      const { accessToken } = await createAndLoginUser('ADMIN')

      const createRes = await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTruck)

      const truckId = createRes.body.data.truckId

      const res = await request(app)
        .delete(`/api/v1/trucks/${truckId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
    })

    it('debe retornar 403 si es OPERATOR', async () => {
      const { accessToken: adminToken } = await createAndLoginUser('ADMIN')
      const { accessToken: operatorToken } = await createAndLoginUser('OPERATOR')

      const createRes = await request(app)
        .post('/api/v1/trucks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validTruck)

      const truckId = createRes.body.data.truckId

      const res = await request(app)
        .delete(`/api/v1/trucks/${truckId}`)
        .set('Authorization', `Bearer ${operatorToken}`)

      expect(res.status).toBe(403)
    })
  })
})
