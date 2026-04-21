import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, MODES } from '../theme/ThemeContext';
import { useDimensions } from '../utils/responsive';
import { getTodayProgress, getPlanInfo, resetPlan } from '../database/db';
import { getToday, formatDate } from '../utils/dateUtils';

const THEME_LABELS = { system: '跟随系统', light: '浅色', dark: '深色' };
const THEME_ICONS  = { system: '🌓', light: '☀️', dark: '🌙' };

export default function HomeScreen({ navigation }) {
  const { colors: c, mode, setMode } = useTheme();
  const layout = useDimensions();
  const s = makeStyles(c, layout);

  const [progress, setProgress] = useState({ total: 0, done: 0, retries: 0 });
  const [plan, setPlan] = useState(null);

  useFocusEffect(useCallback(() => {
    Promise.all([getTodayProgress(), getPlanInfo()]).then(([p, info]) => {
      setProgress(p);
      setPlan(info);
    });
  }, []));

  const allDone = progress.done >= progress.total && progress.total > 0 && progress.retries === 0;
  const pct = progress.total > 0 ? Math.min(1, progress.done / progress.total) : 0;
  const remaining = progress.total - progress.done + progress.retries;

  const handleReset = () => {
    Alert.alert('重置进度', '将清除所有学习记录，确定吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: async () => {
        await resetPlan();
        navigation.reset({ index: 0, routes: [{ name: 'Setup' }] });
      }},
    ]);
  };

  const todayCard = (
    <View style={s.card}>
      {allDone ? (
        <View style={s.doneBox}>
          <Text style={s.doneEmoji}>🎉</Text>
          <Text style={s.doneTitle}>今天打卡完成！</Text>
          <Text style={s.doneSub}>明天继续加油</Text>
          <TouchableOpacity style={[s.studyBtn, { backgroundColor: c.info, marginTop: 16 }]}
            onPress={() => navigation.navigate('Study')}>
            <Text style={s.studyBtnText}>继续学习更多词 →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={s.progressHeader}>
            <Text style={s.cardLabel}>今日进度</Text>
            <Text style={s.progressFrac}>
              <Text style={s.progressDone}>{progress.done}</Text>
              <Text style={s.progressTotal}> / {progress.total}</Text>
              {progress.retries > 0 &&
                <Text style={s.retryBadge}>  +{progress.retries}复习</Text>}
            </Text>
          </View>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
          <Text style={s.remaining}>
            还剩 <Text style={{ color: c.primary, fontWeight: '700' }}>{remaining}</Text> 个单词
          </Text>
          <TouchableOpacity style={s.studyBtn} onPress={() => navigation.navigate('Study')}>
            <Text style={s.studyBtnText}>开始学习 →</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const planCard = plan && (
    <View style={s.card}>
      <Text style={s.cardLabel}>学习计划</Text>
      <View style={s.statsRow}>
        <StatBox c={c} label="每日目标" value={plan.dailyCount} unit="词" color={c.primary} />
        <StatBox c={c} label="剩余新词" value={plan.newCount}   unit="个" color={c.info} />
        <StatBox c={c} label="预计完成" value={plan.estimatedDays} unit="天" color={c.warning} />
      </View>
      <View style={s.divider} />
      <View style={s.dotRow}>
        <DotItem color={c.border}   label="待学习" count={plan.newCount}      c={c} />
        <DotItem color={c.warning}  label="学习中" count={plan.learningCount} c={c} />
        <DotItem color={c.primary}  label="已掌握" count={plan.knownCount}    c={c} />
      </View>
    </View>
  );

  const settingsCard = (
    <View style={s.card}>
      <Text style={s.cardLabel}>外观</Text>
      <View style={s.themeRow}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m}
            style={[s.themeBtn, mode === m && s.themeBtnActive]}
            onPress={() => setMode(m)}
          >
            <Text style={s.themeIcon}>{THEME_ICONS[m]}</Text>
            <Text style={[s.themeLabel, mode === m && s.themeLabelActive]}>{THEME_LABELS[m]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.divider} />
      <Text style={[s.cardLabel, { marginTop: 16 }]}>设置</Text>
      <TouchableOpacity style={s.settingRow} onPress={() => navigation.navigate('Setup', { reset: true })}>
        <Text style={s.settingText}>修改每日学习数量</Text>
        <Text style={s.settingArrow}>›</Text>
      </TouchableOpacity>
      <View style={s.divider} />
      <TouchableOpacity style={s.settingRow} onPress={handleReset}>
        <Text style={[s.settingText, { color: c.danger }]}>重置所有进度</Text>
        <Text style={s.settingArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.pageHeader}>
          <Text style={s.greeting}>📖 今日学习</Text>
          <Text style={s.dateText}>{formatDate(getToday())}</Text>
        </View>

        {layout.landscape && layout.tablet ? (
          // Tablet landscape: two-column
          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              {todayCard}
              {settingsCard}
            </View>
            <View style={{ flex: 1 }}>
              {planCard}
            </View>
          </View>
        ) : (
          <>
            {todayCard}
            {planCard}
            {settingsCard}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, unit, color, c }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color }}>{value ?? '—'}</Text>
      <Text style={{ fontSize: 11, color: c.textMuted, marginTop: -2 }}>{unit}</Text>
      <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function DotItem({ color, label, count, c }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 13, color: c.textSub }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>{count ?? 0}</Text>
    </View>
  );
}

const makeStyles = (c, layout) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  twoCol: { flexDirection: 'row', gap: 16 },

  pageHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16, paddingHorizontal: 4,
  },
  greeting: { fontSize: layout.tablet ? 26 : 22, fontWeight: '700', color: c.text },
  dateText: { fontSize: 13, color: c.textMuted },

  card: {
    backgroundColor: c.card, borderRadius: 18, padding: layout.cardPad,
    marginBottom: 14, borderWidth: 1, borderColor: c.border,
  },
  cardLabel: { fontSize: 13, color: c.textMuted, fontWeight: '600', marginBottom: 14, letterSpacing: 0.5 },

  doneBox: { alignItems: 'center', paddingVertical: 8 },
  doneEmoji: { fontSize: 48, marginBottom: 8 },
  doneTitle: { fontSize: 22, fontWeight: '700', color: c.primary },
  doneSub: { fontSize: 14, color: c.textMuted, marginTop: 4 },

  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressFrac: { fontSize: 15 },
  progressDone: { fontSize: 22, fontWeight: '700', color: c.primary },
  progressTotal: { fontSize: 15, color: c.textMuted },
  retryBadge: { fontSize: 12, color: c.warning, fontWeight: '600' },

  barBg: { height: 8, backgroundColor: c.border, borderRadius: 4, marginBottom: 12 },
  barFill: { height: 8, backgroundColor: c.primary, borderRadius: 4 },
  remaining: { fontSize: 14, color: c.textMuted, marginBottom: 18 },

  studyBtn: {
    backgroundColor: c.primary, borderRadius: 24,
    paddingVertical: 14, alignItems: 'center',
  },
  studyBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 12 },
  dotRow: { flexDirection: 'row', justifyContent: 'space-around' },

  themeRow: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: c.cardAlt, borderWidth: 1.5, borderColor: c.border,
  },
  themeBtnActive: { borderColor: c.primary, backgroundColor: c.primaryBg },
  themeIcon: { fontSize: 20, marginBottom: 4 },
  themeLabel: { fontSize: 12, color: c.textMuted, fontWeight: '500' },
  themeLabelActive: { color: c.primary, fontWeight: '700' },

  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
  },
  settingText: { fontSize: 15, color: c.text },
  settingArrow: { fontSize: 20, color: c.textFaint },
});
