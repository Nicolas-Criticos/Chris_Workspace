# App Architecture Reference
> The single document to pull up when building anything. Last updated: 2026-06-15

---

## 1. Full Stack Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                           BROWSER / USER                                        ║
╚══════════════════════════════════════════════════════════════════════════════════╝
                                    │ ▲
                            clicks, URLs, events
                                    │ ▲
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ERROR BOUNDARY  (src/ErrorBoundary.tsx)                                        ║
║  └─ Catches render crashes app-wide, shows fallback UI                          ║
║                                                                                 ║
║  ┌──────────────────────────────────────────────────────────────────────────┐   ║
║  │  REACT ROUTER  (src/App.tsx)                                             │   ║
║  │  Routes: <BrowserRouter> → <Routes> → <Route path="/" element={...} />  │   ║
║  │  Route guards live here (ProtectedRoute wrapper)                         │   ║
║  └──────────────────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
                                    │ ▲
                           route match → render
                                    │ ▲
╔══════════════════════════════════════════════════════════════════════════════════╗
║  PAGES LAYER  (src/pages/[Feature]/index.tsx)                                   ║
║                                                                                 ║
║  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 ║
║  │  DashboardPage  │  │  ProfilePage    │  │  LoginPage      │  ...             ║
║  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                 ║
║           │                   │                     │                           ║
║  One job: orchestrate layout + page hooks + pass props DOWN to components       ║
║  No raw Supabase. No inline logic. No fetch calls.                              ║
╚══════════════════════════════════════════════════════════════════════════════════╝
          │ ▲                calls                │ ▲
   props/JSX                              calls hook, gets data back
          │ ▲                                     │ ▲
╔═════════╧══════════════╗          ╔═════════════╧══════════════════════════════╗
║  LAYOUT COMPONENTS     ║          ║  PAGE HOOKS  (src/pages/[Feature]/hooks/)  ║
║  (src/components/      ║          ║                                             ║
║   layout/)             ║          ║  useDashboard.ts                           ║
║                        ║          ║  useProfile.ts                             ║
║  Navbar, Sidebar,      ║          ║                                             ║
║  PageWrapper,          ║          ║  Page-specific logic, derived state,        ║
║  AuthLayout            ║          ║  combines multiple query hooks,             ║
║                        ║          ║  handles form state + submission            ║
╚════════════════════════╝          ╚═════════════════════════════════════════════╝
          │ ▲                                     │ ▲
   props/JSX                              calls query hooks
          │ ▲                                     │ ▲
╔═════════╧══════════════════════════════════════╧══════════════════════════════╗
║  UI COMPONENT LIBRARY  (src/components/ui/)                                    ║
║                                                                                ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            ║
║  │  Button  │ │  Input   │ │  Modal   │ │  Card    │ │  Table   │  ...         ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘            ║
║                                                                                ║
║  Dumb, reusable, receives ALL data via props. Zero knowledge of app domain.    ║
╚════════════════════════════════════════════════════════════════════════════════╝
                                    │ ▲
                          props in → events out
                                    │ ▲
╔══════════════════════════════════════════════════════════════════════════════════╗
║  REACT QUERY HOOKS  (src/lib/[domain]/queries.ts)                               ║
║                                                                                 ║
║  useProjects()    useUser()    useCreateProject()    useUpdateTask()            ║
║                                                                                 ║
║  ┌──────────────────────────────────────────────────────────────────────────┐   ║
║  │  REACT QUERY CACHE  (in-memory, keyed by queryKeys)                      │   ║
║  │  QueryClient — configured in main.tsx, provided via QueryClientProvider   │   ║
║  │  Handles: deduplication, background refetch, stale-while-revalidate      │   ║
║  └──────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                 ║
║  ← QUERY KEYS (src/lib/queryKeys.ts) feed into every useQuery() call           ║
╚══════════════════════════════════════════════════════════════════════════════════╝
                                    │ ▲
                     queryFn calls → data returned
                                    │ ▲
╔══════════════════════════════════════════════════════════════════════════════════╗
║  API LAYER  (src/lib/[domain]/api.ts)                                           ║
║                                                                                 ║
║  getProjects()   getUser()   createProject()   deleteTask()                    ║
║                                                                                 ║
║  Pure async functions. No React. No hooks. No state.                           ║
║  Each function: one Supabase call → typed return value → throw on error        ║
╚══════════════════════════════════════════════════════════════════════════════════╝
                                    │ ▲
                         supabase.from('table')
                                    │ ▲
╔══════════════════════════════════════════════════════════════════════════════════╗
║  SUPABASE CLIENT  (src/lib/supabase.ts)                                         ║
║                                                                                 ║
║  createClient(SUPABASE_URL, SUPABASE_ANON_KEY)                                 ║
║  Single instance. Exported once. Imported by API layer ONLY.                   ║
║                                                                                 ║
║  ← .env variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) feed in here    ║
╚══════════════════════════════════════════════════════════════════════════════════╝
                                    │ ▲
                         HTTPS / WebSocket
                                    │ ▲
╔══════════════════════════════════════════════════════════════════════════════════╗
║  SUPABASE CLOUD  (cloud.supabase.com)                                           ║
║                                                                                 ║
║  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌───────────────────┐ ║
║  │  PostgreSQL  │  │  Auth (JWT)   │  │  Storage     │  │  Realtime         │ ║
║  │  + RLS       │  │               │  │  (buckets)   │  │  (subscriptions)  │ ║
║  └──────────────┘  └───────────────┘  └──────────────┘  └───────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════╝

  ╔══════════════════════════════════════════════════════╗
  ║  SHARED INFRASTRUCTURE (used across ALL layers)      ║
  ║                                                      ║
  ║  src/types/           — TypeScript interfaces        ║
  ║  src/lib/queryKeys.ts — React Query key constants    ║
  ║  src/lib/constants.ts — App-wide config constants    ║
  ║  src/utils/           — Pure utility functions       ║
  ║  .env / .env.local    — Environment variables        ║
  ╚══════════════════════════════════════════════════════╝
```

**Arrow legend:**
- `│ ▲` = bidirectional (data flows both ways)
- `→` = unidirectional (caller → callee only)
- `←` = feeds into (config/constants injected at init)

---

## 2. Layer-by-Layer Explanation

---

### Layer 1 — Environment & Config

**What it IS:** The source of truth for secrets and environment-specific values.

**What it CONTAINS:**
```
.env                    # committed defaults (no secrets)
.env.local              # local overrides (gitignored)
.env.production         # prod values (gitignored)
src/lib/constants.ts    # non-secret app constants
```

**What it CAN do:**
- Store API URLs, keys, feature flags
- Export typed constant values

**What it CANNOT do:**
- ❌ Be committed to git if it contains secrets (use `.env.local`)
- ❌ Import from any src/ file (no circular deps)

**Snippet:** `env-setup`

**Example:**
```typescript
// .env.local
VITE_SUPABASE_URL=https://abc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

// src/lib/constants.ts
export const APP_NAME = 'Samsara'
export const DEFAULT_PAGE_SIZE = 20
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
} as const
```

---

### Layer 2 — Types Layer

**What it IS:** The single source of truth for all TypeScript interfaces and types in the app.

**What it CONTAINS:**
```
src/types/
  index.ts          # re-exports everything
  database.ts       # mirrors Supabase table shapes
  api.ts            # request/response types
  ui.ts             # component prop types
```

**What it CAN do:**
- Define interfaces that mirror DB tables
- Define shared prop types
- Export enums and type unions

**What it CANNOT do:**
- ❌ Import from components, hooks, or pages (it's at the bottom of the import hierarchy)
- ❌ Contain any runtime logic

**Snippet:** `types-setup`

**Example:**
```typescript
// src/types/database.ts
export interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'complete'
  created_at: string
  user_id: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  completed: boolean
  due_date: string | null
}
```

---

### Layer 3 — Supabase Client

**What it IS:** A single configured Supabase client instance, exported once and imported only by the API layer.

**What it CONTAINS:**
```
src/lib/supabase.ts     # THE client — one file, one export
```

**What it CAN do:**
- Create and export the typed Supabase client
- Read from `.env` variables

**What it CANNOT do:**
- ❌ Be imported by components, hooks, or pages directly
- ❌ Contain query logic
- ❌ Export multiple clients

**Snippet:** `supabase-client`

**Example:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

---

### Layer 4 — API Layer

**What it IS:** Pure async functions — one per DB operation. No React, no hooks, just fetch-and-return.

**What it CONTAINS:**
```
src/lib/
  projects/api.ts     # getProjects, createProject, updateProject, deleteProject
  tasks/api.ts        # getTasks, createTask, toggleTask
  auth/api.ts         # signIn, signOut, getSession
  users/api.ts        # getUser, updateUser
```

**What it CAN do:**
- Import and use the Supabase client
- Import types
- Make async Supabase calls
- Throw errors on failure

**What it CANNOT do:**
- ❌ Use React hooks (`useState`, `useEffect`, etc.)
- ❌ Import from components or pages
- ❌ Handle loading/error state

**Snippet:** `api-function`

**Example:**
```typescript
// src/lib/projects/api.ts
import { supabase } from '@/lib/supabase'
import type { Project } from '@/types'

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createProject(
  name: string,
  description?: string
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
```

---

### Layer 5 — Query Keys

**What it IS:** A centralized registry of all React Query cache keys — prevents typos and makes cache invalidation predictable.

**What it CONTAINS:**
```
src/lib/queryKeys.ts    # ONE file with ALL keys
```

**What it CAN do:**
- Export typed key factory functions
- Group keys by domain

**What it CANNOT do:**
- ❌ Import from anywhere except types
- ❌ Contain any async logic

**Snippet:** `query-keys`

**Example:**
```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    list: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.projects.all, id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    byProject: (projectId: string) =>
      [...queryKeys.tasks.all, 'project', projectId] as const,
  },
  user: {
    current: ['user', 'current'] as const,
  },
} as const
```

---

### Layer 6 — React Query Hooks

**What it IS:** Custom hooks that wrap API functions with React Query — giving you loading, error, data, and cache management for free.

**What it CONTAINS:**
```
src/lib/
  projects/queries.ts     # useProjects, useProject, useCreateProject
  tasks/queries.ts        # useTasks, useCreateTask, useToggleTask
  auth/queries.ts         # useCurrentUser, useSignIn, useSignOut
```

**What it CAN do:**
- Call API layer functions via `queryFn` / `mutationFn`
- Use `queryKeys` for cache keys
- Invalidate other queries after mutations
- Return typed `{ data, isLoading, error, mutate }` etc.

**What it CANNOT do:**
- ❌ Call Supabase directly (go through API layer)
- ❌ Import from components or pages
- ❌ Contain JSX

**Snippet:** `query-hook` / `mutation-hook`

**Example:**
```typescript
// src/lib/projects/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, createProject } from './api'
import { queryKeys } from '@/lib/queryKeys'

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: getProjects,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createProject(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}
```

---

### Layer 7 — UI Component Library

**What it IS:** Reusable, dumb presentational components. They receive everything via props and emit events via callbacks.

**What it CONTAINS:**
```
src/components/ui/
  Button.tsx
  Input.tsx
  Modal.tsx
  Card.tsx
  Badge.tsx
  Spinner.tsx
  Table.tsx
  index.ts      # barrel export
```

**What it CAN do:**
- Render UI based on props
- Accept className overrides
- Emit events via callback props (`onClick`, `onChange`, etc.)
- Have internal micro-state (open/closed, focused, etc.)

**What it CANNOT do:**
- ❌ Import from lib/, pages/, or hooks/
- ❌ Make API calls or use query hooks
- ❌ Know anything about "projects" or "users" — only generic UI concepts

**Snippet:** `ui-component`

**Example:**
```typescript
// src/components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  isLoading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${className ?? ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner size="sm" /> : children}
    </button>
  )
}
```

---

### Layer 8 — Layout Components

**What it IS:** Structural components that define the shell of your app — navigation, sidebars, wrappers.

**What it CONTAINS:**
```
src/components/layout/
  Navbar.tsx
  Sidebar.tsx
  PageWrapper.tsx
  AuthLayout.tsx
  DashboardLayout.tsx
```

**What it CAN do:**
- Use auth state hooks (e.g., `useCurrentUser`)
- Render navigation, branding, user menus
- Wrap page content in consistent structure

**What it CANNOT do:**
- ❌ Contain page-specific business logic
- ❌ Fetch domain data (projects, tasks, etc.)

**Snippet:** `layout-component`

**Example:**
```typescript
// src/components/layout/PageWrapper.tsx
interface PageWrapperProps {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function PageWrapper({ title, children, actions }: PageWrapperProps) {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>{title}</h1>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      <div className="page-content">{children}</div>
    </div>
  )
}
```

---

### Layer 9 — Page Hooks

**What it IS:** Feature-specific hooks that live alongside their page — they combine query hooks, handle form state, and encapsulate the logic for one feature.

**What it CONTAINS:**
```
src/pages/Dashboard/
  hooks/
    useDashboardData.ts    # combines useProjects + useTasks
    useDashboardFilters.ts # filter/sort state
```

**What it CAN do:**
- Call multiple query hooks
- Manage local form/filter state with `useState`
- Derive computed values from query results
- Handle form submission logic

**What it CANNOT do:**
- ❌ Call API layer directly
- ❌ Import Supabase client
- ❌ Return JSX

**Snippet:** `page-hook`

**Example:**
```typescript
// src/pages/Dashboard/hooks/useDashboardData.ts
export function useDashboardData() {
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const [filter, setFilter] = useState<'all' | 'active'>('all')

  const filteredProjects = useMemo(
    () =>
      filter === 'all'
        ? projects
        : projects?.filter((p) => p.status === 'active'),
    [projects, filter]
  )

  return {
    projects: filteredProjects,
    isLoading: projectsLoading,
    filter,
    setFilter,
    total: projects?.length ?? 0,
    activeCount: projects?.filter((p) => p.status === 'active').length ?? 0,
  }
}
```

---

### Layer 10 — Page Components

**What it IS:** Route-level components. They orchestrate the page — calling page hooks and passing data down to components.

**What it CONTAINS:**
```
src/pages/
  Dashboard/
    index.tsx           # the page component
    hooks/              # page hooks
  Profile/
    index.tsx
  Login/
    index.tsx
```

**What it CAN do:**
- Call page hooks
- Render layout + UI components
- Pass data as props to child components
- Handle navigation (`useNavigate`)

**What it CANNOT do:**
- ❌ Call API functions directly
- ❌ Import Supabase client
- ❌ Put complex logic inline — extract to a page hook

**Snippet:** `page-component`

**Example:**
```typescript
// src/pages/Dashboard/index.tsx
import { useDashboardData } from './hooks/useDashboardData'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ProjectCard } from '@/components/ProjectCard'
import { Button } from '@/components/ui/Button'

export function DashboardPage() {
  const { projects, isLoading, filter, setFilter, activeCount } =
    useDashboardData()

  if (isLoading) return <Spinner />

  return (
    <PageWrapper
      title="Dashboard"
      actions={<Button onClick={() => setFilter('active')}>Active Only</Button>}
    >
      <p>{activeCount} active projects</p>
      {projects?.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </PageWrapper>
  )
}
```

---

### Layer 11 — Router

**What it IS:** The app entry point — defines all routes and wraps the app in providers.

**What it CONTAINS:**
```
src/App.tsx           # routes + top-level providers
src/main.tsx          # ReactDOM.render, QueryClientProvider
```

**What it CAN do:**
- Define all routes
- Wrap app in `QueryClientProvider`, `BrowserRouter`
- Implement `ProtectedRoute` for auth guards

**What it CANNOT do:**
- ❌ Contain business logic
- ❌ Make API calls

**Snippet:** `router-setup`

**Example:**
```typescript
// src/App.tsx
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

### Layer 12 — Error Boundary

**What it IS:** A React class component (or library wrapper) that catches render errors and shows a fallback UI instead of a blank screen.

**What it CONTAINS:**
```
src/ErrorBoundary.tsx    # wraps <App />
```

**What it CAN do:**
- Catch JavaScript errors during render
- Log errors to monitoring (e.g., Sentry)
- Render a "Something went wrong" fallback

**What it CANNOT do:**
- ❌ Catch async errors (those are handled by React Query's `error` state)
- ❌ Recover automatically without a page reload

**Snippet:** `error-boundary`

**Example:**
```typescript
// src/main.tsx
import { ErrorBoundary } from 'react-error-boundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        fallback={<div>Something went wrong. <button onClick={() => window.location.reload()}>Reload</button></div>}
        onError={(error) => console.error('App crashed:', error)}
      >
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
)
```

---

### Layer 13 — Test Layer

**What it IS:** Automated tests organised to mirror the src/ structure.

**What it CONTAINS:**
```
src/test/
  setup.ts                    # vitest/jest setup, MSW handlers
  mocks/
    handlers.ts               # MSW API mock handlers
    supabase.ts               # Supabase mock
  lib/
    projects/api.test.ts      # API function unit tests
    projects/queries.test.ts  # hook tests with renderHook
  pages/
    Dashboard.test.tsx        # integration tests
  components/
    ui/Button.test.tsx        # component unit tests
```

**What it CAN do:**
- Mock Supabase via MSW or vi.mock
- Test API functions in isolation
- Test hooks with `renderHook` + `QueryClientProvider`

**Snippet:** `test-setup` / `api-test` / `hook-test`

**Example:**
```typescript
// src/lib/projects/api.test.ts
import { getProjects } from './api'
import { supabase } from '@/lib/supabase'
import { vi } from 'vitest'

vi.mock('@/lib/supabase')

test('getProjects returns data on success', async () => {
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Test Project' }],
        error: null,
      }),
    }),
  } as any)

  const result = await getProjects()
  expect(result).toHaveLength(1)
  expect(result[0].name).toBe('Test Project')
})
```

---

## 3. Communication Rules

| From → To           | Allowed? | Notes |
|---------------------|----------|-------|
| Page → Page Hook    | ✅ YES   | Call hook, destructure return |
| Page → UI Component | ✅ YES   | Pass data as props |
| Page → Layout      | ✅ YES   | Wrap in layout component |
| Page Hook → Query Hook | ✅ YES | Combine multiple hooks |
| Query Hook → API    | ✅ YES   | Via `queryFn`/`mutationFn` |
| API → Supabase Client | ✅ YES | The ONLY importer of client |
| Layout → Auth Hook  | ✅ YES   | `useCurrentUser()` is fine |
| UI Component → UI Component | ✅ YES | Composition is fine |
| Page → Query Hook   | ⚠️ OK   | Prefer via page hook, but direct use is fine for simple pages |
| Page → API          | ❌ NO    | Skip no layers — always go through a hook |
| Component → API     | ❌ NO    | Components are presentational only |
| Component → Supabase | ❌ NEVER | Hard rule. No exceptions. |
| Hook → Supabase     | ❌ NEVER | Hooks call API, API calls Supabase |
| Page → Supabase     | ❌ NEVER | Hard rule. No exceptions. |
| Types → anything    | ❌ NEVER | Types are imported, never import |
| API → React hooks   | ❌ NEVER | API layer has no React dependency |

**The golden rule:** Data flows DOWN (as props). Events flow UP (as callbacks). External data flows through: **Page Hook → Query Hook → API → Supabase**.

---

## 4. Foundation Checklist

### 🛠 Project Setup
- [ ] Vite + React + TypeScript project initialised
- [ ] `tsconfig.json` with `"strict": true`
- [ ] Path alias configured: `@/` → `src/` (in `vite.config.ts` + `tsconfig.json`)
- [ ] `.gitignore` includes: `node_modules/`, `dist/`, `.env.local`, `.env.production`
- [ ] `.env.example` committed with all required keys (no values)
- [ ] `README.md` with setup instructions

### 🎨 Code Quality
- [ ] ESLint installed and configured (`eslint.config.js` or `.eslintrc`)
  - [ ] `@typescript-eslint` rules enabled
  - [ ] `eslint-plugin-react-hooks` (enforces hooks rules)
  - [ ] `eslint-plugin-import` (enforces no-skip-layers)
- [ ] Prettier installed with `.prettierrc`
- [ ] `lint-staged` + `husky` pre-commit hook (lint + format on commit)
- [ ] `package.json` scripts: `lint`, `format`, `type-check`

### 🗂 Project Structure
- [ ] `src/types/` — database, api, ui types
- [ ] `src/lib/supabase.ts` — single client export
- [ ] `src/lib/queryKeys.ts` — all React Query keys
- [ ] `src/lib/constants.ts` — app constants
- [ ] `src/lib/[domain]/api.ts` — per domain API files
- [ ] `src/lib/[domain]/queries.ts` — per domain query hooks
- [ ] `src/components/ui/` — dumb UI components + `index.ts` barrel
- [ ] `src/components/layout/` — layout components
- [ ] `src/pages/[Feature]/index.tsx` — page components
- [ ] `src/pages/[Feature]/hooks/` — page-specific hooks
- [ ] `src/test/` — test setup + mocks

### 🔐 Auth & Security
- [ ] Supabase Auth configured (email/password or social)
- [ ] `ProtectedRoute` component implemented
- [ ] Auth state hook (`useCurrentUser`) created
- [ ] Sign-in / sign-out flows working
- [ ] Session persistence tested (page refresh keeps user logged in)
- [ ] RLS policies enabled on ALL tables (not just "by default")
- [ ] RLS tested: confirm anonymous user CANNOT read protected data
- [ ] API keys in `.env.local` only — never hardcoded in src/

### ⚡ Data Layer
- [ ] `@tanstack/react-query` installed
- [ ] `QueryClient` configured with sensible defaults (staleTime, retry)
- [ ] `QueryClientProvider` wraps app in `main.tsx`
- [ ] `ReactQueryDevtools` added (dev only)
- [ ] At least one query hook + one mutation hook working end-to-end
- [ ] Cache invalidation tested after mutations

### 🧱 UI Foundation
- [ ] CSS framework or design system chosen (Tailwind / CSS Modules / etc.)
- [ ] `Button` component with loading state
- [ ] `Input` component with error state
- [ ] `Spinner` / loading component
- [ ] Global error display component (toast or inline)
- [ ] 404 page implemented

### 🚧 Error Handling
- [ ] `ErrorBoundary` wraps the entire app
- [ ] React Query errors shown in UI (not silently swallowed)
- [ ] API functions throw meaningful errors
- [ ] Network error handled gracefully (offline state)

### 🧪 Tests
- [ ] Vitest (or Jest) configured
- [ ] `@testing-library/react` installed
- [ ] Test setup file created (`src/test/setup.ts`)
- [ ] At least one API function test passing
- [ ] At least one hook test passing
- [ ] CI runs tests on push

### 🚀 Build & Deployment
- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] Zero ESLint errors in build
- [ ] Environment variables set in deployment platform (Vercel/Netlify)
- [ ] Preview deploy on every PR (Vercel automatic)
- [ ] `dist/` gitignored

### 📊 Observability
- [ ] Console errors reviewed (no unhandled errors at startup)
- [ ] Loading states on all async operations
- [ ] Error states shown on all data fetches
- [ ] Empty states handled (no blank screens when no data)

---

## 5. What's Still Missing

### Things Snippets Don't Cover Yet
- **Optimistic updates** — updating the UI before the server confirms (advanced mutation pattern)
- **Infinite scroll / pagination** — `useInfiniteQuery` pattern
- **Real-time subscriptions** — Supabase `channel().on('postgres_changes', ...)` wrapped in a hook
- **File upload** — Supabase Storage API functions + progress tracking
- **Form validation** — `react-hook-form` + `zod` schema integration pattern
- **Stale-while-revalidate config** — default `staleTime` / `gcTime` strategy for the QueryClient

### Infrastructure Gaps
- **Email sending** — transactional email (Resend/SendGrid) via Supabase Edge Functions
- **Edge Functions** — Supabase serverless functions for logic that shouldn't run client-side
- **Cron jobs** — Supabase pg_cron for scheduled DB tasks
- **Database migrations** — Supabase CLI migration workflow (`supabase db diff`, `supabase migration new`)
- **Type generation** — `supabase gen types typescript` to auto-generate `Database` type from live schema

### Security Considerations
- **Rate limiting** — Supabase built-in, but verify it's enabled for auth endpoints
- **Input sanitisation** — never build raw SQL strings; always use Supabase query builder
- **Service role key** — should NEVER appear in client-side code; only in Edge Functions
- **CORS** — configure allowed origins in Supabase dashboard for production
- **Content Security Policy** — add CSP headers via hosting platform

### Performance Considerations
- **Bundle splitting** — React.lazy + Suspense for route-level code splitting
- **Image optimisation** — use Supabase Storage transform URLs for resizing
- **Query deduplication** — React Query handles this, but ensure `queryKeys` are stable (no new arrays in render)
- **Virtualization** — for long lists (>100 items), use `@tanstack/virtual`

### Deployment Considerations
- **Preview environments** — Vercel branch previews need their own `.env` (can use same dev Supabase project)
- **Production vs staging** — separate Supabase projects for prod and staging
- **Database backups** — Supabase automatic backups on paid plan; verify for prod
- **Monitoring** — Sentry (errors) + Vercel Analytics (performance) are the minimal setup

---

## 6. The Nicris Quick Reference Card

```
╔══════════════════════════════════════════════════════════════════════╗
║              NICRIS APP QUICK REFERENCE CARD                        ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  THE 3-LAYER RULE                                                    ║
║  ─────────────────                                                   ║
║  Page  →  Hook  →  API  →  Supabase                                 ║
║  Never skip. Never reverse. Never shortcut.                          ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  NAMING CONVENTIONS (5 rules)                                        ║
║  ──────────────────────────────                                      ║
║  1. Files:      PascalCase for components, camelCase for lib/        ║
║  2. Hooks:      useFeatureAction  (useProjects, useCreateTask)       ║
║  3. API fns:    verbNoun          (getProjects, createTask)          ║
║  4. Types:      PascalCase nouns  (Project, Task, UserProfile)       ║
║  5. Query keys: queryKeys.domain.scope (queryKeys.projects.list())   ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  STARTING A NEW FEATURE — FILE ORDER                                 ║
║  ────────────────────────────────────                                ║
║  1. types/        Add interface to src/types/database.ts             ║
║  2. queryKeys.ts  Add key factory for the domain                     ║
║  3. api.ts        Write get/create/update/delete functions           ║
║  4. queries.ts    Write useQuery + useMutation hooks                 ║
║  5. Component     Build the UI component (if new pattern needed)     ║
║  6. Page hook     Combine data + local state logic                   ║
║  7. Page          Render it, wire up props                           ║
║  8. Route         Add to App.tsx                                     ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  SNIPPET SEQUENCE FOR A NEW FEATURE                                  ║
║  ────────────────────────────────────                                ║
║  types-setup → api-function → query-keys →                          ║
║  query-hook → mutation-hook → ui-component → page-hook →            ║
║  page-component → router-setup (if new route)                       ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  THE "NEVER DO THIS" LIST                                            ║
║  ──────────────────────────                                          ║
║  ❌ import { supabase } from anywhere except lib/[domain]/api.ts    ║
║  ❌ Call an API function directly from a page or component           ║
║  ❌ Put business logic inside JSX (extract to a hook first)          ║
║  ❌ Hardcode Supabase keys — always use import.meta.env              ║
║  ❌ Create a second Supabase client instance                         ║
║  ❌ Skip the types layer — always type your data                     ║
║  ❌ Use `any` — write the type or use `unknown`                      ║
║  ❌ Inline magic strings — use constants or queryKeys                ║
║  ❌ Forget RLS — every new table needs row-level security            ║
║  ❌ Commit .env.local — it's in .gitignore for a reason              ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  WHEN SOMETHING BREAKS                                               ║
║  ─────────────────────                                               ║
║  Data not showing?   → Check queryKey matches invalidation key       ║
║  Stale data?         → Check staleTime in QueryClient config         ║
║  Auth 401 error?     → Check RLS policy + user is logged in          ║
║  TypeScript error?   → Run supabase gen types to refresh DB types    ║
║  Hook not updating?  → Ensure queryKey has all dynamic params        ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

*This document is the ground truth for how apps are built in the Nicris stack. When in doubt, consult this first.*
