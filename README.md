# Masters Tracker 🎓

A beautiful, dark-themed master's degree progress tracker with orbital course visualization, semester planning, and smart suggestions.

## ✨ Features

- **Orbital Course Visualization** - Courses orbit around your degree core like planets
- **Semester Planning** - Department offers 4 courses, you pick 2-3 (6-9 credits)
- **Progress Tracking** - Status: Pending → Registered → Passed → Failed
- **Smart Suggestions** - Rule-based recommendations for next semester
- **Multi-Major Support** - SWE, CSA, CIS (extensible)
- **Guest Mode** - Try without account, data stored locally
- **Full Auth** - Email/password with PocketBase
- **Free Hosting** - Vercel + PocketBase (local + Cloudflare Tunnel / GCP Free Tier)

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Framer Motion |
| Backend | PocketBase (SQLite, Realtime, Auth, File Storage) |
| Database | PocketBase Collections (SQLite) |
| Scraping | Playwright (Chromium) |
| Deployment | Vercel (Frontend), Docker + Cloudflare Tunnel (Backend) |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm (or npm/yarn)

### 1. Clone & Install

```bash
cd masters_tracker_02
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

Required variables:
```env
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
PB_ENCRYPTION_KEY=your-32-char-base64-key
PB_ADMIN_EMAIL=admin@masterstracker.local
PB_ADMIN_PASSWORD=secure-password
```

Generate encryption key:
```bash
openssl rand -base64 32
```

### 3. Start PocketBase

```bash
# Start PocketBase in background
npm run db:start

# Or with full stack (PocketBase + Next.js)
npm run full:dev
```

PocketBase Admin UI: http://localhost:8090/_/

### 4. Run Migrations

Migrations run automatically on PocketBase startup. Check Admin UI > Settings > Migrations.

### 5. Seed Major Data

In PocketBase Admin UI > Collections > majors > New Record, add the three majors from `pb_migrations/1700000005_seed_majors.js`.

Or use the API:
```bash
# After PocketBase is running
curl -X POST http://localhost:8090/api/collections/majors/records \
  -H "Content-Type: application/json" \
  -d '{"id":"swe","name":"Software Engineering","nameAr":"هندسة البرمجيات","collegeId":"100000","courseIdPrefix":"1210037","thesisPatterns":[...],"creditsPerCourse":3,"maxCoursesPerSemester":3,"minCoursesPerSemester":2,"typicalCoursesOffered":4,"totalCreditsRequired":33,"thesisCreditsRequired":9,"courseCreditsRequired":24}'
```

### 6. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 🌐 Free Production Deployment

### Frontend: Vercel (Free)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Backend: PocketBase (Free Options)

#### Option A: Local + Cloudflare Tunnel (Recommended for Dev)
```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# Quick tunnel (random subdomain)
./cloudflared tunnel --url http://localhost:8090

# Or named tunnel (persistent subdomain)
./cloudflared tunnel login
./cloudflared tunnel create masters-tracker
./cloudflared tunnel route dns masters-tracker api.yourdomain.com
./cloudflared tunnel run masters-tracker
```

#### Option B: Google Cloud Free Tier (Always Free)
- e2-micro instance (0.25 vCPU, 1GB RAM, 30GB disk)
- Regions: us-central1, us-west1, us-east1
- Requires credit card verification (no charges if in free tier)
- Run PocketBase as systemd service

#### Option C: Oracle Cloud Always Free
- 1 OCPU, 1GB RAM, 47GB disk
- Never sleeps
- Note: Some reports of random account deletions

## 📁 Project Structure

```
masters_tracker_02/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main single-page app
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Space theme design tokens
│   │   └── providers.tsx      # Context providers
│   ├── components/
│   │   ├── orbital/           # Orbital visualization
│   │   │   ├── OrbitalView.tsx
│   │   │   └── Starfield.tsx
│   │   ├── panels/            # UI panels
│   │   │   ├── SemesterPlanner.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   └── SuggestionPanel.tsx
│   │   ├── auth/              # Auth forms
│   │   │   └── AuthForms.tsx
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/
│   │   └── use-pocketbase.ts  # React hooks for PB
│   ├── lib/
│   │   ├── pocketbase/        # PB client & schema
│   │   │   ├── client.ts
│   │   │   └── schema.ts
│   │   ├── scraper/           # HU course scraper
│   │   │   ├── hu-client.ts
│   │   │   └── cli.ts
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── index.ts           # TypeScript types
├── pb_migrations/             # PocketBase migrations
├── docker-compose.yml         # Local dev stack
├── Dockerfile.dev             # Next.js dev container
└── .env.example              # Environment template
```

## 🎨 Design System

### Space Theme (Dark Only)

```css
/* Core Colors (OKLCH) */
--space-void: oklch(0.06 0 0);           /* Background */
--space-deep: oklch(0.10 0.015 265);     /* Cards */
--space-glass: oklch(0.20 0.02 265 / 0.55); /* Glass morphism */

--nebula-primary: oklch(0.62 0.22 272);  /* Primary accent */
--nebula-glow: oklch(0.75 0.25 280);     /* Glows */

--star-white: oklch(0.96 0.005 265);     /* Primary text */
--starlight-dim: oklch(0.62 0.015 265);  /* Secondary text */

/* Status Colors */
--status-pending: oklch(0.68 0.18 75);
--status-registered: oklch(0.58 0.18 200);
--status-passed: oklch(0.58 0.18 142);
--status-failed: oklch(0.55 0.22 25);
```

### Typography

- **Headings**: Space Grotesk (geometric, technical)
- **Body**: IBM Plex Sans (readable, supports Arabic)
- **Mono**: JetBrains Mono (course codes, credits)

## 🕷️ Course Scraping

Scrape master's courses from Hashemite University:

```bash
# Scrape all majors
npm run scrape

# Scrape specific major
npm run scrape:swe
npm run scrape:csa
npm run scrape:cis
```

### Scraper Details

- **Target**: `https://hu.edu.jo/unitCenter/class_a.aspx?t=0&unitid=40000000`
- **College**: Prince Hussein College of IT (100000)
- **Patterns**: 
  - Non-thesis: `1210037XX`
  - Thesis: `91003799` (9hr), `61003799` (6hr), `31003799` (3hr)
- **Department**: Auto-discovered by name matching

## 📊 Data Model

### Major Config
```typescript
{
  id: 'swe',
  name: 'Software Engineering',
  collegeId: '100000',
  courseIdPrefix: '1210037',
  thesisPatterns: [...],
  creditsPerCourse: 3,
  maxCoursesPerSemester: 3,
  minCoursesPerSemester: 2,
  typicalCoursesOffered: 4,
  totalCreditsRequired: 33,
  thesisCreditsRequired: 9,
  courseCreditsRequired: 24,
}
```

### Course
```typescript
{
  courseId: '121003701',
  code: 'SWE 701',
  nameAr: '...',
  nameEn: 'Advanced Software Engineering',
  credits: 3,
  type: 'core' | 'elective' | 'thesis',
  semesterOffered: ['fall', 'spring'],
  isThesis: false,
}
```

### User Progress
```typescript
{
  userId: '...',
  majorId: 'swe',
  courseId: '121003701',
  status: 'pending' | 'registered' | 'passed' | 'failed',
  semester: '2025-fall',
  grade: 85,
  creditsEarned: 3,
}
```

## 🔐 Authentication

- **Guest Mode**: localStorage only, wiped on tab close
- **Registered**: PocketBase email/password, persistent
- **Upgrade Flow**: Guest → Account migration

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type check
npx tsc --noEmit
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run scrape` | Scrape all majors |
| `npm run scrape:swe` | Scrape SWE only |
| `npm run db:start` | Start PocketBase (Docker) |
| `npm run db:stop` | Stop PocketBase |
| `npm run full:dev` | Full stack dev |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run lint & type check
5. Submit PR

## 📄 License

MIT License - feel free to use for your own master's tracking!

## 🙏 Acknowledgments

- [PocketBase](https://pocketbase.io/) - Amazing backend in a single binary
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful accessible components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [Framer Motion](https://www.framer.com/motion/) - Smooth animations
- [Hashemite University](https://hu.edu.jo/) - Course data source