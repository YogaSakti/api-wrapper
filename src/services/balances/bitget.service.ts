/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { RestClientV2 } from 'bitget-api'
import { NumericBalanceMap } from '../../types/api.types'

// note the single quotes, preventing special characters such as $ from being incorrectly passed
const client = new RestClientV2({
    apiKey: process.env.KEY_BITGET,
    apiSecret: process.env.SECRET_BITGET,
    apiPass: process.env.PASS_BITGET,
})

const getBitgetSavings = async (): Promise<NumericBalanceMap> => {
    try {
        const flexibleSavingsAssets = await client.getEarnSavingsAssets({periodType: 'flexible'}).then((response: any) => response?.data?.resultList)
        const fixedSavingsAssets = await client.getEarnSavingsAssets({periodType: 'fixed'}).then((response: any) => response?.data?.resultList)

        const savingsByCoin: NumericBalanceMap = {}

        // Process flexible savings - sum by coin (vip + non-vip combined)
        if (Array.isArray(flexibleSavingsAssets)) {
            flexibleSavingsAssets.forEach((asset: any) => {
                const { productCoin, holdAmount } = asset
                const coin = productCoin.toUpperCase()
                if (!savingsByCoin[coin]) {
                    savingsByCoin[coin] = 0
                }
                savingsByCoin[coin] += parseFloat(holdAmount)
            })
        }

        // Process fixed savings - use productCoin-productLevel-period as key
        if (Array.isArray(fixedSavingsAssets)) {
            fixedSavingsAssets.forEach((asset: any) => {
                const { productCoin, productLevel, period, holdAmount } = asset
                const key = `${productCoin.toUpperCase()}-${productLevel.toUpperCase()}-${period}`
                savingsByCoin[key] = parseFloat(holdAmount)
            })
        }

        return savingsByCoin
    } catch (error) {
        console.error('Error fetching Bitget savings:', error)
        throw error
    }
}

export const getBitgetBalances = async (): Promise<NumericBalanceMap> => {
    try {
        const savings = await getBitgetSavings()

        // Return all savings data including flexible and fixed
        return savings
    } catch (error) {
        console.error('Error fetching Bitget balances:', error)
        throw error
    }
}