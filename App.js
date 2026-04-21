import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { initDB, loadWordsFromJSON, getSetting } from './src/database/db';

import SetupScreen    from './src/screens/SetupScreen';
import HomeScreen     from './src/screens/HomeScreen';
import StudyScreen    from './src/screens/StudyScreen';
import StatsScreen    from './src/screens/StatsScreen';
import WordListScreen from './src/screens/WordListScreen';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs() {
  const { colors: c, resolvedScheme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const map = {
            Home:     focused ? 'home'      : 'home-outline',
            Stats:    focused ? 'bar-chart' : 'bar-chart-outline',
            WordList: focused ? 'book'      : 'book-outline',
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor:   c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopColor:  c.tabBorder,
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ title: '首页' }} />
      <Tab.Screen name="Stats"    component={StatsScreen}    options={{ title: '统计' }} />
      <Tab.Screen name="WordList" component={WordListScreen} options={{ title: '单词库' }} />
    </Tab.Navigator>
  );
}

function RootNavigator({ hasSetup }) {
  const { colors: c, resolvedScheme } = useTheme();

  const navTheme = resolvedScheme === 'dark'
    ? { ...DarkTheme,    colors: { ...DarkTheme.colors,    background: c.bg, card: c.card, border: c.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: c.bg, card: c.card, border: c.border } };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={c.statusBar} />
      <Stack.Navigator
        initialRouteName={hasSetup ? 'Main' : 'Setup'}
        screenOptions={{ headerShown: false, animationEnabled: true }}
      >
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Main"  component={MainTabs} />
        <Stack.Screen
          name="Study"
          component={StudyScreen}
          options={{ presentation: 'card', gestureEnabled: true }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppContent() {
  const { colors: c } = useTheme();
  const [ready, setReady]       = useState(false);
  const [hasSetup, setHasSetup] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await initDB();
        await loadWordsFromJSON();
        const dailyCount = await getSetting('daily_count');
        setHasSetup(!!dailyCount);
      } catch (e) {
        console.error('Init error:', e);
        setInitError(e.message);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={[styles.splash, { backgroundColor: c.bg }]}>
        <Text style={styles.splashIcon}>📖</Text>
        <Text style={[styles.splashTitle, { color: c.text }]}>墨墨背单词</Text>
        <ActivityIndicator size="large" color={c.primary} style={{ marginTop: 32 }} />
        <Text style={[styles.splashSub, { color: c.textMuted }]}>加载词库中…</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={[styles.splash, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.danger, fontSize: 16, textAlign: 'center', padding: 32 }}>
          启动失败：{initError}
        </Text>
      </View>
    );
  }

  return <RootNavigator hasSetup={hasSetup} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashIcon:  { fontSize: 64, marginBottom: 8 },
  splashTitle: { fontSize: 24, fontWeight: '700' },
  splashSub:   { fontSize: 14, marginTop: 10 },
});
