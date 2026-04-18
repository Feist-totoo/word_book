# 墨墨背单词 — 本地版 (React Native / Expo)

> 基于艾宾浩斯遗忘曲线的考研词汇 App，支持打包为 Android APK。

## 功能

| 功能 | 说明 |
|------|------|
| 制定计划 | 选择每日背单词数量，自动估算完成天数 |
| 智能排队 | 优先展示到期复习词，再随机抽取新词 |
| 记忆曲线 | 忘记→当日重学 / 模糊→1-2天后 / 牢记→40-60天后 |
| 进度统计 | 待学/学习中/已掌握分布，近7天学习量，连续打卡 |
| 离线运行 | SQLite 本地存储，无需网络或服务器 |

## 目录结构

```
vocab-app/
├── App.js                     # 根组件 + 导航
├── app.json                   # Expo 配置
├── eas.json                   # EAS Build 配置（打包 APK）
├── package.json
├── babel.config.js
├── assets/
│   └── words.json             # 6276 个考研单词
└── src/
    ├── database/
    │   └── db.js              # SQLite 操作 + 间隔重复逻辑
    ├── screens/
    │   ├── SetupScreen.js     # 制定计划
    │   ├── HomeScreen.js      # 今日首页
    │   ├── StudyScreen.js     # 背单词卡片
    │   └── StatsScreen.js     # 统计页
    └── utils/
        └── dateUtils.js       # 日期工具
```

---

## 本地开发

### 1. 安装依赖（需要 Node.js ≥ 18）

```bash
cd vocab-app
npm install
```

### 2. 启动开发服务器

```bash
npx expo start
```

然后：
- 用手机扫二维码（安装 Expo Go App）
- 或按 `a` 启动 Android 模拟器

---

## 打包 APK（正式安装包）

### 方式一：EAS Build（推荐，云端构建）

1. 注册 [Expo 账号](https://expo.dev/signup)（免费）

2. 安装 EAS CLI：
   ```bash
   npm install -g eas-cli
   eas login
   ```

3. 初始化项目（首次）：
   ```bash
   eas build:configure
   ```

4. 构建 APK：
   ```bash
   # 内测 APK（直接安装到手机）
   npm run build:apk

   # 或正式 AAB（上架 Google Play）
   npm run build:android
   ```

5. 构建完成后下载 `.apk` 文件，发送到手机安装即可。

### 方式二：本地构建（需要 Android Studio）

```bash
# 导出原生项目
npx expo prebuild --platform android

# 进入 android 目录用 Gradle 构建
cd android
./gradlew assembleRelease
```

APK 输出路径：`android/app/build/outputs/apk/release/app-release.apk`

---

## 数据说明

### 数据库（SQLite — vocab_app.db）

| 表 | 说明 |
|----|------|
| `words` | 全部词库，含 status / next_review_date 等学习状态 |
| `daily_schedule` | 每日学习计划（含重复复习条目） |
| `settings` | 用户设置（daily_count, start_date） |
| `study_log` | 每次学习记录（用于统计 / 连续打卡） |

### 间隔重复逻辑

```
忘记 (unknown)  → 当日 retry 队列，再次学习
模糊 (vague)    → next_review_date = today + rand(1,2) 天
牢记 (known)    → next_review_date = today + rand(40,60) 天
```

---

## 常见问题

**Q: 首次启动很慢？**  
A: 首次会将 6276 个单词写入 SQLite，约需 3–5 秒，之后正常。

**Q: 如何重置进度？**  
A: 首页 → 设置 → 重置所有进度。

**Q: 如何更换词库？**  
A: 替换 `assets/words.json`，保持相同结构即可。words.json 结构：
```json
{
  "words": {
    "word_key": {
      "word": "refuse",
      "phonetic": "/rɪˈfjuːz/",
      "trans": [{ "pos": "v", "cn": "拒绝" }],
      "phrases": [{ "phrase": "refuse to do", "tran": "拒绝做某事" }],
      "sentences": [{ "en": "He refused.", "cn": "他拒绝了。" }],
      "relWords": [{ "word": "refusal", "pos": "n", "tran": "拒绝" }]
    }
  }
}
```
