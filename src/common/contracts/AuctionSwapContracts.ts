import { AbiItem } from 'web3-utils';
import Contract from 'web3-eth-contract';
import web3 from 'web3';
import { abi, networks } from '../../contracts/AuctionSwapContract.json';
import { ConfigService } from '@nestjs/config';

// TODO: optimize gas
export const UPDATE_NFT_NUMBER_GAS_LIMIT = '210000';

export const getPlaceBidEventTopics = () => {
  const event = abi.filter(
    (item) => item.name === 'PlaceBid' && item.type === 'event',
  );
  return web3.utils.keccak256(
    event[0].name +
      '(' +
      event[0].inputs.map((item: any) => item.type).join(',') +
      ')',
  );
};

export const getPlaceBidEventInput = () => {
  const event = abi.filter(
    (item) => item.name === 'PlaceBid' && item.type === 'event',
  );
  return event[0].inputs;
};

export const getIncreaseBidEventTopics = () => {
  const event = abi.filter(
    (item) => item.name === 'IncreaseBid' && item.type === 'event',
  );
  return web3.utils.keccak256(
    event[0].name +
      '(' +
      event[0].inputs.map((item: any) => item.type).join(',') +
      ')',
  );
};

export const getIncreaseBidEventInput = () => {
  const event = abi.filter(
    (item) => item.name === 'IncreaseBid' && item.type === 'event',
  );
  return event[0].inputs;
};

export const getAuctionSwapContractAddress = (networkId: string): string =>
  networks[networkId].address.toLowerCase();

export const getListBids = async (
  networkId: string,
  url: string,
  poolId: number,
  account: string,
): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const contract = new Contract(
    abi as AbiItem[],
    getAuctionSwapContractAddress(networkId),
  );
  contract.setProvider(url);
  const order = await contract.methods.buyerBids(poolId, account).call();
  const detail: any = [];
  if (order.length > 0) {
    for (const index of order) {
      try {
        const bid = await contract.methods.bids(poolId, index).call();
        detail.push({
          index: parseInt(index),
          claimed: bid.claimed,
          priceEach: parseFloat(web3.utils.fromWei(bid.priceEach)),
          quantity: parseInt(bid.quantity),
          winQuantity: parseInt(bid.winQuantity),
        });
      } catch (e) {}
    }
  }
  return detail;
};
