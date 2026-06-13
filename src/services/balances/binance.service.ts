/* eslint-disable @typescript-eslint/no-explicit-any */
import { MainClient } from 'binance'
import { NumericBalanceMap } from '../../types/api.types'

// Ensure that the environment variables are set
if (!process.env.KEY_BINANCE || !process.env.SECRET_BINANCE) {
    throw new Error('API key and secret must be set in the environment variables.')
}

const client = new MainClient({
    api_key: process.env.KEY_BINANCE as string,
    api_secret: process.env.SECRET_BINANCE as string,
})

const TRACKED_ASSETS = ['USDT', 'USDC', 'USD1'] as const

const toAmount = (value: any): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
}

// Get wallet balances (spot)
const getSpotBalance = async () => client.getBalances()

// Get Simple Earn flexible positions (replaces old Savings)
const getFlexibleSavings = async () => {
    const results = await Promise.all(TRACKED_ASSETS.map(asset => client
        .getFlexibleProductPosition({ asset })
        .then((resp: any) => resp?.rows ?? [])
        .catch((error: any) => {
            console.error(`Error in getFlexibleSavings ${asset}:`, error)
            return []
        })))

    return results.flat()
}

export const getBinanceBalances = async (): Promise<NumericBalanceMap> => {
    try {
        const [spotBalances, flexibleSavings] = await Promise.all([
            getSpotBalance(),
            getFlexibleSavings()
        ])

        const totals: NumericBalanceMap = { USDT: 0, USDC: 0, USD1: 0 }

        // Aggregate tracked assets from spot balances
        if (Array.isArray(spotBalances)) {
            for (const asset of TRACKED_ASSETS) {
                const spot: any = spotBalances.find((b: any) => b.coin === asset)
                if (spot) {
                    totals[asset] += toAmount(spot.free ?? spot.freeBalance ?? spot.available ?? '0')
                }
            }
        }

        // Add tracked assets from Simple Earn flexible positions
        if (Array.isArray(flexibleSavings)) {
            for (const position of flexibleSavings) {
                const asset = position.asset || position.product?.asset
                if (asset && asset in totals) {
                    totals[asset] += toAmount(position.totalAmount ?? position.amount ?? position.total ?? '0')
                }
            }
        }

        return totals
    } catch (error) {
        console.error('Error fetching Binance balances:', error)
        throw error
    }
}