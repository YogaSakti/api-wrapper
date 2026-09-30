import fetch from 'cross-fetch'
import { EarnAprItem } from '../../types/api.types'

interface BitgetApy {
    apy: string
    rateLevel: number
    minStepValue?: string
    maxStepValue?: string
}

interface BitgetProduct {
    coinName: string
    period: number
    stickType?: number
    apyList: BitgetApy[]
}

interface BitgetBizLineProduct {
    productLevel?: number
    productList?: BitgetProduct[]
}

interface BitgetSavingsGroup {
    bizLineProductList?: BitgetBizLineProduct[]
}

interface BitgetSavingsResponse {
    data?: BitgetSavingsGroup[]
}

const BITGET_HEADERS = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json;charset=UTF-8',
    'language': 'en_US',
    'locale': 'en_US',
    'priority': 'u=1, i',
}

const BITGET_FETCH_OPTIONS = {
    headers: BITGET_HEADERS,
    referrer: 'https://www.bitgetapp.com/earning/savings?source1=earn&source2=savings',
    referrerPolicy: 'unsafe-url',
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
} as const

const BITGET_SAVINGS_URL = 'https://www.bitgetapp.com/v1/finance/savings/product/list'

const buildSavingsRequestBody = (coinName: string) => JSON.stringify({
    coinName,
    matchUserAssets: false,
    matchVipProduct: false,
    savingsReq: true,
    searchObj: {},
    locale: 'en',
})

const parseApr = (apy: string): number => parseFloat(apy) / 100

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Bitget rate-limits rapid sequential calls (429). Retry with backoff so a coin isn't silently dropped.
const fetchBitgetSavings = async (coinName: string, retries = 3): Promise<BitgetSavingsResponse> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const response = await fetch(BITGET_SAVINGS_URL, {
            ...BITGET_FETCH_OPTIONS,
            body: buildSavingsRequestBody(coinName),
        })

        if (response.ok) {
            return response.json() as Promise<BitgetSavingsResponse>
        }

        if (response.status === 429 && attempt < retries) {
            await sleep(500 * (attempt + 1))
            continue
        }

        throw new Error(`Bitget request failed with status ${response.status}`)
    }

    throw new Error('Bitget request failed: retries exhausted')
}

const getProductGroups = (json: BitgetSavingsResponse): BitgetBizLineProduct[] => {
    const groups = json.data?.[0]?.bizLineProductList
    if (!groups?.length) {
        throw new Error('Unexpected Bitget response structure.')
    }

    return groups
}

interface AprTranche {
    apr: number
    capacity: number
}

const getAprTranches = (products: BitgetProduct[]): AprTranche[] => {
    return products.flatMap(product => product.apyList.map(tier => {
        const min = Number(tier.minStepValue ?? 0)
        const max = Number(tier.maxStepValue ?? Number.POSITIVE_INFINITY)
        return {
            apr: parseApr(tier.apy),
            capacity: max - min,
        }
    })).filter(tranche => Number.isFinite(tranche.apr) && tranche.capacity > 0)
        .sort((a, b) => b.apr - a.apr)
}

const calculateCombinedApr = (products: BitgetProduct[], amount?: number): number => {
    const tranches = getAprTranches(products)
    if (tranches.length === 0) {
        throw new Error(`No APY tiers found for ${products[0]?.coinName ?? 'coin'}.`)
    }

    if (amount === undefined) {
        return tranches[0].apr
    }

    let remainingAmount = amount
    let weightedApr = 0

    for (const tranche of tranches) {
        const allocatedAmount = Math.min(remainingAmount, tranche.capacity)
        weightedApr += allocatedAmount * tranche.apr
        remainingAmount -= allocatedAmount
        if (remainingAmount <= 0) break
    }

    if (remainingAmount > 0) {
        weightedApr += remainingAmount * tranches[tranches.length - 1].apr
    }

    return weightedApr / amount
}

interface BitgetCoinConfig {
    includeVipFlexible?: boolean
    includeVip14?: boolean
}

const parseBitgetSavings = (json: BitgetSavingsResponse, config: BitgetCoinConfig, amount?: number): EarnAprItem => {
    const groups = getProductGroups(json)
    const standardProducts = groups.find(group => group.productLevel === 1)?.productList
    const standardFlexible = standardProducts?.filter(item => item.period === 0 && item.stickType !== 1) ?? []

    if (standardFlexible.length === 0) {
        throw new Error('No standard flexible product data found.')
    }

    const products = [...standardFlexible]

    const vipProducts = groups.find(item => item.productLevel === 2)?.productList
    if (config.includeVipFlexible) {
        products.push(...(vipProducts?.filter(item => item.period === 0) ?? []))
    }

    if (config.includeVip14) {
        products.push(...(vipProducts?.filter(item => item.period === 14) ?? []))
    }

    const combinedApr = calculateCombinedApr(products, amount)
    return { name: standardFlexible[0].coinName, APR: combinedApr }
}

const getBitgetSavingsData = async (coinName: string, config: BitgetCoinConfig, amount?: number): Promise<EarnAprItem | null> => {
    try {
        const json = await fetchBitgetSavings(coinName)
        return parseBitgetSavings(json, config, amount)
    } catch (error) {
        console.error('Bitget fetch error:', error)
        return null
    }
}

// USDT: standard flexible + VIP flexible + VIP 14-day. USDC: standard + VIP flexible.
const BITGET_COINS: Record<string, BitgetCoinConfig> = {
    USDT: { includeVipFlexible: true, includeVip14: true },
    USDC: { includeVipFlexible: true },
    USDGO: {},
}

export type BitgetAmounts = [number, number, number]

/**
 * Fetch data from Bitget for all supported coins.
 * Fetched sequentially — parallel requests get rate-limited (429) by Bitget.
 */
export const data_Bitget = async (amounts?: BitgetAmounts): Promise<EarnAprItem[]> => {
    const results: EarnAprItem[] = []
    const coins = Object.entries(BITGET_COINS)
    for (let i = 0; i < coins.length; i++) {
        const [coinName, config] = coins[i]
        const result = await getBitgetSavingsData(coinName, config, amounts?.[i])
        if (result) results.push(result)
        // Space out requests to the same host to avoid tripping Bitget's rate limit
        if (i < coins.length - 1) await sleep(300)
    }
    return results
}