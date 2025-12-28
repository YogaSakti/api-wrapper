import express from 'express'
import fetch from 'cross-fetch'

// Fetch USDT price from Pintu
export const data_pintu = async () => {
    try {
        const response = await fetch('https://api.pintu.pro/v1/public/get-candlesticks?symbol=USDT-IDR&interval=1m', {
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

// Fetch average price from Binance order book
export const data_binance = async (symbol: string = 'USD1USDC', limit: number = 10) => {
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


const priceRouter = express.Router()


priceRouter.get('/pintu', async (req, res) => {
    try {
        const price = await data_pintu()
        res.status(200).json({ price })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch price from Pintu' })
    }
})

priceRouter.get('/binance', async (req, res) => {
    const symbol = (req.query.symbol as string)?.toUpperCase() || 'USD1USDC'
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10
    try {
        const price = await data_binance(symbol, limit)
        if (price === null) {
            return res.status(500).json({ error: 'Failed to fetch order book from Binance' })
        }
        return res.status(200).json({ price })
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch order book from Binance' })
    }
})

export default priceRouter
