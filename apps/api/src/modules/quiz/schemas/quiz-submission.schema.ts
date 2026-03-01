import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuizSubmissionDocument = HydratedDocument<QuizSubmission>;

@Schema({ _id: false })
class QuizAnswer {
  @Prop({ required: true })
  questionId!: string;

  @Prop({ required: true, min: 0, max: 6 })
  value!: number;
}

@Schema({ timestamps: true, collection: 'quiz_submissions' })
export class QuizSubmission {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: [QuizAnswer], required: true })
  answers!: QuizAnswer[];

  @Prop({ type: [String], default: [] })
  interests!: string[];

  @Prop({ type: [String], default: [] })
  valueSortTop!: string[];
}

export const QuizSubmissionSchema = SchemaFactory.createForClass(QuizSubmission);
QuizSubmissionSchema.index({ userId: 1, createdAt: -1 });
