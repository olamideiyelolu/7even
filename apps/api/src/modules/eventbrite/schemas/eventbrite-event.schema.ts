import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventbriteEventDocument = HydratedDocument<EventbriteEvent>;

@Schema({ timestamps: true, collection: 'eventbrite_events' })
export class EventbriteEvent {
  @Prop({ required: true, unique: true, index: true })
  eventbriteId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  url!: string;

  @Prop({ required: true })
  startsAt!: Date;

  @Prop()
  endsAt?: Date;

  @Prop({ default: 'America/Chicago' })
  timezone!: string;

  @Prop()
  venueName?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  categoryId?: string;

  @Prop()
  subcategoryId?: string;

  @Prop({ default: false })
  isFree!: boolean;

  @Prop()
  priceMin?: number;

  @Prop()
  priceMax?: number;

  @Prop()
  currency?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: 'live' })
  status!: string;

  @Prop({ required: true })
  sourceUpdatedAt!: Date;
}

export const EventbriteEventSchema = SchemaFactory.createForClass(EventbriteEvent);
EventbriteEventSchema.index({ startsAt: 1, city: 1, status: 1 });
EventbriteEventSchema.index({ categoryId: 1, startsAt: 1 });
