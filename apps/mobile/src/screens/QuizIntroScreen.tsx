import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { QuizDraftPayload } from '../types/api';

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
      <Text style={styles.title}>Before You Start</Text>
      <Text style={styles.message}>
        The personality/values test takes approximately 15 minutes. You can save your progress if you do not finish.
        {'\n'}
        {'\n'}
        Do you want to continue?
      </Text>
      {hasDraftToResume ? (
        <>
          <Text style={styles.notice}>You already started this quiz. Please resume where you left off.</Text>
          <PrimaryButton
            label="Resume"
            onPress={() => {
              setQuizStartMode('resume');
              acceptQuizIntro();
            }}
          />
          <PrimaryButton label="Not now" onPress={logout} />
        </>
      ) : (
        <>
          <PrimaryButton label={checkingDraft ? 'Checking...' : 'Continue'} onPress={() => void handleContinue()} disabled={checkingDraft} />
          <PrimaryButton label="Not now" onPress={logout} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F6F4EE'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#154734'
  },
  message: {
    fontSize: 18,
    lineHeight: 28,
    color: '#1E2E27',
    marginBottom: 20
  },
  notice: {
    color: '#154734',
    marginBottom: 12,
    fontWeight: '600'
  }
});
