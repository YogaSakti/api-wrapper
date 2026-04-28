export type NumericBalanceMap = Record<string, number>

export type TokenPriceResponse = Record<string, Record<string, number | null>>

export interface DexTokenPriceResponse {
    platform: string
    address: string
    price: number | string | null
    priceChange24h: number | string | null
    priceChange7d: number | string | null
    volume24h: number | string | null
    liquidity: number | string | null
    marketCap: number | string | null
}

export interface EarnAprItem {
    name: string
    APR: number
}