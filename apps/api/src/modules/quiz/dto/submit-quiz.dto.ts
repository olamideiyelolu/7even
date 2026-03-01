import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class QuizAnswerDto {
  @IsString()
  questionId!: string;

  @IsInt()
  @Min(0)
  @Max(6)
  value!: number;
}

export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((answer: QuizAnswerDto) => answer.questionId)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];

  @IsArray()
  @IsString({ each: true })
  interests!: string[];

  @IsArray()
  @ArrayMinSize(10)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  valueSortTop!: string[];
}
