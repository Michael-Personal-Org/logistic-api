export const ResponseUtils = {
  success<T>(data: T, meta?: Record<string, unknown>) {
    return {
      success: true as const,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    }
  },

  error(code: string, message: string) {
    return {
      success: false as const,
      error: { code, message },
      meta: {
        timestamp: new Date().toISOString(),
      },
    }
  },
}
