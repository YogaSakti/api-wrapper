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

export const getOkxBalances = async (coin: string): Promise<NumericBalanceMap> => {
    if (coin !== 'RLUSD') {
        const savingBalances = await client.getSavingBalance({ ccy: coin })
        const amount = Array.isArray(savingBalances)
            ? savingBalances.reduce((total, item: any) => item?.ccy?.toUpperCase() === coin ? total + toAmount(item.amt) : total, 0)
            : 0

        return { [coin]: amount }
    }

    const [fundingBalances, tradingAccounts] = await Promise.all([
        client.getBalances({ ccy: coin }),
        client.getBalance({ ccy: coin })
    ])

    let amount = 0

    if (Array.isArray(fundingBalances)) {
        amount += fundingBalances.reduce((total, item) => item.ccy === coin ? total + toAmount(item.bal) : total, 0)
    }

    if (Array.isArray(tradingAccounts)) {
        amount += tradingAccounts.reduce((total, account) => total + (account.details?.reduce((sum, item) => item.ccy === coin ? sum + toAmount(item.cashBal) : sum, 0) || 0), 0)
    }

    return { [coin]: amount }
}
