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

const BYBIT_EARN_CATEGORY = {
    FLEXIBLE: 'FlexibleSaving',
    ON_CHAIN: 'OnChain',
} as const

type BybitEarnCategory = typeof BYBIT_EARN_CATEGORY[keyof typeof BYBIT_EARN_CATEGORY]

const BYBIT_COIN = {
    USDE: 'USDE',
    USDT: 'USDT',
    USDC: 'USDC',
    USD1: 'USD1',
    BYUSDT: 'BYUSDT',
} as const

interface BybitCoinBalance {
    coin: string
    walletBalance?: string
}

interface BybitEarnPosition {
    coin: string
    amount?: string
    totalPnl?: string
}

interface BybitBalanceSources {
    spotBalances: BybitCoinBalance[]
    earnPositions: BybitEarnPosition[]
    onChainBalances: BybitEarnPosition[]
    unifiedBalances: BybitCoinBalance[]
}

const toAmount = (value: unknown): number => {
    const parsed = parseFloat(String(value))
    return isNaN(parsed) ? 0 : parsed
}

const getSpotBalance = async () => client
    .getAllCoinsBalance({ accountType: 'FUND' })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching balances: ${response.retMsg}`)
        const balances = response.result?.balance
        return Array.isArray(balances)
            ? balances.filter((balance: BybitCoinBalance) => toAmount(balance.walletBalance) !== 0)
            : []
    })

const getEarnPositions = async (category: BybitEarnCategory = BYBIT_EARN_CATEGORY.FLEXIBLE) => client
    .getEarnPosition({ category })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching earn positions: ${response.retMsg}`)
        const positions = response.result?.list
        return Array.isArray(positions) ? positions : []
    })

const getUnifiedBalance = async () => client
    .getAllCoinsBalance({ accountType: 'UNIFIED', coin: BYBIT_COIN.BYUSDT })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching unified balance: ${response.retMsg}`)
        const balances = response.result?.balance
        return Array.isArray(balances)
            ? balances.filter((balance: BybitCoinBalance) => toAmount(balance.walletBalance) !== 0)
            : []
    })

const groupByCoin = <T extends { coin: string }>(items: T[]): Record<string, T[]> => items.reduce((groups, item) => {
    groups[item.coin] = groups[item.coin] || []
    groups[item.coin].push(item)
    return groups
}, {} as Record<string, T[]>)

const firstAmountByCoin = <T extends { walletBalance?: string; amount?: string }>(groups: Record<string, T[]>, coin: string, field: keyof T): number =>
    toAmount(groups[coin]?.[0]?.[field])

const calculateOnChainAmount = (positions: BybitEarnPosition[]): number => positions.reduce((total, position) =>
    total + toAmount(position.amount) + toAmount(position.totalPnl), 0)

const getSettledValue = <T>(result: PromiseSettledResult<T>, fallback: T, source: string): T => {
    if (result.status === 'fulfilled') return result.value

    console.error(`Error fetching Bybit ${source}:`, result.reason)
    return fallback
}

const buildBybitBalanceMap = ({
    spotBalances,
    earnPositions,
    onChainBalances,
    unifiedBalances,
}: BybitBalanceSources): NumericBalanceMap => {
    const spotByCoin = groupByCoin(spotBalances)
    const earnByCoin = groupByCoin(earnPositions)
    const onChainByCoin = groupByCoin(onChainBalances)
    const unifiedByCoin = groupByCoin(unifiedBalances)

    return {
        USDE: firstAmountByCoin(spotByCoin, BYBIT_COIN.USDE, 'walletBalance'),
        USD1: firstAmountByCoin(spotByCoin, BYBIT_COIN.USD1, 'walletBalance'),
        USDT: firstAmountByCoin(earnByCoin, BYBIT_COIN.USDT, 'amount'),
        USDC: firstAmountByCoin(earnByCoin, BYBIT_COIN.USDC, 'amount'),
        'USDT-ONCHAIN': calculateOnChainAmount(onChainByCoin[BYBIT_COIN.USDT] || []),
        'USDC-ONCHAIN': calculateOnChainAmount(onChainByCoin[BYBIT_COIN.USDC] || []),
        BYUSDT: firstAmountByCoin(unifiedByCoin, BYBIT_COIN.BYUSDT, 'walletBalance')
    }
}

export const getBybitBalances = async (): Promise<NumericBalanceMap> => {
    try {
        const [spotBalances, earnPositions, onChainBalances, unifiedBalances] = await Promise.allSettled([
            getSpotBalance(),
            getEarnPositions(),
            getEarnPositions(BYBIT_EARN_CATEGORY.ON_CHAIN),
            getUnifiedBalance()
        ])

        return buildBybitBalanceMap({
            spotBalances: getSettledValue(spotBalances, [], 'spot balances'),
            earnPositions: getSettledValue(earnPositions, [], 'earn positions'),
            onChainBalances: getSettledValue(onChainBalances, [], 'on-chain positions'),
            unifiedBalances: getSettledValue(unifiedBalances, [], 'unified balances'),
        })
    } catch (error) {
        console.error('Error fetching Bybit balances:', error)
        throw error
    }
}
