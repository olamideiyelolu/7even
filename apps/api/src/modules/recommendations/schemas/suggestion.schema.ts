import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SuggestionDocument = HydratedDocument<Suggestion>;

@Schema({ _id: false })
class SuggestionItem {
  @Prop({ type: Types.ObjectId })
  venueEventId?: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, enum: ['restaurant', 'event'] })
  type!: 'restaurant' | 'event';

  @Prop()
  eventUrl?: string;

  @Prop()
  startsAt?: Date;

  @Prop()
  venueName?: string;

  @Prop()
  locationLabel?: string;

  @Prop()
  detailLabel?: string;

  @Prop()
  priceLabel?: string;

  @Prop({ required: true, enum: ['static', 'catalog'], default: 'catalog' })
  source!: 'static' | 'catalog';

  @Prop({ type: [String], default: [] })
  matchedTags!: string[];

  @Prop({ required: true })
  score!: number;
}

@Schema({ timestamps: true, collection: 'suggestions' })
export class Suggestion {
  @Prop({ type: Types.ObjectId, required: true })
  matchId!: Types.ObjectId;

  @Prop({ type: [SuggestionItem], default: [] })
  items!: SuggestionItem[];
}

export const SuggestionSchema = SchemaFactory.createForClass(Suggestion);
SuggestionSchema.index({ matchId: 1 }, { unique: true });
