import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class QuizDraftAnswerDto {
  @IsString()
  questionId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  value!: number;
}

export class UpsertQuizDraftDto {
  @IsArray()
  @ArrayUnique((answer: QuizDraftAnswerDto) => answer.questionId)
  @ValidateNested({ each: true })
  @Type(() => QuizDraftAnswerDto)
  answers!: QuizDraftAnswerDto[];

  @IsArray()
  @IsString({ each: true })
  interests!: string[];

  @IsInt()
  @Min(0)
  currentIndex!: number;

  @IsBoolean()
  isValueStep!: boolean;

  @IsString()
  @IsIn(['choose', 'rank'])
  valueMode!: 'choose' | 'rank';

  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  selectedValues!: string[];

  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  rankedValues!: string[];
}
