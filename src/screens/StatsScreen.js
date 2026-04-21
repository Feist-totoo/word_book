import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useDimensions } from '../utils/responsive';
import { getStats } from '../database/db';
import { getToday, addDays } from '../utils/dateUtils';

export default function StatsScreen() {
  const { colors: c } = useTheme();
  const layout = useDimensions();
  const s = makeStyles(c, layout);

  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    getStats().then(st => { setStats(st); setLoading(false); });
  }, []));

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>
      </SafeAreaView>
    );
  }

  const { total, newCount, learningCount, knownCount, todayMap, recentDays, streak } = stats;
  const masteredPct = total > 0 ? Math.round((knownCount / total) * 100) : 0;

  const streakCard = (
    <View style={[s.card, s.streakCard]}>
      <Text style={s.streakEmoji}>{streak > 0 ? '🔥' : '💤'}</Text>
      <View>
        <Text style={s.streakNumber}>{streak}</Text>
        <Text style={s.streakLabel}>天连续打卡</Text>
      </View>
    </View>
  );

  const masteryCard = (
    <View style={s.card}>
      <Text style={s.cardLabel}>单词掌握情况</Text>
      <View style={s.masteredRow}>
        <Text style={s.masteredPct}>{masteredPct}%</Text>
        <Text style={s.masteredSub}>已掌握</Text>
      </View>
      <SegmentedBar c={c} segments={[
        { value: knownCount,    color: c.primary },
        { value: learningCount, color: c.warning },
        { value: newCount,      color: c.border  },
      ]} total={total} />
      <View style={s.legendRow}>
        <LegendItem c={c} color={c.primary}  label="已掌握" count={knownCount} />
        <LegendItem c={c} color={c.warning}  label="学习中" count={learningCount} />
        <LegendItem c={c} color={c.textFaint} label="待学习" count={newCount} />
      </View>
      <Text style={s.totalNote}>共 {total.toLocaleString()} 词</Text>
    </View>
  );

  const todayCard = (
    <View style={s.card}>
      <Text style={s.cardLabel}>今日详情</Text>
      <View style={s.todayGrid}>
        <TodayBox c={c} emoji="😵" label="忘记" count={todayMap.unknown} color={c.danger} />
        <TodayBox c={c} emoji="🤔" label="模糊" count={todayMap.vague}   color={c.warning} />
        <TodayBox c={c} emoji="✅" label="牢记" count={todayMap.known}   color={c.primary} />
      </View>
    </View>
  );

  const activityCard = (
    <View style={s.card}>
      <Text style={s.cardLabel}>近 7 天学习量</Text>
      <ActivityBar c={c} s={s} recentDays={recentDays} />
    </View>
  );

  const rulesCard = (
    <View style={s.card}>
      <Text style={s.cardLabel}>记忆曲线规则</Text>
      {[
        { emoji: '😵', label: '忘记', desc: '当日重新复习' },
        { emoji: '🤔', label: '模糊', desc: '1–2 天后复习' },
        { emoji: '✅', label: '牢记', desc: '40–60 天后复习' },
      ].map((r, i, arr) => (
        <View key={i}>
          <View style={s.ruleRow}>
            <Text style={s.ruleEmoji}>{r.emoji}</Text>
            <Text style={s.ruleLabel}>{r.label}</Text>
            <Text style={s.ruleDesc}>{r.desc}</Text>
          </View>
          {i < arr.length - 1 && <View style={s.divider} />}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.pageTitle}>📊 学习统计</Text>

        {layout.landscape && layout.tablet ? (
          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              {streakCard}
              {todayCard}
              {rulesCard}
            </View>
            <View style={{ flex: 1 }}>
              {masteryCard}
              {activityCard}
            </View>
          </View>
        ) : (
          <>
            {streakCard}
            {masteryCard}
            {todayCard}
            {activityCard}
            {rulesCard}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SegmentedBar({ c, segments, total }) {
  return (
    <View style={{ height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 16, backgroundColor: c.border }}>
      {segments.map((seg, i) => {
        const pct = total > 0 ? (seg.value / total) * 100 : 0;
        if (pct === 0) return null;
        return <View key={i} style={{ width: `${pct}%`, backgroundColor: seg.color, height: 12 }} />;
      })}
    </View>
  );
}

function LegendItem({ color, label, count, c }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 13, color: c.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: c.text }}>{count.toLocaleString()}</Text>
    </View>
  );
}

function TodayBox({ emoji, label, count, color, c }) {
  return (
    <View style={{ alignItems: 'center', padding: 12 }}>
      <Text style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color }}>{count}</Text>
      <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function ActivityBar({ c, s, recentDays }) {
  const today = getToday();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const found = recentDays.find(r => r.date === d);
    days.push({ date: d, cnt: found ? found.cnt : 0 });
  }
  const maxCnt = Math.max(...days.map(d => d.cnt), 1);
  const dayNames = ['日','一','二','三','四','五','六'];

  return (
    <View style={s.activityRow}>
      {days.map((d, i) => {
        const dayName = dayNames[new Date(d.date + 'T00:00:00').getDay()];
        const hPct = d.cnt / maxCnt;
        return (
          <View key={i} style={s.activityCol}>
            <View style={s.activityBarBg}>
              <View style={[s.activityBarFill, {
                height: `${Math.max(4, Math.round(hPct * 100))}%`,
                backgroundColor: d.cnt > 0 ? c.primary : c.border,
              }]} />
            </View>
            <Text style={s.activityCount}>{d.cnt > 0 ? d.cnt : ''}</Text>
            <Text style={[s.activityDay, today === d.date && { color: c.primary, fontWeight: '700' }]}>
              {dayName}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (c, layout) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  twoCol: { flexDirection: 'row', gap: 14 },
  pageTitle: { fontSize: layout.tablet ? 24 : 20, fontWeight: '700', color: c.text, marginBottom: 16, paddingHorizontal: 4 },

  card: {
    backgroundColor: c.card, borderRadius: 18, padding: layout.cardPad,
    marginBottom: 14, borderWidth: 1, borderColor: c.border,
  },
  cardLabel: { fontSize: 13, color: c.textMuted, fontWeight: '600', marginBottom: 16, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 8 },

  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: c.warning + '18', borderColor: c.warning + '40' },
  streakEmoji: { fontSize: 40 },
  streakNumber: { fontSize: 36, fontWeight: '800', color: c.warning },
  streakLabel: { fontSize: 14, color: c.textMuted },

  masteredRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  masteredPct: { fontSize: 44, fontWeight: '800', color: c.primary },
  masteredSub: { fontSize: 16, color: c.textMuted },

  legendRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  totalNote: { textAlign: 'center', fontSize: 12, color: c.textFaint, marginTop: 4 },

  todayGrid: { flexDirection: 'row', justifyContent: 'space-around' },

  activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  activityCol: { flex: 1, alignItems: 'center' },
  activityBarBg: { width: 24, height: 60, backgroundColor: c.cardAlt, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  activityBarFill: { width: '100%', borderRadius: 4 },
  activityCount: { fontSize: 10, color: c.textMuted, marginTop: 4 },
  activityDay: { fontSize: 12, color: c.textMuted },

  ruleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  ruleEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  ruleLabel: { fontSize: 15, fontWeight: '600', color: c.text, width: 48 },
  ruleDesc: { flex: 1, fontSize: 14, color: c.textMuted },
});
