import fetch from 'cross-fetch'
import { MainClient } from 'binance'
import { RestClientV5 } from 'bybit-api'

export type WdfeeExchange = 'bybit' | 'pintu' | 'tokocrypto'
export type WdfeeDestination = WdfeeExchange | 'p2p'

type FeeSource = 'bybit-api' | 'pintu-api' | 'binance-api'

export interface WdfeeWithdrawal {
    network: string
    name?: string
    fee: string
    percentageFee?: string
    min?: string
    max?: string
    enabled: boolean
    feeSource: FeeSource
}

interface WdfeeDeposit {
    exchange: WdfeeDestination
    action: 'deposit'
    enabled: boolean
    name?: string
}

interface WdfeeRouteNetwork {
    network: string
    source: WdfeeWithdrawal & { exchange: WdfeeExchange; action: 'withdraw' }
    destination: WdfeeDeposit
}

interface WdfeeExchangeData {
    deposit: string[]
    withdraw: WdfeeWithdrawal[]
}

export interface WdfeeMasterResponse {
    asset: 'USDT'
    exchanges: {
        bybit: WdfeeExchangeData
        pintu: WdfeeExchangeData
        tokocrypto: WdfeeExchangeData & {
            internalTransfer: { p2p: { enabled: boolean; fee: string; feeSource: 'fixed' } }
        }
        p2p: { deposit: string[] }
    }
}

export interface WdfeeRouteResponse {
    asset: 'USDT'
    from: WdfeeExchange
    to: WdfeeDestination
    transferType: 'onchain' | 'internal'
    internalTransfer?: { enabled: boolean; fee: string; feeSource: 'fixed' }
    networks: WdfeeRouteNetwork[]
}

const bybitClient = new RestClientV5({
    testnet: false,
    key: process.env.KEY_BYBIT as string,
    secret: process.env.SECRET_BYBIT as string,
})

const binanceClient = new MainClient({
    api_key: process.env.KEY_BINANCE as string,
    api_secret: process.env.SECRET_BINANCE as string,
})

const PINTU_NETWORK_URL = 'https://api.pintu.pro/v1/public/get-network-reference?asset=USDT'

const aliases: Record<string, string> = {
    ARBI: 'ARBITRUM',
    ARBITRUM: 'ARBITRUM',
    CAVAX: 'AVAXC',
    'AVALANCHE C-CHAIN': 'AVAXC',
    MATIC: 'POL',
    POLYGON: 'POL',
    OP: 'OPTIMISM',
    OPTIMISM: 'OPTIMISM',
    KLAY: 'KAIA',
    KAIA: 'KAIA',
    APTOS: 'APT',
    APT: 'APT',
    TRON: 'TRX',
    TRX: 'TRX',
    TEZOS: 'XTZ',
    XTZ: 'XTZ',
    STATEMINT: 'DOT',
    'ASSET HUB POLKADOT': 'DOT',
    DOT: 'DOT',
    ETHEREUM: 'ETH',
    'BINANCE SMARTCHAIN': 'BSC',
    'BNB SMART CHAIN': 'BSC',
    SOLANA: 'SOL',
}

export const normalizeNetwork = (value: string): string => {
    const normalized = value.trim().toUpperCase()
    return aliases[normalized] || normalized
}

const BYBIT_DEPOSIT = ['ETH', 'TRX', 'MANTLE', 'BSC', 'APT', 'TON', 'PLASMA', 'SOL', 'POL', 'ARBITRUM', 'AVAXC', 'CELO', 'BERA', 'HYPEREVM', 'OPTIMISM', 'KAIA', 'MONAD', 'KAVAEVM', 'CORN'] as const
const PINTU_DEPOSIT = ['ARBITRUM', 'AVAXC', 'BSC', 'ETH', 'OPTIMISM', 'POL', 'SOL', 'TRX'] as const
const TOKOCRYPTO_DEPOSIT = ['BSC', 'PLASMA', 'KAIA', 'OPTIMISM', 'SOL', 'TRX', 'ETH', 'POL', 'ARBITRUM', 'APT', 'SCROLL', 'XTZ', 'KAVAEVM', 'TON', 'NEAR', 'OPBNB', 'CELO'] as const
const TOKOCRYPTO_WITHDRAW = ['BSC', 'PLASMA', 'KAIA', 'OPTIMISM', 'AVAXC', 'POL', 'ARBITRUM', 'APT', 'SCROLL', 'XTZ', 'KAVAEVM', 'NEAR', 'TON', 'SOL', 'TRX', 'OPBNB', 'ETH', 'CELO'] as const
const P2P_DEPOSIT = ['BSC', 'TRX', 'ETH', 'APT', 'PLASMA', 'SOL', 'POL', 'TON', 'ARBITRUM', 'AVAXC', 'OPTIMISM', 'CELO', 'OPBNB', 'KAIA', 'NEAR', 'SCROLL', 'DOT', 'KAVAEVM', 'XTZ'] as const


interface BybitChain {
    chain: string
    chainType: string
    chainWithdraw: string
    chainDeposit: string
    withdrawFee: string
    withdrawPercentageFee: string
    withdrawMin: string
    withdrawMax: string
}

interface BybitCoinInfoResponse {
    retCode: number
    result?: { rows?: Array<{ coin: string; chains?: BybitChain[] }> }
}

interface PintuNetwork {
    asset?: string
    name?: string
    fee?: string
}

interface PintuResponse {
    code?: number
    data?: { networks?: PintuNetwork[] }
}

interface BinanceNetwork {
    network?: string
    name?: string
    withdrawFee?: string
    withdrawMin?: string
    withdrawMax?: string
    withdrawEnable?: boolean
    busy?: boolean
}

interface BinanceCoin {
    coin?: string
    withdrawAllEnable?: boolean
    networkList?: BinanceNetwork[]
}

const getBybit = async () => {
    const response = await bybitClient.getCoinInfo('USDT') as BybitCoinInfoResponse
    const row = response.retCode === 0 ? response.result?.rows?.find(item => item.coin === 'USDT') : undefined
    if (!row?.chains) throw new Error('Invalid Bybit coin info response')
    return row.chains
}

const getPintu = async () => {
    const response = await fetch(PINTU_NETWORK_URL)
    const json = await response.json() as PintuResponse
    if (!response.ok || json.code !== 0 || !Array.isArray(json.data?.networks)) {
        throw new Error('Invalid Pintu network response')
    }
    return json.data.networks
}

const getTokocrypto = async () => {
    const balances = await binanceClient.getBalances() as BinanceCoin[]
    const coin = balances.find(item => item.coin === 'USDT')
    if (!coin?.networkList) throw new Error('Invalid Binance balance response')
    return coin
}

const mapBybit = (chains: BybitChain[]): WdfeeExchangeData => {
    const liveDeposits = new Set(chains.filter(chain => chain.chainDeposit === '1').map(chain => normalizeNetwork(chain.chain)))
    return {
        deposit: BYBIT_DEPOSIT.filter(network => liveDeposits.has(network)),
        withdraw: chains
            .map(chain => ({ chain, network: normalizeNetwork(chain.chain) }))
            .filter(({ chain, network }) => chain.chainWithdraw === '1' && BYBIT_DEPOSIT.includes(network as typeof BYBIT_DEPOSIT[number]))
            .map(({ chain, network }) => ({
                network,
                name: chain.chainType,
                fee: chain.withdrawFee,
                percentageFee: chain.withdrawPercentageFee,
                min: chain.withdrawMin,
                max: chain.withdrawMax,
                enabled: true,
                feeSource: 'bybit-api' as const,
            })),
    }
}

const mapPintu = (networks: PintuNetwork[]): WdfeeExchangeData => {
    const usdtNetworks = networks.filter(network => network.asset === 'USDT' && network.name)
    const liveDeposits = new Set(usdtNetworks.map(network => normalizeNetwork(network.name as string)))
    return {
        deposit: PINTU_DEPOSIT.filter(network => liveDeposits.has(network)),
        withdraw: usdtNetworks
            .map(network => ({ network, canonical: normalizeNetwork(network.name as string) }))
            .filter(({ network, canonical }) => Boolean(network.fee) && PINTU_DEPOSIT.includes(canonical as typeof PINTU_DEPOSIT[number]))
            .map(({ network, canonical }) => ({
                network: canonical,
                name: network.name,
                fee: network.fee as string,
                enabled: true,
                feeSource: 'pintu-api' as const,
            }))
    }
}

const mapTokocrypto = (coin: BinanceCoin): WdfeeExchangeData => ({
    deposit: [...TOKOCRYPTO_DEPOSIT],
    withdraw: (coin.networkList || [])
        .map(network => ({ network, canonical: normalizeNetwork(network.network || '') }))
        .filter(({ network, canonical }) => TOKOCRYPTO_WITHDRAW.includes(canonical as typeof TOKOCRYPTO_WITHDRAW[number]) && Boolean(network.withdrawFee))
        .map(({ network, canonical }) => ({
            network: canonical,
            name: network.name,
            fee: network.withdrawFee as string,
            min: network.withdrawMin,
            max: network.withdrawMax,
            enabled: coin.withdrawAllEnable !== false && network.withdrawEnable === true && network.busy !== true,
            feeSource: 'binance-api' as const,
        })),
})

const destinationDeposits = async (destination: WdfeeDestination): Promise<WdfeeDeposit[]> => {
    if (destination === 'bybit') {
        const bybit = mapBybit(await getBybit())
        return bybit.deposit.map(network => ({ exchange: 'bybit', action: 'deposit', enabled: true, name: network }))
    }
    if (destination === 'pintu') {
        const pintuNetworks = await getPintu()
        const names = new Map<string, string>()
        for (const network of pintuNetworks) {
            if (network.asset === 'USDT' && network.name) names.set(normalizeNetwork(network.name), network.name)
        }
        return PINTU_DEPOSIT
            .filter(network => names.has(network))
            .map(network => ({ exchange: 'pintu', action: 'deposit' as const, enabled: true, name: names.get(network) }))
    }
    const networks = destination === 'tokocrypto' ? TOKOCRYPTO_DEPOSIT : P2P_DEPOSIT
    return networks.map(network => ({ exchange: destination, action: 'deposit' as const, enabled: true, name: network }))
}

const sourceWithdrawals = async (source: WdfeeExchange): Promise<WdfeeWithdrawal[]> => {
    if (source === 'bybit') return mapBybit(await getBybit()).withdraw
    if (source === 'pintu') return mapPintu(await getPintu()).withdraw
    return mapTokocrypto(await getTokocrypto()).withdraw
}

export const getWdfeeMaster = async (): Promise<WdfeeMasterResponse> => {
    const [bybitChains, pintuNetworks, tokocryptoCoin] = await Promise.all([getBybit(), getPintu(), getTokocrypto()])
    return {
        asset: 'USDT',
        exchanges: {
            bybit: mapBybit(bybitChains),
            pintu: mapPintu(pintuNetworks),
            tokocrypto: {
                ...mapTokocrypto(tokocryptoCoin),
                internalTransfer: { p2p: { enabled: true, fee: '0', feeSource: 'fixed' } },
            },
            p2p: { deposit: [...P2P_DEPOSIT] },
        },
    }
}

export const getWdfeeRoute = async (from: WdfeeExchange, to: WdfeeDestination): Promise<WdfeeRouteResponse> => {
    if (from === 'tokocrypto' && to === 'p2p') {
        return {
            asset: 'USDT',
            from,
            to,
            transferType: 'internal',
            internalTransfer: { enabled: true, fee: '0', feeSource: 'fixed' },
            networks: [],
        }
    }

    const [withdrawals, deposits] = await Promise.all([sourceWithdrawals(from), destinationDeposits(to)])
    const depositsByNetwork = new Map(deposits.map(deposit => [normalizeNetwork(deposit.name || ''), deposit]))
    const networks = withdrawals.flatMap(withdrawal => {
        const destination = depositsByNetwork.get(withdrawal.network)
        return destination
            ? [{
                network: withdrawal.network,
                source: { ...withdrawal, exchange: from, action: 'withdraw' as const },
                destination,
            }]
            : []
    })

    return { asset: 'USDT', from, to, transferType: 'onchain', networks }
}
