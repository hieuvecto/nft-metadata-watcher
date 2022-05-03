import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWeb3Service } from 'src/common/web3/web3.service.interface';
import { Promise } from 'bluebird';
import {
  createTxData,
  toAddressString,
  toBufferFromString,
  toNumber,
} from 'src/common/ethereum_util/ethereum.util';
import { existsSync } from 'fs';
import {
  EthereumAccountRole,
  EthereumAccountsService,
} from 'src/common/ethereum_accounts/ethereum_accounts.service';
import {
  getRandomizeByRarityContractAddress,
  requestRandomNumber,
  REQUEST_RANDOM_NUMBER_GAS_LIMIT,
} from 'src/common/contracts/RandomizeByRarityContract';
import BigNumber from 'bignumber.js';
import {
  getOpenBoxTypeEventTopics,
  getWidiCharContractAddress,
  getWidiLandContractAddress,
} from 'src/common/contracts/WidiContract';
import notifier from 'node-notifier';
import {
  getOpenBoxContractAddress,
  getOpenBoxEventTopics,
} from 'src/common/contracts/OpenBoxContract';
import axios from 'axios';
import { of } from 'rxjs';

const MAXIMUM_SCANNING_BLOCKS = 40;

export class BscLogsWatcherService {
  constructor(
    private readonly configService: ConfigService,

    @Inject('BscWeb3Service')
    private readonly bscWeb3Service: IWeb3Service,
    @Inject('PolygonWeb3Service')
    private readonly polygonWeb3Service: IWeb3Service,
    @Inject('EthereumAccountsService')
    private readonly ethereumAccountsService: EthereumAccountsService,
  ) {}

  private readonly logger = new Logger(BscLogsWatcherService.name);

  private isSent = false;

  async getAllLogs() {
    try {
      // BAD CODE
      // await this.ethereumAccountsService.initNonce(this.polygonWeb3Service);

      let startBlock;
      const startBlockStr = this.configService.get('bsc.scanStartBlock');
      if (startBlockStr) {
        startBlock = parseInt(startBlockStr, 10);
      } else {
        startBlock =
          (await this.bscWeb3Service.getBlockNumber()) -
          parseInt(this.configService.get('bsc.scanFromBackLatestBlock'), 10);
      }

      await this.getLogs(startBlock, 0);
    } catch (e) {
      this.logger.error(`CRASH bsc watcher: ${e}`);
      throw e;
    }
  }

  private async getLogs(fromBlock: number, offset: number): Promise<void> {
    // TODO: add ethereum maintaince to be able to pause this process.
    const confirmedBlockNumber =
      (await this.bscWeb3Service.getBlockNumber(true)) -
      parseInt(this.configService.get('bsc.delayConfirmedBlocks'), 10);

    if (confirmedBlockNumber < fromBlock) {
      this.logger.log('Sleep...zzz');

      await new Promise((res): void => {
        setTimeout(() => {
          res(() => `sleeped`);
        }, this.configService.get('bsc.sleepTime'));
      });
      return this.getLogs(fromBlock, offset);
    }

    const toBlock = Math.min(
      confirmedBlockNumber,
      fromBlock + MAXIMUM_SCANNING_BLOCKS,
    );
    this.logger.log(`scan block from ${fromBlock} to ${toBlock}`);

    const networkId = this.configService.get('bsc.networkId');

    // const watchWidiCharLogsReseult = this.watchWidiCharLogs(
    //   fromBlock,
    //   toBlock,
    //   networkId,
    // );

    // const watchWidiLandLogsReseult = this.watchWidiLandLogs(
    //   fromBlock,
    //   toBlock,
    //   networkId,
    // );

    const targetBlockNumber = 17388996;
    await Promise.all([this.estimateOpenBoxGas(confirmedBlockNumber, offset)]);

    return this.getLogs(toBlock + 1, offset + 100);
  }

  private async watchOpenBoxContractLogs(
    fromBlock: number,
    toBlock: number,
    networkId: string,
  ) {
    // contract logs
    const logs = await this.bscWeb3Service.getPastLogs({
      fromBlock,
      toBlock,
      address: getOpenBoxContractAddress(networkId),
    });
    this.logger.log(`scanned OpenBoxContract logs: ${JSON.stringify(logs)}`);

    const openBoxTopics = getOpenBoxEventTopics(networkId);
    const openBoxLogs = logs.filter(({ topics }) =>
      openBoxTopics.includes(topics[0]),
    );
    this.logger.log(
      `scanned OpenBox event logs: ${JSON.stringify(openBoxLogs)}`,
    );

    let gasPrice;
    if (openBoxLogs.length > 0) {
      // TODO: consider use separate transaction creator for optimizing send tx.
      gasPrice = await this.polygonWeb3Service.getGasPrice();
      this.logger.log(`gasPrice: 0x${gasPrice.toString(16)}`);
    }

    await Promise.map(
      openBoxLogs,
      ({ transactionHash, topics, data }) => {
        const poolId = toNumber(toBufferFromString(topics[1]));
        const tokenId = toNumber(toBufferFromString(topics[2]));
        const dataBuffer = toBufferFromString(data);
        const buyerAddress = toAddressString(dataBuffer.slice(0, 32));

        return {
          transactionHash,
          buyerAddress,
          poolId,
          tokenId,
          gasPrice,
        };
      },
      { concurrency: 3 },
    ).map(this.handleOpenBoxLogData.bind(this));

    // TODO: add warning except log.
  }

  private async handleOpenBoxLogData({
    transactionHash,
    buyerAddress,
    poolId,
    tokenId,
    gasPrice,
  }: {
    transactionHash: string;
    buyerAddress: string;
    poolId: number;
    tokenId: number;
    gasPrice: BigNumber;
  }): Promise<boolean> {
    try {
      const basePath = this.configService.get('nftMetadata.path');
      const poolDirectoryPath = `${basePath}/${poolId}`;
      const filePath = `${poolDirectoryPath}/${tokenId}.json`;

      // TODO: optimize
      const isFileExisted = existsSync(filePath);
      if (isFileExisted) {
        throw new Error(`${filePath} existed`);
      }

      const polygonNetworkId = this.configService.get('polygon.networkId');
      const txData = createTxData({
        to: getRandomizeByRarityContractAddress(polygonNetworkId),
        gasLimit: REQUEST_RANDOM_NUMBER_GAS_LIMIT,
        gasPrice,
        value: new BigNumber(0),
        data: requestRandomNumber(polygonNetworkId, poolId, tokenId),
        nonce: this.ethereumAccountsService.getNonce(
          EthereumAccountRole.signer,
        ),
      });
      this.logger.log(`txData: ${JSON.stringify(txData)}`);

      const signedTx = this.polygonWeb3Service.sign(
        txData,
        this.ethereumAccountsService.getPrivateKey(EthereumAccountRole.signer),
      );
      this.logger.log(`signedTx: ${signedTx}`);

      // send tx
      const hash = await this.polygonWeb3Service.send(signedTx);
      this.logger.log(
        `requestRandomNumber(poolId=${poolId}, tokenId=${tokenId}) txHash: ${hash}`,
      );

      return true;
    } catch (e) {
      this.logger.error(`handleOpenBoxLogData error: ${e}`);
    }
  }

  private async watchWidiCharLogs(
    fromBlock: number,
    toBlock: number,
    networkId: string,
  ) {
    // contract logs
    const logs = await this.bscWeb3Service.getPastLogs({
      fromBlock,
      toBlock,
      address: getWidiCharContractAddress(networkId),
    });
    this.logger.log(`scanned Widi char contract logs: ${JSON.stringify(logs)}`);

    const openBoxTopics = getOpenBoxTypeEventTopics(networkId);
    const openBoxLogs = logs.filter(({ topics }) =>
      openBoxTopics.includes(topics[0]),
    );
    this.logger.log(
      `scanned OpenBox char event logs: ${JSON.stringify(openBoxLogs)}`,
    );

    await Promise.map(
      openBoxLogs,
      ({ transactionHash, data }) => {
        const dataBuffer = toBufferFromString(data);
        const rarity = toNumber(dataBuffer.slice(0, 32));

        return {
          transactionHash,
          rarity,
        };
      },
      { concurrency: 3 },
    ).map(this.handleWidiCharOpenBox.bind(this));
  }

  private async handleWidiCharOpenBox({
    transactionHash,
    rarity,
  }: {
    transactionHash: string;
    rarity: number;
  }): Promise<boolean> {
    try {
      if (rarity === 4) {
        notifier.notify({
          title: 'EPIC Char Box opened.',
          message: `Transaction hash: ${transactionHash}`,
        });
      }

      if (rarity === 5) {
        notifier.notify({
          title: 'LEGEND Char Box opened.',
          message: `Transaction hash: ${transactionHash}`,
        });
      }

      return true;
    } catch (e) {
      this.logger.error(`handleWidiOpenBox error: ${e}`);
    }
  }

  private async watchWidiLandLogs(
    fromBlock: number,
    toBlock: number,
    networkId: string,
  ) {
    // contract logs
    const logs = await this.bscWeb3Service.getPastLogs({
      fromBlock,
      toBlock,
      address: getWidiLandContractAddress(networkId),
    });
    this.logger.log(`scanned Widi land contract logs: ${JSON.stringify(logs)}`);

    const openBoxTopics = getOpenBoxTypeEventTopics(networkId);
    const openBoxLogs = logs.filter(({ topics }) =>
      openBoxTopics.includes(topics[0]),
    );
    this.logger.log(
      `scanned OpenBox land event logs: ${JSON.stringify(openBoxLogs)}`,
    );

    await Promise.map(
      openBoxLogs,
      ({ transactionHash, data }) => {
        const dataBuffer = toBufferFromString(data);
        const rarity = toNumber(dataBuffer.slice(0, 32));

        return {
          transactionHash,
          rarity,
        };
      },
      { concurrency: 3 },
    ).map(this.handleWidiLandOpenBox.bind(this));
  }

  private async handleWidiLandOpenBox({
    transactionHash,
    rarity,
  }: {
    transactionHash: string;
    rarity: number;
  }): Promise<boolean> {
    try {
      if (rarity === 4) {
        notifier.notify({
          title: 'EPIC Land Box opened.',
          message: `Transaction hash: ${transactionHash}`,
        });
      }

      if (rarity === 5) {
        notifier.notify({
          title: 'LEGEND Land Box opened.',
          message: `Transaction hash: ${transactionHash}`,
        });
      }

      return true;
    } catch (e) {
      this.logger.error(`handleWidiOpenBox error: ${e}`);
    }
  }

  private async estimateOpenBoxGas(curentBlockNumber: number, offset: number) {
    try {
      const from = '0x516d00da00ba0125de52cce3638ccc17f8af4ed5';
      const data =
        '0xc5b51df700000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000042307839336634326263663364323330656361623066633730613631653064333634323566363339666163616266623032356663306339313134326362656136633834000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004198fb3c8cc9f94340d8cee110837bdd73fcdbd61cbe68820c9ecfdc0963c17ce1186546d86909d1b34a4340e6014e95d63d1a763652d69ac833bdccf8459fcd9d1b00000000000000000000000000000000000000000000000000000000000000';

      // const data =ß
      //   '0xc5b51df700000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000423078336536616134303936313861323134653039623164626633323134396330336337363432336433653464343639633430346539306333303539303939373230390000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041cb02f40589dea84626873a517b8702ff1ca107b260c54e43e6c38d427b5b60430e1d056ad8c8ab86abdc4edf64fea2c1157ee75056167610216f79605215ab291b00000000000000000000000000000000000000000000000000000000000000';

      // const data =
      //   '0xc5b51df700000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000423078306461363835653061393938376239353330643063346138636638323036636333333162663637303137316663393064643162316331646264623564663335340000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041e993cdabad9bae52597d3165dd921c601062555cd26f6c57b2010ebad12dbdb46a5d398f1f7ac215290a4289273ed5a94dd53a8ec3ceb6e9b2d06deb71d418551c00000000000000000000000000000000000000000000000000000000000000';
      const nonce = 2;
      const contractAddress = '0x398b6aee9d03ec1b8a3020015fd643556c2b7f7e';
      const privateKey =
        'e5d9c069ee08c4fdec8a9c678b57194ddb68775a1ef757a4860c1c2309024755';
      const privateKeyBuffer = toBufferFromString(`0x${privateKey}`);

      // const estimatedGasLimit = await this.bscWeb3Service
      //   .getWeb3()
      //   .eth.estimateGas({
      //     from: from.toLowerCase(),
      //     nonce,
      //     to: contractAddress,
      //     data,
      //   });

      // this.logger.log(`ESTIMATED GAS: ${estimatedGasLimit}`);

      const blockNumberOffset = -2;
      const nextBlockNumber = new BigNumber(curentBlockNumber);
      const params = {
        from: from.toLowerCase(),
        nonce,
        to: contractAddress,
        data,
      };

      const response = await axios.post(this.configService.get('bsc.url'), {
        jsonrpc: '2.0',
        method: 'eth_estimateGas',
        params: [params, `0x${nextBlockNumber.toString(16)}`], // 60 seconds, may need to be hex, I forget
        id: new Date().getTime(), // Id of the request; anything works, really
      });
      const nextEstimatedGas = new BigNumber(response.data.result);

      // this.logger.log(
      //   `Next block number with offset=${blockNumberOffset}: 0x${nextBlockNumber.toString(
      //     16,
      //   )}`,
      // );

      this.logger.log('Target block number: ', nextBlockNumber.toString());
      console.log(`Next estimate gas:`, nextEstimatedGas.toString());

      // const legendGasLimit = 1000000;
      // const legendGasLimit = 370000;
      // if (estimatedGasLimit > legendGasLimit && !this.isSent) {
      //   const txData = createTxData({
      //     to: contractAddress,
      //     gasLimit: '564212',
      //     gasPrice: new BigNumber('20000000000'),
      //     value: new BigNumber(0),
      //     data,
      //     nonce,
      //   });
      //   this.logger.log(`txData: ${JSON.stringify(txData)}`);

      //   const signedTx = this.bscWeb3Service.sign(
      //     txData,
      //     privateKeyBuffer,
      //   );
      //   this.logger.log(`signedTx: ${signedTx}`);

      //   // send tx
      //   const hash = await this.bscWeb3Service.send(signedTx);
      //   this.logger.log(
      //     `Sent transaction. Alerttttttttttttttttttttttttttttttttttttttttttttttttttttt. txHash: ${hash}`,
      //   );

      //   this.isSent = true;
      // }
    } catch (e) {
      this.logger.error(`Error when estimate open box gas: ${e}`);
    }
  }
}
