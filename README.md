<div align="center">

# 📖 墨墨背单词

**基于艾宾浩斯遗忘曲线的考研词汇 App**

![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=flat-square&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-51.0-000020?style=flat-square&logo=expo&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Local_DB-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Android_|_iOS-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-brightgreen?style=flat-square)

<br/>

> 告别死记硬背 — 科学安排复习时间，让单词真正留在记忆里。

</div>

---

## ✨ 功能特性

| 功能 | 描述 |
|------|------|
| 📅 **制定计划** | 灵活选择每日背词数量（10 / 20 / 30 / 50 / 100），自动估算完成周期 |
| 🧠 **记忆曲线** | 三档评分驱动间隔重复，科学安排下次复习时间 |
| 🔁 **智能排队** | 优先展示到期复习词，空余名额再抽取新词，当日遗忘词自动追加 |
| 📊 **学习统计** | 掌握率进度条、近 7 天学习量、连续打卡天数 |
| 💾 **完全离线** | SQLite 本地存储，无需网络、无需服务器 |
| 📱 **可打包 APK** | 支持通过 EAS Build 一键打包为 Android APK |

---

## 🔬 记忆曲线规则

本 App 基于 **艾宾浩斯遗忘曲线**，每次评分后自动调度下次复习日期：

```
😵  忘  记  →  当日重新加入队列，立刻再学
🤔  模  糊  →  next_review = today + random(1, 2) 天
✅  牢  记  →  next_review = today + random(40, 60) 天
```

> 标记"牢记"的单词不会消失，40–60 天后会再次出现进行长期巩固。

---

## 🗂️ 项目结构

```
vocab-app/
├── App.js                      # 根组件，导航入口
├── app.json                    # Expo 配置
├── eas.json                    # EAS Build 打包配置
├── package.json
├── babel.config.js
│
├── assets/
│   └── words.json              # 6,276 个考研单词（内嵌）
│
└── src/
    ├── database/
    │   └── db.js               # SQLite 操作 + 间隔重复核心逻辑
    ├── screens/
    │   ├── SetupScreen.js      # 制定计划页
    │   ├── HomeScreen.js       # 今日首页
    │   ├── StudyScreen.js      # 背单词卡片页
    │   └── StatsScreen.js      # 统计页
    └── utils/
        └── dateUtils.js        # 日期工具函数
```

---

## 🗄️ 数据库设计

使用 `expo-sqlite` 实现本地持久化，共 4 张表：

```sql
words           -- 词库 + 每个单词的学习状态（status, next_review_date 等）
daily_schedule  -- 每日学习计划（含重复复习条目 retry）
settings        -- 用户配置（daily_count, start_date）
study_log       -- 每次学习记录（用于统计与连续打卡）
```

**单词状态流转：**

```
new  ──[首次学习]──▶  learning  ──[多次牢记]──▶  known
                         ▲                           │
                         └────────[到期复习]──────────┘
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm 或 yarn
- [Expo Go](https://expo.dev/client)（手机预览）或 Android 模拟器

### 安装 & 运行

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/vocab-app.git
cd vocab-app

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npx expo start
```

启动后：
- 📱 **手机**：安装 Expo Go，扫描终端中的二维码
- 🖥️ **模拟器**：按 `a` 启动 Android 模拟器（需安装 Android Studio）

---

## 📦 打包 APK

### 方式一：EAS Build（推荐 — 云端构建，无需配置本地环境）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号（免费注册）
eas login

# 首次使用，初始化项目
eas build:configure

# 构建 APK（内测安装包）
npm run build:apk
```

构建完成后，在 [expo.dev](https://expo.dev) 控制台下载 `.apk` 文件，传输到手机安装即可。

> 💡 如需上架 Google Play，使用 `npm run build:android` 构建 `.aab` 格式。

### 方式二：本地构建（需要 Android Studio + JDK 17）

```bash
# 导出原生 Android 项目
npx expo prebuild --platform android

# 进入 android 目录构建
cd android
./gradlew assembleRelease
```

APK 输出路径：
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📚 词库说明

内置词库为 `assets/words.json`，包含 **6,276 个考研核心词汇**，每个单词包含：

```json
{
  "refuse": {
    "word": "refuse",
    "phonetic": "/rɪˈfjuːz/",
    "trans": [
      { "pos": "v", "cn": "拒绝", "en": "to say firmly that you will not do something" }
    ],
    "phrases": [
      { "phrase": "refuse to do", "tran": "拒绝做某事" }
    ],
    "sentences": [
      { "en": "He refused to answer.", "cn": "他拒绝回答。" }
    ],
    "relWords": [
      { "word": "refusal", "pos": "n", "tran": "拒绝" }
    ]
  }
}
```

### 替换自定义词库

只需替换 `assets/words.json`，保持上述 JSON 结构即可支持任意词库（四六级、托福、GRE……）。

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [React Native 0.74](https://reactnative.dev/) | 跨平台 UI 框架 |
| [Expo 51](https://expo.dev/) | 开发工具链 + 原生 API |
| [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) | 本地 SQLite 数据库 |
| [@react-navigation](https://reactnavigation.org/) | 页面导航（Stack + BottomTabs） |
| [@expo/vector-icons](https://icons.expo.fyi/) | 图标库 |
| [EAS Build](https://docs.expo.dev/build/introduction/) | 云端 APK / AAB 构建 |

---

## 🤝 贡献

欢迎提交 Issue 和 PR！建议在 PR 中说明：

1. 改动的功能或修复的问题
2. 如涉及数据库结构变更，请同步更新 `db.js` 中的 `initDB()`

---

## 📄 License

[MIT](LICENSE) © 2025
