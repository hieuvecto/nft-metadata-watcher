import Common from '@ethereumjs/common';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import { Web3Service } from './web3.service';

@Injectable()
export class BscWeb3Service extends Web3Service {
  web3: Web3;
  common: Common;
  protected readonly logger = new Logger(BscWeb3Service.name);

  constructor(protected readonly configService: ConfigService) {
    super();
    // TODO: consider aws web3 provider for signature v4
    this.web3 = new Web3(new Web3.providers.HttpProvider(configService.get('bsc.url')));

    const networkId = parseInt(configService.get('bsc.networkId'), 10);
    const chainId = parseInt(configService.get('bsc.chainId'), 10);
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

  getWeb3(): Web3 {
    return this.web3;
  }
}
