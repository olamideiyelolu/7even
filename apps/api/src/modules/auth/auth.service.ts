import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import argon2 from 'argon2';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthSession, AuthSessionDocument } from './schemas/auth-session.schema';
import { UsersService } from '../users/users.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokens } from './types/auth.types';

interface OtpEntry {
  code: string;
  expiresAt: Date;
}

const SCHOOL_BY_EMAIL_DOMAIN: Array<{ school: string; domains: string[] }> = [
  { school: 'DePaul University', domains: ['depaul.edu'] },
  { school: 'University of Illinois Chicago', domains: ['uic.edu'] },
  { school: 'Roosevelt University', domains: ['roosevelt.edu'] },
  { school: 'Columbia College Chicago', domains: ['colum.edu', 'columbiachicago.edu'] },
  { school: 'Harold Washington College', domains: ['haroldwashington.edu', 'hwc.ccc.edu'] }
];

@Injectable()
export class AuthService {
  // OTP storage is intentionally disabled for MVP local flow.
  private readonly emailOtps = new Map<string, OtpEntry>();

  constructor(
    @InjectModel(AuthSession.name)
    private readonly sessionModel: Model<AuthSessionDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const school = this.resolveSchoolFromEmail(dto.email);
    if (!school) {
      throw new BadRequestException(
        'Email domain is not supported. Allowed schools: DePaul University, University of Illinois Chicago, Roosevelt University, Columbia College Chicago, Harold Washington College.'
      );
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use.');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.createFromRegistration(
      {
        ...dto,
        school
      },
      passwordHash
    );
    await this.usersService.markEmailVerified(dto.email.toLowerCase());

    return {
      userId: user.id,
      email: user.email,
      otpPreview: null,
      message: 'Registered. OTP verification is currently bypassed in local MVP.'
    };
  }

  private resolveSchoolFromEmail(email: string) {
    const domain = email.toLowerCase().split('@')[1]?.trim();
    if (!domain) return null;

    for (const entry of SCHOOL_BY_EMAIL_DOMAIN) {
      if (
        entry.domains.some((allowedDomain) => domain === allowedDomain || domain.endsWith(`.${allowedDomain}`))
      ) {
        return entry.school;
      }
    }
    return null;
  }

  async verifyEmail(dto: VerifyEmailDto) {
    // OTP is bypassed for local MVP.
    await this.usersService.markEmailVerified(dto.email.toLowerCase());
    return { verified: true, bypassed: true };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      user: this.usersService.toPublicUser(user),
      ...tokens
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const { tokenFamily, tokenHash, userId } = await this.validateRefreshToken(
      dto.refreshToken
    );

    await this.sessionModel.updateMany(
      { tokenFamily, userId: new Types.ObjectId(userId), revoked: false },
      { revoked: true, revokedAt: new Date() }
    );

    const user = await this.usersService.findById(userId);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid user session.');
    }

    return this.issueTokens(userId, user.email, tokenFamily);
  }

  async logout(dto: RefreshTokenDto) {
    const { tokenFamily, userId } = await this.validateRefreshToken(dto.refreshToken);
    await this.sessionModel.updateMany(
      { tokenFamily, userId: new Types.ObjectId(userId) },
      { revoked: true, revokedAt: new Date() }
    );
    return { success: true };
  }

  private async issueTokens(
    userId: string,
    email: string,
    tokenFamily?: string
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m')
    });

    const family = tokenFamily ?? uuidv4();
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, tokenFamily: family },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '30d')
      }
    );

    const decoded = this.jwtService.decode(refreshToken) as { exp: number };
    await this.sessionModel.create({
      userId: new Types.ObjectId(userId),
      tokenFamily: family,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
      revoked: false
    });

    return { accessToken, refreshToken };
  }

  private async validateRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        tokenFamily: string;
      }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET')
      });

      const tokenHash = this.hashToken(refreshToken);
      const session = await this.sessionModel.findOne({
        userId: new Types.ObjectId(payload.sub),
        tokenFamily: payload.tokenFamily,
        tokenHash,
        revoked: false,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      return {
        userId: payload.sub,
        tokenFamily: payload.tokenFamily,
        tokenHash
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
