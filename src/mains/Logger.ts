import { LoggerService } from '@nestjs/common';

export class MonoLogger implements LoggerService {
  log(message: string) {
    console.log('[INFO]', new Date().toISOString(), message);
  }
  error(message: string, trace: string) {
    console.log('[ERROR]', new Date().toISOString(), message, trace);
  }
  warn(message: string) {
    console.log('[WARN]', new Date().toISOString(), message);
  }
  debug(message: string) {
    return;
  }
  verbose(message: string) {
    return;
  }
}

export class DebugMonoLogger implements LoggerService {
  log(message: string) {
    console.log('[INFO]', new Date().toISOString(), message);
  }
  error(message: string, trace: string) {
    console.log('[ERROR]', new Date().toISOString(), message, trace);
  }
  warn(message: string) {
    console.log('[WARN]', new Date().toISOString(), message);
  }
  debug(message: string) {
    console.log('[DEBUG]', new Date().toISOString(), message);
  }
  verbose(message: string) {
    console.log('[VERBOSE]', new Date().toISOString(), message);
  }
}
