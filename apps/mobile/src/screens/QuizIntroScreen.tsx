import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { QuizDraftPayload } from '../types/api';
import { ui } from '../theme/ui';

export function QuizIntroScreen() {
  const { accessToken, acceptQuizIntro, setQuizStartMode, logout } = useAuth();
  const [checkingDraft, setCheckingDraft] = useState(false);
  const [hasDraftToResume, setHasDraftToResume] = useState(false);

  const handleContinue = async () => {
    if (checkingDraft) return;
    setCheckingDraft(true);
    try {
      const draft = await apiRequest<QuizDraftPayload | null>('/quiz/draft', {}, accessToken ?? undefined);
      const hasDraft =
        !!draft &&
        (draft.currentIndex > 0 ||
          draft.answers.length > 0 ||
          draft.isValueStep ||
          draft.selectedValues.length > 0 ||
          draft.rankedValues.length > 0);

      if (!hasDraft) {
        setQuizStartMode('fresh');
        acceptQuizIntro();
        return;
      }
      setHasDraftToResume(true);
    } catch {
      setQuizStartMode('fresh');
      acceptQuizIntro();
    } finally {
      setCheckingDraft(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRule} />
      <Text style={styles.kicker}>ONBOARDING</Text>
      <Text style={styles.title}>Before You Start</Text>
      <Text style={styles.message}>
        The personality and values test takes approximately 15 minutes. You can save progress if you do not finish.
        {'\n\n'}
        Do you want to continue?
      </Text>

      {hasDraftToResume ? (
        <>
          <Text style={styles.notice}>You already started this quiz. Resume where you left off.</Text>
          <PrimaryButton
            label="Resume"
            onPress={() => {
              setQuizStartMode('resume');
              acceptQuizIntro();
            }}
          />
          <PrimaryButton label="Not now" variant="secondary" onPress={logout} />
        </>
      ) : (
        <>
          <PrimaryButton label={checkingDraft ? 'Checking...' : 'Continue'} onPress={() => void handleContinue()} disabled={checkingDraft} />
          <PrimaryButton label="Not now" variant="secondary" onPress={logout} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: ui.spacing.lg,
    justifyContent: 'center',
    backgroundColor: ui.color.bg
  },
  topRule: {
    position: 'absolute',
    top: ui.spacing.xs,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: ui.color.topRule
  },
  kicker: {
    color: ui.color.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: ui.spacing.sm
  },
  title: {
    fontSize: ui.type.heading,
    fontWeight: '800',
    marginBottom: ui.spacing.md,
    color: ui.color.textPrimary
  },
  message: {
    fontSize: ui.type.body,
    lineHeight: 24,
    color: ui.color.textSecondary,
    marginBottom: ui.spacing.lg
  },
  notice: {
    color: ui.color.successText,
    backgroundColor: ui.color.successBg,
    borderRadius: ui.radius.md,
    padding: ui.spacing.sm,
    marginBottom: ui.spacing.md,
    fontWeight: '600'
  }
});
