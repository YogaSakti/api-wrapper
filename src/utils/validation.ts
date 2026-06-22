export const isSafeSlug = (value: string): boolean => /^[a-zA-Z0-9-]{1,100}$/.test(value)

export const getSingleParam = (value: string | string[] | undefined): string | undefined => {
    if (typeof value === 'string') return value
    return undefined
}

export const isFiatCode = (value: string): boolean => /^[A-Z]{2,10}$/.test(value)

export const isSafePlatform = (value: string): boolean => /^[a-zA-Z0-9-]{1,50}$/.test(value)

export const isSafeAddress = (value: string): boolean => /^[a-zA-Z0-9:._-]{1,128}$/.test(value)

export const isSafeSymbol = (value: string): boolean => /^[A-Z0-9]{2,30}$/.test(value)

// OKX instrument id, e.g. USD1-USDC (BASE-QUOTE)
export const isSafeInstId = (value: string): boolean => /^[A-Z0-9]{1,15}-[A-Z0-9]{1,15}$/.test(value)

export const parseIntegerInRange = (value: unknown, min: number, max: number): number | null => {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null

    const parsed = parseInt(value, 10)
    if (parsed < min || parsed > max) return null

    return parsed
}

export const parseIndexFilter = (value: unknown, max: number): number[] | null => {
    if (typeof value !== 'string' || value.trim() === '') return null

    const parts = value.split(',').map(part => part.trim())
    if (parts.some(part => !/^\d+$/.test(part))) return null

    const indices = parts.map(part => parseInt(part, 10))
    if (indices.some(index => index < 1 || index > max)) return null

    return indices
}