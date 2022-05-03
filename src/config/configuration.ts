export default () => ({
  nftMetadata: {
    path: process.env.NFT_METADATA_PATH,
  },
  ethereum_accounts: {
    path: process.env.ETHEREUM_ACCOUNTS_PATH,
  },
  polygon: {
    url: process.env.POLYGON_URL,
    networkId: process.env.POLYGON_NETWORK_ID,
    chainId: process.env.POLYGON_CHAIN_ID,
    scanStartBlock: process.env.POLYGON_SCAN_START_BLOCK,
    scanFromBackLatestBlock: process.env.POLYGON_SCAN_FROM_BACK_LATEST_BLOCK,
    delayConfirmedBlocks: process.env.POLYGON_DELAY_CONFIRMED_BLOCKS,
    sleepTime: process.env.POLYGON_SLEEP_TIME,
  },
  bsc: {
    url: process.env.BSC_URL,
    networkId: process.env.BSC_CHAIN_ID,
    chainId: process.env.BSC_NETWORK_ID,
    scanStartBlock: process.env.BSC_SCAN_START_BLOCK,
    scanFromBackLatestBlock: process.env.BSC_SCAN_FROM_BACK_LATEST_BLOCK,
    delayConfirmedBlocks: process.env.BSC_DELAY_CONFIRMED_BLOCKS,
    sleepTime: process.env.BSC_SLEEP_TIME,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});
