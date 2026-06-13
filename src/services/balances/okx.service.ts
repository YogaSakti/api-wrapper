/* eslint-disable @typescript-eslint/no-explicit-any */
import { RestClient } from 'okx-api'
import { NumericBalanceMap } from '../../types/api.types'

if (!process.env.KEY_OKX || !process.env.SECRET_OKX || !process.env.PASS_OKX) {
    throw new Error('API key, secret, and passphrase must be set in the environment variables.')
}

const client = new RestClient({
    apiKey: process.env.KEY_OKX,
    apiSecret: process.env.SECRET_OKX,
    apiPass: process.env.PASS_OKX,
})

const toAmount = (value: any): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
}

const getOkxSavingBalances = async (): Promise<NumericBalanceMap> => {
    // Empty response means no savings positions, not an error
    const response: any = await client.getSavingBalance()
    if (!Array.isArray(response)) return {}

    return response.reduce((acc: NumericBalanceMap, item: any) => {
        if (!item?.ccy) return acc
        acc[item.ccy.toUpperCase()] = toAmount(item.amt)
        return acc
    }, {})
}

export const getOkxBalances = async (): Promise<NumericBalanceMap> => {
    try {
        const savingBalances = await getOkxSavingBalances()

        // Return specific coins like Bybit format
        return {
            USDT: savingBalances.USDT || 0,
            USDC: savingBalances.USDC || 0
        }
    } catch (error) {
        console.error('Error fetching OKX balances:', error)
        throw error
    }
}