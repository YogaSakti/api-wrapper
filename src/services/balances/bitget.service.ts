/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { RestClientV2 } from 'bitget-api'
import { NumericBalanceMap } from '../../types/api.types'
import { toAmount } from '../../utils/number'

if (!process.env.KEY_BITGET || !process.env.SECRET_BITGET || !process.env.PASS_BITGET) {
    throw new Error('API key, secret, and passphrase must be set in the environment variables.')
}

// note the single quotes, preventing special characters such as $ from being incorrectly passed
const client = new RestClientV2({
    apiKey: process.env.KEY_BITGET,
    apiSecret: process.env.SECRET_BITGET,
    apiPass: process.env.PASS_BITGET
})

export interface BitgetEarnPositionTier {
    minApy: string
    maxApy: string
    currentApy: string
}

export interface BitgetEarnPosition {
    productCoin: string
    productLevel: string
    period: string
    holdAmount: string
    apy: BitgetEarnPositionTier[]
}

export interface BitgetEarnPositions {
    flexible: BitgetEarnPosition[]
    fixed: BitgetEarnPosition[]
}

export const getBitgetEarnPositions = async (): Promise<BitgetEarnPositions> => {
    const [flexibleResponse, fixedResponse] = await Promise.all([
        client.getEarnSavingsAssets({ periodType: 'flexible' }),
        client.getEarnSavingsAssets({ periodType: 'fixed' })
    ])

    return {
        flexible: flexibleResponse.data?.resultList ?? [],
        fixed: fixedResponse.data?.resultList ?? []
    }
}

export const aggregateBitgetBalances = ({ flexible: flexibleSavingsAssets, fixed: fixedSavingsAssets }: BitgetEarnPositions): NumericBalanceMap => {
    const savingsByCoin: NumericBalanceMap = {}
    const totalsByCoin: NumericBalanceMap = {}

    // Process flexible savings - sum by coin (vip + non-vip combined)
    if (Array.isArray(flexibleSavingsAssets)) {
        flexibleSavingsAssets.forEach((asset: any) => {
            const { productCoin, holdAmount } = asset
            if (!productCoin) return
            const coin = productCoin.toUpperCase()
            const amount = toAmount(holdAmount)
            savingsByCoin[coin] = (savingsByCoin[coin] ?? 0) + amount
            totalsByCoin[coin] = (totalsByCoin[coin] ?? 0) + amount
        })
    }

    // Process fixed savings - use productCoin-productLevel-period as key, sum duplicates
    if (Array.isArray(fixedSavingsAssets)) {
        fixedSavingsAssets.forEach((asset: any) => {
            const { productCoin, productLevel, period, holdAmount } = asset
            if (!productCoin || !productLevel) return
            const coin = productCoin.toUpperCase()
            const amount = toAmount(holdAmount)
            const key = `${coin}-${productLevel.toUpperCase()}-${period}`
            savingsByCoin[key] = (savingsByCoin[key] ?? 0) + amount
            totalsByCoin[coin] = (totalsByCoin[coin] ?? 0) + amount
        })
    }

    Object.entries(totalsByCoin).forEach(([coin, amount]) => {
        savingsByCoin[`${coin}-ALL`] = amount
    })

    return savingsByCoin
}

export const getBitgetBalances = async (): Promise<NumericBalanceMap> => {
    return aggregateBitgetBalances(await getBitgetEarnPositions())
}
