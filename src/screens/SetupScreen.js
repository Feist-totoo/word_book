import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { setupPlan, getPlanInfo } from '../database/db';

const DAILY_OPTIONS = [10, 20, 30, 50, 100];

export default function SetupScreen({ navigation, route }) {
  const isReset = route?.params?.reset;
  const [selected, setSelected] = useState(20);
  const [totalWords, setTotalWords] = useState(6276);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPlanInfo().then((info) => setTotalWords(info.newCount || info.total));
  }, []);

  const estimatedDays = Math.ceil(totalWords / selected);

  const handleStart = async () => {
    setLoading(true);
    try {
      await setupPlan(selected);
      // Navigate to main app
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('错误', '创建计划失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📚</Text>
          <Text style={styles.title}>{isReset ? '重新制定计划' : '制定学习计划'}</Text>
          <Text style={styles.subtitle}>
            词库共 <Text style={styles.accent}>{totalWords.toLocaleString()}</Text> 个单词
          </Text>
        </View>

        {/* Daily count selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>每日背单词数量</Text>
          <View style={styles.optionGrid}>
            {DAILY_OPTIONS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.optionBtn, selected === n && styles.optionBtnActive]}
                onPress={() => setSelected(n)}
              >
                <Text style={[styles.optionText, selected === n && styles.optionTextActive]}>
                  {n}
                </Text>
                <Text style={[styles.optionSub, selected === n && styles.optionSubActive]}>
                  个/天
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Plan preview */}
        <View style={styles.preview}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>计划周期</Text>
            <Text style={styles.previewValue}>
              约 <Text style={styles.accent}>{estimatedDays}</Text> 天
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>每天用时</Text>
            <Text style={styles.previewValue}>约 {Math.round(selected * 0.5)} 分钟</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>遗忘后复习</Text>
            <Text style={styles.previewValue}>当日再次学习</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>模糊时复习</Text>
            <Text style={styles.previewValue}>1~2 天后</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>熟记后复习</Text>
            <Text style={styles.previewValue}>40~60 天后</Text>
          </View>
        </View>

        {/* Memory curve note */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            💡 基于艾宾浩斯遗忘曲线：标记"认识"的单词将在 40–60 天后自动安排复习，确保长期记忆。
          </Text>
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[styles.startBtn, loading && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={loading}
        >
          <Text style={styles.startBtnText}>{loading ? '创建中...' : '开始学习 →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  scroll: { padding: 24, paddingBottom: 48 },

  header: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#222', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#888' },
  accent: { color: '#2ed573', fontWeight: '700' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, color: '#aaa', marginBottom: 12, fontWeight: '600', letterSpacing: 0.5 },

  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optionBtn: {
    width: '18%',
    minWidth: 56,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  optionBtnActive: { backgroundColor: '#2ed573' },
  optionText: { fontSize: 20, fontWeight: '700', color: '#333' },
  optionTextActive: { color: '#fff' },
  optionSub: { fontSize: 10, color: '#aaa', marginTop: 2 },
  optionSubActive: { color: 'rgba(255,255,255,0.8)' },

  preview: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  previewLabel: { fontSize: 15, color: '#666' },
  previewValue: { fontSize: 15, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },

  note: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  noteText: { fontSize: 13, color: '#555', lineHeight: 20 },

  startBtn: {
    backgroundColor: '#2ed573',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#2ed573',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
