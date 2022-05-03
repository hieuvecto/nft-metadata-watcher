import { AbiItem } from 'web3-utils';
import {
  getAuctionSwapContractAddress,
  getIncreaseBidEventInput,
  getIncreaseBidEventTopics,
  getListBids,
  getPlaceBidEventInput,
  getPlaceBidEventTopics,
} from './../../common/contracts/AuctionSwapContracts';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWeb3Service } from 'src/common/web3/web3.service.interface';
import { Promise } from 'bluebird';
import {
  toAddressString,
  toBufferFromString,
  toNumber,
} from 'src/common/ethereum_util/ethereum.util';
import web3 from 'web3';
import { createClient } from 'redis';

const MAXIMUM_SCANNING_BLOCKS = 40;

export class BscAuctionWatcherService {
  [x: string]: any;
  constructor(
    private readonly configService: ConfigService,

    @Inject('BscWeb3Service')
    private readonly bscWeb3Service: IWeb3Service,
  ) {
    this.redisClient = createClient({
      url: `redis://@${this.configService.get(
        'redis.host',
      )}:${this.configService.get('redis.port')}`,
    });
    this.redisClient.connect();
  }

  private readonly logger = new Logger(BscAuctionWatcherService.name);

  async getAllLogs() {
    try {
      // BAD CODE

      let startBlock: number;
      const startBlockStr = this.configService.get('bsc.scanStartBlock');
      this.logger.log(`startBlock ${startBlockStr}`);
      if (startBlockStr) {
        startBlock = parseInt(startBlockStr, 10);
      } else {
        startBlock =
          (await this.bscWeb3Service.getBlockNumber()) -
          parseInt(this.configService.get('bsc.scanFromBackLatestBlock'), 10);
      }

      await this.getLogs(startBlock);
    } catch (e) {
      this.logger.error(`CRASH bsc watcher: ${e}`);
      throw e;
    }
  }

  private async getLogs(fromBlock: number): Promise<void> {
    // TODO: add ethereum maintaince to be able to pause this process.
    const confirmedBlockNumber =
      (await this.bscWeb3Service.getBlockNumber(true)) -
      parseInt(this.configService.get('bsc.delayConfirmedBlocks'), 10);

    if (confirmedBlockNumber < fromBlock) {
      await new Promise((res): void => {
        this.logger.log('Sleep...zzz');
        setTimeout(() => {
          res(() => `sleeped`);
        }, this.configService.get('bsc.sleepTime'));
      });
      return this.getLogs(fromBlock);
    }

    const toBlock = Math.min(
      confirmedBlockNumber,
      fromBlock + MAXIMUM_SCANNING_BLOCKS,
    );
    this.logger.log(`scan block from ${fromBlock} to ${toBlock}`);

    const networkId = this.configService.get('bsc.networkId');

    //watch NftAuctionContract logs
    const watchPlaceBidContractLogsResult = this.watchPlaceBitLogs(
      fromBlock,
      toBlock,
      networkId,
    );

    const watchIncreaseBidContractLogsResult = this.watchIncreaseBitLogs(
      fromBlock,
      toBlock,
      networkId,
    );

    await Promise.all([
      watchPlaceBidContractLogsResult,
      watchIncreaseBidContractLogsResult,
    ]);

    return this.getLogs(toBlock + 1);
  }

  private async watchPlaceBitLogs(
    fromBlock: number,
    toBlock: number,
    networkId: string,
  ) {
    // contract logs
    const logs = await this.bscWeb3Service.getPastLogs({
      fromBlock,
      toBlock,
      address: getAuctionSwapContractAddress(networkId),
    });
    //this.logger.log(`scanned AuctionContract logs: ${JSON.stringify(logs)}`);

    const placeBidTopic = getPlaceBidEventTopics();
    const placeBidLogs = logs.filter(
      ({ topics }) => topics[0] == placeBidTopic,
    );
    const eventInput = getPlaceBidEventInput();
    // this.logger.log(
    //   `scanned Place bid event logs: ${JSON.stringify(placeBidLogs)}`,
    // );
    await Promise.map(
      placeBidLogs,
      ({ transactionHash, topics, data, logIndex }) => {
        const poolId = toNumber(toBufferFromString(topics[1]));
        const dataBuffer = toBufferFromString(data);
        const params = this.bscWeb3Service.decodeParameters(
          eventInput.filter((item) => !item.indexed),
          data,
        );
        const { buyerAddress, quantity, priceEach } = params;
        const quantityInt = web3.utils.toNumber(quantity);
        const priceInt = web3.utils.fromWei(priceEach);
        ///console.log(buyerAddress, quantityInt, priceInt, logIndex);
        this.addAccountBidToRedis(buyerAddress, poolId);
      },
      { concurrency: 3 },
    );
    // TODO: add warning except log.
  }

  private async watchIncreaseBitLogs(
    fromBlock: number,
    toBlock: number,
    networkId: string,
  ) {
    // contract logs
    const logs = await this.bscWeb3Service.getPastLogs({
      fromBlock,
      toBlock,
      address: getAuctionSwapContractAddress(networkId),
    });
    //this.logger.log(`scanned AuctionContract logs: ${JSON.stringify(logs)}`);

    const increaseBidTopic = getIncreaseBidEventTopics();
    const increaseBidLogs = logs.filter(
      ({ topics }) => topics[0] == increaseBidTopic,
    );
    const eventInput = getIncreaseBidEventInput();
    // this.logger.log(
    //   `scanned Increase bid event logs: ${JSON.stringify(increaseBidLogs)}`,
    // );
    // TODO: add warning except log.
    await Promise.map(
      increaseBidLogs,
      ({ transactionHash, topics, data, logIndex }) => {
        const poolId = toNumber(toBufferFromString(topics[1]));
        const params = this.bscWeb3Service.decodeParameters(
          eventInput.filter((item) => !item.indexed),
          data,
        );
        const { buyerAddress, quantity, priceEach } = params;
        const quantityInt = web3.utils.toNumber(quantity);
        const priceInt = web3.utils.fromWei(priceEach);
        console.log(buyerAddress, quantityInt, priceInt, logIndex);
        this.addAccountBidToRedis(buyerAddress, poolId);
      },
      { concurrency: 3 },
    );
    // TODO: add warning except log.
  }
  async addAccountBidToRedis(account: string, poolId: number): Promise<any> {
    const networkId = this.configService.get('bsc.networkId');
    const listBids = await getListBids(
      networkId,
      this.configService.get('bsc.url'),
      poolId,
      account,
    );
    const contractAddress = getAuctionSwapContractAddress(networkId);
    const keyRankPrice = `${contractAddress}-${poolId}-price`;
    const keyRankQuantity = `${contractAddress}-${poolId}-quantity`;
    listBids.forEach(({ index, quantity, priceEach }) => {
      this.redisClient.hSet(keyRankPrice, index, priceEach);
      this.redisClient.hSet(keyRankQuantity, index, quantity);
    });
  }
}
