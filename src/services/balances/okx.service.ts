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

const SAVING_COINS = ['USDT', 'USDC', 'USDG'] as const

export const getOkxBalances = async (): Promise<NumericBalanceMap> => {
    const [fundingBalances, tradingAccounts, savingBalances] = await Promise.all([
        client.getBalances({ ccy: 'RLUSD' }),
        client.getBalance({ ccy: 'RLUSD' }),
        client.getSavingBalance({ ccy: SAVING_COINS.join(',') })
    ])

    const balances: NumericBalanceMap = { USDT: 0, USDC: 0, USDG: 0, RLUSD: 0 }

    if (Array.isArray(fundingBalances)) {
        balances.RLUSD += fundingBalances.reduce((total, item) => item.ccy === 'RLUSD' ? total + toAmount(item.bal) : total, 0)
    }

    if (Array.isArray(tradingAccounts)) {
        balances.RLUSD += tradingAccounts.reduce((total, account) => total + (account.details?.reduce((sum, item) => item.ccy === 'RLUSD' ? sum + toAmount(item.cashBal) : sum, 0) || 0), 0)
    }

    if (Array.isArray(savingBalances)) {
        savingBalances.forEach((item: any) => {
            const coin = item?.ccy?.toUpperCase()
            if (SAVING_COINS.includes(coin)) balances[coin] += toAmount(item.amt)
        })
    }

    return balances
}
