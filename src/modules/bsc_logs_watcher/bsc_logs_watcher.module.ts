import { Module } from '@nestjs/common';
import { EthereumAccountsService } from 'src/common/ethereum_accounts/ethereum_accounts.service';
import { BscWeb3Service } from 'src/common/web3/bsc_web3.service';
import { PolygonWeb3Service } from 'src/common/web3/polygon_web3.service';
import { BscLogsWatcherService } from './bsc_logs_watcher.service';

@Module({
  providers: [
    BscLogsWatcherService,
    { provide: 'BscWeb3Service', useClass: BscWeb3Service },
    { provide: 'PolygonWeb3Service', useClass: PolygonWeb3Service },
    {
      provide: 'EthereumAccountsService',
      useClass: EthereumAccountsService,
    },
  ],
})
export class BscLogsWatcherModule {}
