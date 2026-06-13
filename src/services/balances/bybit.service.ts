/* eslint-disable @typescript-eslint/no-explicit-any */
import { RestClientV5 } from 'bybit-api'
import { webcrypto } from 'crypto'
import { NumericBalanceMap } from '../../types/api.types'

// Polyfill for Web Crypto API in Node.js 18
if (typeof globalThis.crypto === 'undefined') {
    (globalThis as any).crypto = webcrypto
}

// Ensure that the environment variables are set
if (!process.env.KEY_BYBIT || !process.env.SECRET_BYBIT) {
    throw new Error('API key and secret must be set in the environment variables.')
}

const client = new RestClientV5({
    testnet: false,
    key: process.env.KEY_BYBIT,
    secret: process.env.SECRET_BYBIT,
})

const toAmount = (value: any): number => {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
}

const getSpotBalance = async () => client
    .getAllCoinsBalance({ accountType: 'FUND' })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching balances: ${response.retMsg}`)
        return response.result.balance.filter((balance: any) => toAmount(balance.walletBalance) !== 0)
    })

const getEarnPositions = async (category = 'FlexibleSaving') => client
    .getEarnPosition({ category })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching earn positions: ${response.retMsg}`)
        return response.result.list
    })

const getUnifiedBalance = async () => client
    .getAllCoinsBalance({ accountType: 'UNIFIED', coin: 'BYUSDT' })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching unified balance: ${response.retMsg}`)
        return response.result.balance.filter((balance: any) => toAmount(balance.walletBalance) !== 0)
    })

export const getBybitBalances = async (): Promise<NumericBalanceMap> => {
    try {
        const [spotBalances, earnPositions, onChainBalances, unifiedBalances] = await Promise.all([
            getSpotBalance(),
            getEarnPositions(),
            getEarnPositions('OnChain'),
            getUnifiedBalance()
        ])

        const findCoin = (balances: any, coin: string) => Array.isArray(balances) ? balances.find((b: any) => b.coin === coin) : null
        const findAllCoins = (balances: any, coin: string) => Array.isArray(balances) ? balances.filter((b: any) => b.coin === coin) : []
        const calculateOnChainAmount = (positions: any[]) =>
            positions.reduce((total, position) =>
                total + toAmount(position.amount) + toAmount(position.totalPnl), 0)

        const usdeBalance = findCoin(spotBalances, 'USDE')
        const usdtPosition = findCoin(earnPositions, 'USDT')
        const usdcPosition = findCoin(earnPositions, 'USDC')
        const usdtOnChain = findAllCoins(onChainBalances, 'USDT')
        const usdcOnChain = findAllCoins(onChainBalances, 'USDC')
        const byusdtBalance = findCoin(unifiedBalances, 'BYUSDT')

        return {
            USDE: usdeBalance ? toAmount(usdeBalance.walletBalance) : 0,
            USDT: usdtPosition ? toAmount(usdtPosition.amount) : 0,
            USDC: usdcPosition ? toAmount(usdcPosition.amount) : 0,
            'USDT-ONCHAIN': calculateOnChainAmount(usdtOnChain),
            'USDC-ONCHAIN': calculateOnChainAmount(usdcOnChain),
            BYUSDT: byusdtBalance ? toAmount(byusdtBalance.walletBalance) : 0
        }
    } catch (error) {
        console.error('Error fetching Bybit balances:', error)
        throw error
    }
}
