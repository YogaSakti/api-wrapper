/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'

/**
 * Fetch Earn data from Kamino.
 */
export const data_kamino = async (vault: string, address: string) => {
    try {
        const vaults: Record<string, string> = {
            SENTORA: 'A2wsxhA7pF4B2UKVfXocb6TAAP9ipfPJam6oMKgDE5BK',
            ALLEZ: 'A1USdzqDHmw5oz97AkqAGLxEQZfFjASZFuy4T6Qdvnpo'
        }

        const vaultId = vaults[vault.toUpperCase()]
        if (!vaultId) {
            throw new Error(`Invalid vault: ${vault}. Valid vaults are: ${Object.keys(vaults).join(', ')}`)
        }

        //start is 3 hours ago
        const now = new Date()
        const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000))
        const start = threeHoursAgo.toISOString()
        const end = now.toISOString()

        const response = await fetch(`https://api.kamino.finance/kvaults/${vaultId}/users/${address}/metrics/history?start=${start}&end=${end}`, {
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

        return {
            vault: vault.toUpperCase(),
            cumulativeInterestEarned: latestData.cumulativeInterestEarned
        }
    } catch (error) {
        console.error('Kamino fetch error:', error)
        return { vault: vault.toUpperCase(), cumulativeInterestEarned: 0 }
    }
}