/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'
import { data_kamino_sentora } from './kamino.sentora.service'

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

        const headers = {
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
        }

        // Fetch both metrics and rewards in parallel
        const [metricsResponse, rewardsResponse] = await Promise.all([
            fetch(`https://api.kamino.finance/kvaults/${vaultId}/users/${address}/metrics/history?start=${start}&end=${end}`, {
                headers,
                method: 'GET'
            }),
            fetch(`https://api.kamino.finance/kvaults/users/${address}/rewards?source=Season5`, {
                headers,
                method: 'GET'
            })
        ])

        const [json, rewardsJson] = await Promise.all([
            metricsResponse.json(),
            rewardsResponse.json()
        ])

        if (!Array.isArray(json) || json.length === 0) {
            throw new Error('No data found in Kamino response.')
        }

        // Get the latest object (assuming the last item is the latest)
        const latestData = json[json.length - 1]

        // Find the reward for this specific vault
        let tokensEarned = 0
        if (rewardsJson.rewards && Array.isArray(rewardsJson.rewards)) {
            const vaultReward = rewardsJson.rewards.find((r: any) => r.kvault === vaultId)
            if (vaultReward && vaultReward.tokensEarned) {
                tokensEarned = parseFloat(vaultReward.tokensEarned)
            }
        }

        const result = {
            vault: vault.toUpperCase(),
            cumulativeInterestEarned: parseFloat(latestData.cumulativeInterestEarned),
            tokensEarned: tokensEarned
        }

        // If it's SENTORA, also fetch on-chain farm rewards and merge
        if (vault.toUpperCase() === 'SENTORA') {
            const sentoraRewards = await data_kamino_sentora(address)
            return {
                ...result,
                ...sentoraRewards
            }
        }

        return result
    } catch (error) {
        console.error('Kamino fetch error:', error)
        return { vault: vault.toUpperCase(), cumulativeInterestEarned: 0 }
    }
}