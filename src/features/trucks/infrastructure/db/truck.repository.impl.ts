import { TruckEntity } from '@/features/trucks/domain/truck.entity'
import type { CargoType, TruckProps } from '@/features/trucks/domain/truck.entity'
import type {
  FindTrucksOptions,
  FindTrucksResult,
  ITruckRepository,
} from '@/features/trucks/domain/truck.repository'
import type { Database } from '@/shared/config/database'
import { DatabaseError } from '@/shared/errors/app.error'
import { and, count, eq, isNull, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { trucks } from './truck.schema'

export class TruckRepositoryImpl implements ITruckRepository {
  constructor(private readonly db: Database) {}

  // ─── Mapper ──────────────────────────────────────────────
  private toEntity(row: typeof trucks.$inferSelect): TruckEntity {
    const props: TruckProps = {
      id: row.id,
      plateNumber: row.plateNumber,
      model: row.model,
      capacity: row.capacity,
      allowedCargoTypes: (row.allowedCargoTypes ?? ['GENERAL']) as CargoType[],
      isAvailable: row.isAvailable,
      assignedDriverId: row.assignedDriverId ?? null,
      deletedAt: row.deletedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
    return TruckEntity.create(props)
  }

  // ─── Queries ─────────────────────────────────────────────
  async findById(id: string): Promise<TruckEntity | null> {
    try {
      const result = await this.db.select().from(trucks).where(eq(trucks.id, id)).limit(1)

      const row = result[0]
      return row ? this.toEntity(row) : null
    } catch (error) {
      throw new DatabaseError(`Error al buscar camión por ID: ${error}`)
    }
  }

  async findByPlateNumber(plateNumber: string): Promise<TruckEntity | null> {
    try {
      const result = await this.db
        .select()
        .from(trucks)
        .where(eq(trucks.plateNumber, plateNumber))
        .limit(1)

      const row = result[0]
      return row ? this.toEntity(row) : null
    } catch (error) {
      throw new DatabaseError(`Error al buscar camión por placa: ${error}`)
    }
  }

  async findMany(options: FindTrucksOptions): Promise<FindTrucksResult> {
    try {
      const { page, limit, isAvailable, cargoType } = options
      const offset = (page - 1) * limit

      const filters: SQL[] = [isNull(trucks.deletedAt)]

      if (isAvailable !== undefined) {
        filters.push(eq(trucks.isAvailable, isAvailable))
      }

      // Para filtrar por tipo de carga usamos JSON contains
      if (cargoType) {
        filters.push(
          sql`${trucks.allowedCargoTypes}::jsonb @> ${JSON.stringify([cargoType])}::jsonb`
        )
      }

      const where = and(...filters)

      const [rows, countResult] = await Promise.all([
        this.db.select().from(trucks).where(where).limit(limit).offset(offset),
        this.db.select({ count: count() }).from(trucks).where(where),
      ])

      const total = countResult[0]?.count ?? 0

      return {
        trucks: rows.map((row) => this.toEntity(row)),
        total: Number(total),
      }
    } catch (error) {
      throw new DatabaseError(`Error al listar camiones: ${error}`)
    }
  }

  // ─── Mutations ───────────────────────────────────────────
  async save(truck: TruckEntity): Promise<void> {
    try {
      const data = truck.toObject()
      await this.db.insert(trucks).values({
        id: data.id,
        plateNumber: data.plateNumber,
        model: data.model,
        capacity: data.capacity,
        allowedCargoTypes: data.allowedCargoTypes,
        isAvailable: data.isAvailable,
        assignedDriverId: data.assignedDriverId,
        deletedAt: data.deletedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      })
    } catch (error) {
      throw new DatabaseError(`Error al guardar camión: ${error}`)
    }
  }

  async update(truck: TruckEntity): Promise<void> {
    try {
      const data = truck.toObject()
      await this.db
        .update(trucks)
        .set({
          model: data.model,
          capacity: data.capacity,
          allowedCargoTypes: data.allowedCargoTypes,
          isAvailable: data.isAvailable,
          assignedDriverId: data.assignedDriverId,
          updatedAt: new Date(),
        })
        .where(eq(trucks.id, data.id))
    } catch (error) {
      throw new DatabaseError(`Error al actualizar camión: ${error}`)
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.db
        .update(trucks)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(trucks.id, id))
    } catch (error) {
      throw new DatabaseError(`Error al eliminar camión: ${error}`)
    }
  }
}
