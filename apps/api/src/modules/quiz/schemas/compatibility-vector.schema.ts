import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CompatibilityVectorDocument = HydratedDocument<CompatibilityVector>;

@Schema({ timestamps: true, collection: 'compatibility_vectors' })
export class CompatibilityVector {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Object, required: true })
  traits!: Record<string, number>;

  @Prop({ type: [String], default: [] })
  interests!: string[];

  @Prop({ type: [String], default: [] })
  valueSortTop!: string[];

  @Prop({ required: true, default: 1 })
  version!: number;
}

export const CompatibilityVectorSchema =
  SchemaFactory.createForClass(CompatibilityVector);
