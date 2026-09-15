/* eslint-disable @typescript-eslint/no-explicit-any */
import { RestClient } from 'okx-api'
import { NumericBalanceMap } from '../../types/api.types'
import { toAmount } from '../../utils/number'

if (!process.env.KEY_OKX || !process.env.SECRET_OKX || !process.env.PASS_OKX) {
    throw new Error('API key, secret, and passphrase must be set in the environment variables.')
}

const client = new RestClient({
    apiKey: process.env.KEY_OKX,
    apiSecret: process.env.SECRET_OKX,
    apiPass: process.env.PASS_OKX
})

const TRACKED_COINS = ['USDT', 'USDC', 'USDG', 'RLUSD'] as const

const addAmount = (totals: NumericBalanceMap, coin: unknown, amount: unknown) => {
    if (typeof coin !== 'string') return

    const normalizedCoin = coin.toUpperCase()
    if (!TRACKED_COINS.includes(normalizedCoin as typeof TRACKED_COINS[number])) return

    totals[normalizedCoin] += toAmount(amount)
}

export const getOkxBalances = async (): Promise<NumericBalanceMap> => {
    const [fundingBalances, tradingAccounts, savingBalances, stableRewardsBalances] = await Promise.all([
        client.getBalances({ ccy: TRACKED_COINS.join(',') }),
        client.getBalance({ ccy: TRACKED_COINS.join(',') }),
        client.getSavingBalance({ ccy: TRACKED_COINS.join(',') }),
        client.getStableRewardsBalance({ ccy: TRACKED_COINS.join(',') })
    ])

    const totals: NumericBalanceMap = Object.fromEntries(TRACKED_COINS.map(coin => [coin, 0]))

    if (Array.isArray(fundingBalances)) {
        fundingBalances.forEach(item => addAmount(totals, item.ccy, item.bal))
    }

    if (Array.isArray(tradingAccounts)) {
        tradingAccounts.forEach(account => account.details?.forEach(item => addAmount(totals, item.ccy, item.cashBal)))
    }

    if (Array.isArray(savingBalances)) {
        savingBalances.forEach((item: any) => addAmount(totals, item.ccy, item.amt))
    }

    if (Array.isArray(stableRewardsBalances)) {
        stableRewardsBalances.forEach(account => account.details?.forEach(item => addAmount(totals, item.ccy, item.amt)))
    }

    return totals
}
