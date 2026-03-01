import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { QuizIntroScreen } from './src/screens/QuizIntroScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { MatchScreen } from './src/screens/MatchScreen';
import { ChatScreen } from './src/screens/ChatScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  QuizIntro: undefined;
  Quiz: undefined;
  Match: undefined;
  Chat: { matchId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { accessToken, onboardingComplete, quizIntroAccepted } = useAuth();

  return (
    <Stack.Navigator>
      {!accessToken ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : !onboardingComplete && !quizIntroAccepted ? (
        <Stack.Screen name="QuizIntro" component={QuizIntroScreen} options={{ headerShown: false }} />
      ) : !onboardingComplete ? (
        <Stack.Screen name="Quiz" component={QuizScreen} />
      ) : (
        <>
          <Stack.Screen name="Match" component={MatchScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
