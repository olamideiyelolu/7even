import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { ui } from '../theme/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Front'>;

export function FrontScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topRule} />
      <View style={styles.hero}>
        <Text style={styles.logo}>7even</Text>
        <Text style={styles.tagline}>THE SCHOLASTIC DATE ENGINE</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryButtonText}>LOG IN</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ui.color.bg,
    paddingHorizontal: ui.spacing.lg,
    justifyContent: 'space-between'
  },
  topRule: {
    marginTop: ui.spacing.xs,
    height: 7,
    backgroundColor: ui.color.topRule,
    marginHorizontal: -ui.spacing.lg
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    color: ui.color.textPrimary,
    fontSize: 72,
    fontWeight: '800'
  },
  tagline: {
    color: ui.color.accent,
    marginTop: 8,
    letterSpacing: 2.8,
    fontSize: 12,
    fontWeight: '700'
  },
  actions: {
    paddingBottom: ui.spacing.xxl
  },
  primaryButton: {
    height: ui.button.height,
    borderRadius: ui.radius.lg,
    backgroundColor: ui.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...ui.shadow.strong
  },
  secondaryButton: {
    marginTop: ui.spacing.sm,
    height: ui.button.height,
    borderRadius: ui.radius.lg,
    backgroundColor: ui.color.accent,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: ui.color.textOnPrimary,
    fontSize: ui.button.textSize,
    letterSpacing: ui.button.letterSpacing,
    fontWeight: '800'
  },
  secondaryButtonText: {
    color: ui.color.textOnPrimary,
    fontSize: ui.button.textSize,
    letterSpacing: ui.button.letterSpacing,
    fontWeight: '800'
  }
});
