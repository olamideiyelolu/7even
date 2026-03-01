import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { QuizDraftPayload, QuizQuestionResponse, QuizQuestionsPayload } from '../types/api';

const BIG_FIVE_LABELS = [
  { value: 1, label: 'Very Inaccurate' },
  { value: 2, label: 'Moderately Inaccurate' },
  { value: 3, label: 'Neither Accurate Nor Inaccurate' },
  { value: 4, label: 'Moderately Accurate' },
  { value: 5, label: 'Very Accurate' }
];

const MORAL_LABELS = [
  { value: 0, label: '0 - Definitely not OK' },
  { value: 1, label: '1 - Mostly not OK' },
  { value: 2, label: '2 - Slightly not OK' },
  { value: 3, label: '3 - No opinion / Neutral' },
  { value: 4, label: '4 - Slightly OK' },
  { value: 5, label: '5 - Mostly OK' },
  { value: 6, label: '6 - Definitely OK' }
];

type ValueStepMode = 'choose' | 'rank';

export function QuizScreen() {
  const { accessToken, markOnboardingComplete, quizStartMode, setQuizStartMode } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestionResponse[]>([]);
  const [valueCards, setValueCards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isValueStep, setIsValueStep] = useState(false);
  const [valueMode, setValueMode] = useState<ValueStepMode>('choose');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [rankedValues, setRankedValues] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const payload = await apiRequest<QuizQuestionsPayload>('/quiz/questions', {}, accessToken ?? undefined);
        setQuestions(payload.questions);
        setValueCards(payload.valueCards);

        if (quizStartMode === 'start_over') {
          await apiRequest('/quiz/draft/clear', { method: 'POST' }, accessToken ?? undefined);
        }

        if (quizStartMode === 'resume') {
          const draft = await apiRequest<QuizDraftPayload | null>('/quiz/draft', {}, accessToken ?? undefined);
          if (draft) {
            const validQuestionIds = new Set(payload.questions.map((q) => q.id));
            const nextAnswers: Record<string, number> = {};
            for (const answer of draft.answers) {
              if (!validQuestionIds.has(answer.questionId)) continue;
              nextAnswers[answer.questionId] = answer.value;
            }
            setAnswers(nextAnswers);
            setIndex(Math.max(0, Math.min(draft.currentIndex, Math.max(0, payload.questions.length - 1))));
            setIsValueStep(draft.isValueStep);
            setValueMode(draft.valueMode);
            setSelectedValues(
              draft.selectedValues.filter((value) => payload.valueCards.includes(value)).slice(0, 10)
            );
            setRankedValues(
              draft.rankedValues.filter((value) => payload.valueCards.includes(value)).slice(0, 10)
            );
          }
        }
      } catch (error) {
        Alert.alert('Could not load quiz', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setQuizStartMode('fresh');
        setLoading(false);
      }
    }
    void load();
  }, [accessToken, quizStartMode, setQuizStartMode]);

  useEffect(() => {
    if (loading || submitting || questions.length === 0) return;

    const saveTimer = setTimeout(() => {
      void apiRequest(
        '/quiz/draft',
        {
          method: 'POST',
          body: JSON.stringify({
            answers: questions
              .map((q) => ({ questionId: q.id, value: answers[q.id] }))
              .filter((answer) => typeof answer.value === 'number'),
            interests: [],
            currentIndex: index,
            isValueStep,
            valueMode,
            selectedValues,
            rankedValues
          })
        },
        accessToken ?? undefined
      ).catch(() => undefined);
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [
    loading,
    submitting,
    questions,
    answers,
    index,
    isValueStep,
    valueMode,
    selectedValues,
    rankedValues,
    accessToken
  ]);

  const current = questions[index];
  const scale = current?.category === 'moral' ? MORAL_LABELS : BIG_FIVE_LABELS;
  const currentValue = current ? answers[current.id] : undefined;
  const canContinueQuestion = typeof currentValue === 'number';
  const canContinueValue = valueMode === 'choose' ? selectedValues.length === 10 : rankedValues.length === 10;
  const totalSteps = questions.length + 2;
  const progress = useMemo(() => {
    if (!isValueStep) return (index + 1) / Math.max(1, totalSteps);
    return valueMode === 'choose' ? (questions.length + 1) / totalSteps : 1;
  }, [isValueStep, valueMode, index, questions.length, totalSteps]);

  const submitQuiz = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await apiRequest(
        '/quiz/responses',
        {
          method: 'POST',
          body: JSON.stringify({
            answers: questions.map((q) => ({ questionId: q.id, value: answers[q.id] })),
            interests: [],
            valueSortTop: rankedValues
          })
        },
        accessToken ?? undefined
      );
      markOnboardingComplete();
    } catch (error) {
      Alert.alert('Quiz submission failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading quiz...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No quiz questions available.</Text>
      </View>
    );
  }

  if (!isValueStep && !current) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quiz state is out of sync. Please restart onboarding.</Text>
      </View>
    );
  }

  const activeQuestion = current!;

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(5, progress * 100)}%` }]} />
      </View>

      {!isValueStep ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Question {index + 1} of {questions.length}</Text>
          <Text style={styles.prompt}>{activeQuestion.prompt}</Text>
          <View style={styles.optionList}>
            {scale.map((opt) => {
              const selected = currentValue === opt.value;
              return (
                <Pressable
                  key={`${activeQuestion.id}-${opt.value}`}
                  style={[styles.option, selected && styles.optionActive]}
                  onPress={() => setAnswers((prev) => ({ ...prev, [activeQuestion.id]: opt.value }))}
                >
                  <Text style={selected ? styles.optionTextActive : styles.optionText}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <PrimaryButton
            label={index === questions.length - 1 ? 'Continue to value sorting' : 'Next'}
            onPress={() => {
              if (index === questions.length - 1) {
                setIsValueStep(true);
              } else {
                setIndex((prev) => prev + 1);
              }
            }}
            disabled={!canContinueQuestion}
          />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Value Sort</Text>
          <Text style={styles.helper}>
            {valueMode === 'choose'
              ? `Choose exactly 10 values from all 50 (${selectedValues.length}/10 selected)`
              : `Rank your selected 10 values from most to least important (${rankedValues.length}/10 ranked)`}
          </Text>
          <View style={styles.optionList}>
            {(valueMode === 'choose' ? valueCards : selectedValues).map((value) => {
              const selected = valueMode === 'choose' ? selectedValues.includes(value) : rankedValues.includes(value);
              const rank = rankedValues.indexOf(value);
              return (
                <Pressable
                  key={value}
                  style={[styles.option, selected && styles.optionActive]}
                  onPress={() => {
                    if (valueMode === 'choose') {
                      setSelectedValues((prev) => {
                        if (prev.includes(value)) return prev.filter((v) => v !== value);
                        if (prev.length >= 10) return prev;
                        return [...prev, value];
                      });
                    } else {
                      setRankedValues((prev) => {
                        if (prev.includes(value)) return prev.filter((v) => v !== value);
                        return [...prev, value];
                      });
                    }
                  }}
                >
                  <Text style={selected ? styles.optionTextActive : styles.optionText}>
                    {valueMode === 'rank' && rank >= 0 ? `${rank + 1}. ${value}` : value}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton
            label={valueMode === 'choose' ? 'Continue to ranking' : submitting ? 'Submitting...' : 'Submit onboarding'}
            onPress={() => {
              if (valueMode === 'choose') {
                setValueMode('rank');
                setRankedValues([]);
              } else {
                void submitQuiz();
              }
            }}
            disabled={!canContinueValue || submitting}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4EE', padding: 20 },
  progressTrack: {
    height: 8,
    backgroundColor: '#D6DBD4',
    borderRadius: 999,
    marginBottom: 16
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1F5F4A'
  },
  scrollContent: {
    paddingBottom: 32
  },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#154734' },
  prompt: {
    fontSize: 18,
    color: '#1E2E27',
    marginBottom: 16
  },
  helper: { marginBottom: 12, color: '#4A4A4A' },
  optionList: { gap: 10, marginBottom: 16 },
  option: {
    borderWidth: 1,
    borderColor: '#B6B6B6',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF'
  },
  optionActive: {
    borderColor: '#154734',
    backgroundColor: '#E8F0EC'
  },
  optionText: {
    color: '#2E2E2E'
  },
  optionTextActive: {
    color: '#154734',
    fontWeight: '700'
  }
});
