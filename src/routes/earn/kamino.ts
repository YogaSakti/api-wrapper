/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'

/**
 * Fetch Earn data from Kamino.
 */
export const data_kamino = async (address) => {
    try {
        //start is 1 day ago
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000))
        const start = oneDayAgo.toISOString()
        const end = now.toISOString()

        const response = await fetch(`https://api.kamino.finance/kvaults/users/${address}/metrics/history?start=${start}&end=${end}`, {
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
                'Referer': 'https://kamino.finance/',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            'body': null,
            'method': 'GET'
        })

        const json = await response.json()

        if (!Array.isArray(json) || json.length === 0) {
            throw new Error('No data found in Kamino response.')
        }

        // Get the latest object (assuming the last item is the latest)
        const latestData = json[json.length - 1]

        return latestData

    } catch (error) {
        console.error('Kamino fetch error:', error)
        return null
    }
}