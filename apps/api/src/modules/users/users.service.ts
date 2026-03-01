import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RegisterDto } from '../auth/dto/register.dto';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>
  ) {}

  async createFromRegistration(dto: RegisterDto & { school: string }, passwordHash: string) {
    return this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      age: dto.age,
      dateOfBirth: new Date(dto.dateOfBirth),
      school: dto.school,
      major: dto.major,
      schoolYear: dto.schoolYear,
      gender: dto.gender,
      orientation: dto.orientation,
      pronouns: dto.pronouns,
      profilePhotoUrl: dto.profilePhotoUrl,
      ctaLine: dto.ctaLine ?? '',
      interests: dto.interests ?? [],
      preferences: {
        preferredGenders: dto.preferredGenders,
        preferredAgeMin: dto.preferredAgeMin,
        preferredAgeMax: dto.preferredAgeMax
      },
      active: true,
      deletedAt: null
    });
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(userId: string) {
    return this.userModel.findById(userId);
  }

  async markEmailVerified(email: string) {
    return this.userModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      { emailVerifiedAt: new Date() },
      { new: true }
    );
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found.');
    }
    return this.toPublicUser(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const update: Record<string, unknown> = {};
    if (dto.fullName) update.fullName = dto.fullName;
    if (dto.school) update.school = dto.school;
    if (dto.major) update.major = dto.major;
    if (dto.schoolYear) update.schoolYear = dto.schoolYear;
    if (typeof dto.age === 'number') update.age = dto.age;
    if (dto.profilePhotoUrl) update.profilePhotoUrl = dto.profilePhotoUrl;
    if (typeof dto.ctaLine === 'string') update.ctaLine = dto.ctaLine;
    if (typeof dto.pronouns === 'string') update.pronouns = dto.pronouns;
    if (dto.interests) update.interests = dto.interests;
    if (dto.preferredGenders) {
      update['preferences.preferredGenders'] = dto.preferredGenders;
    }
    if (typeof dto.preferredAgeMin === 'number') {
      update['preferences.preferredAgeMin'] = dto.preferredAgeMin;
    }
    if (typeof dto.preferredAgeMax === 'number') {
      update['preferences.preferredAgeMax'] = dto.preferredAgeMax;
    }

    const updated = await this.userModel.findByIdAndUpdate(userId, update, {
      new: true
    });

    if (!updated || updated.deletedAt) {
      throw new NotFoundException('User not found.');
    }

    return this.toPublicUser(updated);
  }

  async softDelete(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      deletedAt: new Date(),
      active: false
    });
    return { success: true };
  }

  async listEligibleUsers() {
    return this.userModel.find({
      deletedAt: null,
      active: true,
      emailVerifiedAt: { $exists: true },
      age: { $gte: 18 }
    });
  }

  async updateMatchingMetadata(
    userId: string,
    payload: { matchedAt?: Date; unmatchedStreak?: number }
  ) {
    const update: Record<string, unknown> = {};
    if (payload.matchedAt) update.lastMatchedAt = payload.matchedAt;
    if (typeof payload.unmatchedStreak === 'number') {
      update.unmatchedStreak = payload.unmatchedStreak;
    }
    return this.userModel.findByIdAndUpdate(userId, update, { new: true });
  }

  async incrementUnmatchedStreak(userIds: string[]) {
    if (userIds.length === 0) return;
    await this.userModel.updateMany(
      { _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } },
      { $inc: { unmatchedStreak: 1 } }
    );
  }

  toPublicUser(user: UserDocument) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      age: user.age,
      school: user.school,
      major: user.major,
      schoolYear: user.schoolYear,
      gender: user.gender,
      orientation: user.orientation,
      pronouns: user.pronouns,
      interests: user.interests,
      profilePhotoUrl: user.profilePhotoUrl,
      ctaLine: user.ctaLine,
      preferences: user.preferences,
      emailVerifiedAt: user.emailVerifiedAt,
      active: user.active,
      unmatchedStreak: user.unmatchedStreak,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
