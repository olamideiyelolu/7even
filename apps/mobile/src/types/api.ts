export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface MatchResponse {
  _id: string;
  userA: string;
  userB: string;
  status: string;
  expiresAt: string;
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
