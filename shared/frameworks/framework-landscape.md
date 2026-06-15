# Web Framework Landscape — Nicris's Map
*Written June 2026 — authoritative source: senior developer review of your actual stack*

---

> **How to read this doc:** You're an electrical engineer entering web development. You already think in systems, layers, and tradeoffs. This doc maps the terrain the same way — what exists, why it exists, and when each thing is the right choice. No fluff, no hand-holding. Just the map.

---

## 1. The Landscape Overview

Where different tech sits on the complexity vs scale spectrum. This is the single most important thing to internalize.

```
COMPLEXITY
    │
    │                                          ← Hyperscale (FB, Netflix, Uber)
    │  [Kubernetes] [Kafka] [Event-driven]
    │  [Microservices + Service Mesh]
    │
    │  [AWS Lambda] [ElasticSearch]
    │  [Next.js + Node + Redis + Postgres]     ← Larger SaaS (100k+ users)
    │
    │  [Next.js + Supabase]                    ← Public apps needing SEO
    │  [React + Supabase] ← YOU ARE HERE       ← Professional startups, internal tools
    │
    │  [React + Firebase]                      ← Beginner-friendly, Google ecosystem
    │
    │  [WordPress] [Webflow] [Bubble]          ← No-code / low-code
    │
    └──────────────────────────────────────────── SCALE
         Small        Medium        Large       Hyper
         (1–1k)       (1k–100k)     (100k–1M)   (1M+)
```

**The key insight:** Most business apps live in the Medium band. The tools built for Hyper scale are genuinely overkill below it — not just unnecessary, but actively harmful to development speed and team sanity.

Kubernetes is not "more professional" than Supabase for a 5-person SaaS. It's just more expensive to run and harder to maintain. The companies that run Kubernetes have entire platform engineering teams whose only job is Kubernetes. Don't aspire to their infrastructure — aspire to their product quality.

---

## 2. The Stack Comparison Tables

### 2a. Frontend Frameworks

| Framework | What It Is | Best For | Not Great For | Learning Curve | SEO Support |
|---|---|---|---|---|---|
| **Vite + React** *(what we use)* | Build tool + UI library. Browser downloads JS, builds the page client-side | Auth-gated apps, dashboards, internal tools, SPAs | Public SEO-dependent pages | Medium (React is everywhere, docs are great) | ❌ Poor (SPA = blank page for crawlers) |
| **Next.js** | React + server rendering built in. Pages can be SSR, SSG, or SPA per route | Public-facing apps, e-commerce, marketing sites, any mix of public + private pages | Pure internal tools (overkill) | Medium-High (more config, more concepts) | ✅ Excellent (HTML delivered from server) |
| **Remix** | React + server-focused, excellent for forms and mutations, progressive enhancement | Apps where data mutations are complex, teams that want strict server/client discipline | Teams unfamiliar with server concepts | High (different mental model) | ✅ Good |
| **Nuxt (Vue)** | Vue's equivalent of Next.js. Server rendering, file-based routing | Teams that prefer Vue syntax, PHP-background devs transitioning | React ecosystem tooling won't carry over | Medium | ✅ Good |
| **SvelteKit** | Svelte's full-stack framework. Svelte compiles away — no virtual DOM, very fast | Performance-critical apps, developers who want minimal magic | Smaller ecosystem, fewer libraries | Low-Medium (Svelte syntax is clean) | ✅ Good |
| **Angular** | Full framework from Google. Opinionated, structured, TypeScript-first from day one | Large enterprise teams, regulated industries (finance, govt), corps that need enforced patterns | Small teams, fast MVPs | High (steep learning curve, opinionated) | ✅ With Angular Universal |

**The practical summary:** For your projects, it's Vite+React or Next.js. Everything else is fine but not in your current path. Choose based on one question: *does Google need to read this page?*

---

### 2b. Backend / Database Options

| Tool | What It Is | Best For | Limits | Cost Model |
|---|---|---|---|---|
| **Supabase** *(what we use)* | Postgres database + auth + storage + realtime + edge functions, all managed | Small-to-medium teams, fast setup, everything in one place | ~500MB free tier, pricing scales with usage, but generous | Free tier → ~$25/month → custom |
| **Firebase** | Google's BaaS. NoSQL (Firestore) + auth + storage + hosting | Beginners, mobile-first apps, Google ecosystem | NoSQL gets painful for relational data, pricing can spike, vendor lock-in | Free tier → pay-per-use (can surprise you) |
| **PlanetScale** | Serverless MySQL built on Vitess (what YouTube uses). Branching for DB schema | Teams that know MySQL, need scalable relational DB without ops overhead | No foreign key enforcement (by design) | Free tier → $39/month+ |
| **Prisma + PostgreSQL** | ORM (query builder) + self-hosted or managed Postgres. Full control | Teams that need full control, existing Postgres infra, complex queries | You manage the database server (or pay Render/Railway/Neon) | Database hosting cost + free Prisma |
| **MongoDB** | Document database (NoSQL). Flexible schema, JSON-native | Unstructured data, content systems, logs, real-time analytics | Doesn't enforce structure — great power, great foot-gun | Atlas free tier → pay-per-use |
| **Convex** | Real-time database + backend functions, TypeScript-native, very new | Teams that want everything reactive by default | Young ecosystem, opinionated patterns | Free tier → $25/month+ |
| **Appwrite** | Open-source BaaS, self-hostable Supabase alternative | Teams that need on-prem or full data sovereignty | Smaller community, less mature | Free (self-host) or cloud pricing |

**The practical summary:** Supabase is the right call for your projects. It's Postgres (the most powerful open-source database in existence), and everything you'd build yourself (auth, storage, realtime, edge functions) is already there. Firebase is fine for beginners but NoSQL will bite you when your data gets relational. Everything else is either niche or overkill.

---

### 2c. CSS / Styling

| Tool | What It Is | Best For | Trade-off |
|---|---|---|---|
| **Tailwind CSS** *(what we use)* | Utility-first CSS. Style directly in your HTML/JSX with class names | Fast iteration, consistent design systems, teams that hate context-switching | HTML gets visually noisy, requires learning the utility class names |
| **CSS Modules** | Scoped CSS files per component. Old-school CSS but no global conflicts | Teams that want real CSS control, no new syntax | More files, more context switching |
| **Styled Components** | Write CSS inside JavaScript using tagged template literals | Component-driven design, dynamic styles based on props | Runtime overhead, CSS-in-JS debate, slower than Tailwind for iteration |
| **Sass/SCSS** | CSS with superpowers (variables, nesting, mixins). Pre-processor | Legacy codebases, teams that know CSS deeply | Adds build step, Tailwind has mostly replaced this in new projects |
| **MUI / Chakra UI** | Pre-built component libraries (buttons, modals, forms) with styles included | Rapid prototyping, teams without designers | Opinionated look, hard to customize deeply, heavy bundles |

**The practical summary:** Tailwind is correct for 2026. The "HTML looks ugly" critique is real but irrelevant — the productivity gain is worth it, and your codebase stays small. Component libraries (MUI/Chakra) are useful for internal tools where you don't care about custom design.

---

### 2d. State Management / Data Fetching

| Tool | What It Is | Best For | Trade-off |
|---|---|---|---|
| **TanStack Query** *(what we use)* | Server state management. Handles fetching, caching, background sync, loading/error states | Anything that fetches data from an API or database | Only handles server state — not UI state |
| **SWR** | Vercel's data fetching library. Similar to TanStack Query, simpler API | Next.js projects, simpler data needs | Less powerful than TanStack Query for complex scenarios |
| **Zustand** | Minimal client state management. Replaces Redux for UI state (modals, filters, current user) | Simple global UI state, small bundles | Not for server data — pair with TanStack Query |
| **Redux Toolkit** | The modern version of Redux. Powerful, predictable state container | Large apps with complex client-side state, teams that need strict patterns | Verbose, overkill for most apps |
| **Jotai** | Atomic state management. Very minimal, composable | Fine-grained reactive UI state | Very new, smaller ecosystem |

**The mental model:** Separate *server state* (data from your database — use TanStack Query) from *client state* (UI state like "is this modal open" — use Zustand or React's own `useState`). Most React codebases go wrong by conflating these two things. They are different problems.

---

## 3. Decision Tree

Use this when starting any new project:

```
START
  │
  ├─ Does Google need to read this page?
  │   ├─ YES → Next.js
  │   │          ├─ It's mostly static content → Add SSG
  │   │          └─ It's dynamic (e-commerce, community) → Add SSR
  │   │
  │   └─ NO (auth-gated, internal tool, private app)
  │          └─ Vite + React (simpler, faster to build)
  │
  ├─ How big is your team?
  │   ├─ 1–3 people → Supabase (saves you maintaining 4 separate services)
  │   ├─ 4–10 people → Supabase or Postgres + Prisma depending on complexity
  │   └─ 10+ people → Start considering self-hosted infrastructure
  │
  ├─ Do you need real-time features? (live updates, notifications)
  │   ├─ YES, up to ~10k concurrent users → Supabase Realtime (built in)
  │   └─ YES, at massive scale → Redis Pub/Sub or dedicated realtime infrastructure
  │
  ├─ Do you need file uploads? (images, PDFs, documents)
  │   └─ Supabase Storage (built in, S3-compatible)
  │
  ├─ Do you need complex automation workflows?
  │   └─ n8n (already in your stack — hooks into any API, no code required)
  │
  ├─ Is this e-commerce?
  │   └─ Next.js + Supabase + Stripe (SEO for product pages is non-negotiable)
  │
  └─ Is this a pure marketing/landing page?
      └─ Next.js or Astro (Astro is even lighter, ships zero JS by default)
```

---

## 4. Nicris's Project Map

Every project you're building, mapped to the right stack with the reason why.

| Project | Stack | Status | Reason |
|---|---|---|---|
| **myLifeTracker** | Vite + React + Supabase | ✅ Correct | Private, auth-gated. SEO irrelevant. You're the only user. Speed of development wins. |
| **Samsara Community App** | Vite + React + Supabase | ✅ Correct | Members-only community. Google doesn't need to see inside. Internal = Vite SPA. |
| **AWE App** | Vite + React + Supabase | ✅ Correct | Coaching platform, login-required. Users access via invitation. No public index pages. |
| **WaveEngineering (Airwave)** | Vite + React + Supabase | ✅ Correct | Internal business system — jobs, quotes, invoices. Nobody needs to find this on Google. Perfect fit. |
| **Unitree** | Next.js + Supabase | ⚠️ Consider migration | Public-facing: marketing pages, avatar quizzes, community content, documentation. These pages need to rank on Google. Currently a SPA = invisible to crawlers. |
| **Samsara Landing Page** | Next.js or Astro | ⚠️ Upgrade recommended | Marketing page. SEO is its entire purpose. If it's a Vite SPA right now, Google sees a blank page. |
| **Olive Oil DTC** | Next.js + Supabase | 🔲 Not yet built | E-commerce. Product pages need SEO. "Best EVOO South Africa" should find you. SSR is essential here. |

**The migration note for Unitree and the landing page:** This doesn't mean starting over. Next.js can wrap your existing React components almost unchanged. The routing moves from React Router to Next.js file-based routing, and you add `getServerSideProps` or `generateStaticParams` where needed. It's work, but it's measured in days, not weeks.

---

## 5. What Vite vs Next.js Actually Means

This is the single most important concept to understand. Everything else follows from it.

### The Vite SPA (Single Page Application) model

When someone visits your Vite app:

```
Browser → Server: "Give me the page"
Server  → Browser: "Here's an empty HTML file and 2MB of JavaScript"
Browser: *runs the JavaScript*
Browser: *JavaScript fetches your data from Supabase*
Browser: *JavaScript builds the page*
User: *finally sees content* (300ms–2s later)
Googlebot: *sees the empty HTML file, gives up, indexes nothing*
```

**The problem:** Googlebot doesn't wait around for JavaScript to run. It sees the blank shell and leaves. Your pages don't get indexed. Nobody finds you.

**When it doesn't matter:** If you need a login to see any content, Google can't get in anyway. Googlebot hitting a login wall is no different than hitting a blank page. So for auth-gated apps — your dashboards, internal tools, community apps — the SPA model is completely fine.

### The Next.js SSR (Server-Side Rendering) model

When someone visits your Next.js app:

```
Browser   → Server: "Give me the page"
Server: *runs your code*
Server: *fetches data from Supabase*
Server: *builds the full HTML page*
Server   → Browser: "Here's the complete page with all content"
Browser: *displays it immediately* (50–150ms)
Googlebot: *reads the full HTML, indexes every word*
```

**The result:** Pages appear faster, Google indexes everything, and you can still use all your React components. The server just pre-builds the HTML before sending it.

### SSG (Static Site Generation) — a subset of Next.js

For pages that don't change often (product pages, blog posts, documentation), Next.js can pre-build the HTML at *deploy time* rather than on each request. The result is served from a CDN — effectively instant load anywhere in the world. The Samsara landing page could be entirely SSG. Your olive oil product pages could be SSG. They're rebuilt whenever you update content, cached globally, and load in under 100ms.

### The practical rule

| Situation | Use |
|---|---|
| Private, login required, internal | Vite SPA |
| Public, needs to rank on Google | Next.js (SSR or SSG) |
| Pure static marketing site | Astro or Next.js SSG |
| Mix of public and private pages | Next.js (it handles both per-route) |

---

## 6. The Architectural Anti-Patterns

The biggest risk in your React projects isn't choosing the wrong framework. It's letting your codebase rot into something nobody can navigate.

### What the mess looks like (12-folder explosion)

After 6–12 months on a React project with no enforced structure, you end up with this:

```
src/
  pages/         ← some logic, some just wrappers
  components/    ← 80 files, no organization
  hooks/         ← some fetch data, some format strings
  utils/         ← the junk drawer
  services/      ← sometimes calls the API, sometimes calls hooks
  helpers/       ← more junk drawer
  contexts/      ← global state scattered everywhere
  providers/     ← wraps providers, confusingly named
  stores/        ← Zustand stores and also Redux slices somehow
  managers/      ← what does a "manager" do exactly?
  adapters/      ← transforms data? or calls APIs?
  factories/     ← nobody knows anymore
  types/         ← TypeScript types, 600 lines, partially duplicated
```

After a year, a new developer spends 3 days figuring out where to put a new feature. Even the original author can't remember the rules because there weren't any. This is the most common failure mode in React development, and it has nothing to do with React — it's a discipline problem.

### What the clean 3-layer model looks like

```
src/
  pages/         ← ONLY: layout + composition. Knows which components to show.
  components/    ← ONLY: UI. Receives props. Knows nothing about data fetching.
  lib/           ← ONLY: Supabase calls (queries, mutations). No UI. No state.
```

The flow is strictly one-directional:

```
Page
  → calls TanStack Query hook
    → calls lib/supabase function
      → calls Supabase API
        → returns data back up the chain
Page
  → passes data as props to Components
    → Components render UI
```

**The rules that enforce this:**
- Components never call Supabase directly
- lib/ functions never import React
- Pages are thin — they orchestrate, they don't logic
- If you can't tell which layer something belongs to, it's a sign the abstraction is wrong

### The complexity creep timeline

```
Month 0:   Clean. Everything makes sense.
Month 3:   "I'll just put this helper here for now"
Month 6:   "Where does this belong again? I'll make a new folder"
Month 9:   Two different patterns for the same thing coexist
Month 12:  New dev asks "where do I put a new API call?" Nobody agrees
Month 18:  Entire codebase is technically debt. Rewrite discussions begin.
```

**The prevention:** Decide the rules on day one. Write them down. Enforce them in code review. The 3-layer rule is the rule. Deviations need a meeting, not a file.

### How to prevent it going forward

1. Every new file lives in exactly one of: `pages/`, `components/`, `lib/`
2. Run `tsc --noEmit` in CI — TypeScript errors block merges
3. Add ESLint with import order rules — enforces layer boundaries
4. Code review specifically checks: *which layer does this live in, and is that right?*
5. If a component grows past ~150 lines, split it — don't add a new abstraction

---

## 7. Scaling Path for Your Projects

What actually happens if your projects grow? Let's be concrete.

### What Supabase can handle

People underestimate Supabase. It runs on Postgres, which is the most battle-tested database on the planet. LinkedIn, Instagram, and Spotify have all run significant workloads on Postgres.

| Scale | Supabase handles it? | Notes |
|---|---|---|
| 0 – 10k users | ✅ Comfortably | Free tier, then Pro ($25/mo) |
| 10k – 100k users | ✅ Yes | Pro plan, possibly add read replicas |
| 100k – 500k users | ✅ With optimization | Indexes, query optimization, connection pooling (PgBouncer — Supabase includes it) |
| 500k – 1M users | ⚠️ Possible but evaluate | Depends on query complexity and concurrent connections |
| 1M+ active users | ❌ Probably time to move | Not a Supabase limit specifically — a "single-database" architecture limit |

**The actual constraint at scale isn't storage or rows — it's concurrent connections.** Postgres handles ~500 concurrent connections before it starts struggling. Supabase's PgBouncer pools these, multiplying effective capacity by 10–20x. Most apps never hit this. Your Samsara app at 100k users, if those users aren't all online simultaneously, is completely fine.

### What would actually change at each scale milestone

**At 10k active users:**
- Enable Supabase Pro ($25/month)
- Add database indexes to your most-queried columns
- Review your slow queries (Supabase has a query analyser)
- Nothing else changes

**At 100k active users:**
- Add a read replica (Supabase supports this)
- Add connection pooling if not already active
- Consider edge functions for compute-heavy operations
- Still on Supabase — this is normal Supabase scale

**At 500k active users:**
- Evaluate whether you need a dedicated database (self-hosted Postgres on AWS RDS or Neon)
- Add Redis for caching (frequently-read data that never changes)
- Possibly migrate to Next.js if you're on Vite+React
- Add a CDN for static assets (Vercel or Cloudflare)

**At 1M+ active users:**
- You have a real business with real infrastructure budget
- Hire a backend engineer whose full job is database and infrastructure
- Consider read replicas in multiple regions
- This is a good problem to have — you're not pre-optimizing for it

### The migration path off Supabase (if you ever need it)

Because Supabase is just Postgres under the hood:

1. Export your database with `pg_dump` — standard Postgres export
2. Import to any Postgres provider (AWS RDS, Neon, Railway, self-hosted)
3. Update your connection strings
4. Move auth to a dedicated auth service (Auth0, Clerk) or build your own
5. Move storage to S3 directly

There's no vendor lock-in beyond the Supabase-specific APIs (realtime, edge functions). Your data is always accessible as plain Postgres. This is the main reason Supabase beats Firebase for serious projects — Firebase's NoSQL is a proprietary format; Supabase's Postgres is an open standard.

### Why starting simple is correct

Pre-optimizing for scale you don't have yet is one of the most expensive mistakes in software. You pay the cost of complexity before you have the revenue or team to justify it, and you slow down iteration on the thing that actually matters: building a product people want.

The companies that run Kubernetes have hundreds of engineers and billions of dollars in revenue. They arrived there by first building something simple, getting users, making money, then hiring people to solve the scale problems that money bought them. You do not start there.

**The rule:** Solve the problem you have, not the problem you might have in 3 years.

---

## 8. Key Terms Glossary

Plain language. No jargon justifying jargon.

---

**SPA (Single Page Application)**
A web app that loads once as a JavaScript bundle, then handles all navigation in the browser without full page reloads. Gmail is a SPA. Your dashboard is a SPA. Fast and interactive, but Google struggles to index them.

---

**SSR (Server-Side Rendering)**
The server builds the full HTML page before sending it to the browser. Every request triggers a server-side render. Good for dynamic, personalized public content (e-commerce product pages with real-time stock, news sites).

---

**SSG (Static Site Generation)**
HTML pages are built at deploy time and served as static files from a CDN. No server needed per request. Best for content that doesn't change often (marketing pages, docs, blogs). Blazing fast.

---

**ISR (Incremental Static Regeneration)**
A Next.js feature combining SSG and SSR. Pages are statically built but automatically regenerated in the background every N seconds. Your olive oil product pages could use ISR — built statically, updated every hour when inventory changes.

---

**API (Application Programming Interface)**
A defined contract for how two systems talk to each other. When your React frontend fetches data from Supabase, it uses Supabase's API. When n8n sends you an email, it uses Resend's API. APIs are how software talks to software.

---

**REST vs GraphQL**
Two different styles of API design.
- **REST:** Each resource has its own URL. `/users/123` gives you a user. Simple, predictable, standard.
- **GraphQL:** One URL, you specify exactly what fields you want. More flexible, less over-fetching, more complex to set up. Overkill for most projects.

Supabase uses REST (and also supports a thin GraphQL layer). You're using REST. You don't need GraphQL yet.

---

**Authentication vs Authorization**
- **Authentication (AuthN):** Are you who you say you are? (Login — prove your identity)
- **Authorization (AuthZ):** Are you allowed to do this? (Permissions — what can you access)

Supabase handles both. Auth = login flow. Row Level Security = authorization rules on the data.

---

**RLS (Row Level Security)**
Postgres-level rules that control which rows a user can read or write, evaluated at the database layer before data ever leaves. Example: "Users can only read their own check-in records." This runs in the database itself — no matter how your app calls Supabase, the rule enforces. It's the correct way to secure multi-user data in Supabase.

---

**CI/CD (Continuous Integration / Continuous Deployment)**
- **CI:** Every time you push code, automated tests run and TypeScript is checked. Broken code is caught before it reaches production.
- **CD:** When tests pass, code is automatically deployed to production. No manual deploy steps.

Vercel does CD automatically — push to `main`, it deploys. GitHub Actions handles CI — runs your tests on every PR. Together they mean: if it passes review and tests, it ships.

---

**Monorepo vs Polyrepo**
- **Monorepo:** All your projects (frontend, backend, shared utilities) live in one git repository. Easier to share code, harder to scale CI.
- **Polyrepo:** Each project has its own repository. More isolation, more overhead coordinating changes across repos.

For your scale: polyrepo is fine. One repo per app. If you find yourself copy-pasting shared code between apps constantly, that's the signal to consider a monorepo.

---

**Edge Functions**
Small serverless functions that run at CDN edge nodes (geographically close to the user) rather than in a central server. Lower latency for compute. Supabase Edge Functions use Deno runtime. Good for: auth webhooks, lightweight API endpoints, data transformations. Not for: heavy computation or long-running processes.

---

**Webhooks**
A way for external services to push data to you when something happens. Instead of your app constantly asking "did anything change?" (polling), the external service calls your URL when something happens. Example: Stripe calls your webhook URL when a payment succeeds. Resend calls your webhook URL when an email bounces. n8n can both receive and send webhooks.

---

**WebSockets**
A persistent, bidirectional connection between browser and server. Unlike standard HTTP (browser asks, server answers, connection closes), WebSockets keep the connection open. Supabase Realtime uses WebSockets — that's how your app receives live database updates without refreshing. Also how chat apps, live dashboards, and collaborative tools work.

---

## 9. The 2026 Recommended Starter Decision

No hedging. Here's the actual answer.

---

### The 30-second decision

**Is your app auth-gated (users must log in to see anything)?**
→ **Vite + React + TypeScript + Tailwind + React Router + TanStack Query + Supabase**

**Does Google need to index your pages?**
→ **Next.js + TypeScript + Tailwind + TanStack Query + Supabase**

That's it. 90% of decisions collapse into this binary.

---

### The full recommended stack (either path)

```
Language:    TypeScript (always — it catches entire categories of bugs at editor time)
Styling:     Tailwind CSS (utility-first, fast, consistent)
Database:    Supabase (Postgres + auth + storage + realtime in one service)
Auth:        Supabase Auth (built in, handles email/password, OAuth, magic links)
Data layer:  TanStack Query (caching, loading states, background sync — correct tool)
Testing:     Vitest (fast, compatible with Vite, same config)
Hosting:     Vercel (push to deploy, edge CDN, free tier is real)
Automation:  n8n (workflows, webhooks, integrations — already in your stack)
```

---

### Why this stack rated 9/10

A team of 1 founder + 1 designer + 2 devs gets:

- **Frontend** (Vite + React + TypeScript + Tailwind): modern, fast, typed
- **Backend**: Supabase handles it — no separate API server to maintain
- **Database**: Postgres — the most powerful open-source RDBMS, full SQL
- **Auth**: Supabase — email/password, magic links, OAuth, all pre-built
- **Storage**: Supabase — file uploads, image hosting, S3-compatible
- **Realtime**: Supabase — live database subscriptions, WebSockets built in
- **Hosting**: Vercel — push to `main`, it deploys globally
- **Automation**: n8n — any workflow, any integration, no code required

What you *don't* have to maintain: web servers, authentication servers, file storage servers, database servers, SSL certificates, deployment pipelines (Vercel handles it). A 2-dev team gets the infrastructure capabilities of a 10-person team.

---

### The one thing that matters more than stack choice

The senior developer critique of most React projects isn't technical — it's architectural. The stack is fine. The discipline isn't.

**Pick a structure. Write it down. Never deviate.**

```
src/
  pages/       ← layout and composition only
  components/  ← pure UI, receives props
  lib/         ← all Supabase calls, no React imports
```

Every file knows its place. Every developer knows the rules. Reviews enforce the layer boundaries. After a year, your codebase is still readable by someone who wasn't there at the start.

This is harder than it sounds because there's always a reason to "just put this here for now." The "for now" files are where projects go to die.

---

### What to read next (if you want to go deeper)

- **React docs** (react.dev) — the official docs are genuinely excellent now, rewritten in 2023
- **TanStack Query docs** — understand `useQuery` and `useMutation` cold
- **Supabase docs** — especially the RLS section and Auth docs
- **Next.js docs** — the App Router section (newer, the right path in 2026)
- **Tailwind docs** — skim the utility reference, then just use it

You don't need to read these cover to cover. Build something, hit the wall, read the relevant section. That's how you actually learn this.

---

*Last updated: June 2026*
*Source: Senior developer review, stack validated against Airwave Engineering, Unitree, and Samsara project requirements*
