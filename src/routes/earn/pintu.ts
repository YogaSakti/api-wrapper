/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'

/**
 * Fetch USDT price from Pintu.
 */
export const data_pintu = async () => {
    try {
        const response = await fetch('https://api.pintu.pro/v1/public/get-candlesticks?symbol=USDT-IDR&interval=1m', {
            'headers': {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'Referer': 'https://pintu.co.id/',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            'body': null,
            'method': 'GET'
        })

        const json = await response.json()

        if (!json?.data) {
            throw new Error('Unexpected Pintu response structure.')
        }

        const candlesData = json.data.candlesticks

        // check if candlesData is empty
        if (!candlesData || candlesData.length === 0) {
            throw new Error('No data found in Pintu response.')
        }

        // get first data
        const firstData = candlesData[0] || {}
        const currentPrice = firstData?.c || 0

        return parseFloat(currentPrice) || 0

    } catch (error) {
        console.error('Pintu fetch error:', error)
        return null
    }
}