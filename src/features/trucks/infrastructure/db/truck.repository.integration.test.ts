import { auditLogs } from '@/features/audit/infrastructure/db/audit-log.schema'
import {
  clientProfiles,
  driverProfiles,
} from '@/features/profiles/infrastructure/db/profile.schema'
import { TruckEntity } from '@/features/trucks/domain/truck.entity'
import { userTokens, users } from '@/features/users/infrastructure/db/user.schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { TruckRepositoryImpl } from './truck.repository.impl'
import { trucks } from './truck.schema'

// ─── Setup ───────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL no está definida')

const client = postgres(databaseUrl, {
  onnotice: () => {},
})

const db = drizzle(client, {
  schema: { users, userTokens, clientProfiles, driverProfiles, auditLogs, trucks },
})
const repository = new TruckRepositoryImpl(db)

// ─── Helpers ─────────────────────────────────────────────
function makeTruckEntity(overrides: Partial<Parameters<typeof TruckEntity.create>[0]> = {}) {
  return TruckEntity.create({
    id: crypto.randomUUID(),
    plateNumber: `T${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    model: 'Volvo FH16',
    capacity: '20 toneladas',
    allowedCargoTypes: ['GENERAL', 'FRAGILE'],
    isAvailable: true,
    assignedDriverId: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  })
}

// ─── Setup / Teardown ─────────────────────────────────────
beforeAll(async () => {
  await migrate(db, { migrationsFolder: './src/db/migrations' })
})

beforeEach(async () => {
  await db.delete(trucks)
})

afterAll(async () => {
  await client.end()
})

// ─── Tests ───────────────────────────────────────────────
describe('TruckRepositoryImpl', () => {
  describe('save y findById', () => {
    it('debe guardar y recuperar un camión por id', async () => {
      const truck = makeTruckEntity()
      await repository.save(truck)

      const found = await repository.findById(truck.id)

      expect(found).not.toBeNull()
      expect(found?.plateNumber).toBe(truck.plateNumber)
      expect(found?.model).toBe('Volvo FH16')
      expect(found?.isAvailable).toBe(true)
    })

    it('debe retornar null si el id no existe', async () => {
      const found = await repository.findById(crypto.randomUUID())
      expect(found).toBeNull()
    })
  })

  describe('findByPlateNumber', () => {
    it('debe encontrar un camión por placa', async () => {
      const truck = makeTruckEntity({ plateNumber: 'PLACA001' })
      await repository.save(truck)

      const found = await repository.findByPlateNumber('PLACA001')

      expect(found).not.toBeNull()
      expect(found?.id).toBe(truck.id)
    })

    it('debe retornar null si la placa no existe', async () => {
      const found = await repository.findByPlateNumber('NOEXISTE')
      expect(found).toBeNull()
    })
  })

  describe('findMany', () => {
    it('debe listar camiones con paginación', async () => {
      await repository.save(makeTruckEntity())
      await repository.save(makeTruckEntity())
      await repository.save(makeTruckEntity())

      const result = await repository.findMany({ page: 1, limit: 10 })

      expect(result.trucks.length).toBe(3)
      expect(result.total).toBe(3)
    })

    it('debe filtrar por disponibilidad', async () => {
      await repository.save(makeTruckEntity({ isAvailable: true }))
      await repository.save(makeTruckEntity({ isAvailable: false }))

      const result = await repository.findMany({ page: 1, limit: 10, isAvailable: true })

      expect(result.trucks.length).toBe(1)
      expect(result.trucks[0]?.isAvailable).toBe(true)
    })

    it('debe filtrar por tipo de carga', async () => {
      await repository.save(makeTruckEntity({ allowedCargoTypes: ['GENERAL'] }))
      await repository.save(makeTruckEntity({ allowedCargoTypes: ['CHEMICAL', 'HAZARDOUS'] }))

      const result = await repository.findMany({
        page: 1,
        limit: 10,
        cargoType: 'CHEMICAL',
      })

      expect(result.trucks.length).toBe(1)
      expect(result.trucks[0]?.allowedCargoTypes).toContain('CHEMICAL')
    })

    it('no debe retornar camiones eliminados', async () => {
      await repository.save(makeTruckEntity())
      const deletedTruck = makeTruckEntity()
      await repository.save(deletedTruck)
      await repository.softDelete(deletedTruck.id)

      const result = await repository.findMany({ page: 1, limit: 10 })

      expect(result.trucks.length).toBe(1)
    })
  })

  describe('update', () => {
    it('debe actualizar el modelo del camión', async () => {
      const truck = makeTruckEntity()
      await repository.save(truck)

      const updated = TruckEntity.create({
        ...truck.toObject(),
        model: 'Mercedes Actros',
        updatedAt: new Date(),
      })
      await repository.update(updated)

      const found = await repository.findById(truck.id)
      expect(found?.model).toBe('Mercedes Actros')
    })

    it('debe actualizar disponibilidad', async () => {
      const truck = makeTruckEntity({ isAvailable: true })
      await repository.save(truck)

      const updated = TruckEntity.create({
        ...truck.toObject(),
        isAvailable: false,
        updatedAt: new Date(),
      })
      await repository.update(updated)

      const found = await repository.findById(truck.id)
      expect(found?.isAvailable).toBe(false)
    })
  })

  describe('softDelete', () => {
    it('debe marcar el camión como eliminado', async () => {
      const truck = makeTruckEntity()
      await repository.save(truck)

      await repository.softDelete(truck.id)

      const found = await repository.findById(truck.id)
      expect(found?.isDeleted()).toBe(true)
      expect(found?.deletedAt).not.toBeNull()
    })
  })
})
