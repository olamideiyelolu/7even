import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BIG_FIVE_QUESTIONS,
  BIG_FIVE_QUESTIONS_PER_TRAIT,
  BIG_FIVE_TRAITS,
  MORAL_QUESTIONS_PER_TRAIT,
  MORAL_QUESTIONS,
  MORAL_TRAITS,
  QUIZ_QUESTIONS,
  VALUE_CARDS_50
} from '../../common/constants/quiz.constants';
import { QuizQuestion } from '../../common/interfaces/quiz.interface';
import { UsersService } from '../users/users.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpsertQuizDraftDto } from './dto/upsert-quiz-draft.dto';
import {
  QuizSubmission,
  QuizSubmissionDocument
} from './schemas/quiz-submission.schema';
import {
  CompatibilityVector,
  CompatibilityVectorDocument
} from './schemas/compatibility-vector.schema';
import { QuizDraft, QuizDraftDocument } from './schemas/quiz-draft.schema';

@Injectable()
export class QuizService {
  constructor(
    @InjectModel(QuizSubmission.name)
    private readonly submissionModel: Model<QuizSubmissionDocument>,
    @InjectModel(CompatibilityVector.name)
    private readonly vectorModel: Model<CompatibilityVectorDocument>,
    @InjectModel(QuizDraft.name)
    private readonly draftModel: Model<QuizDraftDocument>,
    private readonly usersService: UsersService
  ) {}

  getQuestions(userId: string) {
    const seededBigFive = BIG_FIVE_TRAITS.flatMap((trait) => {
      return BIG_FIVE_QUESTIONS
        .filter((q) => q.axis === trait)
        .sort((a, b) => this.stableHash(`${userId}:${a.id}`) - this.stableHash(`${userId}:${b.id}`))
        .slice(0, BIG_FIVE_QUESTIONS_PER_TRAIT);
    });

    const seededMoral = MORAL_TRAITS.flatMap((trait) => {
      return MORAL_QUESTIONS
        .filter((q) => q.axis === trait)
        .sort((a, b) => this.stableHash(`${userId}:${a.id}`) - this.stableHash(`${userId}:${b.id}`))
        .slice(0, MORAL_QUESTIONS_PER_TRAIT);
    });

    const questions = [...seededBigFive, ...seededMoral];
    return {
      questions,
      valueCards: VALUE_CARDS_50
    };
  }

  async submitResponses(userId: string, dto: SubmitQuizDto) {
    this.validateSubmission(dto.answers, dto.valueSortTop);

    const submission = await this.submissionModel.create({
      userId: new Types.ObjectId(userId),
      answers: dto.answers,
      interests: dto.interests,
      valueSortTop: dto.valueSortTop
    });

    const traits = this.computeTraits(dto.answers);

    await this.vectorModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        userId: new Types.ObjectId(userId),
        traits,
        interests: dto.interests,
        valueSortTop: dto.valueSortTop,
        version: 1
      },
      { upsert: true, new: true }
    );

    await this.usersService.updateMe(userId, { interests: dto.interests });
    await this.clearDraft(userId);

    return {
      submissionId: submission.id,
      traits,
      interests: dto.interests,
      valueSortTop: dto.valueSortTop
    };
  }

  async getResult(userId: string) {
    const vector = await this.vectorModel.findOne({ userId: new Types.ObjectId(userId) });
    return {
      traits: vector?.traits ?? {},
      interests: vector?.interests ?? [],
      valueSortTop: vector?.valueSortTop ?? []
    };
  }

  async getDraft(userId: string) {
    const draft = await this.draftModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!draft) return null;

    return {
      answers: draft.answers,
      interests: draft.interests,
      currentIndex: draft.currentIndex,
      isValueStep: draft.isValueStep,
      valueMode: draft.valueMode,
      selectedValues: draft.selectedValues,
      rankedValues: draft.rankedValues,
      updatedAt: draft.updatedAt
    };
  }

  async upsertDraft(userId: string, dto: UpsertQuizDraftDto) {
    this.validateDraft(dto);

    await this.draftModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        userId: new Types.ObjectId(userId),
        answers: dto.answers,
        interests: dto.interests,
        currentIndex: dto.currentIndex,
        isValueStep: dto.isValueStep,
        valueMode: dto.valueMode,
        selectedValues: dto.selectedValues,
        rankedValues: dto.rankedValues
      },
      { upsert: true, new: true }
    );

    return { saved: true };
  }

  async clearDraft(userId: string) {
    await this.draftModel.deleteOne({ userId: new Types.ObjectId(userId) });
    return { cleared: true };
  }

  async getAllVectors() {
    return this.vectorModel.find();
  }

  async getVectorByUserId(userId: string) {
    return this.vectorModel.findOne({ userId: new Types.ObjectId(userId) });
  }

  private computeTraits(answers: Array<{ questionId: string; value: number }>) {
    const lookup = new Map(QUIZ_QUESTIONS.map((q) => [q.id, q]));
    const traits: Record<string, number[]> = {};

    for (const answer of answers) {
      const question = lookup.get(answer.questionId);
      if (!question) continue;

      const score = this.normalizeAnswer(question, answer.value);
      if (!traits[question.axis]) traits[question.axis] = [];
      traits[question.axis].push(score);
    }

    return Object.fromEntries(
      Object.entries(traits).map(([axis, values]) => [
        axis,
        Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(3))
      ])
    );
  }

  private normalizeAnswer(question: QuizQuestion, value: number) {
    if (question.category === 'moral') {
      return question.keyed === 'minus' ? value : 6 - value;
    }
    return question.keyed === 'minus' ? 6 - value : value;
  }

  private validateSubmission(
    answers: Array<{ questionId: string; value: number }>,
    valueSortTop: string[]
  ) {
    const lookup = new Map(QUIZ_QUESTIONS.map((q) => [q.id, q]));
    const seenQuestionIds = new Set<string>();

    for (const answer of answers) {
      if (seenQuestionIds.has(answer.questionId)) {
        throw new BadRequestException(`Duplicate answer submitted for question ${answer.questionId}.`);
      }
      seenQuestionIds.add(answer.questionId);

      const question = lookup.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(`Unknown question id: ${answer.questionId}.`);
      }

      if (question.category === 'big_five' && (answer.value < 1 || answer.value > 5)) {
        throw new BadRequestException(`Big Five question ${answer.questionId} requires a value from 1 to 5.`);
      }
      if (question.category === 'moral' && (answer.value < 0 || answer.value > 6)) {
        throw new BadRequestException(`Moral question ${answer.questionId} requires a value from 0 to 6.`);
      }
    }

    const allowedValues = new Set<string>(VALUE_CARDS_50 as readonly string[]);
    const seenValues = new Set<string>();
    for (const value of valueSortTop) {
      if (!allowedValues.has(value)) {
        throw new BadRequestException(`Unknown value card: ${value}.`);
      }
      if (seenValues.has(value)) {
        throw new BadRequestException('Duplicate values are not allowed in valueSortTop.');
      }
      seenValues.add(value);
    }
  }

  private validateDraft(dto: UpsertQuizDraftDto) {
    const lookup = new Map(QUIZ_QUESTIONS.map((q) => [q.id, q]));
    for (const answer of dto.answers) {
      const question = lookup.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(`Unknown question id: ${answer.questionId}.`);
      }
      if (question.category === 'big_five' && (answer.value < 1 || answer.value > 5)) {
        throw new BadRequestException(`Big Five question ${answer.questionId} requires a value from 1 to 5.`);
      }
      if (question.category === 'moral' && (answer.value < 0 || answer.value > 6)) {
        throw new BadRequestException(`Moral question ${answer.questionId} requires a value from 0 to 6.`);
      }
    }

    const allowedValues = new Set<string>(VALUE_CARDS_50 as readonly string[]);
    for (const value of dto.selectedValues) {
      if (!allowedValues.has(value)) {
        throw new BadRequestException(`Unknown value card: ${value}.`);
      }
    }
    for (const value of dto.rankedValues) {
      if (!allowedValues.has(value)) {
        throw new BadRequestException(`Unknown value card: ${value}.`);
      }
      if (!dto.selectedValues.includes(value) && dto.valueMode === 'rank') {
        throw new BadRequestException(`Ranked value must be in selected values: ${value}.`);
      }
    }
  }

  private stableHash(input: string) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
}
