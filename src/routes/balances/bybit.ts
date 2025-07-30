import { RestClientV5 } from 'bybit-api';
// Ensure that the environment variables are set
if (!process.env.KEY_BYBIT || !process.env.SECRET_BYBIT) {
    throw new Error('API key and secret must be set in the environment variables.');
}

const client = new RestClientV5({
    testnet: false,
    key: process.env.KEY_BYBIT,
    secret: process.env.SECRET_BYBIT,
});

const getSpotBalance = async () => client
    .getAllCoinsBalance({ accountType: 'FUND' })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching balances: ${response.retMsg}`);
        const filteredBalances = response.result.balance.filter((balance: any) => parseInt(balance.walletBalance) !== 0);
        return filteredBalances
    })
    .catch((error: any) => error);

const getEarnPositions = async () => client
    .getEarnPosition({ category: 'FlexibleSaving' })
    .then((response: any) => {
        if (response.retCode !== 0) throw new Error(`Error fetching earn positions: ${response.retMsg}`);
        return response.result.list;
    })
    .catch((error: any) => error);

export const getBybitBalances = async () => {
    try {
        const getData = await Promise.all([
            getSpotBalance(),
            getEarnPositions()
        ]);

        // return USDE from spot balance
        // return USDT and USDC from earn positions
        const spotBalance = getData[0]?.find((balance: any) => balance.coin === 'USDE');
        const earnPositions = getData[1]?.filter((position: any) => position.coin === 'USDT' || position.coin === 'USDC') || [];

        const usdtPosition = earnPositions.find((position: any) => position.coin === 'USDT');
        const usdcPosition = earnPositions.find((position: any) => position.coin === 'USDC');

        return {
            USDE: spotBalance ? parseFloat(spotBalance.walletBalance) : 0,
            USDT: usdtPosition ? parseFloat(usdtPosition.amount) : 0,
            USDC: usdcPosition ? parseFloat(usdcPosition.amount) : 0
        };
    } catch (error) {
        console.error('Error fetching balance:', error);
        throw error;
    }
};
