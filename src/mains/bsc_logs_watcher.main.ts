import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.modules/bsc_logs_watcher.module';
import { BscLogsWatcherService } from 'src/modules/bsc_logs_watcher/bsc_logs_watcher.service';
import { DebugMonoLogger, MonoLogger } from './Logger';

const loggerInstance =
  process.env.NODE_ENV === 'development'
    ? {}
    : process.env.NODE_ENV === 'staging'
    ? { logger: new DebugMonoLogger() }
    : { logger: new MonoLogger() };

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    ...loggerInstance,
  });
  const service = await app.resolve(BscLogsWatcherService);
  const config = await app.resolve(ConfigService);
  await service.getAllLogs(
    // TODO: consider computing scanStartBlock
    parseInt(config.get('bsc.scanStartBlock'), 10),
  );
}

bootstrap();
