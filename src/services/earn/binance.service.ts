/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'

const BINANCE_HEADERS = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'clienttype': 'web',
    'content-type': 'application/json',
    'lang': 'en',
    'priority': 'u=1, i',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-passthrough-token': '',
    'referer': 'https://www.binance.com/en/earn',
    'referrer-policy': 'origin-when-cross-origin',
}

/**
 * Fetch data from Binance.
 */
export const data_Binance = async () => {
    try {
        const response = await fetch(
            'https://www.binance.com/bapi/earn/v1/friendly/finance-earn/homepage/overview?searchCoin=FDUSD&pageSize=100',
            {
                headers: {
                    ...BINANCE_HEADERS,
                    'bnc-currency': 'USD_USD',
                    'bnc-location': 'BINANCE',
                    'bnc-uuid': '9c7f4b6f-b75f-41d5-9872-98e1e1827126',
                    'csrftoken': 'd41d8cd98f00b204e9800998ecf8427e',
                    'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
                    'x-trace-id': 'e3b264c3-6475-4876-8751-573290b8cffb',
                    'x-ui-request-trace': 'e3b264c3-6475-4876-8751-573290b8cffb',
                },
                method: 'GET'
            },
        )

        const json = await response.json()
        if (!json?.data?.list) {
            throw new Error('Unexpected Binance response structure.')
        }

        // find FDUSD
        const fdusdData = json.data.list.find(
            (item: { asset: string }) => item.asset === 'FDUSD',
        )
        if (!fdusdData?.productSummary) {
            throw new Error('FDUSD data not found in Binance response.')
        }

        const simpleEarn = fdusdData.productSummary.find(
            (p: { productType: string }) => p.productType === 'SIMPLE_EARN',
        )

        if (!simpleEarn) {
            throw new Error('SIMPLE_EARN for FDUSD not found in Binance response.')
        }

        // e.g. maxApr is in decimal form like "0.10" => 10%
        return {
            name: 'FDUSD',
            APR: (parseFloat(simpleEarn.maxApr) * 100) / 100,
        }
    } catch (error) {
        console.error('Binance fetch error:', error)
        return {
            name: 'FDUSD',
            APR: 0
        }
    }
}

/**
 * Fetch FDUSD, USDT, and USDC data from Binance.
 */
export const data_Binance_All = async (noLimit: string) => {
    try {
        const listCurrency = ['USD1', 'USDT', 'USDC']
        const getData = (currency: any) => fetch(`https://www.binance.com/bapi/earn/v3/friendly/finance-earn/calculator/product/list?asset=${currency}&type=Flexible`, {
            headers: {
                ...BINANCE_HEADERS,
                'bnc-currency': 'USD',
                'bnc-location': '',
                'bnc-uuid': '3f4df1c8-cd33-4b91-8e24-93ed8338275b',
                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'x-trace-id': '735af735-42db-47c7-8feb-68272939852b',
                'x-ui-request-trace': '735af735-42db-47c7-8feb-68272939852b',
            },
            method: 'GET'
        })

        const jsons = await Promise.all(listCurrency.map(c => getData(c).then(r => r.json())))

        return jsons.map(json => {
            const data = json?.data?.savingFlexibleProduct?.[0]
            if (!data) throw new Error('No data found.')
            return {
                name: data.asset,
                APR: parseFloat(
                    noLimit && data.asset === noLimit
                        ? data.apy
                        : data.marketApr
                )
            }
        }) || []
    } catch (error) {
        console.error('Binance fetch error:', error)
        return []
    }
}