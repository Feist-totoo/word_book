import * as SQLite from 'expo-sqlite';
import { getToday, addDays, randomBetween } from '../utils/dateUtils';

let _db = null;
const getDB = async () => {
  if (!_db) _db = await SQLite.openDatabaseAsync('vocab_app_v2.db');
  return _db;
};

// ─── Schema ──────────────────────────────────────────────────────────────────

export const initDB = async () => {
  const db = await getDB();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS words (
      id               TEXT PRIMARY KEY,
      word             TEXT NOT NULL,
      phonetic         TEXT,
      trans            TEXT,
      phrases          TEXT,
      sentences        TEXT,
      rel_words        TEXT,
      status           TEXT NOT NULL DEFAULT 'new',
      next_review_date TEXT,
      review_count     INTEGER NOT NULL DEFAULT 0,
      correct_count    INTEGER NOT NULL DEFAULT 0,
      last_reviewed    TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_schedule (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL,
      word_id     TEXT NOT NULL,
      completed   INTEGER NOT NULL DEFAULT 0,
      result      TEXT,
      added_type  TEXT NOT NULL DEFAULT 'plan'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS study_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      date      TEXT NOT NULL,
      word_id   TEXT NOT NULL,
      result    TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_schedule_date ON daily_schedule(date, completed);
    CREATE INDEX IF NOT EXISTS idx_words_status  ON words(status, next_review_date);
    CREATE INDEX IF NOT EXISTS idx_log_date      ON study_log(date);
  `);
};

// ─── Seed ─────────────────────────────────────────────────────────────────────

export const loadWordsFromJSON = async () => {
  const db = await getDB();
  const row = await db.getFirstAsync('SELECT COUNT(*) as cnt FROM words');
  if (row.cnt > 0) return;

  const wordsData = require('../../assets/words.json');
  const entries = Object.entries(wordsData.words || {});
  const BATCH = 200;

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const placeholders = batch.map(() => '(?,?,?,?,?,?,?)').join(',');
    const values = batch.flatMap(([id, w]) => [
      id, w.word, w.phonetic || null,
      JSON.stringify(w.trans || []),
      JSON.stringify(w.phrases || []),
      JSON.stringify(w.sentences || []),
      JSON.stringify(w.relWords || []),
    ]);
    await db.runAsync(
      `INSERT OR IGNORE INTO words (id,word,phonetic,trans,phrases,sentences,rel_words) VALUES ${placeholders}`,
      values
    );
  }
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const getSetting = async (key) => {
  const db = await getDB();
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
};

export const setSetting = async (key, value) => {
  const db = await getDB();
  await db.runAsync('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)', [key, String(value)]);
};

// ─── Plan ─────────────────────────────────────────────────────────────────────

export const setupPlan = async (dailyCount) => {
  await setSetting('daily_count', dailyCount);
  await setSetting('start_date', getToday());
};

export const getPlanInfo = async () => {
  const db = await getDB();
  const dailyCount = parseInt((await getSetting('daily_count')) || '0', 10);
  const startDate = await getSetting('start_date');
  const { new_cnt }      = await db.getFirstAsync("SELECT COUNT(*) as new_cnt FROM words WHERE status='new'");
  const { learning_cnt } = await db.getFirstAsync("SELECT COUNT(*) as learning_cnt FROM words WHERE status='learning'");
  const { known_cnt }    = await db.getFirstAsync("SELECT COUNT(*) as known_cnt FROM words WHERE status='known'");
  const { total }        = await db.getFirstAsync('SELECT COUNT(*) as total FROM words');
  return {
    dailyCount, startDate, total,
    newCount: new_cnt,
    learningCount: learning_cnt,
    knownCount: known_cnt,
    estimatedDays: dailyCount > 0 ? Math.ceil(new_cnt / dailyCount) : 0,
  };
};

// ─── Schedule ─────────────────────────────────────────────────────────────────

export const generateTodaySchedule = async () => {
  const db = await getDB();
  const today = getToday();
  const dailyCount = parseInt((await getSetting('daily_count')) || '20', 10);

  const { cnt } = await db.getFirstAsync(
    "SELECT COUNT(*) as cnt FROM daily_schedule WHERE date=? AND added_type='plan'", [today]
  );
  if (cnt > 0) return;

  const dueRows = await db.getAllAsync(
    `SELECT id FROM words WHERE status!='new' AND next_review_date<=? ORDER BY next_review_date ASC LIMIT ?`,
    [today, dailyCount]
  );
  const wordIds = dueRows.map(r => r.id);

  const needed = dailyCount - wordIds.length;
  if (needed > 0) {
    const newRows = await db.getAllAsync(
      "SELECT id FROM words WHERE status='new' ORDER BY RANDOM() LIMIT ?", [needed]
    );
    wordIds.push(...newRows.map(r => r.id));
  }

  if (wordIds.length === 0) return;

  const placeholders = wordIds.map(() => "(?,?,'plan')").join(',');
  await db.runAsync(
    `INSERT INTO daily_schedule (date,word_id,added_type) VALUES ${placeholders}`,
    wordIds.flatMap(id => [today, id])
  );
};

export const getTodayQueue = async () => {
  const db = await getDB();
  const today = getToday();
  await generateTodaySchedule();

  const rows = await db.getAllAsync(
    `SELECT ds.id AS schedule_id, ds.word_id, ds.added_type,
            w.word, w.phonetic, w.trans, w.phrases, w.sentences, w.rel_words,
            w.status, w.review_count, w.correct_count
     FROM daily_schedule ds
     JOIN words w ON ds.word_id = w.id
     WHERE ds.date=? AND ds.completed=0
     ORDER BY ds.id ASC`,
    [today]
  );

  return rows.map(r => ({
    scheduleId: r.schedule_id,
    wordId: r.word_id,
    addedType: r.added_type,
    word: r.word,
    phonetic: r.phonetic,
    trans: JSON.parse(r.trans || '[]'),
    phrases: JSON.parse(r.phrases || '[]'),
    sentences: JSON.parse(r.sentences || '[]'),
    relWords: JSON.parse(r.rel_words || '[]'),
    status: r.status,
    reviewCount: r.review_count,
    correctCount: r.correct_count,
  }));
};

export const getTodayProgress = async () => {
  const db = await getDB();
  const today = getToday();
  await generateTodaySchedule();

  const { total }   = await db.getFirstAsync("SELECT COUNT(*) as total FROM daily_schedule WHERE date=? AND added_type='plan'", [today]);
  const { done }    = await db.getFirstAsync("SELECT COUNT(*) as done FROM daily_schedule WHERE date=? AND added_type='plan' AND completed=1", [today]);
  const { retries } = await db.getFirstAsync("SELECT COUNT(*) as retries FROM daily_schedule WHERE date=? AND added_type='retry' AND completed=0", [today]);

  return { total, done, retries };
};

// ─── Mark result ──────────────────────────────────────────────────────────────

export const markResult = async (scheduleId, wordId, result) => {
  const db = await getDB();
  const today = getToday();

  await db.runAsync('UPDATE daily_schedule SET completed=1, result=? WHERE id=?', [result, scheduleId]);
  await db.runAsync('INSERT INTO study_log (date,word_id,result) VALUES (?,?,?)', [today, wordId, result]);

  let nextDate, newStatus;
  if (result === 'unknown') {
    nextDate = today;
    newStatus = 'learning';
    await db.runAsync("INSERT INTO daily_schedule (date,word_id,added_type) VALUES (?,?,'retry')", [today, wordId]);
  } else if (result === 'vague') {
    nextDate = addDays(today, randomBetween(1, 2));
    newStatus = 'learning';
  } else {
    nextDate = addDays(today, randomBetween(40, 60));
    newStatus = 'known';
  }

  await db.runAsync(
    `UPDATE words SET status=?, next_review_date=?, review_count=review_count+1,
     correct_count=correct_count+${result==='known'?1:0}, last_reviewed=? WHERE id=?`,
    [newStatus, nextDate, today, wordId]
  );
};

// ─── Continue study ───────────────────────────────────────────────────────────

export const continueStudyToday = async (count = 20) => {
  const db = await getDB();
  const today = getToday();

  const scheduled = await db.getAllAsync(
    'SELECT word_id FROM daily_schedule WHERE date=?', [today]
  );
  const scheduledIds = scheduled.map(r => r.word_id);

  const excludeClause = scheduledIds.length > 0
    ? `AND id NOT IN (${scheduledIds.map(() => '?').join(',')})`
    : '';

  const newWords = await db.getAllAsync(
    `SELECT id FROM words WHERE status='new' ${excludeClause} ORDER BY RANDOM() LIMIT ?`,
    [...scheduledIds, count]
  );

  if (newWords.length === 0) return 0;

  const placeholders = newWords.map(() => "(?,?,'plan')").join(',');
  await db.runAsync(
    `INSERT INTO daily_schedule (date,word_id,added_type) VALUES ${placeholders}`,
    newWords.flatMap(w => [today, w.id])
  );

  return newWords.length;
};

// ─── Learned words list ───────────────────────────────────────────────────────

/**
 * Returns paginated list of words the user has studied.
 * status: 'known' | 'learning' | 'all' (default 'all' = known+learning)
 */
export const getLearnedWords = async ({ status = 'all', search = '', page = 0, pageSize = 50 } = {}) => {
  const db = await getDB();
  const offset = page * pageSize;

  let statusClause;
  if (status === 'known')    statusClause = "status='known'";
  else if (status === 'learning') statusClause = "status='learning'";
  else                       statusClause = "status IN ('known','learning')";

  const searchClause = search.trim()
    ? `AND word LIKE ?`
    : '';
  const params = search.trim()
    ? [`%${search.trim()}%`, pageSize, offset]
    : [pageSize, offset];

  const rows = await db.getAllAsync(
    `SELECT id, word, phonetic, trans, status, review_count, correct_count, last_reviewed, next_review_date
     FROM words
     WHERE ${statusClause} ${searchClause}
     ORDER BY last_reviewed DESC, word ASC
     LIMIT ? OFFSET ?`,
    params
  );

  const { total } = await db.getFirstAsync(
    `SELECT COUNT(*) as total FROM words WHERE ${statusClause} ${searchClause}`,
    search.trim() ? [`%${search.trim()}%`] : []
  );

  return {
    words: rows.map(r => ({
      ...r,
      trans: JSON.parse(r.trans || '[]'),
    })),
    total,
    hasMore: offset + pageSize < total,
  };
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getStats = async () => {
  const db = await getDB();
  const today = getToday();
  const plan = await getPlanInfo();

  const todayResults = await db.getAllAsync(
    `SELECT result, COUNT(*) as cnt FROM daily_schedule
     WHERE date=? AND completed=1 AND added_type='plan' GROUP BY result`,
    [today]
  );
  const todayMap = { unknown: 0, vague: 0, known: 0 };
  todayResults.forEach(r => { todayMap[r.result] = r.cnt; });

  const recentDays = await db.getAllAsync(
    `SELECT date, COUNT(*) as cnt FROM study_log WHERE date >= ? GROUP BY date ORDER BY date ASC`,
    [addDays(today, -6)]
  );

  let streak = 0;
  let checkDate = today;
  while (true) {
    const { cnt } = await db.getFirstAsync(
      "SELECT COUNT(*) as cnt FROM study_log WHERE date=?", [checkDate]
    );
    if (cnt === 0) break;
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  return { ...plan, todayMap, recentDays, streak };
};

// ─── Reset ────────────────────────────────────────────────────────────────────

export const resetPlan = async () => {
  const db = await getDB();
  // Keep theme setting
  const themeSaved = await getSetting('theme_mode');
  await db.runAsync('DELETE FROM settings');
  await db.runAsync('DELETE FROM daily_schedule');
  await db.runAsync('DELETE FROM study_log');
  await db.runAsync("UPDATE words SET status='new',next_review_date=NULL,review_count=0,correct_count=0,last_reviewed=NULL");
  if (themeSaved) await setSetting('theme_mode', themeSaved);
};
