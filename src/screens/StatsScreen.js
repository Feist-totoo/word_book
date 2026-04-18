import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStats } from '../database/db';
import { getToday, addDays } from '../utils/dateUtils';

export default function StatsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    getStats().then((s) => { setStats(s); setLoading(false); });
  }, []));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2ed573" />
        </View>
      </SafeAreaView>
    );
  }

  const { total, newCount, learningCount, knownCount, todayMap, recentDays, streak } = stats;
  const masteredPct = total > 0 ? Math.round((knownCount / total) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>📊 学习统计</Text>

        {/* Streak */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>{streak > 0 ? '🔥' : '💤'}</Text>
          <View>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>天连续打卡</Text>
          </View>
        </View>

        {/* Word status breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>单词掌握情况</Text>

          {/* Progress arc text */}
          <View style={styles.masteredRow}>
            <Text style={styles.masteredPct}>{masteredPct}%</Text>
            <Text style={styles.masteredLabel}>已掌握</Text>
          </View>

          {/* Segmented bar */}
          <SegmentedBar
            segments={[
              { value: knownCount, color: '#2ed573' },
              { value: learningCount, color: '#ffa502' },
              { value: newCount, color: '#dfe6e9' },
            ]}
            total={total}
          />

          <View style={styles.legendRow}>
            <LegendItem color="#2ed573" label="已掌握" count={knownCount} />
            <LegendItem color="#ffa502" label="学习中" count={learningCount} />
            <LegendItem color="#dfe6e9" label="待学习" count={newCount} />
          </View>
          <Text style={styles.totalNote}>共 {total.toLocaleString()} 词</Text>
        </View>

        {/* Today's result breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>今日学习详情</Text>
          <View style={styles.todayGrid}>
            <TodayBox emoji="😵" label="忘  记" count={todayMap.unknown} color="#ff7675" />
            <TodayBox emoji="🤔" label="模  糊" count={todayMap.vague} color="#ffa502" />
            <TodayBox emoji="✅" label="牢  记" count={todayMap.known} color="#2ed573" />
          </View>
        </View>

        {/* 7-day activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>近 7 天学习量</Text>
          <ActivityBar recentDays={recentDays} />
        </View>

        {/* Spaced repetition legend */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>记忆曲线规则</Text>
          <RuleRow emoji="😵" label="忘记" desc="当日重新复习" />
          <RuleRow emoji="🤔" label="模糊" desc="1–2 天后复习" />
          <RuleRow emoji="✅" label="牢记" desc="40–60 天后复习" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SegmentedBar({ segments, total }) {
  return (
    <View style={styles.segBar}>
      {segments.map((s, i) => {
        const pct = total > 0 ? (s.value / total) * 100 : 0;
        if (pct === 0) return null;
        return (
          <View
            key={i}
            style={[
              styles.segBarPart,
              { width: `${pct}%`, backgroundColor: s.color },
              i === 0 && styles.segBarLeft,
              i === segments.length - 1 && styles.segBarRight,
            ]}
          />
        );
      })}
    </View>
  );
}

function LegendItem({ color, label, count }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendCount}>{count.toLocaleString()}</Text>
    </View>
  );
}

function TodayBox({ emoji, label, count, color }) {
  return (
    <View style={styles.todayBox}>
      <Text style={styles.todayEmoji}>{emoji}</Text>
      <Text style={[styles.todayCount, { color }]}>{count}</Text>
      <Text style={styles.todayLabel}>{label}</Text>
    </View>
  );
}

function ActivityBar({ recentDays }) {
  const today = getToday();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const found = recentDays.find((r) => r.date === d);
    days.push({ date: d, cnt: found ? found.cnt : 0 });
  }
  const maxCnt = Math.max(...days.map((d) => d.cnt), 1);
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <View style={styles.activityRow}>
      {days.map((d, i) => {
        const dayName = dayNames[new Date(d.date + 'T00:00:00').getDay()];
        const hPct = d.cnt / maxCnt;
        return (
          <View key={i} style={styles.activityCol}>
            <View style={styles.activityBarBg}>
              <View style={[styles.activityBarFill, { height: `${Math.max(4, Math.round(hPct * 100))}%` }]} />
            </View>
            <Text style={styles.activityCount}>{d.cnt > 0 ? d.cnt : ''}</Text>
            <Text style={styles.activityDay}>{dayName}</Text>
          </View>
        );
      })}
    </View>
  );
}

function RuleRow({ emoji, label, desc }) {
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleEmoji}>{emoji}</Text>
      <Text style={styles.ruleLabel}>{label}</Text>
      <Text style={styles.ruleDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 16, paddingHorizontal: 4 },

  streakCard: {
    backgroundColor: '#fff8f0',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  streakEmoji: { fontSize: 40 },
  streakNumber: { fontSize: 36, fontWeight: '800', color: '#f0932b' },
  streakLabel: { fontSize: 14, color: '#aaa' },

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

  masteredRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  masteredPct: { fontSize: 44, fontWeight: '800', color: '#2ed573' },
  masteredLabel: { fontSize: 16, color: '#aaa' },

  segBar: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 16, backgroundColor: '#f0f0f0' },
  segBarPart: { height: 12 },
  segBarLeft: { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
  segBarRight: { borderTopRightRadius: 6, borderBottomRightRadius: 6 },

  legendRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, color: '#888' },
  legendCount: { fontSize: 14, fontWeight: '700', color: '#444' },
  totalNote: { textAlign: 'center', fontSize: 12, color: '#ccc', marginTop: 4 },

  todayGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  todayBox: { alignItems: 'center', padding: 12 },
  todayEmoji: { fontSize: 28, marginBottom: 8 },
  todayCount: { fontSize: 30, fontWeight: '800' },
  todayLabel: { fontSize: 12, color: '#aaa', marginTop: 4 },

  activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  activityCol: { flex: 1, alignItems: 'center' },
  activityBarBg: { width: 20, height: 60, backgroundColor: '#f0f0f0', borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  activityBarFill: { width: '100%', backgroundColor: '#2ed573', borderRadius: 4 },
  activityCount: { fontSize: 10, color: '#aaa', marginTop: 4 },
  activityDay: { fontSize: 12, color: '#bbb' },

  ruleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  ruleEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  ruleLabel: { fontSize: 15, fontWeight: '600', color: '#444', width: 48 },
  ruleDesc: { flex: 1, fontSize: 14, color: '#888' },
});
