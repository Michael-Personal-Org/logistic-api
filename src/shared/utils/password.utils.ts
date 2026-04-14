import argon2 from 'argon2'

export const passwordUtils = {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain)
  },

  // Nota: argon2.verify recibe (hash, plaintext) — orden invertido vs bcrypt
  compare(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain)
  },
}
