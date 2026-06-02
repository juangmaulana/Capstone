type DatabaseError = {
  code?: string
}

const isDatabaseError = (err: unknown): err is DatabaseError => {
  return typeof err === 'object' && err !== null && 'code' in err
}

export const isUniqueViolation = (err: unknown): boolean => {
  return isDatabaseError(err) && err.code === '23505'
}

export const isForeignKeyViolation = (err: unknown): boolean => {
  return isDatabaseError(err) && err.code === '23503'
}
