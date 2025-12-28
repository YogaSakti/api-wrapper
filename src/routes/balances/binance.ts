import { MainClient } from 'binance'

// Ensure that the environment variables are set
if (!process.env.KEY_BINANCE || !process.env.SECRET_BINANCE) {
    throw new Error('API key and secret must be set in the environment variables.')
}

const client = new MainClient({
    api_key: process.env.KEY_BINANCE as string,
    api_secret: process.env.SECRET_BINANCE as string,
})

// Get wallet balances (spot)
const getSpotBalance = async () => client
    .getBalances()
    .then((balances: any[]) => balances)
    .catch((error: any) => {
        console.error('Error in getSpotBalance:', error)
        throw error
    })

// Get Simple Earn flexible positions (replaces old Savings)
const getFlexibleSavings = async () => {
    try {
        const [usdtResult, usdcResult, usd1Result] = await Promise.all([
            client
                .getFlexibleProductPosition({asset: 'USDT'})
                .then((resp: any) => resp?.rows ?? [])
                .catch((error: any) => {
                    console.error('Error in getFlexibleSavings USDT:', error)
                    return []
                }),
            client
                .getFlexibleProductPosition({asset: 'USDC'})
                .then((resp: any) => resp?.rows ?? [])
                .catch((error: any) => {
                    console.error('Error in getFlexibleSavings USDC:', error)
                    return []
                }),
            client
                .getFlexibleProductPosition({asset: 'USD1'})
                .then((resp: any) => resp?.rows ?? [])
                .catch((error: any) => {
                    console.error('Error in getFlexibleSavings USD1:', error)
                    return []
                })
        ])
        // Gabungkan hasil dari USDT, USDC, dan USD1
        return [...usdtResult, ...usdcResult, ...usd1Result]
    } catch (error) {
        console.error('Error in getFlexibleSavings:', error)
        throw error
    }
}

export const getBinanceBalances = async () => {
    try {
        const [spotBalances, flexibleSavings] = await Promise.all([
            getSpotBalance(),
            getFlexibleSavings()
        ])

        // Aggregate USDT, USDC, and USD1 from spot balances
        let usdt = 0
        let usdc = 0
        let usd1 = 0
        if (Array.isArray(spotBalances)) {
            const usdtSpot = spotBalances.find((b: any) => b.coin === 'USDT')
            const usdcSpot = spotBalances.find((b: any) => b.coin === 'USDC')
            const usd1Spot = spotBalances.find((b: any) => b.coin === 'USD1')
            if (usdtSpot) {
                const free = parseFloat(usdtSpot.free ?? usdtSpot.freeBalance ?? usdtSpot.available ?? '0')
                usdt += isNaN(free) ? 0 : free
            }
            if (usdcSpot) {
                const free = parseFloat(usdcSpot.free ?? usdcSpot.freeBalance ?? usdcSpot.available ?? '0')
                usdc += isNaN(free) ? 0 : free
            }
            if (usd1Spot) {
                const free = parseFloat(usd1Spot.free ?? usd1Spot.freeBalance ?? usd1Spot.available ?? '0')
                usd1 += isNaN(free) ? 0 : free
            }
        }

        // Add USDT, USDC, and USD1 from Simple Earn flexible positions
        if (Array.isArray(flexibleSavings)) {
            for (const position of flexibleSavings) {
                const asset = position.asset || position.product?.asset
                const amountStr = position.totalAmount ?? position.amount ?? position.total ?? '0'
                const amount = parseFloat(amountStr)
                if (asset === 'USDT') usdt += isNaN(amount) ? 0 : amount
                if (asset === 'USDC') usdc += isNaN(amount) ? 0 : amount
                if (asset === 'USD1') usd1 += isNaN(amount) ? 0 : amount
            }
        }

        return {
            USDT: usdt,
            USDC: usdc,
            USD1: usd1
        }
    } catch (error) {
        console.error('Error fetching Binance balances:', error)
        throw error
    }
}