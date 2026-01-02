/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'

/**
 * Fetch data from Bitget.
 */
export const data_Bitget = async () => {
    try {
        const response = await fetch('https://www.bitgetapp.com/v1/finance/savings/product/list', {
            'headers': {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json;charset=UTF-8',
                'language': 'en_US',
                'locale': 'en_US',
                'priority': 'u=1, i',
            },
            'referrer': 'https://www.bitgetapp.com/earning/savings?source1=earn&source2=savings',
            'referrerPolicy': 'unsafe-url',
            'body': '{"coinName":"USDT","matchUserAssets":false,"matchVipProduct":false,"savingsReq":true,"searchObj":{},"locale":"en"}',
            'method': 'POST',
            'mode': 'cors',
            'credentials': 'include'
        })

        const json = await response.json()
        if (!json?.data?.length) {
            throw new Error('Unexpected Bitget response structure.')
        }

        const data = json.data[0].bizLineProductList[0].productList.find((item: any) => item.period === 0)
        if (!data) {
            throw new Error('No data found for period = 0.')
        }

        const apy = data.apyList.find((item: any) => item.rateLevel === 1)
        if (!apy) {
            throw new Error('No data found for rateLevel = 1.')
        }

        const vipData = json.data[0].bizLineProductList.find((item: any) => item.productLevel === 2).productList.find((item: any) => item.period == 14)
        if (!vipData) {
            throw new Error('No data found for VIP.')
        }

        const vipApy = vipData.apyList.find((item: any) => item.rateLevel === 0)
        if (!vipApy) {
            throw new Error('No data found for VIP rateLevel = 0.')
        }

        return [
            {
                name: data.coinName,
                APR: parseFloat(apy.apy) / 100,
            },
            {
                name: `${vipData.coinName}-VIP-14`,
                APR: parseFloat(vipApy.apy) / 100,
            },
        ]
    } catch (error) {
        console.error('Bitget fetch error:', error)
        return []
    }
}

export const data_BitgetV2 = async () => {
    try {
        const response = await fetch('https://www.bitgetapp.com/v1/finance/savings/product/list', {
            'headers': {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json;charset=UTF-8',
                'language': 'en_US',
                'locale': 'en_US',
                'priority': 'u=1, i',
            },
            'referrer': 'https://www.bitgetapp.com/earning/savings?source1=earn&source2=savings',
            'referrerPolicy': 'unsafe-url',
            'body': '{"coinName":"USDC","matchUserAssets":false,"matchVipProduct":false,"savingsReq":true,"searchObj":{},"locale":"en"}',
            'method': 'POST',
            'mode': 'cors',
            'credentials': 'include'
        })

        const json = await response.json()
        if (!json?.data?.length) {
            throw new Error('Unexpected Bitget response structure.')
        }

        const data = json.data[0].bizLineProductList[0].productList.find((item: any) => item.period === 0)
        if (!data) {
            throw new Error('No data found for period = 0.')
        }

        const apy = data.apyList.find((item: any) => item.rateLevel === 1)
        if (!apy) {
            throw new Error('No data found for rateLevel = 1.')
        }

        const vipData = json.data[0].bizLineProductList.find((item: any) => item.productLevel === 2).productList.find((item: any) => item.period === 0)
        if (!vipData) {
            throw new Error('No data found for VIP.')
        }

        const vipApy = vipData.apyList.find((item: any) => item.rateLevel === 0)
        if (!vipApy) {
            throw new Error('No data found for VIP rateLevel = 0.')
        }

        return [
            {
                name: data.coinName,
                APR: parseFloat(apy.apy) / 100,
            },
            {
                name: `${vipData.coinName}-VIP`,
                APR: parseFloat(vipApy.apy) / 100,
            },
        ]
    } catch (error) {
        console.error('Bitget fetch error:', error)
        return []
    }
}