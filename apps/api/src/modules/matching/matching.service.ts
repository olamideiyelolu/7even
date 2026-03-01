import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
    morality: number;
    values: number;
    top3Bonus: number;
    aiRerank?: number;
  };
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

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
          vectorByUser.get(userA.id)?.valueSortTop ?? [],
          vectorByUser.get(userB.id)?.valueSortTop ?? []
        );

        candidates.push({ userA, userB, score });
      }
    }

    candidates.sort((a, b) => b.score.total - a.score.total);
    await this.maybeRerankWithAI(candidates, vectorByUser);
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
    const match = await this.matchModel
      .findOne({
        status: 'active',
        $or: [{ userA: new Types.ObjectId(userId) }, { userB: new Types.ObjectId(userId) }]
      })
      .sort({ createdAt: -1 });

    if (!match) return null;

    const matchedWithId =
      match.userA.toString() === userId ? match.userB.toString() : match.userA.toString();
    const matchedWith = await this.usersService.findById(matchedWithId);

    return {
      ...(typeof (match as MatchDocument & { toObject?: () => Record<string, unknown> }).toObject === 'function'
        ? (match as MatchDocument & { toObject: () => Record<string, unknown> }).toObject()
        : match),
      matchedWith: matchedWith
        ? {
            id: matchedWith.id,
            fullName: matchedWith.fullName,
            school: matchedWith.school,
            major: (matchedWith as UserDocument & { major?: string }).major,
            profilePhotoUrl: matchedWith.profilePhotoUrl
          }
        : null
    };
  }

  async getCurrentPartnerProfile(userId: string) {
    const current = await this.getCurrentMatch(userId);
    const matchedWithId = current?.matchedWith?.id;
    if (!matchedWithId) return null;

    const user = await this.usersService.findById(matchedWithId);
    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      school: user.school,
      major: user.major,
      schoolYear: user.schoolYear,
      age: user.age,
      pronouns: user.pronouns,
      ctaLine: user.ctaLine,
      profilePhotoUrl: user.profilePhotoUrl
    };
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

    const priorMatch = await this.matchModel.findOne({
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

    if (priorMatch) return false;

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

    const userAGender = this.normalizeGenderValue(userA.gender);
    const userBGender = this.normalizeGenderValue(userB.gender);
    const preferredForA = this.normalizePreferredGenderValues(userAPref.preferredGenders ?? []);
    const preferredForB = this.normalizePreferredGenderValues(userBPref.preferredGenders ?? []);

    const genderOkForA = preferredForA.includes(userBGender);
    const genderOkForB = preferredForB.includes(userAGender);

    return ageOkForA && ageOkForB && genderOkForA && genderOkForB;
  }

  private computeScore(
    userA: UserDocument,
    userB: UserDocument,
    traitsA: Record<string, number>,
    traitsB: Record<string, number>,
    valuesA: string[],
    valuesB: string[]
  ) {
    const personalityKeys = [
      'openness',
      'conscientiousness',
      'extraversion',
      'agreeableness',
      'neuroticism'
    ] as const;
    const moralKeys = [
      'care',
      'fairness',
      'liberty',
      'loyalty',
      'authority',
      'sanctity'
    ] as const;

    const personality = this.calculateTraitSimilarity(
      personalityKeys as unknown as string[],
      traitsA,
      traitsB,
      4,
      3
    );
    const morality = this.calculateTraitSimilarity(
      moralKeys as unknown as string[],
      traitsA,
      traitsB,
      6,
      3
    );

    const overlap = this.intersectionCount(valuesA, valuesB);
    const valueOverlap = overlap / 10;
    const hasTop3Overlap = this.hasTop3Overlap(valuesA, valuesB);
    const top3Bonus = hasTop3Overlap ? 0.1 : 0;
    const values = Math.min(1, valueOverlap + top3Bonus);

    const total = Number((personality * 0.4 + morality * 0.4 + values * 0.2).toFixed(4));

    return {
      total,
      personality: Number(personality.toFixed(4)),
      morality: Number(morality.toFixed(4)),
      values: Number(values.toFixed(4)),
      top3Bonus: Number(top3Bonus.toFixed(4))
    };
  }

  private timezone() {
    return this.config.get<string>('MATCH_TIMEZONE', 'America/Chicago');
  }

  private getCycleKey(date: Date) {
    const local = dayjs(date).tz(this.timezone());
    return local.day(0).format('YYYY-MM-DD');
  }

  private async maybeRerankWithAI(
    candidates: PairCandidate[],
    vectorByUser: Map<string, { traits?: Record<string, number>; valueSortTop?: string[] }>
  ) {
    const enabled = this.config.get<string>('MATCH_AI_ENABLED', 'false') === 'true';
    const apiKey = this.config.get<string>('MATCH_AI_API_KEY', '');
    if (!enabled || !apiKey || candidates.length === 0) return;

    const topK = this.config.get<number>('MATCH_AI_TOP_K', 300);
    const batchSize = Math.max(1, this.config.get<number>('MATCH_AI_BATCH_SIZE', 20));
    const weight = Math.min(0.5, Math.max(0.05, this.config.get<number>('MATCH_AI_WEIGHT', 0.25)));
    const model = this.config.get<string>('MATCH_AI_MODEL', 'gpt-4o-mini');

    const subset = candidates.slice(0, Math.min(topK, candidates.length));
    for (let i = 0; i < subset.length; i += batchSize) {
      const batch = subset.slice(i, i + batchSize);
      const payload = batch.map((candidate, idx) => {
        const pairId = `${i + idx}`;
        return {
          pairId,
          userA: {
            age: candidate.userA.age,
            school: candidate.userA.school,
            major: (candidate.userA as UserDocument & { major?: string }).major ?? '',
            valuesTop10: vectorByUser.get(candidate.userA.id)?.valueSortTop ?? []
          },
          userB: {
            age: candidate.userB.age,
            school: candidate.userB.school,
            major: (candidate.userB as UserDocument & { major?: string }).major ?? '',
            valuesTop10: vectorByUser.get(candidate.userB.id)?.valueSortTop ?? []
          },
          deterministic: candidate.score,
          traitsA: vectorByUser.get(candidate.userA.id)?.traits ?? {},
          traitsB: vectorByUser.get(candidate.userB.id)?.traits ?? {}
        };
      });

      const aiScores = await this.scoreBatchWithAI(payload, apiKey, model);
      if (aiScores.size === 0) continue;

      for (let offset = 0; offset < batch.length; offset += 1) {
        const pairId = `${i + offset}`;
        const aiScore = aiScores.get(pairId);
        if (typeof aiScore !== 'number') continue;

        const candidate = batch[offset];
        candidate.score.aiRerank = Number(aiScore.toFixed(4));
        candidate.score.total = Number(
          (candidate.score.total * (1 - weight) + candidate.score.aiRerank * weight).toFixed(4)
        );
      }
    }
  }

  private async scoreBatchWithAI(
    batchPayload: Array<Record<string, unknown>>,
    apiKey: string,
    model: string
  ) {
    const timeoutMs = this.config.get<number>('MATCH_AI_TIMEOUT_MS', 12000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You score compatibility pairs. Return strict JSON: {"scores":[{"pairId":"string","aiScore":number}]}. aiScore must be 0..1.'
            },
            {
              role: 'user',
              content: JSON.stringify({
                instructions:
                  'For each pair, output one aiScore between 0 and 1. Prefer similarity in values ranking, moral traits, and big-five compatibility. Do not omit any pairId.',
                pairs: batchPayload
              })
            }
          ]
        })
      });

      if (!response.ok) {
        this.logger.warn(`AI rerank request failed: ${response.status}`);
        return new Map<string, number>();
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) return new Map<string, number>();

      const parsed = this.safeJsonParse(content);
      const list = parsed?.scores;
      if (!Array.isArray(list)) return new Map<string, number>();

      const result = new Map<string, number>();
      for (const item of list) {
        if (!item || typeof item !== 'object') continue;
        const pairId = (item as { pairId?: unknown }).pairId;
        const rawScore = (item as { aiScore?: unknown }).aiScore;
        if (typeof pairId !== 'string' || typeof rawScore !== 'number') continue;
        const normalized = Math.max(0, Math.min(1, rawScore));
        result.set(pairId, normalized);
      }
      return result;
    } catch (error) {
      const isAbort = typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
      this.logger.warn(`AI rerank failed${isAbort ? ' due to timeout' : ''}. Using deterministic scores.`);
      return new Map<string, number>();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private safeJsonParse(input: string): Record<string, unknown> | null {
    try {
      return JSON.parse(input) as Record<string, unknown>;
    } catch {
      const start = input.indexOf('{');
      const end = input.lastIndexOf('}');
      if (start < 0 || end <= start) return null;
      try {
        return JSON.parse(input.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }

  private normalizeGenderValue(input: string) {
    const value = (input ?? '').toLowerCase().trim();
    if (value === 'man' || value === 'male') return 'male';
    if (value === 'woman' || value === 'female') return 'female';
    if (value === 'non_binary' || value === 'non-binary' || value === 'nonbinary') return 'non-binary';
    return 'other';
  }

  private normalizePreferredGenderValues(values: string[]) {
    return values.map((value) => this.normalizeGenderValue(value));
  }

  private calculateTraitSimilarity(
    keys: string[],
    traitsA: Record<string, number>,
    traitsB: Record<string, number>,
    maxDiffPerTrait: number,
    neutralValue: number
  ) {
    let distance = 0;
    for (const key of keys) {
      distance += Math.abs((traitsA[key] ?? neutralValue) - (traitsB[key] ?? neutralValue));
    }
    const maxDistance = keys.length * maxDiffPerTrait;
    if (maxDistance <= 0) return 0;
    return Math.max(0, 1 - distance / maxDistance);
  }

  private intersectionCount(listA: string[], listB: string[]) {
    const setB = new Set(listB);
    return [...new Set(listA)].filter((value) => setB.has(value)).length;
  }

  private hasTop3Overlap(listA: string[], listB: string[]) {
    const topA = new Set(listA.slice(0, 3));
    return listB.slice(0, 3).some((value) => topA.has(value));
  }
}
