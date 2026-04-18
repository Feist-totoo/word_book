import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTodayProgress, getPlanInfo, resetPlan } from '../database/db';
import { getToday, formatDate } from '../utils/dateUtils';

export default function HomeScreen({ navigation }) {
  const [progress, setProgress] = useState({ total: 0, done: 0, retries: 0 });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const [p, info] = await Promise.all([getTodayProgress(), getPlanInfo()]);
    setProgress(p);
    setPlan(info);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { reload(); }, []));

  const allDone = !loading && progress.done >= progress.total && progress.total > 0 && progress.retries === 0;
  const pct = progress.total > 0 ? Math.min(1, progress.done / progress.total) : 0;

  const handleReset = () => {
    Alert.alert(
      '重置进度',
      '将清除所有学习记录并重新开始，确定吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            await resetPlan();
            navigation.reset({ index: 0, routes: [{ name: 'Setup' }] });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>📖 今日学习</Text>
          <Text style={styles.dateText}>{formatDate(getToday())}</Text>
        </View>

        {/* Today's progress card */}
        <View style={styles.card}>
          {allDone ? (
            <View style={styles.doneBox}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={styles.doneTitle}>今天打卡完成！</Text>
              <Text style={styles.doneSub}>明天继续加油</Text>
            </View>
          ) : (
            <>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>今日进度</Text>
                <Text style={styles.progressFraction}>
                  <Text style={styles.progressDone}>{progress.done}</Text>
                  {' / '}
                  {progress.total}
                  {progress.retries > 0 && (
                    <Text style={styles.retryBadge}> +{progress.retries}复习</Text>
                  )}
                </Text>
              </View>
              {/* Progress bar */}
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
              </View>
              <Text style={styles.remaining}>
                还剩 <Text style={styles.accent}>{progress.total - progress.done + progress.retries}</Text> 个单词
              </Text>

              <TouchableOpacity
                style={styles.studyBtn}
                onPress={() => navigation.navigate('Study')}
              >
                <Text style={styles.studyBtnText}>开始学习 →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Plan overview */}
        {plan && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>学习计划</Text>
            <View style={styles.statsRow}>
              <StatBox label="每日目标" value={plan.dailyCount} unit="词" color="#2ed573" />
              <StatBox label="剩余新词" value={plan.newCount} unit="个" color="#74b9ff" />
              <StatBox label="预计完成" value={plan.estimatedDays} unit="天" color="#ffa502" />
            </View>
            <View style={styles.divider} />
            <View style={styles.statusRow}>
              <StatusDot color="#dfe6e9" label="待学习" count={plan.newCount} />
              <StatusDot color="#ffa502" label="学习中" count={plan.learningCount} />
              <StatusDot color="#2ed573" label="已掌握" count={plan.knownCount} />
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>设置</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('Setup', { reset: true })}
          >
            <Text style={styles.settingText}>修改每日学习数量</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingItem} onPress={handleReset}>
            <Text style={[styles.settingText, { color: '#ff7675' }]}>重置所有进度</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, unit, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusDot({ color, label, count }) {
  return (
    <View style={styles.dotRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.dotLabel}>{label}</Text>
      <Text style={styles.dotCount}>{count ?? 0}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  scroll: { padding: 16, paddingBottom: 32 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#222' },
  dateText: { fontSize: 13, color: '#aaa' },
  accent: { color: '#2ed573', fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 14, color: '#aaa', fontWeight: '600', marginBottom: 16, letterSpacing: 0.5 },

  doneBox: { alignItems: 'center', paddingVertical: 12 },
  doneEmoji: { fontSize: 48, marginBottom: 10 },
  doneTitle: { fontSize: 22, fontWeight: '700', color: '#2ed573', marginBottom: 4 },
  doneSub: { fontSize: 15, color: '#aaa' },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontSize: 14, color: '#aaa' },
  progressFraction: { fontSize: 15, color: '#333' },
  progressDone: { fontSize: 22, fontWeight: '700', color: '#2ed573' },
  retryBadge: { fontSize: 12, color: '#ffa502', fontWeight: '600' },

  barBg: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 12 },
  barFill: { height: 8, backgroundColor: '#2ed573', borderRadius: 4 },
  remaining: { fontSize: 14, color: '#888', marginBottom: 20 },

  studyBtn: {
    backgroundColor: '#2ed573',
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#2ed573',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  studyBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800' },
  statUnit: { fontSize: 12, color: '#aaa', marginTop: -2 },
  statLabel: { fontSize: 12, color: '#aaa', marginTop: 4 },

  divider: { height: 1, backgroundColor: '#f5f5f5', marginVertical: 12 },

  statusRow: { flexDirection: 'row', justifyContent: 'space-around' },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotLabel: { fontSize: 13, color: '#888' },
  dotCount: { fontSize: 13, fontWeight: '600', color: '#444' },

  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingText: { fontSize: 15, color: '#333' },
  settingArrow: { fontSize: 20, color: '#ccc' },
});
