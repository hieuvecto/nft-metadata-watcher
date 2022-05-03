import Common from '@ethereumjs/common';
import { Transaction, TxData } from '@ethereumjs/tx';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { Log, PastLogsOptions } from 'web3-core';
import { BlockTransactionString } from 'web3-eth';
import { IWeb3Service } from './web3.service.interface';

@Injectable()
export abstract class Web3Service implements IWeb3Service {
  web3: Web3;
  common: Common;
  protected readonly logger = new Logger(Web3Service.name);

  getTransactionCount(address: string): Promise<number> {
    return this.web3.eth.getTransactionCount(address, 'pending');
  }

  decodeParameters(inputs: any, data: any): any {
    return this.web3.eth.abi.decodeParameters(inputs, data);
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
      this.web3.eth
        .sendSignedTransaction(signedTx, (err, hash) => {
          if (err) return rej(err);
          return res(hash);
        })
        .on('error', (err) => this.logger.error(`Send error:  ${err}`)),
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

  abstract getWeb3(): Web3;
}
