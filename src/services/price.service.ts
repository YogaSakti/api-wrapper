import fetch from 'cross-fetch'

/**
 * Fetch stablecoin price from Pintu (IDR)
 */
export const getPintuPrice = async (quoteCurrency: string = 'USDT'): Promise<number | null> => {
    try {
        const normalizedCurrency = quoteCurrency.toUpperCase()
        const response = await fetch(`https://api.pintu.pro/v1/public/get-candlesticks?symbol=${normalizedCurrency}-IDR&interval=1m`, {
            headers: {
                accept: 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                priority: 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                Referer: 'https://pintu.co.id/',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            body: null,
            method: 'GET'
        })

        const json = await response.json()
        if (!json?.data) {
            throw new Error('Unexpected Pintu response structure.')
        }
        const candlesData = json.data.candlesticks
        if (!candlesData || candlesData.length === 0) {
            throw new Error('No data found in Pintu response.')
        }
        const firstData = candlesData[0] || {}
        const currentPrice = firstData?.c || 0
        return parseFloat(currentPrice) || 0
    } catch (error) {
        console.error('Pintu fetch error:', error)
        return null
    }
}

/**
 * Fetch average price from Binance order book
 */
export const getBinanceOrderBookPrice = async (symbol: string = 'USD1USDC', limit: number = 10): Promise<number | null> => {
    try {
        const response = await fetch(`https://www.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`, {
            headers: {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,id;q=0.8',
                'bnc-level': '0',
                'bnc-location': 'ID',
                'bnc-time-zone': 'Asia/Jakarta',
                clienttype: 'web',
                'content-type': 'application/json',
                lang: 'en',
                priority: 'u=1, i',
                'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-passthrough-token': '',

            },
            method: 'GET',
        })
        const data = await response.json()
        if (!data.bids || !data.asks || !Array.isArray(data.bids) || !Array.isArray(data.asks) || data.bids.length === 0 || data.asks.length === 0) {
            throw new Error('No order book data found')
        }
        const bidPrice = parseFloat(data.bids[0][0])
        const askPrice = parseFloat(data.asks[0][0])
        if (isNaN(bidPrice) || isNaN(askPrice)) {
            throw new Error('Invalid price data')
        }
        const average = (bidPrice + askPrice) / 2
        return average
    } catch (error) {
        console.error('Binance fetch error:', error)
        return null
    }
}