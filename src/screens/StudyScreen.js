import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Animated,
  ActivityIndicator, Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useDimensions } from '../utils/responsive';
import { getTodayQueue, getTodayProgress, markResult, continueStudyToday } from '../database/db';

export default function StudyScreen({ navigation }) {
  const { colors: c } = useTheme();
  const layout = useDimensions();
  const s = makeStyles(c, layout);

  const [queue, setQueue]           = useState([]);
  const [current, setCurrent]       = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [sessionStats, setSessionStats] = useState({ unknown: 0, vague: 0, known: 0 });

  // Progress — sourced from DB, never resets mid-session
  const [progressDone,  setProgressDone]  = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  // Load initial state from DB
  const loadInitial = useCallback(async () => {
    setLoading(true);
    const prog = await getTodayProgress();
    const q    = await getTodayQueue();

    if (q.length === 0) {
      setProgressDone(prog.done);
      setProgressTotal(prog.total);
      setDone(true);
      setLoading(false);
      return;
    }

    const total = prog.done + q.length;
    setProgressDone(prog.done);
    setProgressTotal(total);
    setQueue(q);
    setCurrent(q[0]);
    setLoading(false);
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  const handleReveal = () => {
    setShowDetails(true);
    fadeIn();
  };

  const handleResult = async (result) => {
    if (submitting || !current) return;
    setSubmitting(true);

    setSessionStats(s => ({ ...s, [result]: s[result] + 1 }));
    await markResult(current.scheduleId, current.wordId, result);

    const newQueue = await getTodayQueue();

    const newDone = progressDone + 1;
    setProgressDone(newDone);
    setProgressTotal(prev => Math.max(prev, newDone + newQueue.length));

    if (newQueue.length === 0) {
      setDone(true);
    } else {
      setCurrent(newQueue[0]);
      setShowDetails(false);
      fadeIn();
    }
    setSubmitting(false);
  };

  const handleContinue = async () => {
    const added = await continueStudyToday(20);
    if (added === 0) {
      Alert.alert('🎉 全部完成', '所有单词都已学完，没有更多新词了！');
      return;
    }
    const q    = await getTodayQueue();
    const prog = await getTodayProgress();

    setProgressDone(prog.done);
    setProgressTotal(prog.done + q.length);
    setQueue(q);
    setCurrent(q[0]);
    setShowDetails(false);
    setDone(false);
    setSessionStats({ unknown: 0, vague: 0, known: 0 });
    fadeIn();
  };

  // ── Done ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.doneScreen}>
          <Text style={s.doneEmoji}>🎉</Text>
          <Text style={s.doneTitle}>今天打卡完成！</Text>
          <Text style={s.doneSub}>本次学习成果</Text>
          <View style={s.summaryCard}>
            <SummaryRow c={c} emoji="😵" label="忘  记" count={sessionStats.unknown} color={c.danger} />
            <View style={s.summaryDivider} />
            <SummaryRow c={c} emoji="🤔" label="模  糊" count={sessionStats.vague}   color={c.warning} />
            <View style={s.summaryDivider} />
            <SummaryRow c={c} emoji="✅" label="牢  记" count={sessionStats.known}   color={c.primary} />
          </View>
          <TouchableOpacity style={s.continueBtn} onPress={handleContinue}>
            <Text style={s.continueBtnText}>继续学习 +20词 →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>返回首页</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={s.loadingText}>准备单词…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pct = progressTotal > 0 ? Math.min(1, progressDone / progressTotal) : 0;

  // ── Card content ──────────────────────────────────────────────────────────
  const wordCard = (
    <Animated.View style={[s.wordCard, { opacity: fadeAnim }]}>
      {current?.addedType === 'retry' && (
        <View style={s.retryBadge}><Text style={s.retryBadgeText}>🔁 重复记忆</Text></View>
      )}
      <Text style={s.mainWord}>{current?.word}</Text>
      <Text style={s.phonetic}>{current?.phonetic || '/···/'}</Text>

      {showDetails ? (
        <Animated.View style={{ opacity: fadeAnim }}>
          {current?.trans?.length > 0 && <>
            <SectionTitle title="释义" c={c} />
            {current.trans.map((t, i) => (
              <View key={i} style={s.transRow}>
                <View style={s.posTag}><Text style={s.posText}>{t.pos}</Text></View>
                <Text style={s.transText}>{t.cn}</Text>
              </View>
            ))}
          </>}
          {current?.phrases?.length > 0 && <>
            <SectionTitle title="短语" c={c} />
            {current.phrases.slice(0, 3).map((p, i) => (
              <View key={i} style={s.phraseRow}>
                <Text style={s.phraseEn}>{p.phrase}</Text>
                <Text style={s.phraseCn}>{p.tran}</Text>
              </View>
            ))}
          </>}
          {current?.sentences?.length > 0 && <>
            <SectionTitle title="例句" c={c} />
            {current.sentences.slice(0, 2).map((s2, i) => (
              <View key={i} style={s.sentenceRow}>
                <Text style={s.sentenceEn}>{s2.en}</Text>
                <Text style={s.sentenceCn}>{s2.cn}</Text>
              </View>
            ))}
          </>}
          {current?.relWords?.length > 0 && <>
            <SectionTitle title="相关词" c={c} />
            <View style={s.relWordWrap}>
              {current.relWords.slice(0, 5).map((r, i) => (
                <View key={i} style={s.relWordTag}>
                  <Text style={s.relWordEn}>{r.word}</Text>
                  <Text style={s.relWordCn}> {r.tran?.split('；')[0]}</Text>
                </View>
              ))}
            </View>
          </>}
        </Animated.View>
      ) : (
        <TouchableOpacity style={s.revealBtn} onPress={handleReveal}>
          <Text style={s.revealText}>点击翻面查看释义</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const actionBtns = !showDetails ? (
    <>
      <ActionBtn c={c} label="不认识" sublabel="今日再学" color={c.danger}  onPress={handleReveal} />
      <ActionBtn c={c} label="认  识" sublabel="查看详情" color={c.primary} onPress={handleReveal} />
    </>
  ) : (
    <>
      <ActionBtn c={c} label="忘  记" sublabel="今日复习"  color={c.danger}  onPress={() => handleResult('unknown')} disabled={submitting} />
      <ActionBtn c={c} label="模  糊" sublabel="1-2天后"   color={c.warning} onPress={() => handleResult('vague')}   disabled={submitting} />
      <ActionBtn c={c} label="牢  记" sublabel="40-60天后" color={c.primary} onPress={() => handleResult('known')}   disabled={submitting} />
    </>
  );

  // ── Landscape tablet layout ───────────────────────────────────────────────
  if (layout.landscape && layout.tablet) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backIcon}>
            <Text style={s.backIconText}>‹</Text>
          </TouchableOpacity>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
          <Text style={s.counterText}>{progressDone}/{progressTotal}</Text>
        </View>
        <View style={s.landscapeBody}>
          <ScrollView style={s.landscapeLeft} contentContainerStyle={{ padding: 24 }}>
            {wordCard}
          </ScrollView>
          <View style={s.landscapeRight}>
            <View style={s.actionsVertical}>{actionBtns}</View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Portrait (phone / tablet portrait) ───────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backIcon}>
          <Text style={s.backIconText}>‹</Text>
        </TouchableOpacity>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
        <Text style={s.counterText}>{progressDone}/{progressTotal}</Text>
      </View>
      <ScrollView contentContainerStyle={s.cardArea}>{wordCard}</ScrollView>
      <View style={s.actions}>{actionBtns}</View>
    </SafeAreaView>
  );
}

function SectionTitle({ title, c }) {
  return (
    <View style={{ marginTop: 20, marginBottom: 10 }}>
      <Text style={{ fontSize: 11, color: c.textMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
        {title}
      </Text>
    </View>
  );
}

function ActionBtn({ label, sublabel, color, onPress, disabled, c }) {
  return (
    <TouchableOpacity
      style={[{
        flex: 1, paddingVertical: 14, borderRadius: 20, alignItems: 'center',
        backgroundColor: color, opacity: disabled ? 0.5 : 1,
      }]}
      onPress={onPress} disabled={disabled} activeOpacity={0.8}
    >
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{label}</Text>
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

function SummaryRow({ emoji, label, count, color, c }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <Text style={{ fontSize: 22, marginRight: 12 }}>{emoji}</Text>
      <Text style={{ flex: 1, fontSize: 16, color: c.textSub }}>{label}</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color }}>{count}</Text>
    </View>
  );
}

const makeStyles = (c, layout) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: c.textMuted, fontSize: 15 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    paddingHorizontal: 16, gap: 10, backgroundColor: c.card,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  backIcon: { padding: 4 },
  backIconText: { fontSize: 30, color: c.text, lineHeight: 32 },
  barBg: { flex: 1, height: 6, backgroundColor: c.border, borderRadius: 3 },
  barFill: { height: 6, backgroundColor: c.primary, borderRadius: 3 },
  counterText: { fontSize: 13, color: c.textMuted, minWidth: 48, textAlign: 'right' },

  // Portrait
  cardArea: { padding: 16, paddingBottom: 20 },
  actions: {
    flexDirection: 'row', padding: 16, gap: 10,
    backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border,
  },

  // Landscape tablet
  landscapeBody: { flex: 1, flexDirection: 'row' },
  landscapeLeft: { flex: 1.4 },
  landscapeRight: {
    width: 200, borderLeftWidth: 1, borderLeftColor: c.border,
    backgroundColor: c.card, justifyContent: 'center', padding: 16,
  },
  actionsVertical: { gap: 10 },

  // Word card
  wordCard: {
    backgroundColor: c.card, borderRadius: 20, padding: layout.cardPad,
    borderWidth: 1, borderColor: c.border,
  },
  retryBadge: {
    alignSelf: 'flex-start', backgroundColor: c.warning + '28',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12,
  },
  retryBadgeText: { fontSize: 12, color: c.warning, fontWeight: '600' },
  mainWord: {
    fontSize: layout.tablet ? 52 : 44, fontWeight: '800',
    color: c.text, textAlign: 'center', marginBottom: 6,
  },
  phonetic: { fontSize: 17, color: c.textMuted, textAlign: 'center', marginBottom: 24 },

  revealBtn: {
    marginTop: 32, marginBottom: 12, paddingVertical: 18, borderRadius: 12,
    borderWidth: 1.5, borderColor: c.borderMid, borderStyle: 'dashed', alignItems: 'center',
  },
  revealText: { fontSize: 15, color: c.textFaint },

  transRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  posTag: { backgroundColor: c.infoBg, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginTop: 1 },
  posText: { fontSize: 11, color: c.info, fontWeight: '700' },
  transText: { flex: 1, fontSize: layout.tablet ? 17 : 16, color: c.textSub, lineHeight: 22 },

  phraseRow: { marginBottom: 8 },
  phraseEn: { fontSize: 15, fontWeight: '600', color: c.text },
  phraseCn: { fontSize: 13, color: c.textMuted, marginTop: 2 },

  sentenceRow: { marginBottom: 10, backgroundColor: c.cardAlt, borderRadius: 8, padding: 10 },
  sentenceEn: { fontSize: 14, color: c.textSub, lineHeight: 20, fontStyle: 'italic' },
  sentenceCn: { fontSize: 12, color: c.textMuted, marginTop: 4 },

  relWordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relWordTag: {
    backgroundColor: c.cardAlt, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  relWordEn: { fontSize: 13, fontWeight: '600', color: c.text },
  relWordCn: { fontSize: 12, color: c.textMuted },

  // Done screen
  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: c.primary, marginBottom: 4 },
  doneSub: { fontSize: 15, color: c.textMuted, marginBottom: 24 },
  summaryCard: {
    width: '100%', backgroundColor: c.card, borderRadius: 18, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: c.border,
  },
  summaryDivider: { height: 1, backgroundColor: c.border },
  continueBtn: {
    width: '100%', backgroundColor: c.info, borderRadius: 24,
    paddingVertical: 15, alignItems: 'center', marginBottom: 12,
  },
  continueBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  backBtn: {
    width: '100%', borderRadius: 24, paddingVertical: 15, alignItems: 'center',
    borderWidth: 1.5, borderColor: c.borderMid,
  },
  backBtnText: { fontSize: 17, fontWeight: '600', color: c.textMuted },
});
