import type { UserProps, UserTokenProps } from '@/features/users/domain/user.entity'
import { UserEntity, UserTokenEntity } from '@/features/users/domain/user.entity'
import type { IUserRepository } from '@/features/users/domain/user.repository'
import type { FindManyOptions, FindManyResult } from '@/features/users/domain/user.repository'
import { userTokens, users } from '@/features/users/infrastructure/db/user.schema'
import type { Database } from '@/shared/config/database'
import { DatabaseError } from '@/shared/errors/app.error'
import { type SQL, and, count, eq, isNull, lt } from 'drizzle-orm'

export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly db: Database) {}

  // ----- Mappers -----
  private toEntity(row: typeof users.$inferSelect): UserEntity {
    const props: UserProps = {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      firstName: row.firstName,
      lastName: row.lastName,
      status: row.status,
      role: row.role,
      twoFactorSecret: row.twoFactorSecret ?? null,
      twoFactorEnabled: row.twoFactorEnabled,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    }

    return UserEntity.create(props)
  }

  private toTokenEntity(row: typeof userTokens.$inferSelect): UserTokenEntity {
    const props: UserTokenProps = {
      id: row.id,
      userId: row.userId,
      token: row.token,
      type: row.type,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    }
    return UserTokenEntity.create(props)
  }

  // ----- Users -----
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1)

      const row = result[0]
      return row ? this.toEntity(row) : null
    } catch (error) {
      if (error instanceof Error && error.message.includes('invalid input syntax for type uuid')) {
        return null
      }
      throw new DatabaseError(`Error al buscar usuario por ID: ${error}`)
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1)

      const row = result[0]
      return row ? this.toEntity(row) : null
    } catch (error) {
      throw new DatabaseError(`Error al buscar usuario por email: ${error}`)
    }
  }

  async findMany(options: FindManyOptions): Promise<FindManyResult> {
    try {
      const { page, limit, role, status } = options
      const offset = (page - 1) * limit

      const filters: SQL[] = [isNull(users.deletedAt)]
      if (role) filters.push(eq(users.role, role))
      if (status) filters.push(eq(users.status, status))

      const where = and(...filters)

      const [rows, countResult] = await Promise.all([
        this.db.select().from(users).where(where).limit(limit).offset(offset),
        this.db.select({ count: count() }).from(users).where(where),
      ])

      const total = countResult[0]?.count ?? 0

      return {
        users: rows.map((row) => this.toEntity(row)),
        total: Number(total),
      }
    } catch (error) {
      throw new DatabaseError(`Error al listar usuarios: ${error}`)
    }
  }

  async save(user: UserEntity): Promise<void> {
    try {
      const data = user.toObject()
      await this.db.insert(users).values({
        id: data.id,
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status,
        twoFactorSecret: data.twoFactorSecret,
        twoFactorEnabled: data.twoFactorEnabled,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      })
    } catch (error) {
      throw new DatabaseError(`Error al guardar usuario: ${error}`)
    }
  }

  async update(user: UserEntity): Promise<void> {
    try {
      const data = user.toObject()
      await this.db
        .update(users)
        .set({
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          status: data.status,
          twoFactorSecret: data.twoFactorSecret,
          twoFactorEnabled: data.twoFactorEnabled,
          updatedAt: new Date(),
          deletedAt: data.deletedAt,
        })
        .where(eq(users.id, data.id))
    } catch (error) {
      throw new DatabaseError(`Error al actualizar usuario: ${error}`)
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, id))
    } catch (error) {
      throw new DatabaseError(`Error al eliminar usuario: ${error}`)
    }
  }

  // ----- Tokens -----
  async saveToken(token: UserTokenEntity): Promise<void> {
    try {
      const data = token.toObject()
      await this.db.insert(userTokens).values({
        id: data.id,
        userId: data.userId,
        token: data.token,
        type: data.type,
        expiresAt: data.expiresAt,
        usedAt: data.usedAt,
        createdAt: data.createdAt,
      })
    } catch (error) {
      throw new DatabaseError(`Error al guardar token: ${error}`)
    }
  }

  async findToken(
    token: string,
    type: 'activation' | 'password_reset'
  ): Promise<UserTokenEntity | null> {
    try {
      const result = await this.db
        .select()
        .from(userTokens)
        .where(and(eq(userTokens.token, token), eq(userTokens.type, type)))
        .limit(1)

      const row = result[0]
      return row ? this.toTokenEntity(row) : null
    } catch (error) {
      throw new DatabaseError(`Error al buscar token: ${error}`)
    }
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    try {
      await this.db.update(userTokens).set({ usedAt: new Date() }).where(eq(userTokens.id, tokenId))
    } catch (error) {
      throw new DatabaseError(`Error al marcar token como usado: ${error}`)
    }
  }

  async deleteExpiredTokens(userId: string): Promise<void> {
    try {
      await this.db
        .delete(userTokens)
        .where(and(eq(userTokens.userId, userId), lt(userTokens.expiresAt, new Date())))
    } catch (error) {
      throw new DatabaseError(`Error al eliminar tokens expirados: ${error}`)
    }
  }
}
