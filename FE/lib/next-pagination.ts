export function getLinks(
  total: number,
  limit: number,
  page: number,
  url: string,
): {
  prev: string | null,
  next: string | null,
} {
  let next = null
  let prev = null

  const hasNext = page * limit < total
  if (hasNext) {
    const nextUrl = new URL(url)
    nextUrl.searchParams.set('page', String(page + 1))
    next = nextUrl.toString()
  }
  
  const hasPrev = page > 1
  if (hasPrev) {
    const prevUrl = new URL(url)
    prevUrl.searchParams.set('page', String(page - 1))
    prev = prevUrl.toString()
  }

  return { prev, next }
}