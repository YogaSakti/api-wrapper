/* eslint-disable @typescript-eslint/no-explicit-any */
import { RestClientV5 } from 'bybit-api'
import { webcrypto } from 'crypto'

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

const getSpotBalance = async () => client
    .getAllCoinsBalance({ accountType: 'FUND' })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching balances: ${response.retMsg}`)
        const filteredBalances = response.result.balance.filter((balance: any) => parseInt(balance.walletBalance) !== 0)
        return filteredBalances
    })
    .catch((error: any) => {
        console.error('Error in getSpotBalance:', error)
        throw error
    })

const getEarnPositions = async (category = 'FlexibleSaving') => client
    .getEarnPosition({ category })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching earn positions: ${response.retMsg}`)
        return response.result.list
    })
    .catch((error: any) => {
        console.error('Error in getEarnPositions:', error)
        throw error
    })

export const getBybitBalances = async () => {
    try {
        const [spotBalances, earnPositions, onChainBalances] = await Promise.all([
            getSpotBalance(),
            getEarnPositions(),
            getEarnPositions('OnChain')
        ])

        const findCoin = (balances: any, coin: string) =>Array.isArray(balances) ? balances.find((b: any) => b.coin === coin) : null
        const findAllCoins = (balances: any, coin: string) =>Array.isArray(balances) ? balances.filter((b: any) => b.coin === coin) : []
        const calculateOnChainAmount = (positions: any[]) => 
            positions.reduce((total, position) => 
                total + parseFloat(position.amount) + parseFloat(position.totalPnl), 0)

        const usdeBalance = findCoin(spotBalances, 'USDE')
        const usdtPosition = findCoin(earnPositions, 'USDT')
        const usdcPosition = findCoin(earnPositions, 'USDC')
        const usdtOnChain = findAllCoins(onChainBalances, 'USDT')
        const usdcOnChain = findAllCoins(onChainBalances, 'USDC')

        return {
            USDE: usdeBalance ? parseFloat(usdeBalance.walletBalance) : 0,
            USDT: usdtPosition ? parseFloat(usdtPosition.amount) : 0,
            USDC: usdcPosition ? parseFloat(usdcPosition.amount) : 0,
            'USDT-ONCHAIN': calculateOnChainAmount(usdtOnChain),
            'USDC-ONCHAIN': calculateOnChainAmount(usdcOnChain)
        }
    } catch (error) {
        console.error('Error fetching balance:', error)
        throw error
    }
}
