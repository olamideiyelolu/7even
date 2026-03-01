import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator';

const CTA_LINES = ['Red Line', 'Brown Line', 'Purple Line', 'Green Line', 'Blue Line', 'Orange Line', 'Metra', 'Bus', 'I Drive'] as const;
const PRONOUNS = ['he/him', 'she/her', 'they/them', 'other'] as const;

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  school?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  schoolYear?: string;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(99)
  age?: number;

  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(CTA_LINES)
  ctaLine?: (typeof CTA_LINES)[number];

  @IsOptional()
  @IsString()
  @IsIn(PRONOUNS)
  pronouns?: (typeof PRONOUNS)[number];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredGenders?: string[];

  @IsOptional()
  @IsInt()
  @Min(18)
  preferredAgeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(99)
  preferredAgeMax?: number;
}
