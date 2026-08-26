import fetch from 'cross-fetch'
import { MainClient } from 'binance'
import { RestClientV5 } from 'bybit-api'

export type WdfeeExchange = 'bybit' | 'pintu' | 'tokocrypto'
export type WdfeeDestination = WdfeeExchange | 'p2p'

export interface WdfeeWithdrawal {
    network: string
    name?: string
    fee: string
    percentageFee?: string
    min?: string
    max?: string
    confirmation?: string
    safeConfirmNumber?: string
    depositMin?: string
    minConfirm?: number
    enabled: boolean
}

export interface WdfeeDeposit {
    network: string
    name?: string
    confirmation?: string
    safeConfirmNumber?: string
    depositMin?: string
    minConfirm?: number
    enabled: boolean
}

interface WdfeeExchangeData {
    deposit: WdfeeDeposit[]
    withdraw: WdfeeWithdrawal[]
}

export interface WdfeeRecommendation {
    from: WdfeeExchange
    to: WdfeeDestination
    transferType: 'onchain' | 'internal'
    network?: string
    source?: WdfeeWithdrawal & { exchange: WdfeeExchange; action: 'withdraw' }
    destination?: WdfeeDeposit & { exchange: WdfeeDestination; action: 'deposit' }
    internalTransfer?: { enabled: boolean; fee: string }
}

export interface WdfeeMasterResponse {
    asset: 'USDT'
    recommendations: WdfeeRecommendation[]
}

export interface WdfeeRouteResponse {
    asset: 'USDT'
    from: WdfeeExchange
    to: WdfeeDestination
    transferType: 'onchain' | 'internal'
    source?: { exchange: WdfeeExchange; withdraw: WdfeeWithdrawal[] }
    destination?: { exchange: WdfeeDestination; deposit: WdfeeDeposit[] }
    internalTransfer?: { enabled: boolean; fee: string }
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
    confirmation: string
    withdrawFee: string
    depositMin: string
    withdrawMin: string
    chainDeposit: string
    chainWithdraw: string
    withdrawPercentageFee: string
    safeConfirmNumber: string
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
    depositEnable?: boolean
    minConfirm?: number
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
    const allowedChains = chains
        .map(chain => ({ chain, network: normalizeNetwork(chain.chain) }))
        .filter(({ network }) => BYBIT_DEPOSIT.includes(network as typeof BYBIT_DEPOSIT[number]))

    return {
        deposit: allowedChains.map(({ chain, network }) => ({
            network,
            name: chain.chainType,
            confirmation: chain.confirmation,
            safeConfirmNumber: chain.safeConfirmNumber,
            depositMin: chain.depositMin,
            enabled: chain.chainDeposit === '1',
        })),
        withdraw: allowedChains.map(({ chain, network }) => ({
            network,
            name: chain.chainType,
            fee: chain.withdrawFee,
            percentageFee: chain.withdrawPercentageFee,
            min: chain.withdrawMin,
            max: chain.withdrawMax,
            confirmation: chain.confirmation,
            safeConfirmNumber: chain.safeConfirmNumber,
            depositMin: chain.depositMin,
            enabled: chain.chainWithdraw === '1',
        })),
    }
}

const mapPintu = (networks: PintuNetwork[]): WdfeeExchangeData => {
    const usdtNetworks = networks.filter(network => network.asset === 'USDT' && network.name)
    const allowedNetworks = usdtNetworks
        .map(network => ({ network, canonical: normalizeNetwork(network.name as string) }))
        .filter(({ canonical }) => PINTU_DEPOSIT.includes(canonical as typeof PINTU_DEPOSIT[number]))

    return {
        deposit: allowedNetworks.map(({ network, canonical }) => ({
            network: canonical,
            name: network.name,
            enabled: true,
        })),
        withdraw: allowedNetworks
            .filter(({ network }) => Boolean(network.fee))
            .map(({ network, canonical }) => ({
                network: canonical,
                name: network.name,
                fee: network.fee as string,
                enabled: true,
            })),
    }
}

const mapTokocrypto = (coin: BinanceCoin): WdfeeExchangeData => {
    const networks = (coin.networkList || [])
        .map(network => ({ network, canonical: normalizeNetwork(network.network || '') }))

    return {
        deposit: networks
            .filter(({ canonical }) => TOKOCRYPTO_DEPOSIT.includes(canonical as typeof TOKOCRYPTO_DEPOSIT[number]))
            .map(({ network, canonical }) => ({
                network: canonical,
                name: network.name,
                minConfirm: network.minConfirm,
                enabled: network.depositEnable === true,
            })),
        withdraw: networks
            .filter(({ network, canonical }) => TOKOCRYPTO_WITHDRAW.includes(canonical as typeof TOKOCRYPTO_WITHDRAW[number]) && Boolean(network.withdrawFee))
            .map(({ network, canonical }) => ({
                network: canonical,
                name: network.name,
                fee: network.withdrawFee as string,
                min: network.withdrawMin,
                max: network.withdrawMax,
                minConfirm: network.minConfirm,
                enabled: coin.withdrawAllEnable !== false && network.withdrawEnable === true && network.busy !== true,
            })),
    }
}

const mapP2P = (): WdfeeExchangeData => ({
    deposit: P2P_DEPOSIT.map(network => ({ network, name: network, enabled: true })),
    withdraw: [],
})

const getExchangeData = async (exchange: WdfeeDestination): Promise<WdfeeExchangeData> => {
    if (exchange === 'bybit') return mapBybit(await getBybit())
    if (exchange === 'pintu') return mapPintu(await getPintu())
    if (exchange === 'tokocrypto') return mapTokocrypto(await getTokocrypto())
    return mapP2P()
}

const WD_FEE_ROUTES: Array<[WdfeeExchange, WdfeeDestination]> = [
    ['bybit', 'pintu'],
    ['bybit', 'tokocrypto'],
    ['bybit', 'p2p'],
    ['pintu', 'bybit'],
    ['pintu', 'tokocrypto'],
    ['pintu', 'p2p'],
    ['tokocrypto', 'bybit'],
    ['tokocrypto', 'pintu'],
    ['tokocrypto', 'p2p'],
]

const internalTransfer = { enabled: true, fee: '0' }

const selectRecommendation = (
    from: WdfeeExchange,
    to: WdfeeDestination,
    data: Record<WdfeeDestination, WdfeeExchangeData>,
): WdfeeRecommendation | undefined => {
    const depositsByNetwork = new Map(
        data[to].deposit
            .filter(deposit => deposit.enabled)
            .map(deposit => [deposit.network, deposit] as const),
    )
    let best: WdfeeRecommendation | undefined
    let bestFee = Number.POSITIVE_INFINITY

    for (const withdrawal of data[from].withdraw) {
        if (!withdrawal.enabled) continue
        const destination = depositsByNetwork.get(withdrawal.network)
        if (!destination) continue
        const fee = Number(withdrawal.fee)
        if (!Number.isFinite(fee) || fee >= bestFee) continue
        bestFee = fee
        best = {
            from,
            to,
            transferType: 'onchain',
            network: withdrawal.network,
            source: { ...withdrawal, exchange: from, action: 'withdraw' },
            destination: { ...destination, exchange: to, action: 'deposit' },
        }
    }

    return best
}

export const getWdfeeMaster = async (): Promise<WdfeeMasterResponse> => {
    const [bybitChains, pintuNetworks, tokocryptoCoin] = await Promise.all([getBybit(), getPintu(), getTokocrypto()])
    const data: Record<WdfeeDestination, WdfeeExchangeData> = {
        bybit: mapBybit(bybitChains),
        pintu: mapPintu(pintuNetworks),
        tokocrypto: mapTokocrypto(tokocryptoCoin),
        p2p: mapP2P(),
    }
    const recommendations: WdfeeRecommendation[] = []

    for (const [from, to] of WD_FEE_ROUTES) {
        if (from === 'tokocrypto' && to === 'p2p') {
            recommendations.push({ from, to, transferType: 'internal', internalTransfer })
            continue
        }
        const recommendation = selectRecommendation(from, to, data)
        if (recommendation) recommendations.push(recommendation)
    }

    return { asset: 'USDT', recommendations }
}

export const getWdfeeRoute = async (from: WdfeeExchange, to: WdfeeDestination): Promise<WdfeeRouteResponse> => {
    if (from === 'tokocrypto' && to === 'p2p') {
        return {
            asset: 'USDT',
            from,
            to,
            transferType: 'internal',
            internalTransfer,
        }
    }

    const [sourceData, destinationData] = await Promise.all([getExchangeData(from), getExchangeData(to)])
    return {
        asset: 'USDT',
        from,
        to,
        transferType: 'onchain',
        source: { exchange: from, withdraw: sourceData.withdraw },
        destination: { exchange: to, deposit: destinationData.deposit },
    }
}
