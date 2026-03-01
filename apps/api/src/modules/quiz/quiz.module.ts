import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CompatibilityVector,
  CompatibilityVectorSchema
} from './schemas/compatibility-vector.schema';
import { QuizDraft, QuizDraftSchema } from './schemas/quiz-draft.schema';
import { QuizSubmission, QuizSubmissionSchema } from './schemas/quiz-submission.schema';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: QuizSubmission.name, schema: QuizSubmissionSchema },
      { name: CompatibilityVector.name, schema: CompatibilityVectorSchema },
      { name: QuizDraft.name, schema: QuizDraftSchema }
    ])
  ],
  providers: [QuizService],
  controllers: [QuizController],
  exports: [QuizService, MongooseModule]
})
export class QuizModule {}
