import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { Cron } from '@nestjs/schedule';

class WorkerScheduler {
  constructor(private readonly config: ConfigService) {}

  @Cron('0 19 * * 0', { timeZone: 'America/Chicago' })
  async triggerWeeklyMatch() {
    const baseUrl = this.config.get<string>('API_BASE_URL', 'http://localhost:4000/api');
    const token = this.config.get<string>('WORKER_AUTH_TOKEN', '');

    try {
      await fetch(`${baseUrl}/scheduler/run-weekly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
    } catch {
      // Swallow errors to keep worker alive; production should add retries + observability.
    }
  }
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ScheduleModule.forRoot()],
  providers: [WorkerScheduler]
})
class WorkerModule {}

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
}

void bootstrap();
