import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { initDB, loadWordsFromJSON, getSetting } from './src/database/db';

import SetupScreen from './src/screens/SetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import StudyScreen from './src/screens/StudyScreen';
import StatsScreen from './src/screens/StatsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Stats: focused ? 'bar-chart' : 'bar-chart-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2ed573',
        tabBarInactiveTintColor: '#bbb',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: '统计' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
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
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>📖</Text>
        <Text style={styles.splashText}>墨墨背单词</Text>
        <ActivityIndicator size="large" color="#2ed573" style={{ marginTop: 32 }} />
        <Text style={styles.splashSub}>加载词库中…</Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.splash}>
        <Text style={{ color: '#ff7675', fontSize: 16, textAlign: 'center', padding: 32 }}>
          启动失败：{initError}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
          {!hasSetup ? (
            <Stack.Screen name="Setup" component={SetupScreen} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="Study"
                component={StudyScreen}
                options={{ presentation: 'card', gestureEnabled: true }}
              />
              <Stack.Screen
                name="Setup"
                component={SetupScreen}
                options={{ presentation: 'modal' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashTitle: { fontSize: 64, marginBottom: 8 },
  splashText: { fontSize: 24, fontWeight: '700', color: '#222' },
  splashSub: { fontSize: 14, color: '#aaa', marginTop: 10 },
});
