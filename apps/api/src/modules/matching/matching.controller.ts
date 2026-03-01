import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/interfaces/request.interface';
import { ReportMessageDto } from '../moderation/dto/report-message.dto';
import { ModerationService } from '../moderation/moderation.service';
import { MatchingService } from './matching.service';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly moderationService: ModerationService
  ) {}

  @Get('current')
  getCurrent(@CurrentUser() user: AuthUser) {
    return this.matchingService.getCurrentMatch(user.sub);
  }

  @Get('current/partner-profile')
  getCurrentPartnerProfile(@CurrentUser() user: AuthUser) {
    return this.matchingService.getCurrentPartnerProfile(user.sub);
  }

  @Get('history')
  getHistory(@CurrentUser() user: AuthUser) {
    return this.matchingService.getMatchHistory(user.sub);
  }

  @Post(':matchId/block')
  block(@CurrentUser() user: AuthUser, @Param('matchId') matchId: string) {
    return this.matchingService.blockMatch(matchId, user.sub);
  }

  @Post(':matchId/report')
  report(
    @CurrentUser() user: AuthUser,
    @Param('matchId') matchId: string,
    @Body() dto: ReportMessageDto
  ) {
    return this.moderationService.reportMatch(matchId, user.sub, dto.messageIds ?? []);
  }
}
