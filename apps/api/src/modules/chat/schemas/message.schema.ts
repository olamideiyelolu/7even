import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  matchId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true })
  body!: string;

  @Prop({ default: false })
  delivered!: boolean;

  @Prop({ default: false })
  read!: boolean;

  @Prop({ default: false })
  flagged!: boolean;

  @Prop({ type: String, default: null })
  flagReason?: string | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ matchId: 1, createdAt: -1 });
