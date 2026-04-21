import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useDimensions } from '../utils/responsive';
import { setupPlan, getPlanInfo } from '../database/db';

const DAILY_OPTIONS = [10, 20, 30, 50, 100];

export default function SetupScreen({ navigation, route }) {
  const { colors } = useTheme();
  const layout = useDimensions();
  const isReset = route?.params?.reset;
  const [selected, setSelected] = useState(20);
  const [totalWords, setTotalWords] = useState(6276);
  const [loading, setLoading] = useState(false);

  const s = makeStyles(colors, layout);

  useEffect(() => {
    getPlanInfo().then(info => setTotalWords(info.newCount || info.total));
  }, []);

  const estimatedDays = Math.ceil(totalWords / selected);

  const handleStart = async () => {
    setLoading(true);
    try {
      await setupPlan(selected);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      Alert.alert('错误', '创建计划失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const rules = [
    { label: '每日目标',  value: `${selected} 词/天` },
    { label: '计划周期',  value: `约 ${estimatedDays} 天` },
    { label: '遗忘处理',  value: '当日重新复习' },
    { label: '模糊处理',  value: '1–2 天后复习' },
    { label: '牢记处理',  value: '40–60 天后复习' },
  ];

  const content = (
    <>
      <View style={s.header}>
        <Text style={s.emoji}>📚</Text>
        <Text style={s.title}>{isReset ? '重新制定计划' : '制定学习计划'}</Text>
        <Text style={s.subtitle}>
          词库共 <Text style={s.accent}>{totalWords.toLocaleString()}</Text> 个单词
        </Text>
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>每日背单词数量</Text>
        <View style={s.optionGrid}>
          {DAILY_OPTIONS.map(n => (
            <TouchableOpacity
              key={n}
              style={[s.optionBtn, selected === n && s.optionBtnActive]}
              onPress={() => setSelected(n)}
            >
              <Text style={[s.optionNum, selected === n && s.optionNumActive]}>{n}</Text>
              <Text style={[s.optionUnit, selected === n && s.optionUnitActive]}>词/天</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.previewCard}>
        {rules.map((r, i) => (
          <View key={i}>
            {i > 0 && <View style={s.divider} />}
            <View style={s.previewRow}>
              <Text style={s.previewLabel}>{r.label}</Text>
              <Text style={s.previewValue}>{r.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.note}>
        <Text style={s.noteText}>
          💡 基于艾宾浩斯遗忘曲线：牢记的单词将在 40–60 天后自动安排复习，确保长期记忆。
        </Text>
      </View>

      <TouchableOpacity
        style={[s.startBtn, loading && s.startBtnDisabled]}
        onPress={handleStart}
        disabled={loading}
      >
        <Text style={s.startBtnText}>{loading ? '创建中…' : '开始学习 →'}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      {layout.landscape && layout.tablet ? (
        // Tablet landscape: two-column
        <View style={s.twoCol}>
          <View style={s.colLeft}>
            <View style={s.header}>
              <Text style={s.emoji}>📚</Text>
              <Text style={s.title}>{isReset ? '重新制定计划' : '制定学习计划'}</Text>
              <Text style={s.subtitle}>
                词库共 <Text style={s.accent}>{totalWords.toLocaleString()}</Text> 个单词
              </Text>
            </View>
            <View style={s.note}>
              <Text style={s.noteText}>
                💡 基于艾宾浩斯遗忘曲线：牢记的单词将在 40–60 天后自动安排复习，确保长期记忆。
              </Text>
            </View>
          </View>
          <ScrollView style={s.colRight} contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={s.section}>
              <Text style={s.sectionLabel}>每日背单词数量</Text>
              <View style={s.optionGrid}>
                {DAILY_OPTIONS.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[s.optionBtn, selected === n && s.optionBtnActive]}
                    onPress={() => setSelected(n)}
                  >
                    <Text style={[s.optionNum, selected === n && s.optionNumActive]}>{n}</Text>
                    <Text style={[s.optionUnit, selected === n && s.optionUnitActive]}>词/天</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={s.previewCard}>
              {rules.map((r, i) => (
                <View key={i}>
                  {i > 0 && <View style={s.divider} />}
                  <View style={s.previewRow}>
                    <Text style={s.previewLabel}>{r.label}</Text>
                    <Text style={s.previewValue}>{r.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[s.startBtn, loading && s.startBtnDisabled]}
              onPress={handleStart}
              disabled={loading}
            >
              <Text style={s.startBtnText}>{loading ? '创建中…' : '开始学习 →'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>{content}</ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c, layout) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { padding: 24, paddingBottom: 48, alignItems: 'center' },

  twoCol: { flex: 1, flexDirection: 'row' },
  colLeft: { flex: 1, padding: 40, justifyContent: 'center' },
  colRight: { flex: 1, padding: 24 },

  header: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  emoji: { fontSize: layout.tablet ? 72 : 56, marginBottom: 12 },
  title: { fontSize: layout.tablet ? 30 : 26, fontWeight: '700', color: c.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: c.textMuted },
  accent: { color: c.primary, fontWeight: '700' },

  section: { width: '100%', marginBottom: 24 },
  sectionLabel: { fontSize: 13, color: c.textMuted, marginBottom: 14, fontWeight: '600', letterSpacing: 0.5 },

  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionBtn: {
    width: 72, height: 72, borderRadius: 16,
    backgroundColor: c.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: c.border,
  },
  optionBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
  optionNum: { fontSize: 22, fontWeight: '700', color: c.text },
  optionNumActive: { color: '#fff' },
  optionUnit: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  optionUnitActive: { color: 'rgba(255,255,255,0.8)' },

  previewCard: {
    width: '100%', backgroundColor: c.card, borderRadius: 18,
    padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: c.border,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  previewLabel: { fontSize: 15, color: c.textSub },
  previewValue: { fontSize: 15, color: c.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: c.border },

  note: {
    width: '100%', backgroundColor: c.primaryBg,
    borderRadius: 12, padding: 16, marginBottom: 32,
    borderWidth: 1, borderColor: c.primary + '40',
  },
  noteText: { fontSize: 13, color: c.textSub, lineHeight: 20 },

  startBtn: {
    width: '100%', backgroundColor: c.primary, borderRadius: 28,
    paddingVertical: 18, alignItems: 'center',
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
