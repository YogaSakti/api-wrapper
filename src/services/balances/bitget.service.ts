/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { RestClientV2 } from 'bitget-api'
import { NumericBalanceMap } from '../../types/api.types'

if (!process.env.KEY_BITGET || !process.env.SECRET_BITGET || !process.env.PASS_BITGET) {
    throw new Error('API key, secret, and passphrase must be set in the environment variables.')
}

// note the single quotes, preventing special characters such as $ from being incorrectly passed
const client = new RestClientV2({
    apiKey: process.env.KEY_BITGET,
    apiSecret: process.env.SECRET_BITGET,
    apiPass: process.env.PASS_BITGET,
})

const toAmount = (value: any): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
}

export const getBitgetBalances = async (): Promise<NumericBalanceMap> => {
    try {
        const flexibleSavingsAssets = await client.getEarnSavingsAssets({periodType: 'flexible'}).then((response: any) => response?.data?.resultList)
        const fixedSavingsAssets = await client.getEarnSavingsAssets({periodType: 'fixed'}).then((response: any) => response?.data?.resultList)

        const savingsByCoin: NumericBalanceMap = {}

        // Process flexible savings - sum by coin (vip + non-vip combined)
        if (Array.isArray(flexibleSavingsAssets)) {
            flexibleSavingsAssets.forEach((asset: any) => {
                const { productCoin, holdAmount } = asset
                if (!productCoin) return
                const coin = productCoin.toUpperCase()
                savingsByCoin[coin] = (savingsByCoin[coin] ?? 0) + toAmount(holdAmount)
            })
        }

        // Process fixed savings - use productCoin-productLevel-period as key, sum duplicates
        if (Array.isArray(fixedSavingsAssets)) {
            fixedSavingsAssets.forEach((asset: any) => {
                const { productCoin, productLevel, period, holdAmount } = asset
                if (!productCoin || !productLevel) return
                const key = `${productCoin.toUpperCase()}-${productLevel.toUpperCase()}-${period}`
                savingsByCoin[key] = (savingsByCoin[key] ?? 0) + toAmount(holdAmount)
            })
        }

        return savingsByCoin
    } catch (error) {
        console.error('Error fetching Bitget balances:', error)
        throw error
    }
}