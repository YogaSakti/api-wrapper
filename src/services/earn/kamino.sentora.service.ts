/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'

// TypeScript Interfaces
interface SchedulePoint {
    tsStart: bigint
    rewardPerTimeUnit: bigint
}

interface RewardInfo {
    mint: string
    decimals: number
    rps: bigint
    lastIssuanceTs: bigint
    schedulePoints: SchedulePoint[]
    rewardsPerSecondDecimals: number
}

interface FarmState {
    rewardInfos: RewardInfo[]
    numRewards: number
    isDelegated: boolean
    totalActiveStakeScaled: bigint
}

interface UserState {
    farmState: string
    rewardsTally: bigint[]
    rewardsIssued: bigint[]
    activeStake: bigint
}

interface FarmConfig {
    userState: string | null
}

interface RewardsResult {
    [farmState: string]: number
    total: number
}

// Configuration
const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo"
const FARMS_PROGRAM = "FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr"
const RPC_URL = "https://api.mainnet-beta.solana.com"
const PRECISION = BigInt(10) ** BigInt(18)

// Known PYUSD farms with user state addresses for this specific wallet
// For delegated farms, we hardcode the known UserState address since PDA derivation is complex
const PYUSD_FARMS: Record<string, FarmConfig> = {
    "DEe2NZ5dAXGxC7M8Gs9Esd9wZRPdQzG8jNamXqhL5yku": { userState: "9qeE9i1zZWeW2QFXCHngDym3oenzmaFJp57h83GLhxd1" },  // Delegated
    "8hznHD38esVyPps3hUcFahynwekYUfjn43PRz9n5PDZN": { userState: null }  // Non-delegated (derive PDA)
}

// Derive UserState PDA: seeds = ["user", farmState, owner]
const getUserStatePDA = (farm: string, owner: string): string => PublicKey.findProgramAddressSync(
    [Buffer.from("user"), new PublicKey(farm).toBuffer(), new PublicKey(owner).toBuffer()],
    new PublicKey(FARMS_PROGRAM)
)[0].toBase58()

// Read u128 as BigInt
const readU128 = (buf: Buffer, off: number): bigint => buf.readBigUInt64LE(off) + (buf.readBigUInt64LE(off + 8) << BigInt(64))

// Decode UserState (920 bytes)
const decodeUserState = (buf: Buffer): UserState => ({
    farmState: bs58.encode(buf.subarray(16, 48)),
    rewardsTally: Array.from({ length: 10 }, (_, i) => readU128(buf, 88 + i * 16)),
    rewardsIssued: Array.from({ length: 10 }, (_, i) => buf.readBigUInt64LE(248 + i * 8)),
    activeStake: readU128(buf, 408)
})

// Decode FarmState (8336 bytes)
const decodeFarmState = (buf: Buffer): FarmState => {
    let off = 192; // 8+32+32+32+8+32+48
    const rewardInfos = Array.from({ length: 10 }, () => {
        // TokenInfo: mint(32) + decimals(8) + tokenProgram(32) + padding(48) = 120 bytes
        const mint = bs58.encode(buf.subarray(off, off + 32)); off += 32;
        const decimals = Number(buf.readBigUInt64LE(off)); off += 8;
        off += 32; // tokenProgram
        off += 48; // padding
        off += 32; // rewardsVault
        off += 8;  // rewardsAvailable
        // RewardScheduleCurve: 20 points of (u64 tsStart, u64 rewardPerTimeUnit) = 320 bytes
        const schedulePoints = Array.from({ length: 20 }, () => {
            const tsStart = buf.readBigUInt64LE(off); off += 8;
            const rewardPerTimeUnit = buf.readBigUInt64LE(off); off += 8;
            return { tsStart, rewardPerTimeUnit };
        });
        off += 8;  // minClaimDurationSeconds
        const lastIssuanceTs = buf.readBigUInt64LE(off); off += 8;
        off += 8;  // rewardsIssuedUnclaimed
        off += 8;  // rewardsIssuedCumulative
        const rps = readU128(buf, off); off += 16;
        off += 8;  // placeholder0
        off += 1;  // rewardType
        const rewardsPerSecondDecimals = buf.readUInt8(off); off += 1;
        off += 6;  // padding0
        off += 160; // padding1 (20 * u64)
        return { mint, decimals, rps, lastIssuanceTs, schedulePoints, rewardsPerSecondDecimals };
    });
    
    const numRewards = Number(buf.readBigUInt64LE(off)); off += 8;
    off += 8;  // numUsers
    const totalActiveStakeScaled = buf.readBigUInt64LE(off); off += 8;  // u64, not u128!
    off += 32 + 32 + 8 + 32 + 1 + 1; // farmVault, authority, bump, delegateAuth, timeUnit, frozen
    const isDelegated = buf.readUInt8(off) === 1;
    
    return { rewardInfos, numRewards, isDelegated, totalActiveStakeScaled };
};

// Get current reward per second from schedule
const getCurrentRps = (schedulePoints: SchedulePoint[], now: bigint): bigint => {
    let rps = BigInt(0)
    for (const point of schedulePoints) {
        if (point.tsStart <= now) rps = point.rewardPerTimeUnit
        else break
    }
    return rps
}

/**
 * Fetch PYUSD rewards data from Kamino Sentora farms.
 */
export const data_Kamino_Sentora = async (wallet: string): Promise<RewardsResult> => {
    try {
        const connection = new Connection(RPC_URL, 'confirmed')
        const farmPubkeys = Object.keys(PYUSD_FARMS)
        
        // Get user state addresses: use hardcoded if available, else derive PDA
        const userStatePubkeys = farmPubkeys.map(farm => 
            PYUSD_FARMS[farm].userState || getUserStatePDA(farm, wallet)
        )
        
        // Single RPC call for all accounts: farms + user states
        const allPubkeys = [...farmPubkeys, ...userStatePubkeys].map(pk => new PublicKey(pk))
        const accountInfos = await connection.getMultipleAccountsInfo(allPubkeys)
        
        // Parse farms
        const farms: Record<string, FarmState> = {}
        farmPubkeys.forEach((pk, i) => {
            const accountInfo = accountInfos[i]
            if (accountInfo && accountInfo.data) {
                farms[pk] = decodeFarmState(accountInfo.data)
            }
        })
        
        const now = BigInt(Math.floor(Date.now() / 1000)) // Current timestamp
        
        // Calculate rewards from user states
        const results: Record<string, number> = {}
        userStatePubkeys.forEach((_, i) => {
            const accountInfo = accountInfos[farmPubkeys.length + i]
            if (!accountInfo || !accountInfo.data) return
            
            const user = decodeUserState(accountInfo.data)
            const farm = farms[user.farmState]
            if (!farm) return

            for (let r = 0; r < farm.numRewards; r++) {
                const { mint, decimals, rps, lastIssuanceTs, schedulePoints, rewardsPerSecondDecimals } = farm.rewardInfos[r]
                if (mint !== PYUSD_MINT) continue

                // Calculate new rewards since last on-chain update
                const tsDiff = now > lastIssuanceTs ? now - lastIssuanceTs : BigInt(0)
                const currentRps = getCurrentRps(schedulePoints, now)
                const rpsDecimals = BigInt(10) ** BigInt(rewardsPerSecondDecimals)
                const totalStake = farm.totalActiveStakeScaled
                
                // newRewards = tsDiff * rewardPerTimeUnit / rpsDecimals
                // newRpsIncrement = newRewards * PRECISION / totalStake
                const newRewardsTotal = (tsDiff * currentRps) / rpsDecimals
                const newRpsIncrement = totalStake > BigInt(0)
                    ? (newRewardsTotal * PRECISION) / totalStake 
                    : BigInt(0)
                const newRps = rps + newRpsIncrement
                
                const accrued = farm.isDelegated ? user.activeStake * newRps : (user.activeStake * newRps) / PRECISION
                const pending = accrued > user.rewardsTally[r] ? (accrued - user.rewardsTally[r]) / PRECISION : BigInt(0)
                const total = pending + user.rewardsIssued[r]
                results[user.farmState] = Number(total) / 10 ** decimals
            }
        })

        // Calculate total sum of all values
        const total = Object.values(results).reduce((sum: number, val: number) => sum + val, 0)

        return { ...results, total }
    } catch (error) {
        console.error('Kamino Sentora fetch error:', error)
        return { total: 0 }
    }
}
