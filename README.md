# Commus — Privacy-First Community Safety & Crisis Early-Warning Platform

**Commus** is a decentralized, privacy-preserving incident reporting, crisis early-warning, and rapid emergency coordination platform. It bridges citizens, neighborhood communities, and emergency authorities to share critical hazard intelligence while rigorously safeguarding reporter identity, preventing vigilante conflict, and eliminating language barriers through multimodal AI.

---

## 🌟 What Commus Does

Commus transforms how communities report and respond to civil emergencies, environmental hazards, and public safety threats:

### 1. 🛡️ Live Incident Reporting & Realtime Safety Feed
- **Instant Hazard Feeds**: Live incident bulletins powered by Firebase Realtime Database with sub-second synchronization across all connected clients.
- **Danger Level Telemetry**: Standardized threat levels (**LOW**, **MEDIUM**, **HIGH**, **CRITICAL**) with visual warnings, safety banners, and actionable advice.
- **Incident Verification & Community Voting**: Verified community members can vote on incident veracity and validity, elevating critical consensus while filtering misinformation.
- **Status Lifecycle Workflow**: Tracks incidents through formal stages: `under_review` ➔ `verified` ➔ `escalated` ➔ `resolved`.

### 2. 🎙️ Multimodal Voice Reporting & AI Transcription
- **Hands-Free Incident Capture**: Citizens in transit or stressful situations can record voice incident reports using the Web Speech API.
- **Gemini AI Audio Processing**: Automatically transcribes voice recordings and analyzes content to extract incident title, objective description, category, and danger rating.
- **Rule-Based Emergency Fallback**: Gracefully parses keyword-based safety categories if cloud AI is unavailable.

### 3. 🌐 Multilingual Crisis Translation & Speech Synthesis (TTS)
- **Universal Accessibility**: Every incident report and official safety guide features a **Text-to-Speech (TTS)** voice player and **Gemini AI translation**.
- **8 Crisis Languages**: Instantly translate safety bulletins into **English**, **Arabic** (العربية), **French** (Français), **Portuguese** (Português), **Swahili** (Kiswahili), **Yoruba** (Èdè Yorùbá), **Hausa** (Harshen Hausa), and **Igbo** (Asụsụ Igbo).
- **Audio Playback**: Synthesizes speech locally in the user's selected language, ensuring illiterate or visually impaired citizens receive life-saving instructions.

### 4. 🌍 Full Platform Localization (9 Languages & Native RTL)
- **Comprehensive UI Translation**: Complete platform navigation, modals, forms, validation, and alerts available in 9 languages:
  - 🇬🇧 English (`en`)
  - 🇸🇦 Arabic (`ar`) — *Full Right-to-Left (RTL) mirrored layout*
  - 🇫🇷 French (`fr`)
  - 🇵🇹 Portuguese (`pt`)
  - 🇳🇬 Hausa (`ha`)
  - 🇳🇬 Yoruba (`yo`)
  - 🇳🇬 Nigerian Pidgin (`pcm`)
  - 🇰🇪 Swahili (`sw`)
  - 🇳🇬 Igbo (`ig`)
- **Instant Switcher**: Seamless language toggle in the header navigation that persists across browser sessions.

### 5. 🔒 Zero-Knowledge Privacy & Differential Security
- **Reporter Identity Isolation**: Real user identifiers and profile PII are strictly severed from public records (`/incidents`) and stored in isolated, access-restricted directories (`/incidentReportersPrivate`).
- **Geohash Location Fuzzing**: Public feeds display fuzzed coordinate boxes (~1.2km blur radius). Exact GPS coordinates are AES-256 encrypted at rest and accessible solely to authorized emergency dispatchers.
- **Server-Side EXIF Stripping**: Media evidence uploads automatically have GPS telemetry, camera serials, and device metadata permanently scrubbed prior to storage.
- **Anonymous Submission Barrier**: Anonymous users can browse public bulletins but **cannot** submit reports, preventing bot spam and unverified hoaxing.

### 6. 🚨 Audited Authority Escalation
- **Multi-Agency Dispatch**: Community leaders and platform admins can escalate verified high-risk incidents to emergency authorities (Police, Fire, Medical, Civil Defense).
- **Cryptographic Audit Log**: Every escalation action generates an immutable SHA-256 digital audit record logging actor pseudonym, target authority, timestamp, and payload digest.

### 7. 🎓 Civic Education, Safety Quizzes & Badges
- **Interactive Training**: Interactive crisis preparation modules covering riot evasion, flash flood safety, fire response, and non-confrontation protocols.
- **Gamified Safety Badges**: Users earn civic credentials (e.g., *Safety Scout*, *Community Guardian*, *First Responder Ally*) by participating in safety drills and reading guidance.

### 8. 🤝 Community Safety Zones & Referral Program
- **Geographic Safety Circles**: Create and join localized community safety zones (neighborhoods, campuses, commercial districts).
- **Community Referral Engine**: Share personalized invite links, track active referrals, and unlock community recognition tiers.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| --- | --- |
| **Frontend Framework** | [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Class Variance Authority](https://cva.style/) |
| **Realtime Database** | [Firebase Realtime Database (RTDB)](https://firebase.google.com/docs/database) |
| **Authentication** | [Firebase Authentication](https://firebase.google.com/docs/auth) with Custom Claims RBAC |
| **Cloud Storage** | [Firebase Cloud Storage](https://firebase.google.com/docs/storage) with server-side metadata sanitization |
| **Generative AI & Audio** | [Google Gemini 1.5 Flash](https://deepmind.google/technologies/gemini/), Web Speech Recognition & Web Speech Synthesis API |
| **Testing** | [Vitest](https://vitest.dev/) (25 test suites, 146 unit & integration tests) |

---

## 🚀 Getting Started (How to Run Locally)

Follow these instructions to clone, configure, and run the Commus platform on your local workstation:

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js**: v20.0.0 or higher (`v22` / `v25` supported)
- **npm**: v10.0.0 or higher (or `pnpm` / `yarn`)
- **Git**: v2.30+

Verify your local installation:
```bash
node -v
npm -v
```

### 2. Clone the Repository
```bash
git clone https://github.com/belloshehu/commus.git
cd commus
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the template configuration file to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and configure your keys. For local testing without a live Firebase backend, the built-in mock and synthetic fallback drivers allow the platform to run seamlessly out of the box:
```env
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Default Platform Language
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Cryptographic Secret for AES-256 Location Encryption (32-byte hex string)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Google Gemini API Key (Optional for local testing; activates AI translation & voice transcription)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Client Configuration (Optional for mock mode; required for live Firebase sync)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-app-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to explore the dashboard.

### 6. Run Automated Tests
Execute the complete test suite across all 25 test specifications:
```bash
npm test
```
Or run Vitest in watch mode:
```bash
npx vitest
```

### 7. Run Code Quality Checks
Verify TypeScript types and ESLint conformance:
```bash
npm run type-check
npm run lint
```

### 8. Production Build & Deployment
Build an optimized production distribution:
```bash
npm run build
```
Preview the production build locally:
```bash
npm start
```

---

## 📁 Repository Structure

```text
commus/
├── src/
│   ├── app/                      # Next.js App Router routes & endpoints
│   │   ├── api/                  # RESTful API handlers (incidents, AI, badges, admin)
│   │   │   ├── ai/               # Gemini AI translation & transcription endpoints
│   │   │   ├── authority/        # Authority escalation & dispatch endpoints
│   │   │   ├── badges/           # Civic education evaluation endpoints
│   │   │   └── incidents/        # Incident submission & voting endpoints
│   │   ├── incidents/[id]/       # Incident detail view with TTS & AI translation
│   │   ├── login/                # User authentication & Google OAuth portal
│   │   ├── profile/              # User profile, privacy controls & referral tier
│   │   ├── layout.tsx            # Root layout with I18nProvider & AppShell
│   │   └── page.tsx              # Main dashboard with tabbed navigation
│   ├── components/               # Modular UI component library
│   │   ├── about/                # About Commus interactive platform showcase
│   │   ├── admin/                # Role management & audit dispatch portal
│   │   ├── authority/            # Official emergency contacts & directory
│   │   ├── education/            # Safety campaigns, quizzes & badge viewer
│   │   ├── guidance/             # Safety guidance cards, media viewer & TTS
│   │   ├── incident/             # Incident feed, wizard, AI translator modal
│   │   ├── shell/                # AppShell, Header, Sidebar, MobileNav
│   │   └── ui/                   # Reusable UI primitives (Buttons, Cards, Badges)
│   └── lib/                      # Core business logic, SDKs & utilities
│       ├── firebase/             # Firebase Auth, RTDB & Storage client modules
│       ├── guidance/             # Safety guidance data access
│       ├── i18n/                 # 9-language translation framework & dictionaries
│       │   ├── locales/          # en, ar, fr, pt, ha, yo, pcm, sw, ig
│       │   ├── context.tsx       # React I18nProvider & useTranslation hook
│       │   └── types.ts          # TranslationSchema & SupportedLocale types
│       ├── authorization.ts      # Canonical RBAC permissions evaluator (can())
│       ├── location.ts           # Geohash fuzzing & AES-256 encryption engine
│       ├── referrals.ts          # Referral tracking & level progression engine
│       └── security.ts           # Session validation, rate limiting & XSS sanitizer
├── tests/                        # Vitest automated test suites (25 files)
├── docs/                         # Architecture, Security, and Data Specifications
│   ├── ARCHITECTURE.md           # System component decoupled architecture
│   ├── AUTHORIZATION.md          # RBAC roles and permissions specification
│   ├── DATA_MODEL.md             # Firebase RTDB node schemas and indexes
│   ├── SECURITY.md               # Threat model, location privacy, and audit specs
│   └── DEVELOPMENT_RULES.md      # Development policy and workflow standards
├── COMMUS_PROJECT_RULES.md       # Core privacy and non-confrontation directives
├── package.json                  # Dependencies, metadata & build scripts
└── README.md                     # Project documentation (this file)
```

---

## 🛡️ Safety & Non-Confrontation Policy

> [!IMPORTANT]
> **SAFETY FIRST: DO NOT CONFRONT CROWDS**  
> Commus is strictly an **early-warning and de-escalation platform**. Users must **NEVER** approach, photograph, or confront violent crowds, active hazard zones, or hostile demonstrations. Do not take the law into your own hands or attempt vigilante justice. Move immediately to a safe, secure location before reporting an incident.

---

## 📄 Documentation Reference

- 📜 [Project Rules & Mandates](COMMUS_PROJECT_RULES.md)
- 🏛️ [System Architecture](docs/ARCHITECTURE.md)
- 🔐 [Security & Threat Model](docs/SECURITY.md)
- 👥 [Role-Based Access Control (RBAC)](docs/AUTHORIZATION.md)
- 🗄️ [Data Model & Schema (RTDB)](docs/DATA_MODEL.md)
- 🛣️ [Project Roadmap](docs/ROADMAP.md)
- 📋 [Development Rules & Standards](docs/DEVELOPMENT_RULES.md)

---

## ⚖️ License & Acknowledgments

Developed with ❤️ for community safety, privacy preservation, and rapid crisis response.  
Powered by Next.js, Firebase, and Google Gemini AI.
