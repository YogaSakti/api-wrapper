import { RestClient } from 'okx-api'
if (!process.env.KEY_OKX || !process.env.SECRET_OKX || !process.env.PASS_OKX) {
    throw new Error('API key, secret, and passphrase must be set in the environment variables.')
}

const client = new RestClient({
    apiKey: process.env.KEY_OKX,
    apiSecret: process.env.SECRET_OKX,
    apiPass: process.env.PASS_OKX,
})

const getOkxSavingBalances = async () => client.getSavingBalance()
    .then((response: any) => {
        if (response.length === 0) throw new Error('Error fetching balances: No data returned')

        const balances = response.map((item: any) => ({
            [item.ccy.toUpperCase()]: parseFloat(item.amt)
        }))

        // Merge balances into a single object
        return balances.reduce((acc: any, curr: any) => ({ ...acc, ...curr }), {})
    })
    .catch((error: any) => {
        console.error('Error fetching OKX balances:', error)
        throw error
    })

export const getOkxBalances = async () => {
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