import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class UserPreferences {
  @Prop({ type: [String], default: [] })
  preferredGenders!: string[];

  @Prop({ default: 18 })
  preferredAgeMin!: number;

  @Prop({ default: 99 })
  preferredAgeMax!: number;
}

const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, lowercase: true, trim: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, min: 18, max: 99 })
  age!: number;

  @Prop({ required: true })
  dateOfBirth!: Date;

  @Prop({ required: true })
  school!: string;

  @Prop({ required: true })
  major!: string;

  @Prop({ required: true })
  schoolYear!: string;

  @Prop({ required: true })
  gender!: string;

  @Prop({ required: true })
  orientation!: string;

  @Prop({ required: true })
  pronouns!: string;

  @Prop({ required: true })
  profilePhotoUrl!: string;

  @Prop({ default: '' })
  ctaLine!: string;

  @Prop({ type: [String], default: [] })
  interests!: string[];

  @Prop({ type: UserPreferencesSchema, default: () => ({}) })
  preferences!: UserPreferences;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop({ default: true, index: true })
  active!: boolean;

  @Prop({ default: 0 })
  unmatchedStreak!: number;

  @Prop()
  lastMatchedAt?: Date;

  @Prop({ type: Date, default: null, index: true })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ deletedAt: 1, active: 1, emailVerifiedAt: 1 });
