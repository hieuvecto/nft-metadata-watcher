import { TxData } from '@ethereumjs/tx';
import BigNumber from 'bignumber.js';
import {
  setLengthLeft,
  toBuffer,
  keccak256,
  ecsign,
  bufferToHex,
  bufferToInt,
  unpadBuffer,
} from 'ethereumjs-util';

export const toBufferFromString = (val: string) => toBuffer(val);

export const toAddressString = (val: Buffer): string =>
  bufferToHex(val.slice(-20)).toLowerCase();

export const toNumber = (val: Buffer): number => bufferToInt(val);

export const toNumberString = (val: Buffer): string => {
  const ret = bufferToHex(unpadBuffer(val));
  if (ret === '0x') return '0';
  return ret;
};

export const toBytes32 = (val: number | string): Buffer =>
  setLengthLeft(toBuffer(val), 32);

export const toAddress = (val: string): Buffer =>
  setLengthLeft(toBuffer(val), 20);

export const toAdamTokenId = (val: string): string =>
  bufferToHex(toBufferFromString(val).slice(-16)).toLowerCase();

export const hash = (message: Buffer) => {
  return bufferToHex(keccak256(message));
};

export const sign = (msgHash: string, privateKey: Buffer) => {
  const { v, r, s } = ecsign(toBuffer(msgHash), privateKey);
  return { v, r: bufferToHex(r), s: bufferToHex(s) };
};

export const createTxData = (obj: {
  to: string;
  gasLimit: string;
  gasPrice: BigNumber;
  value: BigNumber;
  data: string;
  nonce: number;
}): TxData => {
  return {
    to: obj.to,
    gasLimit: `0x${new BigNumber(obj.gasLimit).toString(16)}`,
    gasPrice: `0x${new BigNumber(obj.gasPrice).toString(16)}`,
    value: `0x${new BigNumber(obj.value).toString(16)}`,
    data: obj.data,
    nonce: `0x${new BigNumber(obj.nonce).toString(16)}`,
  };
};
