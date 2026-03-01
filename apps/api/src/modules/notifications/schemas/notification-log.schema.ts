import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationLogDocument = HydratedDocument<NotificationLog>;

@Schema({ timestamps: true, collection: 'notification_log' })
export class NotificationLog {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: ['match_created', 'new_message', 'match_expiring'] })
  eventType!: 'match_created' | 'new_message' | 'match_expiring';

  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;

  @Prop({ default: false })
  delivered!: boolean;
}

export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);
