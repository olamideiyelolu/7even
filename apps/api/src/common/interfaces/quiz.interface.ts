export interface QuizQuestion {
  id: string;
  prompt: string;
  axis: string;
  category: 'big_five' | 'moral';
  type: 'likert';
  keyed: 'plus' | 'minus';
  domain?: 'O' | 'C' | 'E' | 'A' | 'N';
  facet?: number;
}
