/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'

/**
 * Fetch data from Flipster.
 */
export const data_Flipster = async () => {
    try {
        const response = await fetch('https://api.flipster.io/api/v1/earn', {
            'headers': {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'traceparent': '00-00000000000000004d2c1ad42bc86059-088f1775c63659c0-01',
                'x-datadog-origin': 'rum',
                'x-datadog-parent-id': '616737468577110464',
                'x-datadog-sampling-priority': '1',
                'x-datadog-trace-id': '5560849138465661017',
                'x-prex-client-platform': 'web',
                'x-prex-client-version': 'release-web-2.2.105',
                'Referer': 'https://flipster.io/',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            'body': null,
            'method': 'GET'
        })

        const json = await response.json()
        if (json?.currencies?.length <= 0) {
            throw new Error('Unexpected Flipster response structure.')
        }

        // filter out only USDT
        const filtered = json.currencies.find(
            (item: any) => item.currency === 'USDT',
        )

        // sum the base and vip APRs
        const baseApr = parseFloat(filtered?.aprs?.base) || 0
        const vipApr = parseFloat(filtered?.maximalAchievableAprs?.aprs?.find((item: any) => item.title === 'VIP')?.apr) || 0

        // return is 0.16 not 16 or 16% or "16"
        return {
            name: 'USDT',
            APR: (baseApr + vipApr) / 100,
        }
    } catch (error) {
        console.error('Flipster fetch error:', error)
        // Return an empty array or null if you want to handle gracefully
        return []
    }
}