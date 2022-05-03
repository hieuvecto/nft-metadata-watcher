import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.modules/bsc_auction_watcher.module';
import { BscAuctionWatcherService } from 'src/modules/bsc_auction_watcher/bsc_auction_watcher.service';
import { DebugMonoLogger, MonoLogger } from './Logger';

const loggerInstance =
  process.env.NODE_ENV === 'development'
    ? {}
    : process.env.NODE_ENV === 'staging'
    ? { logger: new DebugMonoLogger() }
    : { logger: new MonoLogger() };

async function bootstrap() {
  console.log(BscAuctionWatcherService);
  const app = await NestFactory.create(AppModule, {
    ...loggerInstance,
  });
  const service = await app.resolve(BscAuctionWatcherService);

  await service.getAllLogs();
}

bootstrap();
