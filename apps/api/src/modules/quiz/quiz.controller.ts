import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VerifiedEmailGuard } from '../../common/guards/verified-email.guard';
import { AuthUser } from '../../common/interfaces/request.interface';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpsertQuizDraftDto } from './dto/upsert-quiz-draft.dto';
import { QuizService } from './quiz.service';

@Controller('quiz')
@UseGuards(JwtAuthGuard, VerifiedEmailGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('questions')
  getQuestions(@CurrentUser() user: AuthUser) {
    return this.quizService.getQuestions(user.sub);
  }

  @Post('responses')
  submitResponses(@CurrentUser() user: AuthUser, @Body() dto: SubmitQuizDto) {
    return this.quizService.submitResponses(user.sub, dto);
  }

  @Get('draft')
  getDraft(@CurrentUser() user: AuthUser) {
    return this.quizService.getDraft(user.sub);
  }

  @Post('draft')
  upsertDraft(@CurrentUser() user: AuthUser, @Body() dto: UpsertQuizDraftDto) {
    return this.quizService.upsertDraft(user.sub, dto);
  }

  @Post('draft/clear')
  clearDraft(@CurrentUser() user: AuthUser) {
    return this.quizService.clearDraft(user.sub);
  }

  @Get('result')
  getResult(@CurrentUser() user: AuthUser) {
    return this.quizService.getResult(user.sub);
  }
}
