import { NestFactory } from '@nestjs/core';
import { PolygonLogsWatcherService } from 'src/modules/polygon_logs_watcher/polygon_logs_watcher.service';
import { AppModule } from '../app.modules/polygon_logs_watcher.module';
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
  const service = await app.resolve(PolygonLogsWatcherService);

  await service.getAllLogs();
}

bootstrap();
