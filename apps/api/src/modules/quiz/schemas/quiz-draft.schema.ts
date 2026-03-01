import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuizDraftDocument = HydratedDocument<QuizDraft>;

@Schema({ _id: false })
class QuizDraftAnswer {
  @Prop({ required: true })
  questionId!: string;

  @Prop({ required: true, min: 0, max: 6 })
  value!: number;
}

@Schema({ timestamps: true, collection: 'quiz_drafts' })
export class QuizDraft {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: [QuizDraftAnswer], default: [] })
  answers!: QuizDraftAnswer[];

  @Prop({ type: [String], default: [] })
  interests!: string[];

  @Prop({ default: 0, min: 0 })
  currentIndex!: number;

  @Prop({ default: false })
  isValueStep!: boolean;

  @Prop({ enum: ['choose', 'rank'], default: 'choose' })
  valueMode!: 'choose' | 'rank';

  @Prop({ type: [String], default: [] })
  selectedValues!: string[];

  @Prop({ type: [String], default: [] })
  rankedValues!: string[];

  updatedAt?: Date;
}

export const QuizDraftSchema = SchemaFactory.createForClass(QuizDraft);
