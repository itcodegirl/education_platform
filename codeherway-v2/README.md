# ⚡ CodeHerWay Learning Platform v2

> Archived reference only.
>
> This folder is legacy project material and is not the active application.
> The canonical app lives at the repository root.

An interactive coding education platform for women in tech — now with Supabase cloud sync, user authentication, bookmarks, notes, and a full visual glow-up.

**Live:** [codeherway1.netlify.app](https://codeherway1.netlify.app)

---

## 🆕 What's New in v2

### Architecture
- **Plain JSX** — no extra type layer, you own every line
- **Supabase backend** — all user data syncs to the cloud
- **Auth system** — email/password + Google + GitHub login
- **No localStorage dependency** — progress follows the user across devices

### New Features
- 🔐 **Authentication** — sign up, login, OAuth (Google/GitHub)
- ★ **Bookmarks** — save lessons, access from floating toolbar
- ✎ **Notes** — per-lesson notes with auto-save to Supabase
- 👤 **User profiles** — display name, avatar initial

### UI Glow-Up
- Smooth animations (fadeIn, scaleIn, float, glow, shimmer)
- Hover micro-interactions on cards, buttons, search results
- Animated auth page with grid background + floating glows
- Better mobile layout with improved touch targets
- Glassmorphic topbar with backdrop blur
- Loading screen with pulsing brand

---

## 🚀 Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase-schema.sql`
3. Enable **Email auth** in Authentication → Providers
4. (Optional) Enable **Google** and **GitHub** OAuth providers
5. Copy your **Project URL** and **anon key** from Settings → API

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Locally

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

### 4. Deploy to Netlify

**Option A: Git Deploy (recommended)**
1. Push to GitHub
2. Netlify → Add new site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add env vars in Netlify → Site settings → Environment variables

**Option B: CLI**
```bash
npm run build
npx netlify deploy --prod --dir=dist
```

---

## 📁 Project Structure

```
codeherway-v2/
├── supabase-schema.sql           ← Run this in Supabase SQL Editor
├── .env.example                  ← Copy to .env, add your keys
├── src/
│   ├── utils/
│   │   ├── supabase.js           ← Supabase client
│   │   ├── helpers.js            ← XP math, dates, reading time
│   │   ├── markdown.jsx          ← Lesson content renderer
│   │   └── iframeStyles.js       ← Code preview iframe CSS
│   ├── context/
│   │   ├── AuthContext.jsx       ← Auth (signup/login/OAuth/logout)
│   │   ├── ThemeContext.jsx      ← Dark/light theme
│   │   └── ProgressContext.jsx   ← All data synced to Supabase
│   ├── hooks/
│   │   └── useKeyboardNav.js     ← Keyboard shortcuts
│   ├── data/
│   │   ├── index.js              ← Course assembly
│   │   ├── quizzes.js            ← All quiz questions
│   │   ├── html/course.js        ← HTML course (14 modules)
│   │   ├── css/course.js         ← CSS course (14 modules)
│   │   ├── js/course.js          ← JS course (14 modules)
│   │   ├── react/course.js       ← React course (14 modules)
│   │   └── reference/            ← Cheatsheets, glossary, projects
│   ├── components/
│   │   ├── AuthPage.jsx          ← Login/signup page (NEW)
│   │   ├── Sidebar.jsx           ← Navigation + stats + user bar
│   │   ├── LessonView.jsx        ← Lesson + bookmarks + notes
│   │   ├── CodePreview.jsx       ← Code/Preview tabs
│   │   ├── QuizView.jsx          ← Interactive quizzes
│   │   ├── SearchPanel.jsx       ← Cross-course search (⌘K)
│   │   ├── BookmarksPanel.jsx    ← Saved lessons (NEW)
│   │   ├── CheatsheetPanel.jsx   ← Syntax reference
│   │   ├── GlossaryPanel.jsx     ← Searchable glossary
│   │   ├── ProjectsPanel.jsx     ← Build project ideas
│   │   ├── BadgesPanel.jsx       ← Achievement grid
│   │   ├── SRPanel.jsx           ← Spaced repetition
│   │   ├── BottomToolbar.jsx     ← Floating tool buttons
│   │   ├── XPPopup.jsx           ← XP gain animation
│   │   ├── BadgeUnlock.jsx       ← Badge unlock animation
│   │   └── ThemeToggle.jsx       ← Dark/light toggle
│   ├── styles/
│   │   └── App.css               ← All styles (upgraded)
│   ├── App.jsx                   ← Root component
│   └── main.jsx                  ← Entry point + providers
├── package.json
├── vite.config.js
└── netlify.toml
```

---

## 🗄️ Supabase Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Display name, avatar (auto-created on signup) |
| `progress` | Completed lessons, quiz scores, last position |
| `gamification` | XP, streak, daily goals, earned badges |
| `bookmarks` | Saved lessons |
| `notes` | Per-lesson notes |
| `sr_cards` | Spaced repetition review queue |

All tables have Row Level Security — users can only access their own data.

---

## ✨ Features

### 4 Course Tracks
| Course | Modules | Accent |
|--------|---------|--------|
| 🧱 HTML | 14 | `#ff6b9d` Pink |
| 🎨 CSS | 14 | `#4ecdc4` Cyan |
| ⚡ JavaScript | 14 | `#ffa726` Amber |
| ⚛️ React | 14 | `#a78bfa` Purple |

### Learning Tools
- ✏️ Code preview with Code/Preview tabs
- 📝 Quiz questions (lesson + module level)
- 🔍 Cross-course search (⌘K or /)
- 📋 Cheat sheets per course
- 📖 Searchable glossary
- 🔨 Build project ideas
- ★ Bookmarks (NEW)
- ✎ Per-lesson notes (NEW)

### Gamification
- ⭐ XP system with level progression
- 🏆 16 earnable badges with unlock animations
- 🔥 Streak tracking
- 🎯 Daily goal tracker
- 🔄 Spaced repetition

### Auth & Cloud
- 🔐 Email/password authentication
- 🔗 Google + GitHub OAuth
- ☁️ All progress synced to Supabase
- 📱 Works across devices

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Navigate lessons |
| `D` | Toggle mark done |
| `⌘K` or `/` | Open search |
| `1` `2` `3` `4` | Switch courses |
| `M` | Toggle sidebar (mobile) |
| `Esc` | Close any panel |

---

## 🛠️ Tech Stack

- **UI:** React 18 (JSX-first)
- **Build:** Vite
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Styling:** Custom CSS with CSS Variables
- **Deploy:** Netlify (static)

---

## 📄 License

© 2025 CodeHerWay. All rights reserved.

Built with 💪 by [CodeHerWay](https://codeherway.com) — empowering women in tech.
