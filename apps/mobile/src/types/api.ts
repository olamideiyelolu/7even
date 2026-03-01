export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    school?: string;
    major?: string;
    schoolYear?: string;
    age?: number;
    profilePhotoUrl?: string;
    ctaLine?: string;
    pronouns?: 'he/him' | 'she/her' | 'they/them' | 'other';
  };
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  school: string;
  major?: string;
  schoolYear?: string;
  age: number;
  profilePhotoUrl?: string;
  ctaLine?: string;
  pronouns?: 'he/him' | 'she/her' | 'they/them' | 'other';
}

export interface MatchResponse {
  _id: string;
  userA: string;
  userB: string;
  status: string;
  expiresAt: string;
  matchedWith?: {
    id: string;
    fullName: string;
    school?: string;
    major?: string;
    profilePhotoUrl?: string;
  } | null;
  score?: {
    total: number;
    personality: number;
    morality: number;
    values: number;
    top3Bonus: number;
    aiRerank?: number;
  };
}

export interface QuizQuestionResponse {
  id: string;
  prompt: string;
  axis: string;
  category: 'big_five' | 'moral';
  type: 'likert';
}

export interface QuizQuestionsPayload {
  questions: QuizQuestionResponse[];
  valueCards: string[];
}

export interface QuizDraftAnswer {
  questionId: string;
  value: number;
}

export interface QuizDraftPayload {
  answers: QuizDraftAnswer[];
  interests: string[];
  currentIndex: number;
  isValueStep: boolean;
  valueMode: 'choose' | 'rank';
  selectedValues: string[];
  rankedValues: string[];
  updatedAt?: string;
}
