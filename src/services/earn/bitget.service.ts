import fetch from 'cross-fetch'
import { EarnAprItem } from '../../types/api.types'

interface BitgetApy {
    apy: string
    rateLevel: number
}

interface BitgetProduct {
    coinName: string
    period: number
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

const findApy = (product: BitgetProduct | undefined, rateLevel: number): BitgetApy | undefined => {
    return product?.apyList?.find(item => item.rateLevel === rateLevel)
}

const createAprItem = (product: BitgetProduct, apy: BitgetApy, suffix = ''): EarnAprItem => ({
    name: `${product.coinName}${suffix}`,
    APR: parseApr(apy.apy),
})

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

const parseBitgetSavings = (json: BitgetSavingsResponse, includeVip14 = false): EarnAprItem[] => {
    const groups = getProductGroups(json)
    const standardProducts = groups[0]?.productList
    const standardFlexible = standardProducts?.find(item => item.period === 0)
    const standardApy = findApy(standardFlexible, 1)

    if (!standardFlexible || !standardApy) {
        throw new Error('No standard flexible product data found.')
    }

    const result: EarnAprItem[] = [createAprItem(standardFlexible, standardApy)]

    const vipProducts = groups.find(item => item.productLevel === 2)?.productList
    const vipFlexible = vipProducts?.find(item => item.period === 0)
    const vipFlexibleApy = findApy(vipFlexible, 0)

    if (vipFlexible && vipFlexibleApy) {
        result.push(createAprItem(vipFlexible, vipFlexibleApy, '-VIP'))
    }

    if (includeVip14) {
        const vip14 = vipProducts?.find(item => item.period === 14)
        const vip14Apy = findApy(vip14, 0)

        if (vip14 && vip14Apy) {
            result.push(createAprItem(vip14, vip14Apy, '-VIP-14'))
        }
    }

    return result
}

const parseBitgetFlexibleByRateLevel = (json: BitgetSavingsResponse, rateLevel: number): EarnAprItem[] => {
    const groups = getProductGroups(json)
    const flexible = groups[0]?.productList?.find(item => item.period === 0)
    const apy = findApy(flexible, rateLevel)

    if (!flexible || !apy) {
        throw new Error(`No flexible product data found for rate level ${rateLevel}.`)
    }

    return [createAprItem(flexible, apy)]
}

const getBitgetSavingsData = async (coinName: string, includeVip14 = false, rateLevel?: number): Promise<EarnAprItem[]> => {
    try {
        const json = await fetchBitgetSavings(coinName)
        if (rateLevel !== undefined) {
            return parseBitgetFlexibleByRateLevel(json, rateLevel)
        }
        return parseBitgetSavings(json, includeVip14)
    } catch (error) {
        console.error('Bitget fetch error:', error)
        return []
    }
}

interface BitgetCoinConfig {
    includeVip14?: boolean
    rateLevel?: number
}

// USDT: standard + VIP + VIP-14. USDC: standard + VIP.
// USDGO: no VIP group, amount-tiered apyList, rateLevel 0 = headline rate (≤300k)
const BITGET_COINS: Record<string, BitgetCoinConfig> = {
    USDT: { includeVip14: true },
    USDC: {},
    USDGO: { rateLevel: 0 },
}

/**
 * Fetch data from Bitget for all supported coins.
 * Fetched sequentially — parallel requests get rate-limited (429) by Bitget.
 */
export const data_Bitget = async (): Promise<EarnAprItem[]> => {
    const results: EarnAprItem[] = []
    const coins = Object.entries(BITGET_COINS)
    for (let i = 0; i < coins.length; i++) {
        const [coinName, config] = coins[i]
        results.push(...await getBitgetSavingsData(coinName, config.includeVip14 ?? false, config.rateLevel))
        // Space out requests to the same host to avoid tripping Bitget's rate limit
        if (i < coins.length - 1) await sleep(300)
    }
    return results
}