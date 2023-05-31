import express from 'express';
import fetch from 'cross-fetch';
import asyncHandler from 'express-async-handler'

const router = express.Router();

// Home page route.
router.get("/", function (req, res) {
    res.status(200).send({ status: 'ok' });
});

router.get("/tensorBidsS1", asyncHandler(async (req, res, next) => {
    const marketBidS1 = await fetch("https://graphql.tensor.trade/graphql", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,id;q=0.8,id-ID;q=0.7",
            "content-type": "application/json",
            "Referer": "https://www.tensor.trade/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": JSON.stringify({
            "operationName": "SwapOrders",
            "variables": {
                "slug": "ed2a62f1-6060-4a63-b78c-941aa7a2023d",
                "owner": "2nQMC1ot35q48vuYA3Nk1HPRbzE87eDycDpK77qtKmBh"
            },
            "query": "query SwapOrders($slug: String!, $owner: String) {\n  tswapOrders(slug: $slug, owner: $owner) {\n    ...ReducedTSwapPool\n    __typename\n  }\n  hswapOrders(slug: $slug, owner: $owner) {\n    ...ReducedHSwapPool\n    __typename\n  }\n  elixirOrders(slug: $slug) {\n    ...ReducedElixirPool\n    __typename\n  }\n  tcompBids(slug: $slug) {\n    ...ReducedTCompBid\n    __typename\n  }\n}\n\nfragment ReducedTSwapPool on TSwapPool {\n  address\n  ownerAddress\n  whitelistAddress\n  poolType\n  curveType\n  startingPrice\n  delta\n  mmCompoundFees\n  mmFeeBalance\n  mmFeeBps\n  takerSellCount\n  takerBuyCount\n  nftsHeld\n  solBalance\n  createdUnix\n  statsTakerSellCount\n  statsTakerBuyCount\n  statsAccumulatedMmProfit\n  margin\n  marginNr\n  lastTransactedAt\n  maxTakerSellCount\n  nftsForSale {\n    ...ReducedMint\n    __typename\n  }\n  __typename\n}\n\nfragment ReducedMint on TLinkedTxMintTV2 {\n  onchainId\n  compressed\n  owner\n  name\n  imageUri\n  metadataUri\n  metadataFetchedAt\n  sellRoyaltyFeeBPS\n  tokenStandard\n  tokenEdition\n  attributes\n  lastSale {\n    price\n    txAt\n    __typename\n  }\n  accState\n  ...MintRarityFields\n  __typename\n}\n\nfragment MintRarityFields on TLinkedTxMintTV2 {\n  rarityRankTT\n  rarityRankTTStat\n  rarityRankTTCustom\n  rarityRankHR\n  rarityRankTeam\n  rarityRankStat\n  rarityRankTN\n  __typename\n}\n\nfragment ReducedHSwapPool on HSwapPool {\n  address\n  pairType\n  delta\n  curveType\n  baseSpotPrice\n  feeBps\n  mathCounter\n  assetReceiver\n  boxes {\n    address\n    vaultTokenAccount\n    mint {\n      ...ReducedMint\n      __typename\n    }\n    __typename\n  }\n  feeBalance\n  buyOrdersQuantity\n  fundsSolOrTokenBalance\n  createdAt\n  lastTransactedAt\n  __typename\n}\n\nfragment ReducedElixirPool on ElixirPool {\n  address\n  createdAt\n  buyPrices\n  sellPrices\n  pNftMint\n  vaults {\n    mint {\n      ...ReducedMint\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment ReducedTCompBid on TCompBid {\n  address\n  target\n  targetId\n  amount\n  solBalance\n  ownerAddress\n  filledQuantity\n  quantity\n  margin\n  marginNr\n  createdAt\n  __typename\n}"
        }),
        "method": "POST"
    });


    const json = await marketBidS1.json();
    res.status(200).send(json);
}));

router.get("/tensorBidsS2", asyncHandler(async (req, res, next) => {
    const marketBidS2 = await fetch("https://graphql.tensor.trade/graphql", {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9,id;q=0.8,id-ID;q=0.7",
          "content-type": "application/json",
          "Referer": "https://www.tensor.trade/",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": JSON.stringify({
            "operationName": "SwapOrders",
            "variables": {
                "slug": "40d3fc20-f3f7-47a3-b8b0-18a90b6719d6",
                "owner": "2nQMC1ot35q48vuYA3Nk1HPRbzE87eDycDpK77qtKmBh"
            },
            "query": "query SwapOrders($slug: String!, $owner: String) {\n  tswapOrders(slug: $slug, owner: $owner) {\n    ...ReducedTSwapPool\n    __typename\n  }\n  hswapOrders(slug: $slug, owner: $owner) {\n    ...ReducedHSwapPool\n    __typename\n  }\n  elixirOrders(slug: $slug) {\n    ...ReducedElixirPool\n    __typename\n  }\n  tcompBids(slug: $slug) {\n    ...ReducedTCompBid\n    __typename\n  }\n}\n\nfragment ReducedTSwapPool on TSwapPool {\n  address\n  ownerAddress\n  whitelistAddress\n  poolType\n  curveType\n  startingPrice\n  delta\n  mmCompoundFees\n  mmFeeBalance\n  mmFeeBps\n  takerSellCount\n  takerBuyCount\n  nftsHeld\n  solBalance\n  createdUnix\n  statsTakerSellCount\n  statsTakerBuyCount\n  statsAccumulatedMmProfit\n  margin\n  marginNr\n  lastTransactedAt\n  maxTakerSellCount\n  nftsForSale {\n    ...ReducedMint\n    __typename\n  }\n  __typename\n}\n\nfragment ReducedMint on TLinkedTxMintTV2 {\n  onchainId\n  compressed\n  owner\n  name\n  imageUri\n  metadataUri\n  metadataFetchedAt\n  sellRoyaltyFeeBPS\n  tokenStandard\n  tokenEdition\n  attributes\n  lastSale {\n    price\n    txAt\n    __typename\n  }\n  accState\n  ...MintRarityFields\n  __typename\n}\n\nfragment MintRarityFields on TLinkedTxMintTV2 {\n  rarityRankTT\n  rarityRankTTStat\n  rarityRankTTCustom\n  rarityRankHR\n  rarityRankTeam\n  rarityRankStat\n  rarityRankTN\n  __typename\n}\n\nfragment ReducedHSwapPool on HSwapPool {\n  address\n  pairType\n  delta\n  curveType\n  baseSpotPrice\n  feeBps\n  mathCounter\n  assetReceiver\n  boxes {\n    address\n    vaultTokenAccount\n    mint {\n      ...ReducedMint\n      __typename\n    }\n    __typename\n  }\n  feeBalance\n  buyOrdersQuantity\n  fundsSolOrTokenBalance\n  createdAt\n  lastTransactedAt\n  __typename\n}\n\nfragment ReducedElixirPool on ElixirPool {\n  address\n  createdAt\n  buyPrices\n  sellPrices\n  pNftMint\n  vaults {\n    mint {\n      ...ReducedMint\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment ReducedTCompBid on TCompBid {\n  address\n  target\n  targetId\n  amount\n  solBalance\n  ownerAddress\n  filledQuantity\n  quantity\n  margin\n  marginNr\n  createdAt\n  __typename\n}"
        }),
        "method": "POST"
      });


    const json = await marketBidS2.json();
    res.status(200).send(json);
}));


export default router;