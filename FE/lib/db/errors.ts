export const isUniqueViolation = (err: any): boolean => {
  return err?.code === '23505'
}

export const isForeignKeyViolation = (err: any): boolean => {
  return err?.code === '23503'
}