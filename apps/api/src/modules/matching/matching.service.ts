import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Model, Types } from 'mongoose';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { QuizService } from '../quiz/quiz.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Match, MatchDocument } from './schemas/match.schema';
import {
  MatchingCycle,
  MatchingCycleDocument
} from './schemas/matching-cycle.schema';
import { BlockedPair, BlockedPairDocument } from './schemas/blocked-pair.schema';

dayjs.extend(utc);
dayjs.extend(timezone);

interface PairCandidate {
  userA: UserDocument;
  userB: UserDocument;
  score: {
    total: number;
    personality: number;
    interests: number;
    unmatchedBoost: number;
  };
}

@Injectable()
export class MatchingService {
  constructor(
    @InjectModel(MatchingCycle.name)
    private readonly cycleModel: Model<MatchingCycleDocument>,
    @InjectModel(Match.name)
    private readonly matchModel: Model<MatchDocument>,
    @InjectModel(BlockedPair.name)
    private readonly blockedPairModel: Model<BlockedPairDocument>,
    private readonly usersService: UsersService,
    private readonly quizService: QuizService,
    private readonly recommendationsService: RecommendationsService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService
  ) {}

  async runWeeklyMatching(referenceDate = new Date()) {
    const cycleKey = this.getCycleKey(referenceDate);
    const existing = await this.cycleModel.findOne({ cycleKey, status: 'completed' });
    if (existing) {
      return { skipped: true, reason: 'Cycle already completed', cycleKey };
    }

    const cycle = await this.cycleModel.findOneAndUpdate(
      { cycleKey },
      { cycleKey, startedAt: new Date(), status: 'running' },
      { upsert: true, new: true }
    );

    const users = await this.usersService.listEligibleUsers();
    const vectors = await this.quizService.getAllVectors();
    const vectorByUser = new Map(vectors.map((v) => [v.userId.toString(), v]));

    const candidates: PairCandidate[] = [];

    for (let i = 0; i < users.length; i += 1) {
      for (let j = i + 1; j < users.length; j += 1) {
        const userA = users[i];
        const userB = users[j];

        if (!(await this.isEligiblePair(userA, userB))) continue;

        const score = this.computeScore(
          userA,
          userB,
          vectorByUser.get(userA.id)?.traits ?? {},
          vectorByUser.get(userB.id)?.traits ?? {},
          vectorByUser.get(userA.id)?.interests ?? userA.interests,
          vectorByUser.get(userB.id)?.interests ?? userB.interests
        );

        candidates.push({ userA, userB, score });
      }
    }

    candidates.sort((a, b) => b.score.total - a.score.total);

    const selected: PairCandidate[] = [];
    const used = new Set<string>();

    for (const candidate of candidates) {
      if (used.has(candidate.userA.id) || used.has(candidate.userB.id)) continue;
      used.add(candidate.userA.id);
      used.add(candidate.userB.id);
      selected.push(candidate);
    }

    const runTime = dayjs(referenceDate).tz(this.timezone());
    const nextSunday = runTime.add(1, 'week').day(0);
    const expiresAt = nextSunday
      .hour(18)
      .minute(59)
      .second(59)
      .millisecond(0)
      .toDate();

    for (const matchCandidate of selected) {
      const match = await this.matchModel.create({
        cycleId: cycle._id,
        userA: new Types.ObjectId(matchCandidate.userA.id),
        userB: new Types.ObjectId(matchCandidate.userB.id),
        status: 'active',
        expiresAt,
        score: matchCandidate.score
      });

      await this.usersService.updateMatchingMetadata(matchCandidate.userA.id, {
        matchedAt: new Date(),
        unmatchedStreak: 0
      });
      await this.usersService.updateMatchingMetadata(matchCandidate.userB.id, {
        matchedAt: new Date(),
        unmatchedStreak: 0
      });

      await this.recommendationsService.generateForMatch(match.id, [
        ...new Set([...(matchCandidate.userA.interests ?? []), ...(matchCandidate.userB.interests ?? [])])
      ]);

      await this.notificationsService.emitMatchCreated(matchCandidate.userA.id, match.id);
      await this.notificationsService.emitMatchCreated(matchCandidate.userB.id, match.id);
    }

    const unmatchedIds = users
      .filter((u) => !used.has(u.id))
      .map((u) => u.id);
    await this.usersService.incrementUnmatchedStreak(unmatchedIds);

    cycle.status = 'completed';
    cycle.completedAt = new Date();
    cycle.candidateCount = users.length;
    cycle.matchedCount = selected.length;
    await cycle.save();

    return {
      cycleKey,
      candidates: users.length,
      matchesCreated: selected.length,
      unmatched: unmatchedIds.length
    };
  }

  async expireActiveMatches() {
    const result = await this.matchModel.updateMany(
      { status: 'active', expiresAt: { $lte: new Date() } },
      { status: 'expired' }
    );
    return { expiredCount: result.modifiedCount };
  }

  async getCurrentMatch(userId: string) {
    return this.matchModel
      .findOne({
        status: 'active',
        $or: [{ userA: new Types.ObjectId(userId) }, { userB: new Types.ObjectId(userId) }]
      })
      .sort({ createdAt: -1 });
  }

  async getMatchHistory(userId: string) {
    return this.matchModel
      .find({
        $or: [{ userA: new Types.ObjectId(userId) }, { userB: new Types.ObjectId(userId) }]
      })
      .sort({ createdAt: -1 })
      .limit(30);
  }

  async blockMatch(matchId: string, blockerId: string) {
    const match = await this.matchModel.findById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found.');
    }

    const otherId =
      match.userA.toString() === blockerId
        ? match.userB.toString()
        : match.userA.toString();

    await this.blockedPairModel.updateOne(
      {
        blockerId: new Types.ObjectId(blockerId),
        blockedId: new Types.ObjectId(otherId)
      },
      {
        blockerId: new Types.ObjectId(blockerId),
        blockedId: new Types.ObjectId(otherId),
        source: 'manual_block'
      },
      { upsert: true }
    );

    match.status = 'blocked';
    await match.save();

    return { success: true };
  }

  private async isEligiblePair(userA: UserDocument, userB: UserDocument) {
    if (userA.id === userB.id) return false;

    const cooldownWeeks = this.config.get<number>('MATCH_COOLDOWN_WEEKS', 4);
    const since = dayjs().subtract(cooldownWeeks, 'week').toDate();

    const recentMatch = await this.matchModel.findOne({
      createdAt: { $gte: since },
      $or: [
        {
          userA: new Types.ObjectId(userA.id),
          userB: new Types.ObjectId(userB.id)
        },
        {
          userA: new Types.ObjectId(userB.id),
          userB: new Types.ObjectId(userA.id)
        }
      ]
    });

    if (recentMatch) return false;

    const blocked = await this.blockedPairModel.findOne({
      $or: [
        {
          blockerId: new Types.ObjectId(userA.id),
          blockedId: new Types.ObjectId(userB.id)
        },
        {
          blockerId: new Types.ObjectId(userB.id),
          blockedId: new Types.ObjectId(userA.id)
        }
      ]
    });

    if (blocked) return false;

    const userAPref = userA.preferences;
    const userBPref = userB.preferences;

    const ageOkForA = userB.age >= userAPref.preferredAgeMin && userB.age <= userAPref.preferredAgeMax;
    const ageOkForB = userA.age >= userBPref.preferredAgeMin && userA.age <= userBPref.preferredAgeMax;

    const genderOkForA = userAPref.preferredGenders.includes(userB.gender);
    const genderOkForB = userBPref.preferredGenders.includes(userA.gender);

    return ageOkForA && ageOkForB && genderOkForA && genderOkForB;
  }

  private computeScore(
    userA: UserDocument,
    userB: UserDocument,
    traitsA: Record<string, number>,
    traitsB: Record<string, number>,
    interestsA: string[],
    interestsB: string[]
  ) {
    const allKeys = Array.from(new Set([...Object.keys(traitsA), ...Object.keys(traitsB)]));
    const maxDiffByTrait: Record<string, number> = {
      openness: 4,
      conscientiousness: 4,
      extraversion: 4,
      agreeableness: 4,
      neuroticism: 4,
      care: 6,
      fairness: 6,
      liberty: 6,
      loyalty: 6,
      authority: 6,
      sanctity: 6
    };

    let personalityDistance = 0;
    let maxPossibleDistance = 0;
    for (const key of allKeys) {
      personalityDistance += Math.abs((traitsA[key] ?? 3) - (traitsB[key] ?? 3));
      maxPossibleDistance += maxDiffByTrait[key] ?? 4;
    }

    const personality = Math.max(0, 1 - personalityDistance / Math.max(1, maxPossibleDistance));

    const setA = new Set(interestsA);
    const setB = new Set(interestsB);
    const overlap = [...setA].filter((tag) => setB.has(tag)).length;
    const union = new Set([...setA, ...setB]).size;
    const interests = union === 0 ? 0 : overlap / union;

    const unmatchedBoost = Math.min(0.2, (userA.unmatchedStreak + userB.unmatchedStreak) * 0.02);
    const total = Number((personality * 0.55 + interests * 0.35 + unmatchedBoost * 0.1).toFixed(4));

    return {
      total,
      personality: Number(personality.toFixed(4)),
      interests: Number(interests.toFixed(4)),
      unmatchedBoost: Number(unmatchedBoost.toFixed(4))
    };
  }

  private timezone() {
    return this.config.get<string>('MATCH_TIMEZONE', 'America/Chicago');
  }

  private getCycleKey(date: Date) {
    const local = dayjs(date).tz(this.timezone());
    return local.day(0).format('YYYY-MM-DD');
  }
}
