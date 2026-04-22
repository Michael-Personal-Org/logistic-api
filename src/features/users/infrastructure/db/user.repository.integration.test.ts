import { auditLogs } from '@/features/audit/infrastructure/db/audit-log.schema'
import {
  clientProfiles,
  driverProfiles,
} from '@/features/profiles/infrastructure/db/profile.schema'
import { trucks } from '@/features/trucks/infrastructure/db/truck.schema'
import { UserEntity, UserTokenEntity } from '@/features/users/domain/user.entity'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { nanoid } from 'nanoid'
import postgres from 'postgres'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { UserRepositoryImpl } from './user.repository.impl'
import { userTokens, users } from './user.schema'

// ----- Conexion a DB de test -----
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL no esta definida')

const client = postgres(databaseUrl, {
  onnotice: () => {},
})

const db = drizzle(client, {
  schema: { users, userTokens, clientProfiles, driverProfiles, auditLogs, trucks },
})
const repository = new UserRepositoryImpl(db)

// ----- Helpers -----
function makeUserEntity(overrides: Partial<Parameters<typeof UserEntity.create>[0]> = {}) {
  return UserEntity.create({
    id: crypto.randomUUID(),
    email: `test-${nanoid(6)}@example.com`,
    passwordHash: 'hash',
    firstName: 'John',
    lastName: 'Doe',
    status: 'pending',
    role: 'CLIENT',
    twoFactorSecret: null,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  })
}

function makeTokenEntity(
  userId: string,
  overrides: Partial<Parameters<typeof UserTokenEntity.create>[0]> = {}
) {
  return UserTokenEntity.create({
    id: crypto.randomUUID(),
    userId,
    token: nanoid(64),
    type: 'activation',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  })
}

// ----- Setup / Teardown -----
beforeAll(async () => {
  await migrate(db, { migrationsFolder: './src/db/migrations' })
})

beforeEach(async () => {
  await db.delete(userTokens)
  await db.delete(users)
})

afterAll(async () => {
  await client.end()
})

// ----- Tests -----
describe('UserRepositoryImpl', () => {
  describe('save y findByEmail', () => {
    it('debe guardar y recuperar un usuario por email', async () => {
      const user = makeUserEntity({ email: 'john@example.com' })
      await repository.save(user)

      const found = await repository.findByEmail('john@example.com')

      expect(found).not.toBeNull()
      expect(found?.email).toBe('john@example.com')
      expect(found?.firstName).toBe('John')
    })

    it('debe retornar null si el email no existe', async () => {
      const found = await repository.findByEmail('noexiste@example.com')
      expect(found).toBeNull()
    })
  })

  describe('findById', () => {
    it('debe retornar un usuario por id', async () => {
      const user = makeUserEntity()
      await repository.save(user)

      const found = await repository.findById(user.id)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(user.id)
    })

    it('debe retornar null si el id no existe', async () => {
      const found = await repository.findById(crypto.randomUUID())
      expect(found).toBeNull()
    })
  })

  describe('update', async () => {
    it('debe actualizar el status del usuario', async () => {
      const user = makeUserEntity({ status: 'pending' })
      await repository.save(user)

      const updated = UserEntity.create({
        ...user.toObject(),
        status: 'active',
        updatedAt: new Date(),
      })
      await repository.update(updated)

      const found = await repository.findById(user.id)
      expect(found?.status).toBe('active')
    })

    it('debe actualizar el 2FA secret', async () => {
      const user = makeUserEntity()
      await repository.save(user)

      const updated = UserEntity.create({
        ...user.toObject(),
        twoFactorSecret: 'NEW_SECRET',
        updatedAt: new Date(),
      })
      await repository.update(updated)

      const found = await repository.findById(user.id)
      expect(found?.twoFactorSecret).toBe('NEW_SECRET')
    })
  })

  describe('softDelete', () => {
    it('debe marcar el usuario como eliminado', async () => {
      const user = makeUserEntity({ status: 'active' })
      await repository.save(user)

      await repository.softDelete(user.id)

      const found = await repository.findById(user.id)
      expect(found?.deletedAt).not.toBeNull()
      expect(found?.isDeleted()).toBe(true)
    })
  })

  describe('tokens', () => {
    it('debe guardar y recuperar un token de activacion', async () => {
      const user = makeUserEntity()
      await repository.save(user)

      const token = makeTokenEntity(user.id)
      await repository.saveToken(token)

      const found = await repository.findToken(token.token, 'activation')

      expect(found).not.toBeNull()
      expect(found?.userId).toBe(user.id)
      expect(found?.isValid()).toBe(true)
    })

    it('debe retornar null si el token no existe', async () => {
      const found = await repository.findToken('nonexistent-token', 'activation')
      expect(found).toBeNull()
    })

    it('debe marcar el token como usado', async () => {
      const user = makeUserEntity()
      await repository.save(user)

      const token = makeTokenEntity(user.id)
      await repository.saveToken(token)

      await repository.markTokenAsUsed(token.id)

      const found = await repository.findToken(token.token, 'activation')
      expect(found?.isUsed()).toBe(true)
    })

    it('debe eliminar tokens expirados', async () => {
      const user = makeUserEntity()
      await repository.save(user)

      const expiredToken = makeTokenEntity(user.id, {
        expiresAt: new Date(Date.now() - 10000),
      })
      await repository.saveToken(expiredToken)

      await repository.deleteExpiredTokens(user.id)

      const found = await repository.findToken(expiredToken.token, 'activation')
      expect(found).toBe(null)
    })

    it('no debe retornar token de tipo incorrecto', async () => {
      const user = makeUserEntity()
      await repository.save(user)

      const token = makeTokenEntity(user.id, { type: 'activation' })
      await repository.saveToken(token)

      const found = await repository.findToken(token.token, 'password_reset')
      expect(found).toBeNull()
    })
  })
})
