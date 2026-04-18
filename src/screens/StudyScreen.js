import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Animated,
  Alert, ActivityIndicator,
} from 'react-native';
import { getTodayQueue, markResult } from '../database/db';

export default function StudyScreen({ navigation }) {
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ unknown: 0, vague: 0, known: 0 });
  const [totalToday, setTotalToday] = useState(0);
  const [doneToday, setDoneToday] = useState(0);
  const [done, setDone] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const loadQueue = useCallback(async () => {
    const q = await getTodayQueue();
    if (q.length === 0) {
      setDone(true);
      setLoading(false);
      return;
    }
    setQueue(q);
    setCurrent(q[0]);
    setTotalToday((prev) => (prev === 0 ? q.length : prev)); // only set once
    setLoading(false);
  }, []);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const handleReveal = () => {
    setShowDetails(true);
    fadeIn();
  };

  const handleResult = async (result) => {
    if (submitting || !current) return;
    setSubmitting(true);

    setSessionStats((s) => ({ ...s, [result]: s[result] + 1 }));
    setDoneToday((n) => n + 1);

    await markResult(current.scheduleId, current.wordId, result);

    // Reload queue (important: retries may have been added)
    const newQueue = await getTodayQueue();
    if (newQueue.length === 0) {
      setDone(true);
    } else {
      setCurrent(newQueue[0]);
      setShowDetails(false);
      fadeIn();
    }
    setSubmitting(false);
  };

  // ── Done screen ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneScreen}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>今天全部完成！</Text>
          <Text style={styles.doneSub}>明天再接再厉</Text>

          <View style={styles.summaryCard}>
            <SummaryRow emoji="😵" label="不认识" count={sessionStats.unknown} color="#ff7675" />
            <SummaryRow emoji="🤔" label="模  糊" count={sessionStats.vague} color="#ffa502" />
            <SummaryRow emoji="✅" label="已掌握" count={sessionStats.known} color="#2ed573" />
          </View>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>返回首页</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2ed573" />
          <Text style={styles.loadingText}>准备单词…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const remaining = queue.length;
  const pct = totalToday > 0 ? Math.min(1, doneToday / (doneToday + remaining)) : 0;

  // ── Main study view ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Text style={styles.backIconText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
        <Text style={styles.counterText}>{doneToday + 1}/{doneToday + remaining}</Text>
      </View>

      {/* Card area */}
      <ScrollView contentContainerStyle={styles.cardArea}>
        <Animated.View style={[styles.wordCard, { opacity: fadeAnim }]}>
          {/* Retry badge */}
          {current?.addedType === 'retry' && (
            <View style={styles.retryBadge}>
              <Text style={styles.retryBadgeText}>🔁 重复记忆</Text>
            </View>
          )}

          <Text style={styles.mainWord}>{current?.word}</Text>
          <Text style={styles.phonetic}>{current?.phonetic || '/···/'}</Text>

          {showDetails ? (
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Translations */}
              {current?.trans?.length > 0 && (
                <>
                  <SectionTitle title="释义" />
                  {current.trans.map((t, i) => (
                    <View key={i} style={styles.transRow}>
                      <View style={styles.posTag}><Text style={styles.posText}>{t.pos}</Text></View>
                      <Text style={styles.transText}>{t.cn}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Phrases */}
              {current?.phrases?.length > 0 && (
                <>
                  <SectionTitle title="短语" />
                  {current.phrases.slice(0, 3).map((p, i) => (
                    <View key={i} style={styles.phraseRow}>
                      <Text style={styles.phraseEn}>{p.phrase}</Text>
                      <Text style={styles.phraseCn}>{p.tran}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Example sentences */}
              {current?.sentences?.length > 0 && (
                <>
                  <SectionTitle title="例句" />
                  {current.sentences.slice(0, 2).map((s, i) => (
                    <View key={i} style={styles.sentenceRow}>
                      <Text style={styles.sentenceEn}>{s.en}</Text>
                      <Text style={styles.sentenceCn}>{s.cn}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Related words */}
              {current?.relWords?.length > 0 && (
                <>
                  <SectionTitle title="相关词" />
                  <View style={styles.relWordWrap}>
                    {current.relWords.slice(0, 4).map((r, i) => (
                      <View key={i} style={styles.relWordTag}>
                        <Text style={styles.relWordEn}>{r.word}</Text>
                        <Text style={styles.relWordCn}> {r.tran?.split('；')[0]}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </Animated.View>
          ) : (
            <TouchableOpacity style={styles.revealBtn} onPress={handleReveal}>
              <Text style={styles.revealText}>点击翻面查看释义</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        {!showDetails ? (
          <>
            <ActionBtn
              label="不认识"
              sublabel="今日再学"
              color="#ff7675"
              onPress={() => { handleReveal(); }}
            />
            <ActionBtn
              label="认  识"
              sublabel="查看详情"
              color="#2ed573"
              onPress={() => { handleReveal(); }}
            />
          </>
        ) : (
          <>
            <ActionBtn
              label="忘  记"
              sublabel="今日复习"
              color="#ff7675"
              onPress={() => handleResult('unknown')}
              disabled={submitting}
            />
            <ActionBtn
              label="模  糊"
              sublabel="1-2天后"
              color="#ffa502"
              onPress={() => handleResult('vague')}
              disabled={submitting}
            />
            <ActionBtn
              label="牢  记"
              sublabel="40-60天后"
              color="#2ed573"
              onPress={() => handleResult('known')}
              disabled={submitting}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ title }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ActionBtn({ label, sublabel, color, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: color }, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.actionBtnLabel}>{label}</Text>
      <Text style={styles.actionBtnSub}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

function SummaryRow({ emoji, label, count, color }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryEmoji}>{emoji}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#aaa', fontSize: 15 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backIcon: { padding: 4 },
  backIconText: { fontSize: 30, color: '#333', lineHeight: 32 },
  barBg: { flex: 1, height: 6, backgroundColor: '#f0f0f0', borderRadius: 3 },
  barFill: { height: 6, backgroundColor: '#2ed573', borderRadius: 3 },
  counterText: { fontSize: 13, color: '#aaa', minWidth: 36, textAlign: 'right' },

  cardArea: { padding: 16, paddingBottom: 20 },
  wordCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  retryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  retryBadgeText: { fontSize: 12, color: '#856404', fontWeight: '600' },

  mainWord: { fontSize: 44, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 6 },
  phonetic: { fontSize: 17, color: '#aaa', textAlign: 'center', marginBottom: 24 },

  revealBtn: {
    marginTop: 32,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  revealText: { fontSize: 15, color: '#bbb' },

  sectionTitleRow: { marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 11, color: '#bbb', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },

  transRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  posTag: { backgroundColor: '#eaf6ff', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginTop: 1 },
  posText: { fontSize: 11, color: '#74b9ff', fontWeight: '700' },
  transText: { flex: 1, fontSize: 16, color: '#333', lineHeight: 22 },

  phraseRow: { marginBottom: 8 },
  phraseEn: { fontSize: 15, fontWeight: '600', color: '#444' },
  phraseCn: { fontSize: 13, color: '#888', marginTop: 2 },

  sentenceRow: { marginBottom: 10, backgroundColor: '#fafafa', borderRadius: 8, padding: 10 },
  sentenceEn: { fontSize: 14, color: '#555', lineHeight: 20, fontStyle: 'italic' },
  sentenceCn: { fontSize: 12, color: '#aaa', marginTop: 4 },

  relWordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relWordTag: { backgroundColor: '#f8f9fa', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  relWordEn: { fontSize: 13, fontWeight: '600', color: '#333' },
  relWordCn: { fontSize: 12, color: '#aaa' },

  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  actionBtnSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Done screen
  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: '#2ed573', marginBottom: 8 },
  doneSub: { fontSize: 16, color: '#aaa', marginBottom: 32 },
  summaryCard: { width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 32, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  summaryEmoji: { fontSize: 22, marginRight: 12 },
  summaryLabel: { flex: 1, fontSize: 16, color: '#555' },
  summaryCount: { fontSize: 24, fontWeight: '800' },
  backBtn: { backgroundColor: '#2ed573', borderRadius: 24, paddingVertical: 15, paddingHorizontal: 48 },
  backBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
