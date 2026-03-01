import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventbriteModule } from '../eventbrite/eventbrite.module';
import { Match, MatchSchema } from '../matching/schemas/match.schema';
import { MatchingModule } from '../matching/matching.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    MatchingModule,
    NotificationsModule,
    EventbriteModule,
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }])
  ],
  providers: [SchedulerService],
  controllers: [SchedulerController],
  exports: [SchedulerService]
})
export class SchedulerModule {}
