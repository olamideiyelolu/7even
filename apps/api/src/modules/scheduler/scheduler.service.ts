import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Match, MatchDocument } from '../matching/schemas/match.schema';
import { MatchingService } from '../matching/matching.service';
import { NotificationsService } from '../notifications/notifications.service';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly matchingService: MatchingService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
    @InjectModel(Match.name)
    private readonly matchModel: Model<MatchDocument>
  ) {}

  @Cron('0 0 19 * * 0', {
    timeZone: 'America/Chicago'
  })
  async runSundayMatchingJob() {
    this.logger.log('Starting weekly matching cycle...');
    await this.matchingService.expireActiveMatches();
    const result = await this.matchingService.runWeeklyMatching();
    this.logger.log(`Weekly matching completed: ${JSON.stringify(result)}`);
  }

  @Cron('0 0 18 * * 3', { timeZone: 'America/Chicago' })
  async runMidweekNudge() {
    this.logger.log('Running midweek reminder job...');
    const activeMatches = await this.matchModel.find({
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    for (const match of activeMatches) {
      await this.notificationsService.emitMatchExpiring(
        match.userA.toString(),
        match.id
      );
      await this.notificationsService.emitMatchExpiring(
        match.userB.toString(),
        match.id
      );
    }
  }

  @Cron('0 0 18 * * 6', { timeZone: 'America/Chicago' })
  async runPreExpiryReminder() {
    this.logger.log('Running pre-expiry reminder job...');

    const upcoming = await this.matchModel.find({
      status: 'active',
      expiresAt: {
        $lte: dayjs().add(2, 'day').toDate(),
        $gt: new Date()
      }
    });

    for (const match of upcoming) {
      await this.notificationsService.emitMatchExpiring(
        match.userA.toString(),
        match.id
      );
      await this.notificationsService.emitMatchExpiring(
        match.userB.toString(),
        match.id
      );
    }
  }

  async runWeeklyNow() {
    await this.matchingService.expireActiveMatches();
    return this.matchingService.runWeeklyMatching(new Date());
  }

  async expireNow() {
    return this.matchingService.expireActiveMatches();
  }
}
