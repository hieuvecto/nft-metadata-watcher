import { TxData } from '@ethereumjs/tx';
import { BigNumber } from 'bignumber.js';
import Web3 from 'web3';
import { Log, PastLogsOptions } from 'web3-core';
import { BlockTransactionString } from 'web3-eth';

export interface IWeb3Service {
  getTransactionCount(address: string): Promise<number>;

  getGasPrice(): Promise<BigNumber>;

  /**
   * Returns the current block number with retry attemps.
   * @param isRetry
   * @returns
   */
  getBlockNumber(isRetry?: boolean): Promise<number>;

  sign(txData: TxData, privateKey: Buffer): string;

  send(signedTx: string): Promise<string>;

  getPastLogs(params: PastLogsOptions): Promise<Log[]>;

  decodeParameters(inputs: any, data: any): any;

  getBlock(
    blockHashOrBlockNumber: string | number,
  ): Promise<BlockTransactionString>;

  call(
    callObject: { to: string; data: string },
    defaultBlock: number | string,
  ): Promise<string>;

  getWeb3(): Web3;
}
