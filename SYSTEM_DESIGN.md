# System Design

This document describes the current recipe-management project as inspected on 2026-09-30. It documents the checked-in frontend and the hosted services it references; it does not verify the deployed database or backend implementations.

## Development and maintenance rules

- Before future development changes, inspect this document and the relevant existing source and configuration files. Do not assume the architecture or treat this document as a substitute for reading the implementation.
- Update this document when a change significantly affects architecture, routing, services, database integration, or reusable components.
- Minor visual or CSS-only changes do not require an update unless they affect the overall design system or project structure.
- Clearly distinguish active implementation, unused code, and external functionality whose implementation is absent from this repository.

## Overview

The application is a browser-rendered React single-page application for managing products, recipes, approval workflows, ERP entry, reports, users, roles, and audit history. Vite builds the frontend. Supabase supplies authentication, database access, realtime subscriptions, and hosted backend functions.

The main data flow is:

```text
React screens and shared components
  -> frontend service modules or direct authentication calls
  -> shared Supabase JavaScript client
  -> hosted Supabase Auth, database API, Realtime, and Edge Functions
```

There is no local application server or server-rendering implementation. Most screen state is local React state; authentication is shared through React Context.

## Tech stack and libraries

Versions below are dependency ranges declared in package.json, not a guarantee of versions deployed remotely. package-lock.json records resolved npm dependencies.

| Dependency | Declared range | Role |
| --- | --- | --- |
| react / react-dom | ^19.2.8 | UI components and browser rendering |
| vite | ^8.2.0 | Development server and production bundling |
| @vitejs/plugin-react | ^6.0.4 | React integration for Vite |
| react-router-dom | ^7.18.2 | Client-side browser routing |
| @supabase/supabase-js | ^2.112.4 | Authentication, database access, realtime, function invocation |
| @supabase/ssr | ^0.12.5 | Declared dependency; no imports in current source |
| i18next | ^26.4.1 | Translation resources and language state |
| react-i18next | ^17.0.13 | React translation integration |
| lucide-react | ^1.33.0 | Icons |
| react-icons | ^5.7.0 | Additional icons |
| recharts | ^3.10.1 | Dashboard charts |
| jspdf | ^4.2.1 | PDF generation |
| jspdf-autotable | ^5.0.8 | PDF table exports |
| xlsx | ^0.18.5 | Spreadsheet exports |
| oxlint | ^1.75.0 | Static linting |
| @types/react / @types/react-dom | ^19.2.17 / ^19.2.3 | Installed type definitions |

Source files use JavaScript and JSX, not TypeScript. No Tailwind, Sass, CSS Modules, or CSS-in-JS setup is present. No dedicated automated test setup is declared.

Available npm scripts are dev (vite), build (vite build), lint (oxlint), and preview (vite preview). vite.config.js enables the React plugin. .oxlintrc.json configures React/Oxc linting, including hook rules.

## Project structure

```text
recipe-management/
├── .github/workflows/keep-alive.yml  # Scheduled hosted function request
├── index.html                      # Browser entry and favicon
├── package.json / package-lock.json # Dependencies and scripts
├── vite.config.js                  # Vite configuration
├── vercel.json                     # SPA hosting rewrite
├── .oxlintrc.json                  # Lint configuration
├── .env.local                      # Local environment configuration (ignored)
├── README.md                       # React/Vite template documentation
├── SYSTEM_DESIGN.md                # Architecture and maintenance guidance
├── public/bites-logo.png           # Public favicon/logo asset
├── src/
│   ├── main.jsx                    # React root, router, global imports
│   ├── App.jsx                     # Auth provider and route tree
│   ├── i18n.js                     # English/Arabic resources and direction
│   ├── assets/images/              # Logos and login background images
│   ├── components/                 # Shared UI and application shell
│   │   └── auth/ProtectedRoute.jsx  # Authentication/permission guard
│   ├── context/                    # Active auth and unused sample contexts
│   ├── data/recipesData.js          # Sample recipes and product options
│   ├── lib/supabaseClient.js        # Shared hosted-services client
│   ├── pages/                      # Business and authentication screens
│   ├── services/                   # Frontend data/business operations
│   ├── styles/                     # Global, component, and page CSS
│   └── utils/auditLogger.js         # Unused local-storage audit utility
├── dist/                           # Generated build output, ignored
└── node_modules/                   # Installed dependencies, ignored
```

No backend source directory, SQL schema, migrations, Supabase function implementation directory, or database policy definitions are present.

## Main pages and routes

Routes are declared in src/App.jsx.

| URL | Active component | Purpose |
| --- | --- | --- |
| /login | Login | Username/password sign-in, account type and language selection |
| /forgot-password | ForgotPassword | Request recovery email/OTP |
| /verify-reset-otp | VerifyResetOtp | Verify recovery OTP and resend |
| /reset-password | ResetPassword | Set a new password using a recovery session |
| /dashboard | Dashboard | Statistics, trends, charts, recent recipes |
| /recipes | Recipes | Recipe list, filters, search, pagination |
| /recipes/new | Recipes | Create a recipe with product, yield, ingredients, draft/submission |
| /recipes/:id | Recipes | Recipe details and workflow actions |
| /recipes/:id?edit=true | Recipes | Edit mode, selected by query string within the component |
| /product-master | ProductMaster | Product catalog, filters, product CRUD |
| /erp-entry | ERPEntry | ERP pending/completed recipe list |
| /erp-entry/:id | ERPDetails | ERP reference, date, notes, completion |
| /reports | Reports | Filtered recipe reports, details, PDF/Excel exports |
| /audit-trail | AuditTrail | Recipe history, approvals, ERP information, exports |
| /settings | Settings | General/profile settings, users, roles, module permissions |
| / | Navigate | Redirect to /login |
| Any unmatched path | Navigate | Redirect to /login |

Recipe listing, creation, details, and editing are implemented in the same Recipes.jsx component. It selects its mode using useLocation, useParams, and the edit query parameter. Separate CreateRecipe.jsx and RecipeDetails.jsx files are not registered in the current route tree.

## Reusable components

| Component | Current responsibility and usage |
| --- | --- |
| MainLayout | Shared authenticated shell; top navigation/header grid, responsive menu/overlay, and Outlet |
| Sidebar | Existing permission-filtered navigation presented as a horizontal pill navbar, profile menu, logout |
| Header | Route-dependent page information, search/actions, language selection, notifications, avatar controls |
| auth/ProtectedRoute | Session/profile/account/role checks and module authorization; renders Outlet |
| StatCard | Dashboard statistic button with icon, title, value, subtitle, and click handler |
| StatusBadge | Status-dependent CSS class and optional translated display label; used by active Recipes |
| RecipeForm | Recipe fields and ingredient management; not imported by current screens |
| IngredientsTable | Ingredient rows and removal actions; imported by the unused RecipeForm |
| AddIngredientModal | Ingredient selection/quantity modal using sample product options; imported by the unused RecipeForm |

Many forms, tables, filters, and modals remain implemented inside page components rather than extracted into shared components. Reports also defines a local ReportInfoItem helper.

Header avatar selection uses FileReader and component state to preview the image. The current handler does not upload to Supabase Storage or persist a changed avatar_url.

## Routing and authentication flow

1. main.jsx initializes i18n, imports global styles, and renders App inside React StrictMode and BrowserRouter.
2. App mounts AuthProvider around the route tree. Public login/recovery routes are outside MainLayout.
3. Login calls the login-with-username hosted function with username, password, and accountType. Returned access/refresh tokens are passed to supabase.auth.setSession, then navigation proceeds to /dashboard.
4. AuthProvider loads the existing session with getSession and listens to onAuthStateChange. It loads the user profile from profiles together with roles and nested role_permissions.
5. AuthProvider normalizes module permission keys and exposes hasPermission and hasAnyPermission for view/add/edit/delete actions. A role with is_system_admin bypasses module permission checks.
6. Business routes are nested inside MainLayout and module-specific ProtectedRoute wrappers. MainLayout and ProtectedRoute both render nested content through Outlet.
7. ProtectedRoute shows a loading state while auth initializes. A missing user redirects to /login with the requested pathname in location state. Missing profiles, inactive accounts, and unassigned roles display access messages.
8. Missing module permission redirects to the first accessible module when available, otherwise displays access denied. Settings accepts view permission for either Settings or Users / Role.
9. Sidebar filters visible modules using permissions. Screens also check action permissions for relevant mutations. Signing out calls Supabase Auth and returns to /login.

These are frontend checks. Actual database authorization depends on hosted policies and backend checks that cannot be inspected here.

Password recovery requests use request-password-reset. The email is carried through route state/sessionStorage under passwordRecoveryEmail. VerifyResetOtp checks an eight-digit code using auth.verifyOtp with type recovery; resend uses auth.resetPasswordForEmail. ResetPassword uses auth.updateUser to change the password, clears recovery state, and signs out.

vercel.json rewrites incoming paths to / so the SPA can handle direct requests to nested routes. The local Vite configuration contains no custom backend proxy.

## CSS, assets, and internationalization

- src/styles/global.css contains resets, typography, default background/text colors, and focus styling. Body scrolling is disabled; the layout's main content area supplies vertical scrolling.
- src/styles/variables.css is imported by main.jsx but remains empty. Authenticated theme tokens are declared on .main-layout in MainLayout.css; they do not change the global or authentication design.
- Business pages import their matching stylesheets: Dashboard.css, Recipes.css, ProductMaster.css, ERPEntry.css, ERPDetails.css, Reports.css, AuditTrail.css, and Settings.css.
- Layout components import MainLayout.css, Sidebar.css, and Header.css. MainLayout also imports mobile-sidebar-offcanvas.css for the expandable mobile top navigation and overlay, followed by bites-theme.css for shared authenticated page styles. Existing navigation configuration, permissions, and handlers remain in Sidebar.jsx.
- Login uses Login.css. Password recovery pages share Login.css and PasswordRecovery.css.
- CreateRecipe.css and RecipeDetails.css belong to the unrouted legacy page files.
- Existing page stylesheets use global class selectors and distributed media queries. The authenticated layout styles and bites-theme.css scope all rules to .main-layout. The shared theme adapts existing cards, charts, forms, filters, tables, tabs, pagination, statuses, dropdowns, dialogs, and Settings panels without changing page markup or data behavior. No CSS Modules are used.
- Some page and component presentation/positioning uses inline JSX styles.
- Logos and login backgrounds live in src/assets/images; a public logo serves as the favicon. The authenticated shell uses the exact supplied bites-background.png (viewport-cover background) and bites-brand.png (navbar logo). Login/recovery pages retain their existing assets and styling. Copy-named background assets also remain in the assets directory.

The authenticated navbar uses the original module list and permission filtering. Header retains its search, page actions, language switching, notifications, and avatar picker; Sidebar retains the profile/logout menu. At desktop widths these controls share a top grid; narrower widths place navigation on its own row, and mobile widths use the existing open/close state to expand the top menu. The authenticated shell owns viewport scrolling, with only the navigation pill pinned by CSS sticky positioning. The header wrapper uses display: contents so the navigation participates in the full-height layout grid; logo, profile controls, heading, search, and page actions scroll normally. Shared summary cards use a compact horizontal icon/content layout with preserved values and supporting text; table wrappers provide horizontal scrolling without removing columns, and small-screen form/Settings layouts stack. All new theme variables and rules are scoped to the authenticated shell; global.css, variables.css, authentication pages, authentication CSS, and existing authentication assets remain unchanged.

src/i18n.js contains English and Arabic translation resources. It initializes react-i18next, defaults to English, persists recipe-language in localStorage, and updates document/body direction and document language. Arabic uses rtl; other selected language values use ltr. Login.css includes explicit RTL selectors. Translation hooks are used across active business screens; recovery pages also contain literal English copy.

## React Context and state management

### Active shared state

AuthContext is mounted by App. It owns user, session, profile, and auth loading state, exposes signOut and refreshProfile, and supplies isAuthenticated, isAdmin, hasPermission, and hasAnyPermission.

### Screen-local state

Business screens primarily use useState, useEffect, useMemo, and useRef for fetched data, loading/errors, forms, filters, pagination, selected records, export menus, and modals. Service subscriptions trigger refetches. No Redux, Zustand, React Query, or other separate state/query library is declared.

Header coordinates search with screens through the header-page-search browser event. MainLayout owns mobile-sidebar state and toggles a body class. Language preference is stored in localStorage; password recovery email uses sessionStorage. Supabase's client manages the authentication session.

### Unmounted sample contexts

RecipesContext initializes from src/data/recipesData.js and implements in-memory recipe CRUD, IDs, workflow changes, and statistics. ProductsContext contains sample products, summary values, and in-memory product operations. Neither provider is mounted by the current App/MainLayout. Their values and workflow defaults do not represent the active Supabase-backed implementation.

## Services and API architecture

src/services contains frontend modules, not server endpoints. They call the shared Supabase client, validate/transform data, join related records for screen use, and expose subscription cleanup functions.

| Service | Responsibility |
| --- | --- |
| productService.js | Reads v_product_master, transforms product rows, creates/updates/deletes products, realtime refresh |
| recipeService.js | Loads recipes/products/profiles/ingredients, validates recipe data, saves recipes and ingredients, deletes recipes, records approvals/rejections, realtime refresh |
| dashboardService.js | Reads dashboard/list/chart views, computes trends using recipe queries, assembles dashboard data, realtime refresh |
| erpService.js | Loads recipes with product/profile/approval/ERP data, ensures a pending ERP entry, completes entries and updates recipe status, realtime refresh |
| reportService.js | Adapts recipeService data for reporting and delegates subscriptions to it |
| auditService.js | Combines recipes, products, approvals, ERP entries, profiles, and audit_logs into audit records/timelines, realtime refresh |
| settingsService.js | Loads users/roles/permissions, edits profiles and role assignments, manages roles/permissions, invokes hosted user management |
| notificationService.js | Loads a user's notifications, marks notifications read, subscribes to user-filtered changes |

Authentication calls also occur directly in the recovery/login screens and AuthContext. PDF and spreadsheet generation occurs in Reports and AuditTrail rather than a server export API.

The active recipe approval operation records an Approved decision and changes recipe status to Approved. ERP operations can create a pending entry/change status to ERP Pending and later ERP Completed. Legacy context defaults differ; do not infer active behavior from them.

Several mutations make multiple sequential database requests, such as saving recipes and ingredients or recording an approval and updating recipe status. These are not expressed as a single frontend RPC transaction. Hosted trigger/transaction behavior is unknown because database definitions are absent.

## Supabase integration

src/lib/supabaseClient.js creates one client using @supabase/supabase-js. It reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY from Vite environment variables and throws if either is missing. Local configuration exists in ignored .env.local; credential values are not documented here.

Integration points include:

- Auth: session restoration, auth-state subscription, setting the login session, sign-out, recovery OTP verification/resend, password update.
- Database API: direct browser queries with from/select/insert/update/delete and relationship selects.
- Realtime: postgres_changes subscriptions on public tables, followed by screen refetches; cleanup removes the channel. Notifications filter by user_id.
- Edge Functions: username login, recovery request, user management.

No current Supabase Storage upload implementation or SSR client usage was identified. Database schema, row-level security, grants, triggers, view SQL, and realtime publication configuration must be inspected in the hosted backend when relevant to future changes.

## Database tables and views referenced by the frontend

The following names are inferred from actual client queries and relationships. They are not a complete deployed schema specification.

| Table | Frontend purpose |
| --- | --- |
| products | Product codes/names/types/categories/base units and recipe/ingredient references |
| recipes | Recipe codes, product/yield/description, workflow status, ownership/assignment, lifecycle timestamps |
| recipe_ingredients | Ingredient product, quantity, and unit records linked to recipes |
| recipe_approvals | Approver, decision, comment, review round, review timestamps |
| erp_entries | Recipe ERP reference, date, entered-by user, notes, status/completion |
| profiles | User identity, account state, role assignment, avatar and recovery fields |
| roles | Role name/description and is_system_admin |
| role_permissions | Module-level view/add/edit/delete flags per role |
| audit_logs | Activity metadata, actor, entity, status changes, comments, timestamps |
| notifications | User notifications and read state |

| View | Current consumers/purpose |
| --- | --- |
| v_product_master | productService product listing |
| v_recipe_list | dashboardService recent recipe listing |
| v_dashboard_recipe_stats | dashboardService summary statistics |
| v_recipes_by_status | dashboardService status chart |
| v_recipes_by_type | dashboardService product-type chart |

The frontend associates recipes with products and users, ingredients with recipes/products, approvals with recipes/users, ERP entries with recipes/users, and profiles with roles/permissions. Constraint definitions, cascade behavior, indexes, policies, and view definitions are not available locally.

## Hosted backend functions

| Function | Caller | Referenced behavior |
| --- | --- | --- |
| login-with-username | pages/Login.jsx | Accepts username/password/accountType; returns session tokens |
| request-password-reset | pages/ForgotPassword.jsx | Requests password recovery |
| manage-user-index-ts | services/settingsService.js | create, reset-password, and delete user actions; includes current session bearer token |
| keep-alive | .github/workflows/keep-alive.yml | Scheduled HTTP request to a hosted function |

The keep-alive GitHub workflow runs on the configured daily cron and supports manual dispatch. Its endpoint is configured directly in the workflow. None of these hosted function implementations is included in this repository, so their validation, authorization, and internal database effects are unverified.

## Unused and legacy implementation

| File/dependency | Current status |
| --- | --- |
| pages/CreateRecipe.jsx | Unrouted page using sample ProductsContext/RecipesContext |
| pages/RecipeDetails.jsx | Unrouted page using sample RecipesContext |
| context/ProductsContext.jsx | Sample in-memory provider, not mounted in the active application |
| context/RecipesContext.jsx | Sample in-memory provider, not mounted in the active application |
| data/recipesData.js | Sample data/options used by legacy code; not the active data source |
| components/RecipeForm.jsx | No imports from active screens |
| components/IngredientsTable.jsx | Used by the unused RecipeForm |
| components/AddIngredientModal.jsx | Used by the unused RecipeForm and relies on sample options |
| utils/auditLogger.js | Local-storage audit utility with no current source imports; active AuditTrail uses auditService |
| styles/CreateRecipe.css / RecipeDetails.css | Styles for unrouted pages |
| styles/variables.css | Imported but empty |
| @supabase/ssr | Declared dependency with no current source imports |

Unused status is based on the inspected source import graph and route/provider wiring. These files remain in the project; this document does not propose or perform their removal.
