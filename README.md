<p align="center">
  <img src="https://img.icons8.com/fluency/96/deciduous-tree.png" alt="Family Tree Logo" width="80" />
</p>

<h1 align="center">🌳 Family Tree</h1>

<p align="center">
  <strong>A beautiful, full-stack family tree web application to map your ancestry, track relationships, and preserve your family's history.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-Postgres+Auth-3FCF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel" alt="Vercel" />
</p>

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone & Install](#1-clone--install)
  - [2. Supabase Setup](#2-supabase-setup)
  - [3. Environment Variables](#3-environment-variables)
  - [4. Run the App](#4-run-the-app)
- [Database Schema](#-database-schema)
- [Authentication Flow](#-authentication-flow)
- [Pages & Routes](#-pages--routes)
- [Design System](#-design-system)
- [Component Library](#-component-library)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core
- 🌲 **Interactive Family Tree** — SVG-based pannable & zoomable tree visualisation with colour-coded generations
- 👤 **Rich Person Profiles** — Photos, life facts, biography, relationship tags, and timeline events
- 🔗 **Relationship Management** — Track parents, children, spouses, siblings, grandparents, cousins, and more
- 📸 **Photo Upload** — Upload from camera, device gallery, or paste a URL — stored securely in Supabase Storage
- 📅 **Timeline Events** — Record births, deaths, marriages, moves, graduations, military service, and custom events
- 🔍 **Real-time Search** — Instantly search across all family members by name

### User Experience
- 🚀 **3-Step Onboarding** — Guided setup: name your tree → add yourself → start exploring
- 📱 **Fully Responsive** — Works beautifully on mobile (375px+), tablet, and desktop
- 🎨 **Premium Design** — Custom colour palette, smooth animations, glassmorphism accents
- 🔔 **Toast Notifications** — Success/error feedback for all actions
- ⬇️ **Bottom Sheets** — Mobile-native modal pattern for forms and uploads

### Security
- 🔒 **Invite-Only Auth** — No public sign-ups; users are added by the admin
- 🛡️ **Row Level Security** — All database tables protected with per-user RLS policies
- 🔑 **Middleware Protection** — Every route is guarded; unauthenticated users are redirected to login
- 🚫 **Service Role Isolation** — Service key is never exposed to the client

### Extras
- 🖨️ **PDF Export** — Print your tree using the browser's print dialog with a clean print stylesheet
- 🔗 **Share Link** — Copy a shareable tree link to clipboard
- ⚙️ **Display Preferences** — Toggle dates, photos, compact layout (persisted in localStorage)
- 🔐 **Password Change** — Update password directly from settings

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) | Server/client rendering, routing, API routes |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Type safety across the entire codebase |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Utility-first styling with custom design tokens |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Relational data with Row Level Security |
| **Auth** | [Supabase Auth](https://supabase.com/auth) | Email/password authentication, invite flow |
| **Storage** | [Supabase Storage](https://supabase.com/storage) | Photo uploads in `avatars` bucket |
| **Auth Client** | [@supabase/ssr](https://www.npmjs.com/package/@supabase/ssr) | Server & client Supabase auth helpers |
| **Icons** | [Lucide React](https://lucide.dev/) | Beautiful, consistent SVG icons |
| **Deployment** | [Vercel](https://vercel.com/) | Zero-config Next.js hosting |

---

## 📸 Screenshots

| Login | Tree View | Person Profile |
|-------|-----------|----------------|
| Clean email/password form with invite-only notice | SVG tree with generation-coloured nodes, pan & zoom | Hero card, facts grid, relationship chips, timeline |

| Onboarding | Add Person | Settings |
|------------|-----------|----------|
| 3-step guided setup with progress dots | Form with relationship linking & photo upload | Account, security, display prefs, export |

> *Replace this section with actual screenshots once the app is running with data.*

---

## 📁 Project Structure

```
familytree/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (Inter font, metadata)
│   ├── page.tsx                  # Root redirect → /tree
│   ├── globals.css               # Tailwind directives, animations, print styles
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── onboarding/
│   │   └── page.tsx              # 3-step onboarding flow
│   ├── tree/
│   │   └── page.tsx              # Main tree view + people list + search
│   ├── person/
│   │   ├── new/
│   │   │   └── page.tsx          # Add new person form
│   │   └── [id]/
│   │       ├── page.tsx          # Person profile page
│   │       └── edit/
│   │           └── page.tsx      # Edit person form
│   ├── settings/
│   │   └── page.tsx              # User settings & preferences
│   └── api/
│       └── invite/
│           └── route.ts          # POST: admin invite user endpoint
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx         # Email/password form with error handling
│   │   └── ProtectedRoute.tsx    # Auth guard wrapper component
│   ├── tree/
│   │   ├── TreeCanvas.tsx        # SVG tree with pan/zoom/touch support
│   │   ├── PersonNode.tsx        # Person card rendered in SVG
│   │   └── RelationshipLine.tsx  # Solid/dashed lines connecting nodes
│   ├── person/
│   │   ├── PersonCard.tsx        # Profile hero section
│   │   ├── PersonForm.tsx        # Shared add/edit form with all fields
│   │   ├── RelationRow.tsx       # Horizontal scrollable relation chips
│   │   ├── PhotoUpload.tsx       # Camera/library/URL upload sheet
│   │   └── Timeline.tsx          # Chronological event list with icons
│   └── ui/
│       ├── Button.tsx            # Primary/secondary/ghost/danger variants
│       ├── Input.tsx             # Input, Textarea, Select with labels
│       ├── Sheet.tsx             # Bottom sheet / modal component
│       ├── Toast.tsx             # Toast notifications + context provider
│       ├── Avatar.tsx            # Photo or coloured initials with ring
│       └── FactGrid.tsx          # 2-column life facts display
│
├── hooks/
│   ├── useAuth.ts                # Auth state management + sign out
│   ├── useTree.ts                # Load trees, persons, relationships
│   └── usePerson.ts             # Load single person + relations + events
│
├── lib/
│   ├── supabase.ts               # Browser-side Supabase client
│   ├── supabase-server.ts        # Server-side Supabase client
│   ├── db.ts                     # All database CRUD functions
│   ├── storage.ts                # Photo upload/delete helpers
│   └── utils.ts                  # Formatting, tree layout, colours
│
├── types/
│   └── index.ts                  # All TypeScript interfaces
│
├── supabase/
│   └── schema.sql                # Complete SQL schema + RLS policies
│
├── middleware.ts                  # Auth middleware (route protection)
├── tailwind.config.ts             # Custom colour palette & design tokens
├── next.config.mjs                # Supabase image domain config
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Dependencies & scripts
├── postcss.config.mjs             # PostCSS + Tailwind
└── .env.local                     # Environment variables (not committed)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **Supabase account** ([sign up free](https://supabase.com/))
- A modern browser (Chrome, Firefox, Safari, Edge)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/familytree.git
cd familytree
npm install
```

### 2. Supabase Setup

#### a) Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) → **New Project**
2. Choose a name, set a database password, pick a region
3. Wait for the project to finish provisioning

#### b) Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the file [`supabase/schema.sql`](supabase/schema.sql)
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run** — this creates all 5 tables with Row Level Security policies:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile info (mirrors auth.users) |
| `trees` | Family trees (one user can have multiple) |
| `persons` | Family members in a tree |
| `relationships` | Connections between persons |
| `events` | Timeline entries (birth, death, marriage, etc.) |

#### c) Create the Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name: `avatars`
4. Public: **OFF**
5. Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`

#### d) Configure Auth (Invite-Only)

1. Go to **Authentication → Providers → Email**
2. Set **"Enable email signup"** to **OFF**
3. This ensures accounts can only be created by admin invitation

#### e) Create Your First User

Since sign-ups are disabled, you need to invite users manually:

**Option A — Via Supabase Dashboard (recommended):**
1. Go to **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter an email and password
4. The user can now sign in at `/login`

**Option B — Via Supabase Dashboard Invite:**
1. Go to **Authentication → Users → Invite user**
2. Enter the email — the user receives an invite link to set their password

### 3. Environment Variables

Copy `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Where to find these:**
1. Go to your Supabase project → **Settings → API**
2. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Security:** The `SUPABASE_SERVICE_ROLE_KEY` is only used server-side in `/api/invite`. It is **never** exposed to the browser. Do **not** commit `.env.local` to version control.

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## 🗄 Database Schema

```
┌──────────┐       ┌──────────┐       ┌──────────────┐
│  trees   │──1:N──│ persons  │──1:N──│   events     │
│          │       │          │       │              │
│ id (PK)  │       │ id (PK)  │       │ id (PK)      │
│ name     │       │ tree_id  │──FK──▶│ person_id    │
│ owner_id │──FK   │ first_   │       │ title        │
│ created  │  │    │   name   │       │ event_type   │
└──────────┘  │    │ last_    │       │ event_date   │
              │    │   name   │       │ event_place  │
              │    │ gender   │       └──────────────┘
              │    │ birth_   │
              │    │   date   │       ┌──────────────┐
              │    │ photo_   │       │relationships │
              │    │   url    │       │              │
              │    │ is_      │       │ id (PK)      │
              │    │  living  │       │ tree_id      │
              │    │ bio      │       │ person_id    │──FK
              │    └──────────┘       │ related_     │
              │                       │  person_id   │──FK
              ▼                       │ relationship │
         ┌──────────┐                │  _type       │
         │ profiles │                └──────────────┘
         │          │
         │ id (PK)  │──FK──▶ auth.users
         │ first_   │
         │   name   │
         │ email    │
         │ avatar   │
         └──────────┘
```

### Row Level Security Policies

| Table | Policy | Rule |
|-------|--------|------|
| `profiles` | View & update own | `auth.uid() = id` |
| `trees` | Full access to own | `auth.uid() = owner_id` |
| `persons` | Access in own tree | `tree.owner_id = auth.uid()` |
| `relationships` | Access in own tree | `tree.owner_id = auth.uid()` |
| `events` | Access for own persons | `person.tree.owner_id = auth.uid()` |

---

## 🔐 Authentication Flow

```
┌─────────┐     ┌────────────┐     ┌──────────────┐     ┌──────────┐
│  User   │────▶│  /login    │────▶│  Supabase    │────▶│ Check    │
│ visits  │     │  page      │     │  Auth        │     │ trees    │
│ any URL │     │            │     │  signIn()    │     │          │
└─────────┘     └────────────┘     └──────────────┘     └─────┬────┘
                                                              │
                                          ┌───────────────────┼───────────────────┐
                                          │                   │                   │
                                          ▼                   ▼                   ▼
                                   ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
                                   │ Has trees?  │   │ No trees?    │   │ Auth error?  │
                                   │ → /tree     │   │ → /onboarding│   │ → Show error │
                                   └─────────────┘   └──────────────┘   └─────────────┘
```

- **Middleware** intercepts every request (except `/login`, static files, and `/api`)
- Unauthenticated users are redirected to `/login`
- Authenticated users trying to access `/login` are redirected to `/tree`
- First-time users (no trees) are redirected to `/onboarding`

---

## 📄 Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Redirect | → `/tree` |
| `/login` | Public | Email + password sign-in form |
| `/onboarding` | Protected | 3-step setup: name tree → add yourself → success |
| `/tree` | Protected | Main view: SVG tree canvas, people list, search, bottom nav |
| `/person/[id]` | Protected | Person profile: hero card, facts, relationships, timeline |
| `/person/[id]/edit` | Protected | Edit form: all fields, photo upload, delete with confirmation |
| `/person/new` | Protected | Add person: form with optional relationship linking |
| `/settings` | Protected | Account, password, display toggles, export, sign out |
| `/api/invite` | API (POST) | Admin endpoint to invite new users via email |

---

## 🎨 Design System

### Colour Palette

The app uses a generation-based colour system to visually distinguish family members:

| Generation | Background | Foreground | Ring | Tailwind Class Prefix |
|------------|-----------|-----------|------|----------------------|
| Great-grandparents | `#EEEDFE` | `#3C3489` | `#7F77DD` | `tree-purple-*` |
| Grandparents | `#E6F1FB` | `#0C447C` | `#378ADD` | `tree-blue-*` |
| Parents | `#E1F5EE` | `#085041` | `#1D9E75` | `tree-green-*` |
| Self | `#E6F1FB` | `#185FA5` | `#185FA5` | `brand` |
| Children | `#FAEEDA` | `#633806` | `#BA7517` | `tree-amber-*` |
| Grandchildren | `#FBEAF0` | `#72243E` | `#D4537E` | `tree-pink-*` |

### Design Tokens

| Token | Value |
|-------|-------|
| **Font** | Inter → system font stack |
| **Card radius** | `12px` |
| **Sheet radius** | `20px` |
| **Avatar radius** | `50%` (fully round) |
| **Shadows** | `shadow-sm` only (subtle) |
| **Brand colour** | `#185FA5` |

### Animations

| Animation | Usage |
|-----------|-------|
| `slideUp` | Sheets/modals sliding up from bottom |
| `fadeIn` | Backdrop overlay appearance |
| Hover scale | Avatar and node hover effects |
| Spinner | Loading states with `animate-spin` |

---

## 🧩 Component Library

### UI Components

| Component | File | Props |
|-----------|------|-------|
| `Button` | `components/ui/Button.tsx` | `variant`, `size`, `loading`, `disabled` |
| `Input` | `components/ui/Input.tsx` | `label`, `error`, `hint` |
| `Textarea` | `components/ui/Input.tsx` | `label`, `error` |
| `Select` | `components/ui/Input.tsx` | `label`, `error`, `options` |
| `Sheet` | `components/ui/Sheet.tsx` | `open`, `onClose`, `title` |
| `Toast` | `components/ui/Toast.tsx` | `message`, `type`, `duration` |
| `Avatar` | `components/ui/Avatar.tsx` | `firstName`, `lastName`, `photoUrl`, `size`, `generationLevel` |
| `FactGrid` | `components/ui/FactGrid.tsx` | `facts` (array of `{label, value}`) |

### Feature Components

| Component | File | Description |
|-----------|------|-------------|
| `LoginForm` | `components/auth/LoginForm.tsx` | Complete login form with validation |
| `ProtectedRoute` | `components/auth/ProtectedRoute.tsx` | Auth guard with loading spinner |
| `TreeCanvas` | `components/tree/TreeCanvas.tsx` | SVG canvas with pan, zoom, and touch |
| `PersonNode` | `components/tree/PersonNode.tsx` | Clickable person card in SVG |
| `RelationshipLine` | `components/tree/RelationshipLine.tsx` | Solid/dashed SVG connector lines |
| `PersonCard` | `components/person/PersonCard.tsx` | Profile hero with avatar and tags |
| `PersonForm` | `components/person/PersonForm.tsx` | Full add/edit form |
| `RelationRow` | `components/person/RelationRow.tsx` | Scrollable relationship chip row |
| `PhotoUpload` | `components/person/PhotoUpload.tsx` | Upload sheet (camera/library/URL) |
| `Timeline` | `components/person/Timeline.tsx` | Event list with coloured icons |

---

## 📡 API Reference

### `POST /api/invite`

Invite a new user by email. Requires an authenticated session.

**Request:**
```json
{
  "email": "newuser@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": { "id": "uuid", "email": "newuser@example.com" }
}
```

**Errors:**
| Status | Response |
|--------|----------|
| `401` | `{ "error": "Unauthorized" }` |
| `400` | `{ "error": "Email is required" }` |
| `400` | `{ "error": "<supabase error>" }` |
| `500` | `{ "error": "Internal server error" }` |

> ⚠️ This endpoint uses `SUPABASE_SERVICE_ROLE_KEY` server-side to bypass RLS.

---

## 🗃 Database Helper Functions

All DB operations are in `lib/db.ts`:

```typescript
// Trees
createTree(name, ownerId)          → Tree
getUserTrees(userId)               → Tree[]

// Persons
getPersonById(id)                  → Person
getPersonsInTree(treeId)           → Person[]
createPerson(data)                 → Person
updatePerson(id, data)             → Person
deletePerson(id)                   → void
searchPersons(treeId, query)       → Person[]

// Relationships
getRelationships(personId)         → Relationship[]
getRelationshipsInTree(treeId)     → Relationship[]
createRelationship(data)           → Relationship
deleteRelationship(id)             → void

// Events
getEvents(personId)                → FamilyEvent[]
createEvent(data)                  → FamilyEvent
updateEvent(id, data)              → FamilyEvent
deleteEvent(id)                    → void
```

Storage operations are in `lib/storage.ts`:

```typescript
uploadPhoto(personId, file)        → string (public URL)
uploadPhotoFromUrl(personId, url)  → string (public URL)
deletePhoto(personId)              → void
```

---

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/familytree.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com/) → **Import Project** → select your repo

3. Add environment variables in Vercel's project settings:
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your service role key |

4. Click **Deploy** — Vercel auto-detects Next.js and builds

### Custom Domain (Optional)

1. In Vercel → **Settings → Domains**
2. Add your domain and configure DNS as instructed

---

## 🤝 Contributing

This is a private, invite-only family tree application. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📜 License

This project is private. All rights reserved.

---

<p align="center">
  Built with ❤️ using Next.js, Supabase, and Tailwind CSS
</p>
