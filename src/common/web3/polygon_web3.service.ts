import Common from '@ethereumjs/common';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import { Web3Service } from './web3.service';

@Injectable()
export class PolygonWeb3Service extends Web3Service {
  web3: Web3;
  common: Common;
  protected readonly logger = new Logger(PolygonWeb3Service.name);

  constructor(protected readonly configService: ConfigService) {
    super();
    // TODO: consider aws web3 provider for signature v4
    this.web3 = new Web3(configService.get('polygon.url'));

    const networkId = parseInt(configService.get('polygon.networkId'), 10);
    const chainId = parseInt(configService.get('polygon.chainId'), 10);
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
