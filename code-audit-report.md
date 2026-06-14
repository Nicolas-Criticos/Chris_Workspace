# Code Audit Report — Nicris Projects
**Audited by:** Chris (Systems Architect)  
**Date:** 2026-06-14  
**Projects:** myLifeTracker · samsara-community-app · awe-app  
**Note:** `samsara-landing` was not found at `~/projects/samsara-landing` — excluded from audit.

---

## Table of Contents
1. [Project-by-Project Analysis](#1-project-by-project-analysis)
2. [Cross-Project Patterns](#2-cross-project-patterns)
3. [Current Code Quality Scores](#3-current-code-quality-scores)
4. [Proposed Standard Framework](#4-proposed-standard-framework)
5. [Nicris Can Understand It — Guide](#5-nicris-can-understand-it--guide)
6. [Modular Building Blocks](#6-modular-building-blocks)

---

## 1. Project-by-Project Analysis

---

### 1.1 myLifeTracker

#### Tech Stack
- **Runtime:** React 18 + TypeScript + Vite
- **Data:** Supabase (2 clients: personal DB + business DB)
- **State/Fetching:** TanStack React Query v5
- **Routing:** React Router v6
- **Styling:** Tailwind v4 + CSS custom properties (design tokens) + heavy inline styles
- **Charts:** Recharts
- **Drag-and-drop:** @dnd-kit
- **Size:** ~14,900 lines of TypeScript/TSX

#### File/Folder Structure

```
src/
├── App.tsx                    ← Routes only, clean
├── main.tsx
├── index.css                  ← Design token definitions
├── components/
│   ├── dashboard/             ← Dashboard subcomponents
│   ├── invoices/              ← Invoice components
│   ├── layout/                ← TopBar, Sidebar
│   ├── olive-rehab/           ← Olive rehab components
│   ├── projects/              ← Project components
│   ├── reviews/               ← Weekly review forms
│   └── todos/
├── pages/                     ← One file per route
├── lib/
│   ├── supabase.ts            ← Client + ALL type definitions
│   ├── businessSupabase.ts    ← Separate client for business DB
│   ├── queries.ts             ← ALL React Query hooks (one giant file)
│   ├── rehab-queries.ts       ← Rehab-specific queries
│   ├── invoiceQueries.ts      ← Invoice-specific queries
│   ├── invoiceTypes.ts        ← Invoice type definitions
│   └── utils.ts               ← Utility functions + badge helpers
```

#### ✅ Strengths

**1. Excellent data layer abstraction**  
All Supabase queries are wrapped in React Query hooks — no raw DB calls inside components. This is the single biggest architectural win in any of these projects.

```typescript
// lib/queries.ts — clean, consistent pattern
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ops_projects')
        .select('*')
        .order('priority', { ascending: true })
      if (error) throw error
      return data as Project[]
    },
  })
}
```

**2. Full TypeScript with comprehensive type definitions**  
Every DB entity has a proper interface. The types file (`supabase.ts`) doubles as a data contract with the DB.

**3. Design token system**  
`index.css` defines a complete design token system with `--sand`, `--olive`, `--clay`, `--ink`, `--font-display`, spacing, shadows, radii. This creates visual consistency without per-component duplication.

**4. Clean App.tsx — routing only**  
App.tsx does one job: mount the router and providers. No logic leaks into it.

**5. Good utility library**  
`utils.ts` contains proper reusable functions for SAST timezone, week ranges, date formatting, and CSS badge generation. These are testable pure functions.

#### ❌ Weaknesses

**1. Business.tsx is 1,427 lines — a god component**  
This single file manages products, cost components, expenses, sales, and system params. It should be split into domain sections.

```tsx
// Bad — Business.tsx contains:
// - Product CRUD (lines 1–400)
// - Cost component management (400–700)
// - Sales tracking (700–1100)
// - Expense tracking (1100–1300)
// - All mixed state, 10+ useState hooks
```

**2. Inline styles dominate everything**  
WeeklyDashboard.tsx has 57 `style={{...}}` calls and only 8 `className=` calls. This is the inverse of what Tailwind is for. Every style is an object literal — not reusable, hard to override, verbose.

```tsx
// Bad — repeated pattern throughout
<p style={{
  fontFamily: 'var(--font-body)',
  fontSize: '0.65rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}}>
  Label
</p>

// Should be:
<p className="label-muted">Label</p>
// With .label-muted defined once in index.css
```

**3. No error handling in UI**  
React Query errors are thrown but there are no error boundaries or `isError` handlers in components. If a query fails, the page silently breaks.

```tsx
// What exists:
const { data: projects = [] } = useProjects()  // error silently swallowed by default []

// What should exist:
const { data: projects = [], isError, error } = useProjects()
if (isError) return <ErrorState message={error.message} />
```

**4. README.md is a single line: `# myLifeTracker`**  
No setup instructions, no env variable documentation, nothing.

**5. supabase.ts is doing two jobs**  
Contains both the Supabase client AND all type definitions for every table. When types need updating, you're navigating a 250-line file to find the right interface.

**6. queries.ts is 700+ lines — too large**  
All hooks for every domain in one file. When you need `useRehabLogs`, you scroll past tasks, checkins, reviews, patterns, products, sales, expenses, community, dreams, finances.

**7. The Dream interface is defined twice**  
```typescript
// supabase.ts — lines ~140 and ~200 both define:
export interface Dream { ... }
```

**8. No tests exist**

---

### 1.2 samsara-community-app

#### Tech Stack
- **Runtime:** React 18 + JavaScript (no TypeScript) + Vite
- **Data:** Supabase (hardcoded fallback keys — security risk)
- **State/Fetching:** TanStack React Query v5 + some raw useState/useEffect
- **Routing:** React Router v6
- **Styling:** Tailwind v4 (primary) with some inline styles
- **Forms:** react-hook-form
- **UI Primitives:** custom Button, Modal, TextInput, TextArea, IconButton
- **Extras:** react-dropzone, heic2any, canvas-confetti, @headlessui/react
- **Size:** ~14,200 lines of JSX/JS

#### File/Folder Structure

```
src/
├── App.jsx                       ← Routes + protected route wrappers
├── components/
│   ├── ProtectedRoute.jsx
│   ├── ProjectCompletionCelebration.jsx
│   ├── portal/ParticleField.jsx
│   └── ui/                       ← Button, Modal, TextInput, TextArea, IconButton
├── hooks/
│   └── useAuthSession.js
├── lib/                          ← API functions (good separation)
│   ├── supabase.js               ← ⚠️ Hardcoded fallback keys
│   ├── projectsApi.js
│   ├── membersApi.js
│   ├── projectActivityApi.js
│   ├── projectBomApi.js
│   ├── storage.js
│   ├── queryKeys.js              ← Centralized query key factory (excellent)
│   ├── slug.js
│   ├── textFormat.js
│   ├── cn.js
│   └── vg/                       ← VrischGewagt-specific API
│       ├── api.js
│       ├── constants.js
│       └── helpers.js
├── pages/
│   ├── circle/                   ← index + components + hooks
│   ├── detail/                   ← ⚠️ Duplicate of project/
│   ├── project/                  ← ⚠️ Duplicate of detail/
│   ├── projects/                 ← index + components + hooks
│   ├── login/
│   └── vg/                       ← VrischGewagt section (full layout)
│       ├── layout/
│       ├── dashboard/
│       ├── animals/
│       ├── produce/
│       ├── accommodation/
│       ├── history/
│       └── projects/
```

#### ✅ Strengths

**1. Strong API layer separation**  
All Supabase operations live in `lib/` — `projectsApi.js`, `membersApi.js`, `projectBomApi.js`, etc. Components call these functions, not Supabase directly.

**2. Centralized query key factory**  
`lib/queryKeys.js` provides a factory for all React Query keys — prevents typo bugs and makes cache invalidation predictable.

```javascript
// lib/queryKeys.js — excellent pattern
export const queryKeys = {
  projectsList: (realm, userId) => ['projects', realm, userId],
  projectDetail: (realm, slug) => ['project', realm, slug],
  // ...
}
```

**3. Custom UI component library**  
`components/ui/` has `Button`, `Modal`, `TextInput`, `TextArea`, `IconButton` — reusable, documented with JSDoc. The Modal component is particularly good: portal rendering, keyboard dismissal, focus trap, aria attributes.

```javascript
/**
 * Centered dialog: semi-transparent backdrop, fixed size panel, scrollable body.
 * Renders via a portal; backdrop and Escape close when `onClose` is set.
 */
export default function Modal({ open, onClose, children, ... })
```

**4. Hook extraction pattern**  
Page hooks like `useProjects.js` extract all page logic from JSX. The page component becomes a view layer only. This is the right pattern.

**5. Tailwind-first styling**  
Unlike myLifeTracker, this project uses Tailwind correctly — class strings on elements, not inline style objects.

**6. VG section is well-isolated**  
The VrischGewagt farm management section has its own layout, nav, hooks, and API layer under `pages/vg/`. Clean namespace.

#### ❌ Weaknesses

**1. 🚨 HARDCODED API KEY IN SOURCE CODE**  
The Supabase anon key is hardcoded as a fallback in `lib/supabase.js`. Since this is JavaScript, this key ships to every browser that visits the app.

```javascript
// lib/supabase.js — SECURITY RISK
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // ← exposed in git history + prod bundle
```

The anon key isn't a secret per se (RLS should protect data), but it shouldn't be in source code. Remove the fallback.

**2. Duplicate components across `detail/` and `project/` directories**  
Three components exist identically in two places:
- `ImageDropzone.jsx` — in both `detail/components/` and `project/components/`
- `ProjectAddUpdateModal.jsx` — same
- `ProjectTaskModal.jsx` — same
- `useProjectDetailPage.js` hook — exists in both `detail/hooks/` and `project/hooks/` with partial differences

These should be merged into `components/projects/` and shared.

**3. No TypeScript**  
With 14,200 lines and multiple data models, no types means:
- No autocompletion for DB fields
- No catching `undefined` access at write-time
- Function signatures have no contract

**4. No linting config**  
No `eslint.config.*` file. Without linting, no enforcement of consistent patterns.

**5. Mixed fetching patterns**  
Some pages use React Query correctly; others fall back to `useState + useEffect + supabase.from()` directly inside components.

```javascript
// Bad — direct in component (vg/produce/index.jsx)
useEffect(() => {
  supabase.from('produce_batches').select('*').then(({ data }) => setBatches(data))
}, [])

// Good — through useProjects hook
const projectsQuery = useQuery({ queryKey: queryKeys.projectsList(realm), ... })
```

**6. `detail/` and `project/` page directories are confusing**  
There are two project detail page implementations. The difference isn't clear from directory names. One appears to be older (`detail/`) and one newer (`project/`). This needs consolidation.

**7. No error handling in UI layer**  
Same as myLifeTracker — queries fail silently.

**8. No tests**

---

### 1.3 awe-app

#### Tech Stack
- **Runtime:** React 18 + JavaScript (no TypeScript) + Vite
- **Data:** Supabase (env-only, clean)
- **State/Fetching:** useState + useEffect (no React Query)
- **Routing:** React Router v6
- **Styling:** Tailwind v4 + inline styles (mixed)
- **Size:** ~894 lines of JSX/JS

#### File/Folder Structure

```
src/
├── App.jsx           ← Routes only
├── main.jsx
├── index.css
├── lib/
│   └── supabase.js   ← Clean, env-only client
├── data/
│   └── program.js    ← Static 12-day program data
├── components/
│   ├── DailyCard.jsx   ← Contains business logic (should be extracted)
│   ├── IntentionForm.jsx
│   └── StreakDisplay.jsx
└── pages/
    ├── Landing.jsx
    ├── Onboarding.jsx
    ├── Day.jsx
    ├── Complete.jsx
    ├── Dissolved.jsx
    └── Missed.jsx
```

#### ✅ Strengths

**1. Clean Supabase client — env-only, no fallbacks**
```javascript
// lib/supabase.js — correct approach
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**2. Beautiful, minimal UI**  
The animated landing page with concentric circles, fade-in sequencing, and minimal typography is genuinely well-crafted. The aesthetic intent is clear and consistent throughout.

**3. Small and focused**  
At 894 lines total, the app does exactly one thing. The routing is clear — one page per app state (Landing → Onboarding → Day → Complete/Dissolved/Missed).

**4. Static data in a data layer**  
`data/program.js` separates the 12-day curriculum from UI components — good separation of concerns.

#### ❌ Weaknesses

**1. Business logic directly in DailyCard.jsx**  
The component fetches check-ins, upserts records, checks miss counts, updates participant status, and handles navigation — all in one file. This is a 165-line component doing 6 different jobs.

```javascript
// DailyCard.jsx — does too much
const handleCheckin = async (completed) => {
  // saves check-in ← data layer
  // checks miss count ← business logic
  // updates participant status ← data layer
  // navigates ← routing
  // sets local state ← UI layer
}
```

**2. No React Query — inconsistent with other projects**  
Direct `useState + useEffect + supabase.from()` patterns throughout. No caching, no loading/error states beyond a single dot spinner.

**3. localStorage for session management**  
```javascript
const participantId = localStorage.getItem("awe_participant_id")
```
Participant identity is localStorage only — clears on browser clear, can't share across devices, no proper auth. This is a known trade-off for a 12-day experience but should be documented.

**4. No error handling at all**  
```javascript
// Bad — silent failure pattern
const { data } = await supabase.from("check_ins").select("*")
// If this fails, the UI just shows nothing
```

**5. Mixed styling — Tailwind + inline styles**  
Some elements use Tailwind classes; others use inline style objects. Not consistent within the same file.

**6. No README, no .env.example (initially)**  
`awe-app` had `.env.example` added, which is good. But no README.

**7. No tests**

---

## 2. Cross-Project Patterns

### ✅ What's Consistent

| Pattern | myLifeTracker | samsara-community-app | awe-app |
|---|---|---|---|
| Vite build tool | ✅ | ✅ | ✅ |
| React 18 | ✅ | ✅ | ✅ |
| React Router v6 | ✅ | ✅ | ✅ |
| Tailwind v4 | ✅ | ✅ | ✅ |
| Supabase JS | ✅ | ✅ | ✅ |
| Cormorant + Inter fonts | ✅ | ✅ | ✅ |
| Dark/warm aesthetic | ✅ | ✅ | ✅ |
| date-fns | ✅ | ✅ | ✅ |
| `lib/supabase.js` naming | ✅ | ✅ | ✅ |

### ❌ What's Inconsistent

| Concern | myLifeTracker | samsara-community-app | awe-app |
|---|---|---|---|
| TypeScript | ✅ Full TS | ❌ Plain JS | ❌ Plain JS |
| React Query | ✅ Used for all data | ⚠️ Mixed | ❌ Not used |
| Linting | ⚠️ Script exists | ❌ None | ❌ None |
| Error handling | ⚠️ Partial | ⚠️ Partial | ❌ None |
| Error boundaries | ❌ None | ❌ None | ❌ None |
| Tests | ❌ None | ❌ None | ❌ None |
| README quality | ❌ 1 line | ⚠️ Deploy only | ❌ None |
| Component docs | ❌ None | ⚠️ Some JSDoc | ❌ None |

### 🔁 Duplicated Code / Logic

**1. SAST timezone handling**  
myLifeTracker defines `nowInSAST()` in `utils.ts`. The other projects don't handle timezone at all — they use `new Date()` which uses browser locale.

**2. Date formatting**  
All three projects use `date-fns` but each invents its own `format()` call patterns inline. No shared date formatting conventions.

**3. Supabase client setup**  
Three separate `lib/supabase.js` files. Same pattern, no shared package.

**4. Loading spinner patterns**  
Each project invents its own loading state display. myLifeTracker uses a text "Loading…" in a centered div. awe-app uses a single dot with pulse animation. samsara-community-app has no global loading state.

**5. Category/status badge logic**  
myLifeTracker has `statusBadge()`, `priorityBadge()`, `categoryBadge()` utilities in utils.ts. samsara-community-app reinvents this inline in each component.

**6. Modal pattern**  
samsara-community-app has a proper Modal component. myLifeTracker builds modals inline with conditional rendering + inline styles. awe-app has no modals.

**7. cn() utility**  
Both myLifeTracker (`lib/utils.ts`) and samsara-community-app (`lib/cn.js`) define an identical `cn()` function wrapping `clsx`. Same code, different files.

### Shared Dependencies (all three projects)
```json
{
  "@supabase/supabase-js": "^2.x",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.x",
  "@tailwindcss/vite": "^4.x",
  "tailwindcss": "^4.x",
  "@vitejs/plugin-react": "^4.x",
  "vite": "^6.x"
}
```
date-fns is used in myLifeTracker and samsara-community-app.

---

## 3. Current Code Quality Scores

### myLifeTracker

| Dimension | Score | Notes |
|---|---|---|
| **Readability** | 7/10 | TypeScript helps; inline styles hurt; long components hurt |
| **Maintainability** | 6/10 | Business.tsx at 1,427 lines is a liability; queries.ts is large |
| **Documentation** | 2/10 | README is 1 line; no inline docs; no component docs |
| **Test coverage** | 0/10 | Zero tests |
| **Component reusability** | 5/10 | Domain components exist but aren't abstracted |
| **Error handling** | 4/10 | React Query catches but UI never surfaces errors |
| **Overall** | **4.0/10** | Solid foundation, needs polish |

### samsara-community-app

| Dimension | Score | Notes |
|---|---|---|
| **Readability** | 6/10 | Good hooks pattern; no TS means missing context |
| **Maintainability** | 5/10 | Duplicate files; mixed fetch patterns; accommodation.jsx is 520 lines |
| **Documentation** | 4/10 | Some JSDoc in UI components; README is deploy-only |
| **Test coverage** | 0/10 | Zero tests |
| **Component reusability** | 7/10 | Best UI component library of the three; queryKeys pattern is excellent |
| **Error handling** | 4/10 | try/catch in mutations; no UI error states |
| **Overall** | **4.3/10** | Best component architecture; security issue is serious |

### awe-app

| Dimension | Score | Notes |
|---|---|---|
| **Readability** | 7/10 | Small codebase; easy to scan; aesthetics are intentional |
| **Maintainability** | 4/10 | Business logic in UI components; no abstraction |
| **Documentation** | 1/10 | Essentially nothing |
| **Test coverage** | 0/10 | Zero tests |
| **Component reusability** | 3/10 | Very little abstraction; DailyCard does everything |
| **Error handling** | 1/10 | Silent failures everywhere |
| **Overall** | **2.7/10** | MVP quality — fine for a first build, needs restructuring |

---

## 4. Proposed Standard Framework

This section defines the standards that every new project (and refactored existing project) should follow.

---

### 4.1 Folder Structure Standard

```
project-name/
├── public/                    ← Static assets (favicon, robots.txt, OG images)
├── src/
│   ├── main.tsx               ← App mount point — nothing else
│   ├── App.tsx                ← Route declarations only
│   ├── index.css              ← Design tokens + global base styles
│   │
│   ├── components/            ← Shared/reusable UI components
│   │   ├── ui/                ← Primitive UI: Button, Modal, Input, Badge, etc.
│   │   ├── layout/            ← TopBar, Sidebar, BottomNav, Layout wrappers
│   │   └── [Feature]/         ← Feature-specific shared components
│   │
│   ├── pages/                 ← One folder per route
│   │   └── [PageName]/
│   │       ├── index.tsx      ← Page component (thin — imports hooks + components)
│   │       ├── components/    ← Page-specific components (not shared elsewhere)
│   │       └── hooks/         ← Page-specific hooks
│   │
│   ├── hooks/                 ← Global hooks (useAuth, useDebounce, etc.)
│   │
│   ├── lib/                   ← Infrastructure and domain logic
│   │   ├── supabase.ts        ← Supabase client only
│   │   ├── types.ts           ← All TypeScript interfaces (separate from client)
│   │   ├── queryKeys.ts       ← Centralized React Query key factory
│   │   ├── utils.ts           ← Pure utility functions
│   │   └── [domain]/          ← Domain API modules
│   │       ├── queries.ts     ← React Query hooks for this domain
│   │       └── api.ts         ← Raw Supabase functions (no React hooks)
│   │
│   └── constants/             ← App-wide constants (not API keys — those are .env)
│       └── index.ts
│
├── .env.example               ← Template — always committed
├── .env.local                 ← Real values — never committed
├── .eslintrc.json             ← Always present
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md                  ← Minimum viable README (see 4.6)
```

**Key rules:**
- Pages are thin — they import hooks and render components
- `lib/[domain]/queries.ts` contains React Query hooks
- `lib/[domain]/api.ts` contains raw async functions (testable without React)
- `components/ui/` contains only primitives — no business logic
- Types go in `lib/types.ts`, not in `lib/supabase.ts`

---

### 4.2 Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `ProjectCard.tsx`, `Modal.tsx` |
| Hooks | camelCase with `use` prefix | `useProjects.ts`, `useAuthSession.ts` |
| API functions | camelCase verbs | `fetchProjects()`, `createProject()`, `updateTask()` |
| Pages | PascalCase folder + index | `pages/Projects/index.tsx` |
| Types/Interfaces | PascalCase | `interface Project`, `type TaskStatus` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE`, `REALMS` |
| CSS custom props | kebab-case | `--color-sand`, `--font-display` |
| Query keys | factory functions | `queryKeys.projects.list(realm)` |
| Files | kebab-case for non-components | `query-keys.ts`, `text-format.ts` |

---

### 4.3 Component Patterns

**Standard component shape:**

```tsx
// components/ui/StatusBadge.tsx

interface StatusBadgeProps {
  status: TaskStatus
  className?: string
}

/** Displays a styled badge for a task or project status. */
export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<TaskStatus, string> = {
    active:    'bg-olive-100 text-olive-700',
    paused:    'bg-clay-100 text-clay-700',
    completed: 'bg-sand-200 text-ink-muted',
  }

  return (
    <span className={cn('badge', styles[status] ?? styles.active, className)}>
      {status}
    </span>
  )
}
```

**Rules:**
- Props interface always defined
- JSDoc comment on the component
- `className` prop for override (composable)
- No inline styles — use Tailwind classes or CSS vars
- No direct Supabase calls in UI components
- Prefer composition over configuration (pass children, not render props)

**Page component shape:**

```tsx
// pages/Projects/index.tsx

// Pages are VIEW-only — they import hooks and render
export default function ProjectsPage() {
  const { projects, isLoading, isError } = useProjects()

  if (isLoading) return <LoadingState />
  if (isError)   return <ErrorState />

  return (
    <PageLayout title="Projects">
      <ProjectList projects={projects} />
    </PageLayout>
  )
}
```

---

### 4.4 Data Access Layer — Standard Supabase Pattern

**Three-layer model:**

```
Component
  → React Query hook (lib/[domain]/queries.ts)
    → API function (lib/[domain]/api.ts)
      → Supabase client (lib/supabase.ts)
```

**`lib/supabase.ts` — client only:**
```typescript
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) throw new Error('Missing Supabase env variables')

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})
```

**`lib/[domain]/api.ts` — raw functions (no React):**
```typescript
import { supabase } from '../supabase'
import type { Project } from '../types'

export async function fetchProjects(realm: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('realm', realm)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}
```

**`lib/[domain]/queries.ts` — React Query wrappers:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../queryKeys'
import { fetchProjects, createProject } from './api'

export function useProjects(realm: string) {
  return useQuery({
    queryKey: queryKeys.projects.list(realm),
    queryFn: () => fetchProjects(realm),
    enabled: Boolean(realm),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.list(vars.realm) })
    },
  })
}
```

**`lib/queryKeys.ts` — centralized key factory:**
```typescript
export const queryKeys = {
  projects: {
    all:    ()            => ['projects'] as const,
    list:   (realm: string) => ['projects', realm] as const,
    detail: (id: string)  => ['projects', id] as const,
  },
  tasks: {
    all:         ()            => ['tasks'] as const,
    byProject:   (id: string)  => ['tasks', 'project', id] as const,
    thisWeek:    ()            => ['tasks', 'week'] as const,
  },
}
```

---

### 4.5 Error Handling Standard

**Mandatory in every page:**
```tsx
// Minimum viable error handling
const { data, isLoading, isError, error } = useProjects(realm)

if (isLoading) return <LoadingSpinner />
if (isError)   return <ErrorState message={error?.message} onRetry={refetch} />
```

**`components/ui/ErrorState.tsx`:**
```tsx
interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <p>Something went wrong.</p>
      {message && <p className="error-detail">{message}</p>}
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  )
}
```

**Error boundary for unexpected errors:**
```tsx
// components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorState message={this.state.error?.message} />
    }
    return this.props.children
  }
}
```

**Wrap App in boundary:**
```tsx
// App.tsx
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>...</Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
```

**Mutation error handling:**
```tsx
const createProject = useCreateProject()

const handleSubmit = (data) => {
  createProject.mutate(data, {
    onError: (err) => toast.error(`Failed: ${err.message}`),
    onSuccess: () => toast.success('Project created'),
  })
}

// In JSX:
{createProject.isError && (
  <p className="error-text">{createProject.error.message}</p>
)}
```

---

### 4.6 Documentation Standard

**README template — minimum viable:**

```markdown
# Project Name

One sentence: what this app does and who it's for.

## Quick Start

\`\`\`bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
\`\`\`

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| VITE_SUPABASE_URL | Supabase project URL | ✅ |
| VITE_SUPABASE_ANON_KEY | Supabase anon key | ✅ |

## Project Structure

Brief description of src/ layout.

## Key Concepts

1-3 sentences about how the app works / main data flows.

## Deploy

How to build and deploy.
```

**Component documentation:**
```tsx
/**
 * Displays a project card in the field view.
 * 
 * @param project - Project data from Supabase
 * @param onOpen  - Callback when card is clicked (opens detail modal)
 * @param isVrisch - True when in VrischGewagt realm (changes styling)
 */
export default function ProjectCard({ project, onOpen, isVrisch }: ProjectCardProps)
```

**Inline comment rules:**
- Comment *why*, not *what* — code shows what; comments show reasoning
- Section headers with `// ── SECTION NAME ──` (consistent with what myLifeTracker already uses)
- TODO format: `// TODO(chris): description of what needs doing`

---

### 4.7 Testing Approach

Zero tests exist across all projects. Rather than recommending a full test suite immediately, here's a pragmatic minimum:

**Phase 1 — Utility functions (start here):**
```typescript
// lib/utils.test.ts
import { nowInSAST, getWeekRange, formatDate, statusBadge } from './utils'

test('getWeekRange returns Monday to Sunday', () => {
  const { start, end } = getWeekRange(new Date('2026-06-14')) // Sunday
  expect(format(start, 'yyyy-MM-dd')).toBe('2026-06-08') // prev Monday
})

test('statusBadge returns correct class for active', () => {
  expect(statusBadge('active')).toContain('olive')
})
```

**Phase 2 — API functions (mock Supabase):**
```typescript
// lib/projects/api.test.ts
vi.mock('../supabase', () => ({ supabase: mockSupabase }))

test('fetchProjects returns array on success', async () => {
  mockSupabase.from.mockReturnValue({ select: () => ({ data: [...], error: null }) })
  const result = await fetchProjects('samsara')
  expect(result).toHaveLength(2)
})
```

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

**`vite.config.ts` addition:**
```typescript
export default defineConfig({
  plugins: [...],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

**Minimum coverage target:** 80% of utility functions and API functions. Zero requirement on UI components initially — test the logic, not the pixels.

---

### 4.8 Shared Utilities Library

The following should be extracted into a shared `@nicris/ui` or `@samsara/shared` package eventually. For now, maintain one canonical copy in the most mature project (myLifeTracker) and copy intentionally to others.

**Extract these:**

| Utility | Current location | Used by |
|---|---|---|
| `cn()` | utils.ts + cn.js | All three |
| `nowInSAST()` | utils.ts | myLifeTracker only |
| `getWeekRange()` | utils.ts | myLifeTracker only |
| `formatDate()` | utils.ts | myLifeTracker only |
| `statusBadge()` | utils.ts | myLifeTracker only |
| Supabase client factory | lib/supabase.* | All three |
| `LoadingSpinner` | none | Needed everywhere |
| `ErrorState` | none | Needed everywhere |
| `ErrorBoundary` | none | Needed everywhere |
| `Modal` | samsara-community-app | Should be in all |
| `Button` | samsara-community-app | Should be in all |

---

## 5. Nicris Can Understand It — Guide

*You don't need to know how to code to read and understand what's happening in these apps.*

### How to Read Any of These Projects

**Step 1: Start with `package.json`**  
This tells you what tools the project uses. Look at `"dependencies"` — that's the list of libraries the app is built on. `"scripts"` tells you how to run it (`npm run dev` = start it locally).

**Step 2: Read `src/App.tsx` (or App.jsx)**  
This file is the app's table of contents. It lists every page and the URL that leads to it. If you want to know what pages exist, this is where to look.

**Step 3: Open the `pages/` folder**  
Each file or folder in here is one screen in the app. `Dashboard.tsx` = the dashboard screen. `OliveRehab.tsx` = the olive rehab screen.

**Step 4: Look in `lib/` to understand data**  
`lib/supabase.ts` = connection to the database  
`lib/queries.ts` = all the questions we ask the database ("give me all projects", "give me this week's tasks")  
`lib/types.ts` = definitions of what data looks like (a Project has a name, status, category...)

**Step 5: `components/` = building blocks**  
These are reusable pieces used across multiple pages. Like a LEGO brick — build it once, use it many places.

### How Components Connect to Data

```
User opens the Dashboard
  ↓
Dashboard.tsx renders
  ↓
It calls useProjects() (a "hook" — a function that fetches data)
  ↓
useProjects() asks React Query: "do you have projects cached?"
  If yes → returns immediately from memory
  If no → calls Supabase → gets projects from the database
  ↓
Dashboard.tsx receives the list of projects
  ↓
It renders CategorySection for each project
```

### Visual Map of Data Flow

```
[Supabase Database]
        ↕ (reads/writes via SQL)
[lib/supabase.ts — connection]
        ↕ (raw async functions)
[lib/queries/api.ts — "get projects", "create task"]
        ↕ (wrapped in React Query for caching)
[lib/queries/queries.ts — useProjects(), useCreateTask()]
        ↕ (called by)
[pages/ and components/ — what you see on screen]
```

### What Each Project Does in Plain Language

**myLifeTracker:**  
Your personal operating system. Tracks daily check-ins (energy, focus, peace), projects organized by category (Foundation / Leverage / Expression), tasks, weekly reviews, olive rehab logs, dreams, finances, and business sales. Nicris-only access.

**samsara-community-app:**  
A community dashboard for the Samsara inner circle. Members log in, see community projects, apply to join them, and track progress. VrischGewagt section tracks farm operations (animals, produce, accommodation, history). Multi-user.

**awe-app:**  
A 12-day digital detox program app. Participants set an intention, then check in daily for 12 days. Miss 3 days → dissolved. Complete all 12 → done. Simple linear flow.

### Key Files to Look at First in Any Project

1. `README.md` — what it is and how to run it
2. `src/App.tsx` — what pages exist
3. `package.json` — what tools it uses
4. `src/lib/types.ts` (or `supabase.ts`) — what data looks like
5. `src/index.css` — the visual design system (colors, fonts, spacing)

---

## 6. Modular Building Blocks

### Reusable "Blocks" — Templates for Common Patterns

---

#### Block 1: Data List Page

The most common pattern across all three apps.

```tsx
// Template: pages/[Feature]/index.tsx

export default function FeaturePage() {
  const { data: items = [], isLoading, isError, refetch } = useFeatureItems()
  const [selected, setSelected] = useState<FeatureItem | null>(null)

  if (isLoading) return <LoadingSpinner />
  if (isError)   return <ErrorState onRetry={refetch} />

  return (
    <PageLayout title="Feature Name">
      <div className="item-list">
        {items.map(item => (
          <FeatureCard
            key={item.id}
            item={item}
            onClick={() => setSelected(item)}
          />
        ))}
      </div>

      {selected && (
        <FeatureDetailModal
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </PageLayout>
  )
}
```

---

#### Block 2: CRUD Hook

```typescript
// Template: lib/[domain]/queries.ts

export function useItems() {
  return useQuery({
    queryKey: queryKeys.items.all(),
    queryFn: fetchItems,
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.items.all() }),
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Item> & { id: string }) =>
      updateItem(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.items.all() }),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.items.all() }),
  })
}
```

---

#### Block 3: Form Modal

```tsx
// Template: components/[Feature]/CreateModal.tsx

interface CreateModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateModal({ open, onClose }: CreateModalProps) {
  const createItem = useCreateItem()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateInput>()

  const onSubmit = (data: CreateInput) => {
    createItem.mutate(data, {
      onSuccess: () => { reset(); onClose() },
      onError: (err) => console.error(err),
    })
  }

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Create Item">
      <h2 className="modal-title">New Item</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        <FormField label="Name" error={errors.name?.message}>
          <input {...register('name', { required: 'Name is required' })} />
        </FormField>

        <div className="form-actions">
          <Button type="button" variant="link" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createItem.isPending}>
            {createItem.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
```

---

#### Block 4: Starter Kit — New Project Checklist

When starting a new project, run through this checklist:

```
□ Copy folder structure (see 4.1)
□ Install deps: react, react-dom, react-router-dom, @supabase/supabase-js,
  @tanstack/react-query, tailwindcss, vite, typescript
□ Set up lib/supabase.ts (client only, no fallback keys)
□ Set up lib/types.ts (all interfaces)
□ Set up lib/queryKeys.ts (empty factory, fill as needed)
□ Set up lib/utils.ts (copy cn, formatDate, nowInSAST from myLifeTracker)
□ Copy components/ui/: Button, Modal, Input, Badge, LoadingSpinner, ErrorState, ErrorBoundary
□ Set up index.css with design tokens (copy from myLifeTracker)
□ Write README.md using template from 4.6
□ Create .env.example listing all required env variables
□ Add .env.local to .gitignore
□ Set up eslint.config.js
□ Set up vitest in vite.config.ts
□ Write first test (utils.test.ts)
```

---

#### Block 5: Auth-Protected Route

```tsx
// components/ProtectedRoute.tsx (copy from samsara-community-app — it's good)

import { useAuthSession } from '../hooks/useAuthSession'
import { Navigate } from 'react-router-dom'
import LoadingSpinner from './ui/LoadingSpinner'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useAuthSession()

  if (isPending) return <LoadingSpinner />
  if (!session)  return <Navigate to="/login" replace />

  return <>{children}</>
}
```

---

### Proposed Component Library Contents

```
components/ui/
├── Button.tsx           — primary/secondary/link variants
├── Input.tsx            — text input with label + error state
├── TextArea.tsx         — multiline with label + error state
├── Select.tsx           — dropdown with label + error state
├── Badge.tsx            — status/category badges (replaces utils.ts badge functions)
├── Modal.tsx            — portal dialog (steal from samsara-community-app)
├── LoadingSpinner.tsx   — centered loading state
├── ErrorState.tsx       — error display with retry
├── ErrorBoundary.tsx    — React error boundary
├── PageLayout.tsx       — consistent page wrapper (title, max-width, padding)
├── FormField.tsx        — label + input + error message wrapper
├── Card.tsx             — generic card container
├── EmptyState.tsx       — "nothing here yet" placeholder
└── index.ts             — barrel export
```

---

## Summary: Top 10 Actions by Priority

| # | Action | Project | Impact |
|---|---|---|---|
| 1 | **Remove hardcoded Supabase key from samsara-community-app** | samsara-community-app | 🔴 Security |
| 2 | **Add error handling to all pages** (isLoading/isError states) | All three | 🔴 Reliability |
| 3 | **Add ErrorBoundary to App.tsx in all projects** | All three | 🟠 Reliability |
| 4 | **Split Business.tsx into domain modules** | myLifeTracker | 🟠 Maintainability |
| 5 | **Merge detail/ and project/ duplicate files** | samsara-community-app | 🟠 Maintainability |
| 6 | **Extract inline styles into CSS classes** | myLifeTracker | 🟡 Readability |
| 7 | **Add TypeScript to samsara-community-app** | samsara-community-app | 🟡 Safety |
| 8 | **Add React Query to awe-app** | awe-app | 🟡 Consistency |
| 9 | **Write README.md files** for all three projects | All three | 🟡 Documentation |
| 10 | **Add vitest + first utility tests** | All three | 🟢 Quality |

---

*Report generated: 2026-06-14. Next audit recommended after top 5 actions are completed.*
