# VS Code Snippets — Samsara Framework

## How to Install

### Option 1: Copy to VS Code snippets folder (recommended)

**On your machine**, copy these files to VS Code's snippet directory:

- **Windows:** `%APPDATA%\Code\User\snippets\`
- **macOS:** `~/Library/Application Support/Code/User/snippets/`
- **Linux:** `~/.config/Code/User/snippets/`

Copy both files:
- `typescriptreact.json` → for `.tsx` files
- `javascriptreact.json` → for `.jsx` files

### Option 2: Via VS Code UI

1. Open VS Code
2. `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Snippets: Configure Snippets"
4. Select "typescriptreact" (for TSX) or "javascriptreact" (for JSX)
5. Paste the contents of the relevant JSON file
6. Save

### Option 3: Project-level snippets

Put them in your project's `.vscode/` folder:
```
your-project/
└── .vscode/
    └── samsara.code-snippets    ← rename either JSON file to this
```
This makes snippets available only in that project.

---

## How to Use

1. Open a `.tsx` or `.jsx` file
2. Type the snippet prefix (e.g., `scomp`)
3. Press `Tab` to expand
4. Fill in the highlighted placeholders — press `Tab` to jump between them
5. Press `Escape` when done

---

## Snippet Cheat Sheet

### 🧩 Components

| Prefix | What you get | Use when... |
|--------|-------------|-------------|
| `scomp` | Standard component (props, JSDoc, className override) | Building any reusable component |
| `spage` | Full page (loading/error/data states, React Query) | Creating a new route/page |
| `smodal` | Modal dialog (portal, keyboard dismiss, aria) | Any popup/dialog |
| `sform` | Form (react-hook-form, validation, submit handler) | Any form with inputs |
| `slist` | List with map, empty state, loading | Rendering arrays of items |
| `scard` | Card container | Wrapping content in a card |

### 📊 Data Layer (3-layer rule)

| Prefix | What you get | Use when... |
|--------|-------------|-------------|
| `squery` | React Query useQuery hook | Fetching data from Supabase |
| `smutation` | useMutation with cache invalidation | Creating/updating/deleting data |
| `sapi` | Supabase API function (async, typed) | Adding a new DB operation |
| `squerykeys` | Query key factory entry | Adding a new query key |
| `scrud` | Full CRUD module (fetch/create/update/delete) | New table/entity needs all operations |

### 🪝 Hooks & State

| Prefix | What you get | Use when... |
|--------|-------------|-------------|
| `shook` | Custom hook template | Extracting logic from components |
| `seffect` | useEffect with cleanup | Side effects |
| `sstate` | useState with type | Adding typed state |

### 🔤 Types

| Prefix | What you get | Use when... |
|--------|-------------|-------------|
| `stype` | DB entity interface (id, created_at, etc.) | Defining a new table type |
| `senum` | Type union for statuses | Status/category types |

### 🛡️ Utilities

| Prefix | What you get | Use when... |
|--------|-------------|-------------|
| `strycatch` | Try/catch with error typing | Wrapping async operations |
| `senvcheck` | Environment variable validation | Checking required env vars |

### 🧪 Testing

| Prefix | What you get | Use when... |
|--------|-------------|-------------|
| `stest` | Vitest test file (describe + it) | Writing unit tests |
| `stestcomp` | Component render test | Testing a React component |

### 📄 Project Setup

| Prefix | What you get | Use when... |
|--------|-------------|-------------|
| `sreadme` | Full README.md template | Starting a new project |
| `senvexample` | .env.example for Supabase | Setting up env vars |

---

## The Pattern

Every snippet follows the framework standard:

```
Component → React Query hook → API function → Supabase
```

Never skip a layer. When you use `spage`, it already imports from the query hook. When you use `squery`, it already calls the API function. When you use `sapi`, it already talks to Supabase with proper error handling.

---

## Examples

### Building a new "Products" feature from scratch:

1. Type `stype` → create `Product` interface in `lib/types.ts`
2. Type `scrud` → create full CRUD in `lib/products/api.ts`
3. Type `squery` → create query hook in `lib/products/queries.ts`
4. Type `spage` → create the page in `pages/Products/index.tsx`
5. Type `slist` → create the list component in `pages/Products/components/ProductList.tsx`
6. Type `smodal` → create an add/edit modal
7. Type `stest` → write tests for the API functions

Total time: ~10 minutes for a fully working, framework-compliant feature.
