import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength
} from 'class-validator';

const ORIENTATIONS = ['straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 'queer', 'asexual', 'other'] as const;
const GENDERS = ['man', 'woman', 'non_binary', 'other'] as const;
const SCHOOL_YEARS = ['freshman', 'sophomore', 'junior', 'senior', 'graduate'] as const;
const CTA_LINES = ['Red Line', 'Brown Line', 'Purple Line', 'Green Line', 'Blue Line', 'Orange Line', 'Metra', 'Bus', 'I Drive'] as const;
const PRONOUNS = ['he/him', 'she/her', 'they/them', 'other'] as const;

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  fullName!: string;

  @IsInt()
  @Min(18)
  @Max(99)
  age!: number;

  @IsDateString()
  dateOfBirth!: string;

  @IsOptional()
  @IsString()
  school!: string;

  @IsString()
  major!: string;

  @IsString()
  @IsIn(SCHOOL_YEARS)
  schoolYear!: (typeof SCHOOL_YEARS)[number];

  @IsString()
  @IsIn(GENDERS)
  gender!: (typeof GENDERS)[number];

  @IsString()
  @IsIn(ORIENTATIONS)
  orientation!: (typeof ORIENTATIONS)[number];

  @IsString()
  @IsIn(PRONOUNS)
  pronouns!: (typeof PRONOUNS)[number];

  @IsString()
  profilePhotoUrl!: string;

  @IsOptional()
  @IsString()
  @IsIn(CTA_LINES)
  ctaLine?: (typeof CTA_LINES)[number];

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(GENDERS, { each: true })
  preferredGenders!: Array<(typeof GENDERS)[number]>;

  @IsInt()
  @Min(18)
  preferredAgeMin!: number;

  @IsInt()
  @Max(99)
  preferredAgeMax!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];
}
