import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MatchDocument = HydratedDocument<Match>;

@Schema({ _id: false })
class ScoreBreakdown {
  @Prop({ required: true })
  total!: number;

  @Prop({ required: true })
  personality!: number;

  @Prop({ required: true })
  morality!: number;

  @Prop({ required: true })
  values!: number;

  @Prop({ required: true })
  top3Bonus!: number;

  @Prop()
  aiRerank?: number;
}

@Schema({ timestamps: true, collection: 'matches' })
export class Match {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  cycleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userA!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userB!: Types.ObjectId;

  @Prop({ default: 'active', enum: ['active', 'expired', 'blocked', 'reported'] })
  status!: 'active' | 'expired' | 'blocked' | 'reported';

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ type: ScoreBreakdown, required: true })
  score!: ScoreBreakdown;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
MatchSchema.index({ userA: 1, userB: 1, createdAt: -1 });
MatchSchema.index({ status: 1, expiresAt: 1 });
