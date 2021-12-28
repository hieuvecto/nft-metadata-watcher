import Common from '@ethereumjs/common';
import { Transaction, TxData } from '@ethereumjs/tx';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { Log, PastLogsOptions } from 'web3-core';
import { BlockTransactionString } from 'web3-eth';
import { IWeb3Service } from './web3.service.interface';

@Injectable()
export class Web3Service implements IWeb3Service {
  web3: Web3;
  common: Common;
  private readonly logger = new Logger(Web3Service.name);

  constructor(private readonly configService: ConfigService) {
    // TODO: consider aws web3 provider for signature v4
    this.web3 = new Web3(configService.get('blockchain.url'));

    const networkId = parseInt(configService.get('blockchain.networkId'), 10);
    const chainId = parseInt(configService.get('blockchain.chainId'), 10);
    if (chainId === 1) {
      this.common = new Common({ chain: 1 });
    } else {
      this.common = Common.forCustomChain('mainnet', {
        name: 'private',
        networkId,
        chainId,
      });
    }
  }

  getTransactionCount(address: string): Promise<number> {
    return this.web3.eth.getTransactionCount(address, 'pending');
  }

  async getGasPrice(): Promise<BigNumber> {
    return new BigNumber(await this.web3.eth.getGasPrice());
  }

  async getBlockNumber(isRetry?: boolean): Promise<number> {
    try {
      return await this.web3.eth.getBlockNumber();
    } catch (e) {
      this.logger.error(`Failed to getBlockNumber. error: ${e}`);
      // retry
      if (isRetry) {
        this.logger.log(`Sleep 60s and retry to getBlockNumber ...`);
        await new Promise((res): void => {
          setTimeout(() => {
            res(() => `sleeped`);
          }, 60 * 1000);
        });

        return this.getBlockNumber(true);
      } else {
        throw e;
      }
    }
  }

  getBlock(
    blockHashOrBlockNumber: string | number,
  ): Promise<BlockTransactionString> {
    return this.web3.eth.getBlock(blockHashOrBlockNumber);
  }

  sign(txData: TxData, privateKey: Buffer): string {
    const tx = Transaction.fromTxData(txData, {
      common: this.common,
    });
    const signedTx = tx.sign(privateKey);
    return `0x${signedTx.serialize().toString('hex')}`;
  }

  send(signedTx: string): Promise<string> {
    return new Promise((res, rej) =>
      this.web3.eth.sendSignedTransaction(signedTx, (err, hash) => {
        if (err) return rej(err);
        return res(hash);
      }),
    );
  }

  call(
    callObject: { to: string; data: string },
    defaultBlock: number | string = 'latest',
  ): Promise<string> {
    return new Promise((res, rej) =>
      this.web3.eth.call(callObject, defaultBlock, (err, ret) => {
        if (err) return rej(err);
        return res(ret);
      }),
    );
  }

  async getPastLogs(params: PastLogsOptions): Promise<Log[]> {
    try {
      return await this.web3.eth.getPastLogs(params);
    } catch (e) {
      this.logger.error(`Failed to getPastLogs. error: ${e}`);
      // retry
      this.logger.log(`Sleep 60s and retry to getPastLogs ...`);
      await new Promise((res): void => {
        setTimeout(() => {
          res(() => `sleeped`);
        }, 60 * 1000);
      });

      return this.getPastLogs(params);
    }
  }
}
