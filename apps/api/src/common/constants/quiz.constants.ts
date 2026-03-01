import rawBigFiveQuestions from './bigfive/questions';
import { QuizQuestion } from '../interfaces/quiz.interface';

type BigFiveDomain = 'O' | 'C' | 'E' | 'A' | 'N';

type RawBigFiveQuestion = {
  id: string;
  text: string;
  keyed: 'plus' | 'minus';
  domain: BigFiveDomain;
  facet: number;
};

const DOMAIN_TO_AXIS: Record<BigFiveDomain, string> = {
  O: 'openness',
  C: 'conscientiousness',
  E: 'extraversion',
  A: 'agreeableness',
  N: 'neuroticism'
};

type MoralTrait = 'care' | 'fairness' | 'liberty' | 'loyalty' | 'authority' | 'sanctity';

const IDR_MORALITY_QUESTIONS: Array<{
  id: string;
  prompt: string;
  axis: MoralTrait;
  keyed: 'plus' | 'minus';
}> = [
  { id: 'idrlabs-morality6-1', prompt: 'Amy and Mia are coworkers in the same office. They are both married, but they start having a secret affair.', axis: 'care', keyed: 'plus' },
  { id: 'idrlabs-morality6-2', prompt: 'A person says that sports stars earn a lot more than nurses because they have to work much harder to become successful.', axis: 'fairness', keyed: 'plus' },
  { id: 'idrlabs-morality6-3', prompt: 'Adam is caught by an automated speed camera and receives a fine in the post for speeding.', axis: 'liberty', keyed: 'plus' },
  { id: 'idrlabs-morality6-4', prompt: 'A Catholic school in New York starts each day with Christian prayer over the loudspeaker.', axis: 'loyalty', keyed: 'plus' },
  { id: 'idrlabs-morality6-5', prompt: 'Barbara yells at her partner for voting for the political opposition in an election.', axis: 'authority', keyed: 'plus' },
  { id: 'idrlabs-morality6-6', prompt: 'Richard says that all races and cultures are equally capable in all areas.', axis: 'sanctity', keyed: 'plus' },
  { id: 'idrlabs-morality6-7', prompt: 'Nick is approached by an old homeless man asking for money. Nick keeps walking and avoids eye contact.', axis: 'care', keyed: 'minus' },
  { id: 'idrlabs-morality6-8', prompt: 'Someone says that Black people generally have lower IQ than White people.', axis: 'fairness', keyed: 'plus' },
  { id: 'idrlabs-morality6-9', prompt: 'Harry receives treatment from an experimental physician using dangerous methods not approved by regulators.', axis: 'liberty', keyed: 'plus' },
  { id: 'idrlabs-morality6-10', prompt: "A man puts down his country's flag while authorities and passers-by watch.", axis: 'loyalty', keyed: 'plus' },
  { id: 'idrlabs-morality6-11', prompt: 'An elderly woman is taken off life support by doctors after a request from her family.', axis: 'authority', keyed: 'plus' },
  { id: 'idrlabs-morality6-12', prompt: 'Your younger brother starts sleeping around with many women in his neighborhood.', axis: 'sanctity', keyed: 'plus' },
  { id: 'idrlabs-morality6-13', prompt: 'A woman keeps trying to seduce a married friend, despite seeing how upset it makes his wife.', axis: 'care', keyed: 'plus' },
  { id: 'idrlabs-morality6-14', prompt: "Someone says that the Holocaust wasn't as bad as many people suggest.", axis: 'fairness', keyed: 'plus' },
  { id: 'idrlabs-morality6-15', prompt: 'An English museum acquires an ancient artifact, knowing that it had been smuggled out from another country on the black market.', axis: 'liberty', keyed: 'plus' },
  { id: 'idrlabs-morality6-16', prompt: 'A man in a crowd slaps a protestor who is carrying a sign criticizing his nation.', axis: 'loyalty', keyed: 'plus' },
  { id: 'idrlabs-morality6-17', prompt: "Sarah shouts at the school principal in front of all her son's classmates.", axis: 'authority', keyed: 'plus' },
  { id: 'idrlabs-morality6-18', prompt: 'A man says that homosexuality is acceptable and should not be judged.', axis: 'sanctity', keyed: 'plus' },
  { id: 'idrlabs-morality6-19', prompt: "John starts dating his ex-wife's good friend just a few days after the divorce.", axis: 'care', keyed: 'plus' },
  { id: 'idrlabs-morality6-20', prompt: 'A man says that women are naturally not as smart as men and should stay out of academia and politics.', axis: 'fairness', keyed: 'plus' },
  { id: 'idrlabs-morality6-21', prompt: 'An old monument in your city has become badly damaged and covered in graffiti over many years due to city neglect.', axis: 'liberty', keyed: 'plus' },
  { id: 'idrlabs-morality6-22', prompt: "Nathan is accused of not standing during his country's national anthem.", axis: 'loyalty', keyed: 'plus' },
  { id: 'idrlabs-morality6-23', prompt: "A teacher tells his pupils that they don't need to obey their parents.", axis: 'authority', keyed: 'plus' },
  { id: 'idrlabs-morality6-24', prompt: 'Debra starts refusing to wear a bra in public, saying that she should not have to hide her body.', axis: 'sanctity', keyed: 'plus' },
  { id: 'idrlabs-morality6-25', prompt: 'Bob finds a wallet in a department store changing room and keeps it rather than handing it in.', axis: 'care', keyed: 'minus' },
  { id: 'idrlabs-morality6-26', prompt: 'A student says that men and women should have equal rights, but Black people should not.', axis: 'fairness', keyed: 'plus' },
  { id: 'idrlabs-morality6-27', prompt: 'Greg is allowed to use hard drugs recreationally under a new law designed to legalize all personal drug use.', axis: 'liberty', keyed: 'plus' },
  { id: 'idrlabs-morality6-28', prompt: 'An American takes the Confederate flag to a political march.', axis: 'loyalty', keyed: 'plus' },
  { id: 'idrlabs-morality6-29', prompt: 'Ethan addresses his university professor by first name in class.', axis: 'authority', keyed: 'plus' },
  { id: 'idrlabs-morality6-30', prompt: 'Jennifer says no one should postpone sex until marriage and people should stop seeing it as special.', axis: 'sanctity', keyed: 'plus' },
  { id: 'idrlabs-morality6-31', prompt: "Tim asks a waitress to make change for him but doesn't buy anything.", axis: 'care', keyed: 'minus' },
  { id: 'idrlabs-morality6-32', prompt: 'A restaurant refuses to hire Muslim staff, saying it goes against their beliefs.', axis: 'fairness', keyed: 'plus' },
  { id: 'idrlabs-morality6-33', prompt: 'A physician begins practicing medicine in his community despite not being licensed to do so.', axis: 'liberty', keyed: 'plus' },
  { id: 'idrlabs-morality6-34', prompt: "Jerry doesn't salute his country's flag when everyone around him does.", axis: 'loyalty', keyed: 'plus' },
  { id: 'idrlabs-morality6-35', prompt: 'Eli asks his elderly father to spend his inheritance on gambling and casino trips.', axis: 'authority', keyed: 'plus' },
  { id: 'idrlabs-morality6-36', prompt: 'Liana says there is nothing morally wrong with incest between consenting family members if no one gets hurt.', axis: 'sanctity', keyed: 'plus' }
];

export const BIG_FIVE_QUESTIONS: QuizQuestion[] = (rawBigFiveQuestions as RawBigFiveQuestion[]).map((q) => ({
  id: q.id,
  prompt: q.text,
  axis: DOMAIN_TO_AXIS[q.domain],
  category: 'big_five',
  type: 'likert',
  keyed: q.keyed,
  domain: q.domain,
  facet: q.facet
}));

export const MORAL_QUESTIONS: QuizQuestion[] = IDR_MORALITY_QUESTIONS.map((q) => ({
  id: q.id,
  prompt: q.prompt,
  axis: q.axis,
  category: 'moral',
  type: 'likert',
  keyed: q.keyed
}));

export const QUIZ_QUESTIONS: QuizQuestion[] = [...BIG_FIVE_QUESTIONS, ...MORAL_QUESTIONS];

export const BIG_FIVE_TRAITS = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism'
] as const;

export const BIG_FIVE_QUESTIONS_PER_TRAIT = 8;

export const VALUE_CARDS_50 = [
  'Compassion',
  'Honesty',
  'Family',
  'Friendship',
  'Growth',
  'Creativity',
  'Achievement',
  'Adventure',
  'Stability',
  'Service',
  'Faith',
  'Health',
  'Independence',
  'Justice',
  'Curiosity',
  'Discipline',
  'Respect',
  'Reliability',
  'Learning',
  'Leadership',
  'Humility',
  'Generosity',
  'Patience',
  'Kindness',
  'Forgiveness',
  'Self-Respect',
  'Accountability',
  'Authenticity',
  'Balance',
  'Courage',
  'Playfulness',
  'Community',
  'Security',
  'Freedom',
  'Open-Mindedness',
  'Excellence',
  'Fairness',
  'Empathy',
  'Loyalty',
  'Purpose',
  'Mindfulness',
  'Gratitude',
  'Ambition',
  'Wisdom',
  'Hope',
  'Presence',
  'Connection',
  'Responsibility',
  'Recognition',
  'Peace'
] as const;

export const INTEREST_TAGS = [
  'coffee',
  'foodie',
  'sports',
  'art',
  'music',
  'outdoors',
  'gaming',
  'comedy',
  'nightlife',
  'books'
] as const;
