import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, FlatList, TextInput,
  ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useDimensions } from '../utils/responsive';
import { getLearnedWords } from '../database/db';
import { formatDate } from '../utils/dateUtils';

const STATUS_TABS = [
  { key: 'all',      label: '全部' },
  { key: 'known',    label: '已掌握' },
  { key: 'learning', label: '学习中' },
];

export default function WordListScreen() {
  const { colors: c } = useTheme();
  const layout = useDimensions();
  const s = makeStyles(c, layout);

  const [status, setStatus]     = useState('all');
  const [search, setSearch]     = useState('');
  const [words, setWords]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(0);
  const [hasMore, setHasMore]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState(null); // word detail modal

  const searchTimer = useRef(null);

  const fetchWords = useCallback(async (pg = 0, reset = true) => {
    if (pg === 0) setLoading(true);
    else setLoadingMore(true);

    const result = await getLearnedWords({ status, search, page: pg, pageSize: 40 });

    if (reset || pg === 0) {
      setWords(result.words);
    } else {
      setWords(prev => [...prev, ...result.words]);
    }
    setTotal(result.total);
    setHasMore(result.hasMore);
    setPage(pg);
    setLoading(false);
    setLoadingMore(false);
  }, [status, search]);

  useEffect(() => { fetchWords(0, true); }, [status]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchWords(0, true), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    fetchWords(page + 1, false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={s.wordItem} onPress={() => setSelected(item)} activeOpacity={0.7}>
      <View style={s.wordItemLeft}>
        <Text style={s.wordText}>{item.word}</Text>
        {item.phonetic ? <Text style={s.phoneticText}>{item.phonetic}</Text> : null}
        {item.trans?.[0] && (
          <Text style={s.transPreview} numberOfLines={1}>
            <Text style={s.posPreview}>{item.trans[0].pos}. </Text>
            {item.trans[0].cn}
          </Text>
        )}
      </View>
      <View style={s.wordItemRight}>
        <StatusBadge status={item.status} c={c} />
        <Text style={s.reviewCount}>×{item.review_count}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.headerRow}>
        <Text style={s.pageTitle}>📖 已学单词</Text>
        <Text style={s.totalText}>{total.toLocaleString()} 词</Text>
      </View>

      {/* Search bar */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="搜索单词…"
          placeholderTextColor={c.textFaint}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status tabs */}
      <View style={s.tabs}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, status === tab.key && s.tabActive]}
            onPress={() => setStatus(tab.key)}
          >
            <Text style={[s.tabText, status === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : words.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyText}>
            {search ? '没有找到匹配的单词' : '还没有学习过单词'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={layout.wordListCols}
          key={`cols-${layout.wordListCols}`}  // force re-render on orientation change
          contentContainerStyle={s.listContent}
          columnWrapperStyle={layout.wordListCols > 1 ? s.columnWrapper : null}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore
            ? <ActivityIndicator size="small" color={c.primary} style={{ padding: 16 }} />
            : null}
        />
      )}

      {/* Word detail modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
            <View style={s.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {selected && <WordDetail word={selected} c={c} s={s} />}
            </ScrollView>
            <TouchableOpacity style={s.modalClose} onPress={() => setSelected(null)}>
              <Text style={s.modalCloseText}>关闭</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function WordDetail({ word, c, s }) {
  return (
    <View style={s.detailContainer}>
      <Text style={s.detailWord}>{word.word}</Text>
      {word.phonetic && <Text style={s.detailPhonetic}>{word.phonetic}</Text>}
      <View style={s.detailMeta}>
        <StatusBadge status={word.status} c={c} />
        <Text style={s.detailMetaText}>复习 {word.review_count} 次</Text>
        {word.last_reviewed && (
          <Text style={s.detailMetaText}>最近：{formatDate(word.last_reviewed)}</Text>
        )}
        {word.next_review_date && (
          <Text style={s.detailMetaText}>下次：{formatDate(word.next_review_date)}</Text>
        )}
      </View>

      {word.trans?.length > 0 && (
        <>
          <Text style={s.detailSectionTitle}>释义</Text>
          {word.trans.map((t, i) => (
            <View key={i} style={s.detailTransRow}>
              <View style={s.posTag}><Text style={s.posText}>{t.pos}</Text></View>
              <Text style={s.detailTransText}>{t.cn}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function StatusBadge({ status, c }) {
  const cfg = {
    known:    { bg: c.primaryBg, color: c.primary,  label: '已掌握' },
    learning: { bg: c.warning + '25', color: c.warning, label: '学习中' },
    new:      { bg: c.border,    color: c.textMuted, label: '待学习' },
  }[status] || { bg: c.border, color: c.textMuted, label: status };

  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, color: cfg.color, fontWeight: '700' }}>{cfg.label}</Text>
    </View>
  );
}

const makeStyles = (c, layout) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: c.textMuted },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  pageTitle: { fontSize: layout.tablet ? 22 : 18, fontWeight: '700', color: c.text },
  totalText: { fontSize: 13, color: c.textMuted },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
    backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: c.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: c.text, padding: 0 },
  clearBtn: { fontSize: 14, color: c.textMuted, paddingLeft: 8 },

  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 10,
    backgroundColor: c.card, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: c.border,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: c.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
  tabTextActive: { color: '#fff' },

  listContent: { padding: 10, paddingBottom: 32 },
  columnWrapper: { gap: 8 },

  wordItem: {
    flex: 1, backgroundColor: c.card, borderRadius: 14, padding: 14,
    margin: 4, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', borderWidth: 1, borderColor: c.border,
    minWidth: 0,
  },
  wordItemLeft: { flex: 1, marginRight: 8, minWidth: 0 },
  wordText: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 2 },
  phoneticText: { fontSize: 12, color: c.textMuted, marginBottom: 4 },
  transPreview: { fontSize: 13, color: c.textSub },
  posPreview: { fontWeight: '700', color: c.info },
  wordItemRight: { alignItems: 'flex-end', gap: 6 },
  reviewCount: { fontSize: 12, color: c.textMuted },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '80%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: c.borderMid,
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  modalClose: {
    marginTop: 16, backgroundColor: c.cardAlt, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: c.border,
  },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: c.textSub },

  detailContainer: { paddingBottom: 8 },
  detailWord: { fontSize: 38, fontWeight: '800', color: c.text, marginBottom: 4 },
  detailPhonetic: { fontSize: 16, color: c.textMuted, marginBottom: 12 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  detailMetaText: { fontSize: 13, color: c.textMuted },
  detailSectionTitle: {
    fontSize: 11, color: c.textMuted, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 10,
  },
  detailTransRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  posTag: { backgroundColor: c.infoBg, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginTop: 1 },
  posText: { fontSize: 11, color: c.info, fontWeight: '700' },
  detailTransText: { flex: 1, fontSize: 16, color: c.textSub, lineHeight: 22 },
});
