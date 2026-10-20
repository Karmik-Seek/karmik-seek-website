# Kaarmik Seek — UI Design System & Implementation Spec
**File:** `ui_design.md` · **Audience:** an AI coding agent (and the human reviewing its work)
**Replaces:** all visual decisions in `UI_FEATURE_EXPLANATION.md`. That document stays the source of truth for **features, routes, API calls and the status machine**. This document is the source of truth for **how everything looks, moves and responds**.

---

## 0. Read this first (agent rules)

1. **Light mode only.** No dark theme, no `dark:` classes, no theme toggle. Set `color-scheme: light` on `<html>`.
2. **Palette is fixed** (Section 3). Use only the tokens defined there. No raw hex in components, no default Tailwind colors (`emerald-500`, `zinc-*`, `amber-*` are banned).
3. **Glassmorphism is the card language**, but it follows the rules in Section 4. Glass without a coloured backdrop looks like a flat white box. The backdrop system is mandatory.
4. **Mobile-first.** Every screen must be designed at 375px first, then enhanced. Test at 360, 375, 414, 768, 1024, 1280, 1536.
5. **Server Components by default.** Add `"use client"` only to interactive leaf components.
6. **Never invent data.** Any number shown in the UI must come from the API or be clearly labelled "Sample".
7. **Respect `prefers-reduced-motion` and `prefers-reduced-transparency`.**
8. Build in the order of Section 15. Do not skip to polish before the foundation is done.

---

## 1. Design direction (the one-paragraph brief)

**Quiet luxury for first-time job seekers.** The product should feel like a private members' club that happens to be free for students: warm cream surfaces, deep plum and wine for authority, a restrained gold used like jewellery (rarely, and always meaningful). Cards are frosted glass floating over soft plum/wine/gold light. Typography is editorial: a refined serif for headlines, a clean humanist sans for everything functional.

**Where the boldness is spent (one place only): the Match Stage in the hero.** A large rounded plum-to-wine panel holding a frosted job card whose match ring fills to a score while skills resolve into "matched" and "missing". It shows the product's real differentiator (the match engine). Everything else on the page stays calm and disciplined.

**What must not happen:** generic SaaS-card grids with identical shadows, gradient washes everywhere, every section fading up on scroll, tracked-out ALL-CAPS eyebrow labels above every heading, one border radius on everything.

---

## 2. Reality check on the current spec and palette (decisions already made for you)

These are problems in the existing material. The agent must apply the fixes, not the original behaviour.

| # | Problem | Fix applied in this document |
|---|---|---|
| 1 | **Gold `#C7A05A` on cream `#F7F2EB` is ~2.2:1 contrast** and **Warm Grey `#9D9792` on cream is ~2.6:1.** Both fail WCAG AA (4.5:1) for text. | Gold and Warm Grey are **decorative/large-element colours only** (borders, icons ≥24px, fills, rings). Text uses derived darker tokens (`gold-700`, `ink-muted`). See Section 3. |
| 2 | White glass over a cream page has nothing to blur, so the effect disappears. | Mandatory `AmbientBackdrop` (Section 4.3): blurred plum/wine/gold light fields behind all content. |
| 3 | Home page shows `94%`, `1,200+`, `48 Hours` as stats. On a trust-based recruiting product, fabricated numbers are a liability. | Replace with live counts from `GET /api/stats/public`. Hide the bar if the data is missing or tiny. Label the hero job card **"Sample"**. |
| 4 | **Status machine bug:** the diagram allows `SHORTLISTED → INTERVIEW_SCHEDULED` only, but the admin UI shows `Reject with Feedback` at every stage. A shortlisted candidate cannot be rejected under the current machine. | Backend must add `SHORTLISTED → REJECTED`. Until then the UI must render **only valid transitions** per Section 11.3. Flag this to the backend owner. |
| 5 | Candidate stepper shows 4 stages; admin shows 5 statuses plus `WITHDRAWN`. `Rejected`/`Withdrawn` have no visual home on the stepper. | Stepper has a terminal-state variant (Section 7.8). |
| 6 | Match colours (emerald/amber/zinc) are off-palette. | Replaced by `sage`, `gold-700`, `grey-600` tiers (Section 3.3). |
| 7 | `Interviews (1)` is hard-coded in the tab label. | Count comes from data; hide when 0. |
| 8 | Seeded admin email hard-coded in the auth fallback description. | Not a UI matter, but never ship an admin email or fallback credentials in client code. Backend owner should review. |

---

## 3. Design tokens

### 3.1 Colour tokens

**Client palette (Plum Regent), used exactly as given:**

| Token | Hex | Role |
|---|---|---|
| `plum-700` (Royal Plum) | `#4A294B` | Primary brand, primary buttons, headings on cream, hero stage |
| `wine-700` (Deep Wine) | `#5F2147` | Secondary brand, gradient partner, destructive/rejected emphasis |
| `cream-100` (Cream) | `#F7F2EB` | Page background |
| `gold-500` (Gold) | `#C7A05A` | Accent: hairlines, rings, icons, focus glow, small highlights |
| `grey-500` (Warm Grey) | `#9D9792` | Borders, disabled, placeholders, neutral fills |

**Derived tokens (generated from the palette so text is readable; mark as derived in code comments):**

| Token | Hex | Purpose | Approx. contrast on cream |
|---|---|---|---|
| `ink` (`plum-950`) | `#1E0E20` | Body text, headings | ~16:1 |
| `ink-muted` | `#6A5B6C` | Secondary text | ~5.6:1 |
| `plum-800` | `#3B2040` | Pressed/hover on primary | — |
| `plum-600` | `#5E3A5F` | Hover on primary | — |
| `plum-500` | `#7A5580` | Icons, subtle links | — |
| `plum-300` | `#B79CB9` | Disabled primary, decorative | — |
| `plum-200` | `#D6C5D8` | Dividers on glass | — |
| `plum-100` | `#EBE1EC` | Tinted fills, ring track, chips | — |
| `plum-50` | `#F6F0F6` | Subtle hover fill | — |
| `wine-600` | `#7A2F5E` | Hover on wine | — |
| `wine-100` | `#F1DDE8` | Rejected/destructive tint | — |
| `cream-50` | `#FBF8F4` | Raised surfaces, input fill | — |
| `cream-200` | `#EEE6DA` | Sunken surfaces, table stripes | — |
| `cream-300` | `#E2D8C9` | Hairlines on cream | — |
| `gold-700` | `#8A6A2E` | **Gold as text** (labels, links on cream) | ~4.5:1 (verify with a contrast tool; darken if it measures lower) |
| `gold-600` | `#A98239` | Gold hover, icons on glass | — |
| `gold-200` | `#E9D9B6` | Gold hairline on light | — |
| `gold-100` | `#F5ECD6` | Interview/highlight tint | — |
| `grey-600` | `#7A746F` | Neutral text on tints (large/bold only) | — |
| `grey-100` | `#EFECE9` | Neutral tint (Applied status) | — |
| `sage-600` | `#3E7B5B` | Success / high match (derived, the only non-palette hue; keep desaturated) | — |
| `sage-100` | `#E3F0E8` | Success tint | — |

**Rule:** if a colour is used for **text smaller than 24px / 19px bold**, it must reach 4.5:1 on its actual background. `gold-500` and `grey-500` never qualify.

### 3.2 Tailwind v4 theme (put in `app/globals.css`)

```css
@import "tailwindcss";

@theme {
  /* brand */
  --color-plum-950: #1e0e20;
  --color-plum-800: #3b2040;
  --color-plum-700: #4a294b;
  --color-plum-600: #5e3a5f;
  --color-plum-500: #7a5580;
  --color-plum-300: #b79cb9;
  --color-plum-200: #d6c5d8;
  --color-plum-100: #ebe1ec;
  --color-plum-50:  #f6f0f6;

  --color-wine-700: #5f2147;
  --color-wine-600: #7a2f5e;
  --color-wine-100: #f1dde8;

  --color-cream-50:  #fbf8f4;
  --color-cream-100: #f7f2eb;
  --color-cream-200: #eee6da;
  --color-cream-300: #e2d8c9;

  --color-gold-700: #8a6a2e;
  --color-gold-600: #a98239;
  --color-gold-500: #c7a05a;
  --color-gold-200: #e9d9b6;
  --color-gold-100: #f5ecd6;

  --color-grey-700: #5c5753;
  --color-grey-600: #7a746f;
  --color-grey-500: #9d9792;
  --color-grey-100: #efece9;

  --color-sage-600: #3e7b5b;
  --color-sage-100: #e3f0e8;

  --color-ink: #1e0e20;
  --color-ink-muted: #6a5b6c;

  /* type */
  --font-display: var(--font-instrument-serif), "Iowan Old Style", Georgia, serif;
  --font-sans: var(--font-manrope), ui-sans-serif, system-ui, sans-serif;

  /* radius: deliberately hierarchical, not one value everywhere */
  --radius-chip: 999px;
  --radius-control: 14px;   /* buttons, inputs */
  --radius-card: 22px;      /* standard glass cards */
  --radius-panel: 32px;     /* hero stage, modals, drawers */

  /* shadows are plum-tinted, never neutral grey */
  --shadow-glass: 0 1px 0 rgb(255 255 255 / 0.7) inset, 0 10px 30px -12px rgb(74 41 75 / 0.22);
  --shadow-lift:  0 1px 0 rgb(255 255 255 / 0.8) inset, 0 22px 48px -18px rgb(74 41 75 / 0.34);
  --shadow-pop:   0 30px 80px -24px rgb(30 14 32 / 0.45);

  /* motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-soft: cubic-bezier(0.65, 0, 0.35, 1);
}

html { color-scheme: light; background: var(--color-cream-100); color: var(--color-ink); }
body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
```

### 3.3 Semantic colour maps (use these, never ad-hoc colours)

**Match score tiers** (job cards, detail gauge, admin dossier):

| Score | Fg | Bg | Ring |
|---|---|---|---|
| `>= 75` | `sage-600` | `sage-100` | `sage-600` |
| `50–74` | `gold-700` | `gold-100` | `gold-600` |
| `< 50` | `grey-600` | `grey-100` | `grey-500` |
| Guest (no profile) | `ink-muted` | `plum-50` | none; show "Sign in to see your match" |

**Application status badges:**

| Status | Text | Bg | Extra |
|---|---|---|---|
| `APPLIED` | `grey-700` | `grey-100` | — |
| `SHORTLISTED` | `plum-700` | `plum-100` | — |
| `INTERVIEW_SCHEDULED` | `gold-700` | `gold-100` | small calendar icon |
| `SELECTED` | `sage-600` | `sage-100` | check icon |
| `REJECTED` | `wine-700` | `wine-100` | — |
| `WITHDRAWN` | `grey-600` | transparent | dashed `grey-500` border |

Always pair colour with an **icon or label**. Colour is never the only signal.

### 3.4 Typography

Load with `next/font/google` (self-hosted at build, no layout shift). Verify both families exist in the installed Next.js font list; fallback stacks are defined above.

| Role | Family | Usage |
|---|---|---|
| Display | **Instrument Serif** (400, plus italic) | Hero headline, page titles, large numbers in match ring |
| UI/Body | **Manrope** (400, 500, 600, 700) | Everything else |

```ts
// app/fonts.ts
import { Instrument_Serif, Manrope } from "next/font/google";

export const display = Instrument_Serif({
  subsets: ["latin"], weight: "400", style: ["normal", "italic"],
  variable: "--font-instrument-serif", display: "swap",
});
export const sans = Manrope({
  subsets: ["latin"], weight: ["400", "500", "600", "700"],
  variable: "--font-manrope", display: "swap",
});
```

**Type scale** (fluid, `clamp()`; line-length cap `62ch` for body):

| Token | Size | Line-height | Letter-spacing | Font |
|---|---|---|---|---|
| `display-xl` | `clamp(2.75rem, 1.6rem + 5vw, 5.25rem)` | 1.02 | -0.02em | Display |
| `display-lg` | `clamp(2.25rem, 1.5rem + 3vw, 3.5rem)` | 1.05 | -0.015em | Display |
| `h2` | `clamp(1.75rem, 1.3rem + 1.6vw, 2.5rem)` | 1.1 | -0.01em | Display |
| `h3` | `1.25rem` | 1.3 | 0 | Sans 600 |
| `body-lg` | `1.125rem` | 1.6 | 0 | Sans 400 |
| `body` | `1rem` | 1.6 | 0 | Sans 400 |
| `small` | `0.875rem` | 1.5 | 0 | Sans 500 |
| `caption` | `0.8125rem` | 1.4 | 0.005em | Sans 500 |

Rules:
- Headlines are set whole. **Do not** colour or italicise a single word in a headline as decoration.
- **No ALL-CAPS tracked labels** above headings. Sentence case everywhere.
- Numerals in tables and scores use `font-variant-numeric: tabular-nums`.
- Minimum body size on mobile is 16px (also prevents iOS input zoom).

### 3.5 Spacing, layout, breakpoints

- Base unit 4px. Section vertical rhythm: `py-16 md:py-24 lg:py-32`.
- Container: `max-w-7xl` (1280) with `px-4 sm:px-6 lg:px-8`.
- Breakpoints (Tailwind defaults): `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.
- Tap targets: min **44×44px** on touch.
- Use `100dvh` (not `100vh`) for full-height mobile layouts. Pad with `env(safe-area-inset-*)`.

---

## 4. Glassmorphism system

### 4.1 Three glass levels

```css
@layer components {
  /* Level 1: standard cards, list items */
  .glass {
    background: rgb(255 255 255 / 0.58);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
            backdrop-filter: blur(18px) saturate(140%);
    border: 1px solid rgb(255 255 255 / 0.65);
    box-shadow: var(--shadow-glass);
    border-radius: var(--radius-card);
  }
  /* Level 2: raised/interactive: navbar, sticky bars, popovers */
  .glass-strong {
    background: rgb(251 248 244 / 0.78);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
            backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid rgb(255 255 255 / 0.8);
    box-shadow: var(--shadow-lift);
  }
  /* Level 3: plum glass, used ONLY inside the hero stage and key CTAs panels. White text. */
  .glass-plum {
    background: linear-gradient(160deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.05));
    -webkit-backdrop-filter: blur(20px) saturate(150%);
            backdrop-filter: blur(20px) saturate(150%);
    border: 1px solid rgb(255 255 255 / 0.22);
    box-shadow: 0 1px 0 rgb(255 255 255 / 0.25) inset, 0 24px 60px -20px rgb(0 0 0 / 0.45);
    color: #fff;
  }
  /* Gold hairline for "premium" emphasis (selected card, featured role) */
  .gold-edge { box-shadow: var(--shadow-glass), 0 0 0 1px rgb(199 160 90 / 0.55); }

  /* Fallbacks */
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .glass, .glass-strong { background: rgb(251 248 244 / 0.96); }
    .glass-plum { background: rgb(74 41 75 / 0.92); }
  }
  @media (prefers-reduced-transparency: reduce) {
    .glass, .glass-strong { background: rgb(251 248 244 / 1); backdrop-filter: none; -webkit-backdrop-filter: none; }
    .glass-plum { background: #4a294b; backdrop-filter: none; -webkit-backdrop-filter: none; }
  }
  /* Mobile: cheaper blur for performance */
  @media (max-width: 767px) {
    .glass { backdrop-filter: blur(12px) saturate(130%); -webkit-backdrop-filter: blur(12px) saturate(130%); }
    .glass-strong { backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); }
  }
}
```

### 4.2 Glass rules (non-negotiable)

1. **Never nest glass inside glass.** Inner elements on a glass card use solid tints (`plum-50`, `cream-50`, `plum-100`) instead.
2. **Never put body text on glass over a busy backdrop.** The backdrop stays low-contrast; text stays `ink` or `ink-muted`.
3. Max **~6 glass elements visible in one viewport** on mobile. Beyond that, scrolling jank on mid-range Android.
4. Do not animate `backdrop-filter`. Animate `opacity` and `transform` only.
5. Tables and long lists: a single glass container wrapping rows, not glass per row.
6. Use a thin inner top highlight (already in `--shadow-glass`) so edges read as "glass", not "white box".

### 4.3 Ambient backdrop (mandatory)

A fixed, non-interactive layer behind all content. This is what makes the glass visible.

```tsx
// components/shell/ambient-backdrop.tsx  (Server Component)
export function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cream-100">
      <div className="absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-plum-700/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-40 h-[38rem] w-[38rem] rounded-full bg-wine-700/15 blur-[140px]" />
      <div className="absolute bottom-[-12rem] left-1/4 h-[30rem] w-[30rem] rounded-full bg-gold-500/20 blur-[130px]" />
      {/* grain: tiny inline SVG noise, ~3% opacity, prevents banding */}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
           style={{ backgroundImage: "url(/textures/grain.svg)" }} />
    </div>
  );
}
```

- Static by default. Only the hero page may add a very slow drift (one 40s loop, transform only), and it must stop under reduced motion.
- On `< md`, shrink blobs to ~60% and reduce blur radius to keep paint cost down.
- Authenticated app shells use the same backdrop at lower intensity (halve the opacities) so data stays readable.

---

## 5. Tech stack (Next.js, latest)

Verify exact versions with `npm view <pkg> version` before installing. Do not pin from memory. Use the current stable of each.

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16.x, App Router** | Current major line; Turbopack is the default bundler; React 19.x; Node 20+ required |
| Language | TypeScript strict | — |
| Styling | **Tailwind CSS v4** (`@theme` tokens) + `clsx` + `tailwind-merge` + `class-variance-authority` | Token-driven, tiny runtime |
| Primitives | **Radix UI** primitives (via shadcn/ui patterns, restyled to this system) | Accessible dialogs, dropdowns, tabs, tooltips, checkbox, slider, accordion |
| Mobile sheets | **Vaul** | Native-feeling bottom sheets for filters, apply flow, dossier on mobile |
| Animation | **Motion** (`motion/react`, formerly Framer Motion) with `LazyMotion` + `domAnimation` | Layout animations, springs, gestures, `AnimatePresence`; smaller bundle |
| Smooth scroll | **Lenis** (`lenis/react`) | **Marketing/home page only** (see 6.4) |
| Icons | **lucide-react** | One consistent stroke style; tree-shakeable. Stroke 1.75, size 18–20 |
| Toasts | **Sonner** | Styled to glass-strong |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | Typed validation shared with API contracts |
| Data (client) | **TanStack Query** | Caching, optimistic updates for apply/withdraw/stage changes |
| URL state | **nuqs** | Type-safe search params for `/jobs` filters (shareable URLs) |
| Drag & drop | **@dnd-kit** | Admin kanban, with transition guards |
| Charts (admin) | **Recharts**, restyled to palette | Only on admin overview |
| Auth | Firebase Auth client + existing FastAPI sync | Unchanged |
| Dates | `date-fns` | Deadlines, "in 3 days", timeline |
| Fonts | `next/font/google` | See 3.4 |
| Images | `next/image` | Logo avatars, OG images |

**Next.js specifics the agent should use:**
- Route groups: `(public)`, `(auth)`, `(student)`, `(admin)` with separate layouts.
- `loading.tsx` (skeletons), `error.tsx`, `not-found.tsx` per route group.
- `generateMetadata` for `/jobs/[id]` (title, description, OG), plus `opengraph-image` for jobs so shared links look premium.
- Public pages (`/`, `/jobs`) render on the server with `fetch(..., { next: { revalidate: 60 } })`. Personalised bits (match score, applied state) hydrate client-side after auth, so cached HTML stays shareable.
- `next.config`: enable the React Compiler if the installed version supports it as stable (check the docs for the current flag name). Do not hand-write `useMemo`/`useCallback` everywhere.
- Route guarding: use the project's request-interception file (in Next.js 16 this is `proxy.ts`; older versions used `middleware.ts`. Check the installed version's docs) for cheap redirects only (e.g. unauthenticated → `/login?next=...`). Real authorization stays in FastAPI.
- Optional: the experimental View Transitions flag for route transitions. **Treat as progressive enhancement only**; the app must look correct without it.
- Do not use experimental/canary features (instant navigation, adapters, etc.) for core flows.

---

## 6. Motion system

### 6.1 Principles
- **Motion answers actions.** Opening, expanding, confirming, advancing a stage, filtering a list.
- **One orchestrated moment on the home page** (hero stage, 6.3). No fade-up on every section.
- Hover motion only on **job cards and primary buttons**; not on every card.
- All motion respects reduced motion: wrap the app in `<MotionConfig reducedMotion="user">`.

### 6.2 Tokens

| Token | Value | Use |
|---|---|---|
| `dur-fast` | 150ms | Hover colour, press |
| `dur-base` | 250ms | Dropdowns, tooltips, tab underline |
| `dur-slow` | 400ms | Modals, drawers, accordion |
| `dur-hero` | 700–1100ms | Hero sequence, match ring fill |
| Ease standard | `[0.16, 1, 0.3, 1]` | Entrances |
| Spring (UI) | `{ type: "spring", stiffness: 380, damping: 32 }` | Layout changes, stepper |
| Spring (soft) | `{ type: "spring", stiffness: 180, damping: 24 }` | Cards settling |

```tsx
// lib/motion.ts
export const ease = [0.16, 1, 0.3, 1] as const;
export const springUI = { type: "spring", stiffness: 380, damping: 32 } as const;
export const springSoft = { type: "spring", stiffness: 180, damping: 24 } as const;
```

### 6.3 The one orchestrated moment: Hero Match Stage

Sequence on first load only (≈1.6s total, runs once, no loop):
1. Stage panel scales from 0.97 → 1 and fades in (500ms).
2. Frosted job card rises 16px → 0 (500ms, 120ms delay).
3. Match ring arc draws 0 → 94 (sample value) with a number count-up in the centre (1000ms, ease-out-expo).
4. Skill chips flip from neutral to **matched** (plum-100 → sage tint with check) staggered 80ms; one chip ("Docker") stays grey as **missing**.
5. Stipend badge slides in last.

After that, the stage is still. Optional: card does a very slow float (translateY ±6px over 8s) that **stops under reduced motion**.

### 6.4 Where motion is used elsewhere

| Interaction | Motion |
|---|---|
| Navbar | Shrinks height and strengthens blur after 24px scroll (`useScroll`/`useMotionValueEvent`) |
| Page change | 180ms opacity crossfade only (via `template.tsx`). No slide. |
| Job list filtering | `layout` + `AnimatePresence mode="popLayout"`; cards reflow with `springUI` |
| Job card hover (desktop only) | `translateY(-2px)` + `shadow-lift`, 150ms |
| Match ring on `/jobs/[id]` | Fills once when scrolled into view (`whileInView`, `once: true`) |
| Dialog/drawer | Scale 0.98 → 1 + fade (desktop); slide up from bottom (mobile, Vaul) |
| Stepper advance | Progress line fills with spring; new active dot gets a single soft pulse |
| Accordion (timeline) | Height auto-animate, 250ms |
| Toasts | Slide + fade from top-right (desktop) / top-center (mobile) |
| Buttons | `scale(0.98)` on press, 100ms |
| Skeletons | Shimmer, 1.6s, disabled under reduced motion |

### 6.5 Smooth scrolling (Lenis) policy
- Enable **only** on `/` (marketing). Disable on all app routes: it conflicts with nested scroll containers, drawers, modals and iOS rubber-banding.
- Disable on touch devices (`syncTouch: false`) to avoid fighting native momentum.
- Disable completely under reduced motion.

### 6.6 Bundle discipline
- Use `LazyMotion features={domAnimation}` and the `m.` components. Load `domMax` only inside the kanban if layout-drag needs it.
- Dynamic-import heavy client pieces: kanban, charts, resume previewer, Lenis provider.

---

## 7. Component specifications

All components live in `components/ui` (primitives) or `components/features/*` (domain). Every component supports: default, hover, focus-visible, active, disabled, loading, error (where relevant).

### 7.1 Button
Variants via `cva`:

| Variant | Look | Use |
|---|---|---|
| `primary` | `bg-plum-700` text white, hover `plum-600`, press `plum-800`; subtle inner top highlight; gold focus ring | Main CTA (one per view) |
| `gold` | Gradient `gold-600 → gold-500`, text `plum-950` (≥7:1) | Rare premium CTA (e.g. "Apply now" on featured) |
| `secondary` | `.glass` surface, `ink` text, plum-200 border | Secondary actions |
| `ghost` | transparent, hover `plum-50` | Tertiary, toolbar |
| `destructive` | `wine-700` text on `wine-100`, hover solid `wine-700` white text | Withdraw, reject |
| `link` | `gold-700` text, underline on hover | Inline |

Sizes: `sm` 36px, `md` 44px (default, touch-safe), `lg` 52px. Radius `--radius-control`. Loading state: spinner replaces icon, width preserved, `aria-busy`.

Focus ring (global): `outline: 2px solid var(--color-gold-700); outline-offset: 2px;` visible on keyboard focus only.

### 7.2 Inputs, select, textarea, checkbox, slider
- Fill `cream-50`, border `cream-300`, radius control, height 48px on mobile, text 16px.
- Focus: border `plum-700` + `0 0 0 4px rgb(199 160 90 / 0.25)` ring.
- Error: border `wine-600`, helper text in `wine-700` with an icon; message states how to fix.
- Password field: eye toggle (44px target) plus **strength meter**: 4 segments, `grey-100` empty → `wine-600` weak → `gold-600` fair → `sage-600` strong; label announces strength via `aria-live="polite"`.
- Skill tag input: combobox (Radix Popover + cmdk-style list), Enter/comma to add, Backspace removes the last tag.
- Range slider (stipend): plum track, gold thumb with 44px hit area, value labels in `₹` formatted with `Intl.NumberFormat("en-IN")`.

### 7.3 Badge / Chip
- Pill radius. Height 26px, text `caption` 600.
- Skill chip: **matched** = `sage-100` bg + `sage-600` text + check icon; **missing** = `grey-100` bg + `grey-700` text + plus icon (hover: tooltip); **neutral** = `plum-100` bg + `plum-700`.

### 7.4 GlassCard
Props: `level` (`1|2|plum`), `interactive`, `gold` (edge), `padding`. Interactive cards are a single `<a>`/`<button>` wrapper with proper focus ring; no div-with-onClick.

### 7.5 MatchRing (signature component)
SVG ring, 3 sizes: `sm` 44px (job card), `md` 96px (dashboard), `lg` 168px (detail page, hero stage).
- Track: `plum-100`. Arc: tier colour (Section 3.3), round caps. Hero stage: arc `gold-500` on plum glass.
- Centre: score in Display font with `%` in Sans small; `tabular-nums`.
- Animates once via `strokeDashoffset` + `useMotionValue` count-up; with reduced motion, render final state.
- `role="img"` with `aria-label="Match score 88 percent"`.

### 7.6 Navbar
- **Desktop:** floating `glass-strong` pill, `top-3`, `max-w-6xl`, radius pill. Left: logo mark + wordmark (Display font). Centre: `Jobs`, `Applications`, `Dashboard` (auth only) with an animated underline/pill that follows the active item (`layoutId`). Right: `Sign in` (ghost) + `Create account` (primary), or avatar menu (Radix DropdownMenu: Profile, Applications, Sign out).
- **Mobile (`< md`):** compact top bar (logo + avatar/Sign in). Authenticated students get a **bottom tab bar** (`glass-strong`, safe-area padded): Home, Jobs, Applications, Profile. Active tab = plum icon + small gold dot. Guests get a hamburger → full-height Vaul sheet.
- Admin shell: left sidebar on `lg+` (glass, collapsible), top bar + sheet on mobile.

### 7.7 JobCard
```
┌───────────────────────────────────────────────┐
│ [logo]  Company name                  ( 88% ) │  ← MatchRing sm
│         Role title (h3)                       │
│  Internship · Remote · ₹25,000 / month        │  ← chips (neutral)
│  [Python✓] [FastAPI✓] [MongoDB✓] [Docker +]   │  ← matched/missing chips, max 4 + "+2"
│  ───────────────────────────────────────────  │
│  Apply by 30 Oct (10 days)      View match →  │
└───────────────────────────────────────────────┘
```
- Whole card is a link to `/jobs/[id]`. `View match` is visual only (not a nested link).
- Deadline < 3 days shows `gold-700` text with a clock icon; closed jobs are greyed with "Closed" badge.
- Guest state: ring replaced by a small lock chip "Sign in for match".
- Skeleton variant matches layout exactly (no layout shift).

### 7.8 ApplicationStepper
- Stages: `Applied → Shortlisted → Interview → Decision`.
- Desktop: horizontal; mobile: compact horizontal with icons only and active label beneath. Under 360px, switch to vertical.
- Done = filled `plum-700` circle + white check; Active = plum ring + soft pulsing gold dot; Pending = `grey-500` outline.
- Connector: `grey-100` track, `plum-700` fill (animated width).
- **Terminal variants:** `Selected` = last node becomes `sage-600` with trophy icon. `Rejected` = last reached node turns `wine-700` with an x icon, remaining nodes dimmed. `Withdrawn` = whole stepper desaturated with a dashed connector and a "Withdrawn on {date}" caption.

### 7.9 Modal / Drawer / Sheet
- Desktop modal: `glass-strong`, radius panel, max-w 640, backdrop `plum-950/40` + 4px blur, focus trapped, Esc closes.
- Mobile: Vaul bottom sheet, drag handle, max-height 92dvh, content scrolls inside, sticky footer with primary action.
- Destructive confirm (withdraw/reject): copy states the consequence; primary button is `destructive`; focus starts on Cancel.

### 7.10 Table → card transformation (admin & applications)
- `>= lg`: dense table in a single glass container, sticky header, row hover `plum-50`.
- `< lg`: each row becomes a stacked card (name + status badge top row, key facts as label/value pairs, actions in a kebab menu). Never horizontally scroll a data table on phones.

### 7.11 Toast, Skeleton, EmptyState, ErrorState
- **Toast** (Sonner): glass-strong, icon by type, 4s. Copy reuses the action's verb ("Application submitted", "Application withdrawn").
- **Skeleton:** `plum-100/60` blocks, shimmer; match real layout.
- **EmptyState:** small illustration made from CSS/SVG shapes in palette (no stock art), one sentence saying what is missing, one action button.
- **ErrorState:** says what failed and what to do; retry button; never "Something went wrong" alone.

---

## 8. Screen specifications

Conventions: `D` = desktop (≥1024), `M` = mobile (<768). Every screen has loading, empty, error and success states unless noted. Routes and API behaviour are unchanged from `UI_FEATURE_EXPLANATION.md`.

### 8.1 Home `/`

**Hero (D):**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  (floating glass navbar)                                                 │
│                                                                          │
│  Your first role, matched          ┌───────────────────────────────┐     │
│  to what you can already do.       │  PLUM→WINE STAGE (radius 32)  │     │
│                                    │  ┌─────────────────────────┐  │     │
│  Kaarmik Seek compares your        │  │ glass-plum job card     │  │     │
│  profile with every campus role,   │  │ [Sample] Company · Role │  │     │
│  shows exactly which skills        │  │   ◔ 94%   MatchRing lg  │  │     │
│  match, and tracks every           │  │ [Python✓][FastAPI✓]     │  │     │
│  application in the open.          │  │ [Docker +] ₹25,000/mo   │  │     │
│                                    │  └─────────────────────────┘  │     │
│  [Browse roles]  [Create account]  │   gold hairline accent        │     │
│                                    └───────────────────────────────┘     │
│  ──── live counts (only if real data) ────                               │
└──────────────────────────────────────────────────────────────────────────┘
```
- Headline in `display-xl`, left-aligned, `ink`. Subtitle `body-lg`, `ink-muted`, max 52ch.
- Primary CTA `Browse roles` → `/jobs`. Secondary: guests `Create account` → `/register`; students `Complete profile`; admins `Post a role` → `/admin/jobs`.
- Trust pill (`Verified Campus Recruiting Platform`) is **dropped**: it is a claim without proof. If verification exists, show what is verified (e.g. "Employers reviewed by your placement cell").
- **Hero (M):** stack. Headline (`display-lg`), subtitle, CTAs full-width, then the stage panel below with the ring at `md` size. Stage reduces to ring + 3 chips.

**Below the hero (all sections calm, no entrance animation except where stated):**
1. **Live counts strip** (single `glass` bar, 3 items, only if API returns real values; otherwise omit the whole strip).
2. **How it works: three pillars.** Do **not** make three identical cards. Use one wide glass panel with three columns separated by `plum-200` hairlines (stacked on mobile). Each column: icon in a `plum-100` rounded-square, a `h3`, 2 lines of copy: *Skill matching* (shows matched vs missing), *Open pipeline* (see where you stand), *Direct interview invites* (date, time, link in one place). Include a small inline diagram per column built from real components (chips, stepper, calendar chip) instead of icons alone.
3. **Featured openings:** top 3 jobs as JobCards. On `< md`, a horizontal snap-scroll row (`snap-x snap-mandatory`, 85% card width).
4. **Closing CTA:** one `glass-plum`-on-plum panel (not a gradient wash across the page): headline + `Create account`. Short.
5. **Footer:** cream-200 background, 4 link groups (Platform, Students, Employers, Legal), copyright.

**Interactions:** unchanged from the click matrix; Lenis smooth scroll active here only.

### 8.2 Auth `/login`, `/register`

```
D: two-column split                      M: single column
┌───────────────────┬────────────────┐   ┌──────────────────────┐
│ Plum stage panel  │ glass-strong   │   │ Logo                 │
│ - serif quote-free│ card           │   │ glass-strong card    │
│   value statement │ [G] Continue   │   │ [G] Continue w/ Google│
│ - 3 short proofs  │ ── or email ── │   │ ── or email ──       │
│   (real features) │ email          │   │ fields …             │
│                   │ password 👁    │   │ [Sign in]            │
│                   │ Forgot?        │   │ Switch link          │
│                   │ [Sign in]      │   └──────────────────────┘
└───────────────────┴────────────────┘
```
- Left panel hidden on `< lg`. It repeats the hero stage motif in miniature (static ring + chips), no animation.
- Google button: `secondary` variant with the official Google "G" mark, full width, 48px.
- Register adds: full name, college (autocomplete), degree + graduation year (two selects side by side on `sm+`), password with strength meter, terms checkbox. Break into **two steps on mobile** (Account → Education) with a progress indicator; one page on desktop.
- Submit label `Sign in` / `Create account` (not "Sign In to Account"). Loading spinner inside the button; fields disabled during request.
- Errors inline per field plus a form-level banner for network/Firebase failures with a retry action.
- On success: redirect to `next` param or role default (`/dashboard` or `/admin`).

### 8.3 Dashboard `/dashboard`

```
D:
┌──────────────────────────────────────────────────────────────┐
│ Welcome back, Prajwal                    ┌──────────────────┐│
│ (display-lg)                              │ Profile 80% ring ││
│ Add your resume to improve matches.       │ [Complete profile]││
│                                           └──────────────────┘│
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│ │Applied │ │Shortl. │ │Interv. │ │Offers  │  (4 stat tiles)  │
│ └────────┘ └────────┘ └────────┘ └────────┘                  │
│ ┌─────────────── Recommended roles ──────────┐ ┌─ Next up ──┐│
│ │ ranked rows (match ≥ 75), Quick apply      │ │ interview  ││
│ └────────────────────────────────────────────┘ │ card/empty ││
│ ┌─────────────── Active applications ────────┐ └────────────┘│
└──────────────────────────────────────────────────────────────┘
M: single column, stats as 2×2 grid, "Next up" first when an interview exists.
```
- Stat tiles: icon, label, number (Display font, `tabular-nums`). Tile for Interviews uses `gold-edge` when count > 0. Tiles are links (filtered `/applications`).
- Profile completion: a `MatchRing md` variant in plum with percentage; text states **what is missing** ("Resume, 3 skills") with a button that deep-links to that section.
- Recommended roles: 3 rows; each = logo, title, company, small ring, deadline, `Apply` button. `Quick apply` opens the Application sheet **only if** the resume exists; otherwise routes to profile with a clear reason.
- Active applications: table on `lg+`, cards on mobile (7.10), each with a mini 4-dot stepper.
- Empty states: no applications → "You haven't applied yet. Start with your best-matching role." + button to `/jobs?sort=match`.

### 8.4 Jobs `/jobs`

```
D:
┌──────────────────────────────────────────────────────────────┐
│ [ 🔍 Search roles, companies, skills ]   Sort: Best match ▾ │
├───────────────┬──────────────────────────────────────────────┤
│ Filters       │ 8 open roles                                  │
│ (glass,       │ ┌─────────JobCard─────────┐ ┌─────JobCard──┐ │
│  sticky)      │ │                         │ │              │ │
│ Type ☐☐☐      │ └─────────────────────────┘ └──────────────┘ │
│ Mode ☐☐☐      │ …                                            │
│ Category      │                                              │
│ Stipend ──●─  │                                              │
│ [Reset]       │                                              │
└───────────────┴──────────────────────────────────────────────┘
M: search bar + [Filters (2)] button + sort → Vaul bottom sheet for filters
   with sticky footer [Show 8 roles] / [Reset]. Cards single column.
```
- Search debounced 250ms; state in URL via `nuqs` (`?q=&type=&mode=&sort=`).
- Active filters shown as removable chips above results.
- Results grid: 1 col (M), 2 cols (`lg`), optionally 3 on `2xl`.
- Result changes animate with layout transitions; counter updates with a tiny number tween.
- Empty result: "No roles match these filters." + `Clear filters` button + suggestion to widen stipend range.
- Sort `Best match` is disabled for guests with a tooltip: "Sign in to sort by match."

### 8.5 Job detail `/jobs/[id]`

```
D (two-column, right column sticky):
┌──────────────────────────────────────────────────────────────┐
│ ← Back to jobs                                                │
│ [logo] Role title (display-lg)                                │
│ Company · Location · Internship · Posted 3 days ago           │
│ [₹25,000/month]  [Closes in 10 days]          [ Apply ]       │
├───────────────────────────────────┬──────────────────────────┤
│ About the role                    │ glass-strong (sticky)    │
│ Eligibility                       │   MatchRing lg  85%      │
│ Skills required                   │   "You meet 4 of 5       │
│ Perks                             │    required skills."     │
│                                   │   Skills fit   45/50 ▬▬▬ │
│                                   │   Education    15/15 ▬▬▬ │
│                                   │   Experience    8/10 ▬▬  │
│                                   │   Availability 12/15 ▬▬  │
│                                   │   Location     10/10 ▬▬▬ │
│                                   │   Matched: chips         │
│                                   │   Missing: chips         │
└───────────────────────────────────┴──────────────────────────┘
M: header → sticky bottom bar [ 85% ring | Apply ] → match card (expanded) → role content.
```
- Sub-score meters: label left, `x / max` right (tabular), 6px bar, `plum-700` fill (tier colour only for the overall ring). Each meter animates once.
- Match summary text is generated from real numbers; never claim "exceptional" without data thresholds (≥ 85 "strong match", 75–84 "good match", 50–74 "partial match", < 50 "low match, here is what is missing").
- Missing skill chip tooltip (hover/tap): "Add this to your profile once you have experience with it."
- Guests: the match card shows a blurred sample state with `Sign in to see your match` overlay. Never show a fake number.
- **Apply flow:** desktop dialog; mobile Vaul sheet. Contents: job summary, resume row (file name, "Replace"), cover letter textarea with live character count and prompt "Why are you interested in this role?", footer `Submit application`. If no resume: inline blocker with `Upload resume` link instead of the form footer. On success: toast "Application submitted", button becomes a `sage` "Applied" badge, and a link `Track application`.

### 8.6 Applications `/applications`

```
┌──────────────────────────────────────────────────────────────┐
│ My applications                                               │
│ [All] [In progress] [Interviews 1] [Closed]   (animated tabs) │
│ ┌ Interview banner (only if scheduled) ───────────────────────┐
│ │ gold-edge glass · Company – Role · Thu 22 Oct, 11:00 IST    │
│ │ Google Meet            [Join meeting]  [Add to calendar]    │
│ └─────────────────────────────────────────────────────────────┘
│ ┌ Application card ───────────────────────────────────────────┐
│ │ Company · Role                 [Shortlisted]  Applied 18 Oct │
│ │ ApplicationStepper                                           │
│ │ ▸ Activity (accordion): dated timeline                       │
│ │ View job posting                      [Withdraw application] │
│ └─────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────┘
```
- Tabs map to status sets: In progress = Applied/Shortlisted/Interview; Closed = Selected/Rejected/Withdrawn. Tab counts from data; hide a count of 0.
- `Join meeting` becomes enabled 15 minutes before start (disabled with tooltip before that) and opens in a new tab with `rel="noopener noreferrer"`.
- `Add to calendar` downloads an `.ics` generated client-side.
- Timeline: vertical line with dots; latest entry at the top with a gold dot; timestamps in IST using `date-fns` with an explicit time zone label.
- Withdraw: confirm dialog (7.9). Optimistic update, rollback and error toast on failure.
- Mobile: banner stacks (buttons full width), stepper compact, actions in a bottom row with `Withdraw` as a text-style destructive link.

### 8.7 Profile `/profile`

- **D:** left sticky section nav (Resume, Skills, Education, Experience, Security) with scroll-spy; right: stacked glass sections. **M:** sections as an accordion list with a completion dot per section; sticky bottom `Save changes` bar appears when the form is dirty.
- **Header:** avatar upload (crop to circle), name, email, phone, location, completion ring `md`.
- **Resume:** drag-and-drop zone (dashed `gold-500` border; on drag-over fills `gold-100` and scales 1.01). Accepts `.pdf` and `.docx` up to 5 MB; errors name the problem ("This file is 7.2 MB. The limit is 5 MB."). Uploaded state: file card with name, size, date, download, remove (confirm). Parser result chip: "12 skills found in your resume" with a `Review skills` link. Upload shows progress bar.
- **Skills:** tag input (7.2); "Suggested for your degree" row of one-tap chips; changing skills shows a subtle inline note "Match scores will update" and then refreshes the jobs query.
- **Education / Experience:** list items in solid `cream-50` rows (not glass-in-glass) with edit/delete; add via dialog/sheet.
- **Security:** linked providers as rows with status badges; `Set password` / `Change password` opens a dialog.
- Save behaviour: autosave drafts locally per section; explicit `Save changes` posts `PUT /api/student/profile`; toast "Profile saved".

### 8.8 Admin suite `/admin/*`

**Shell:** sidebar (`lg+`) with Overview, Jobs, Applicants, Email log. Mobile: top bar + Vaul nav sheet. Admin uses the same palette but denser type (`small` body) and lower backdrop intensity.

**Overview:** 4 KPI tiles (live jobs, candidates, active applications, placement rate) + one Recharts line/area (applications per week, palette only: `plum-700` stroke, `gold-500` secondary) + "Needs attention" list (applicants waiting > 5 days). Quick actions: `Post a role`, `Review new applicants`.

**Jobs manager:** table (cards on mobile) with active/closed switch, applicant count, deadline, actions menu. `Post a role` opens a **multi-section sheet** (Basics → Requirements → Description) with a live preview of the resulting JobCard on desktop. Skills tag input; description markdown editor with preview tab.

**Applicants pipeline:**
```
D: Kanban (5 columns) | M: stage segmented control + list
┌Applied(12)┐┌Shortlisted(4)┐┌Interview(2)┐┌Selected(1)┐┌Rejected(7)┐
│ card      ││ card         ││ card       ││ card      ││ card      │
```
- Role filter at top (searchable select). Cards show name, college, match chip, applied date.
- **Drag rules:** only valid transitions (11.3) are drop targets; invalid columns dim and show a "not allowed" cursor. Dropping onto *Interview* opens the schedule dialog (drop is committed only when saved). Dropping onto *Rejected* opens the reject-with-feedback dialog. Keyboard alternative: card menu "Move to…" (drag is never the only way).
- **Dossier:** desktop = right-side panel (width 520); mobile = full-height sheet. Tabs: Profile, Resume (PDF viewer in an iframe/embedded viewer, lazy), Cover letter, Match breakdown (same meters as 8.5). Footer actions show **only valid next stage buttons**. Email notification toggle defaults on, with a preview of the email that will be sent.
- **Schedule interview dialog:** date, time (with time zone label), platform select (Meet/Zoom/Other) + link, notes. Validates that date is in the future and the link is a URL.
- Bulk actions on the table view: select rows → `Shortlist`, `Reject`. Confirm with a count.

### 8.9 System screens
- **404:** large serif "Page not found", one sentence, `Browse roles` + `Go home`. Uses the stage motif, static.
- **Error boundary:** message, error digest in small text, `Try again`.
- **Offline banner:** slim `gold-100` bar at the top when `navigator.onLine` is false.

---

## 9. Responsive behaviour summary

| Pattern | Mobile (<768) | Tablet (768–1023) | Desktop (≥1024) |
|---|---|---|---|
| Navigation | Top bar + bottom tabs (students) | Top pill nav | Floating pill nav; admin sidebar |
| Filters | Bottom sheet | Collapsible panel | Sticky left rail |
| Job grid | 1 col | 2 col | 2–3 col with rail |
| Tables | Stacked cards | Table with fewer columns | Full table |
| Kanban | Segmented stage list | Horizontal scroll columns | 5 columns |
| Dialogs | Bottom sheet | Centered dialog | Centered dialog / side panel |
| Hero | Stacked, ring `md` | Stacked, larger stage | Two-column with stage |
| Fonts | `display-lg` hero | scale up | `display-xl` |

Rules: no horizontal page scroll at any width, test with 200% browser zoom, landscape phones, and iOS Safari dynamic toolbar (`dvh`). Forms use `inputMode`, `autocomplete`, `enterKeyHint` attributes.

---

## 10. Content and microcopy rules

- Sentence case. Plain verbs. Active voice. No exclamation marks, no emojis in UI chrome.
- A button names what happens: `Submit application`, `Save changes`, `Withdraw application`. The same verb appears in the confirmation toast ("Application submitted").
- Errors: say what happened and the fix. "We couldn't upload your resume. Check your connection and try again." Never apologise vaguely.
- Empty states are invitations to act, not decoration.
- Placeholder/sample content must be labelled **Sample** and use obviously fictional company names.
- Currency `₹` with Indian digit grouping. Dates `22 Oct 2026`; times with `IST`.

---

## 11. Application logic the UI must respect

### 11.1 Data handling
- Public job list and detail: server-rendered, cached 60s. Personalised data (match score, applied state, saved resume) fetched client-side with the Firebase ID token via TanStack Query; show skeleton for personalised pieces only.
- All forms validate with `zod` schemas shared in `lib/schemas`. Server errors map back to fields.
- API client in `lib/api.ts`: attaches token, retries once on 401 after refreshing the Firebase token, normalises errors to `{ code, message, fieldErrors? }`.

### 11.2 Optimistic updates
Apply, withdraw, stage change, skill add/remove: update the cache immediately, roll back with an error toast on failure. Never optimistically show an **offer/selected** state; wait for server confirmation.

### 11.3 Stage transitions (UI must mirror the backend)

| Current | Allowed next (candidate view) | Allowed next (admin view) |
|---|---|---|
| `APPLIED` | `WITHDRAWN` | `SHORTLISTED`, `REJECTED` |
| `SHORTLISTED` | `WITHDRAWN` | `INTERVIEW_SCHEDULED`, `REJECTED` *(requires backend change; see Section 2 #4)* |
| `INTERVIEW_SCHEDULED` | `WITHDRAWN` | `SELECTED`, `REJECTED` |
| `SELECTED` / `REJECTED` / `WITHDRAWN` | none | none |

Build `getAllowedTransitions(status, role)` once in `lib/status.ts` and drive every button, drag target and menu item from it. Do not hand-code per screen.

### 11.4 Guest vs student vs admin
- Guests can browse; any action needing identity redirects to `/login?next=<current url>` and returns afterward.
- Students never see admin routes (redirect to `/dashboard`). Admins hitting student routes see a gentle "You are signed in as an admin" note with a link to `/admin`.

---

## 12. Accessibility requirements (acceptance criteria, not suggestions)

- WCAG 2.2 AA contrast for all text and UI boundaries; run the palette through a checker and fix tokens rather than overriding per component.
- Visible `:focus-visible` ring on every interactive element; logical tab order; skip-to-content link.
- Dialogs/sheets trap focus, restore focus on close, close with Esc.
- Status and match are never colour-only (icon + text).
- Form fields have visible labels (not placeholder-only), error text linked by `aria-describedby`, `aria-invalid` set.
- Live regions for toasts, password strength, filter result counts (`aria-live="polite"`).
- Kanban drag has a keyboard/menu alternative.
- Touch targets ≥ 44px; text resizable to 200% without loss.
- Honour `prefers-reduced-motion` and `prefers-reduced-transparency` (Section 4).

---

## 13. Performance budgets

- LCP < 2.5s on a mid-range phone over 4G for `/` and `/jobs`. CLS < 0.05. INP < 200ms.
- Hero stage is **CSS + SVG**, no raster image. Logo avatars use `next/image` with explicit sizes.
- First-load JS for `/` under ~170 KB gzip (check with the build output); lazy-load kanban, charts, PDF viewer, Lenis.
- At most 6 glass surfaces per mobile viewport (Section 4.2). If a profile shows jank, reduce blur radius before removing the effect.
- Fonts: only the listed weights; `display: swap`; preload through `next/font` defaults.
- Set `sizes` on all images; no layout shift from late-loading avatars (reserve space).

---

## 14. Suggested project structure

```
app/
  fonts.ts
  globals.css                 # tokens, glass utilities (Section 3–4)
  layout.tsx                  # fonts, MotionConfig, QueryProvider, Toaster, AmbientBackdrop
  (public)/
    layout.tsx                # navbar + footer + Lenis provider
    page.tsx                  # home
    jobs/page.tsx
    jobs/[id]/page.tsx
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  (student)/
    layout.tsx                # navbar + bottom tabs, auth gate
    dashboard/page.tsx
    applications/page.tsx
    profile/page.tsx
  (admin)/admin/
    layout.tsx                # sidebar shell
    page.tsx
    jobs/page.tsx
    applicants/page.tsx
  not-found.tsx
  error.tsx
components/
  ui/                         # button, input, badge, glass-card, dialog, sheet, tabs, tooltip, toast…
  shell/                      # navbar, bottom-tabs, footer, ambient-backdrop, admin-sidebar
  features/
    match/                    # match-ring, match-breakdown, skill-chips
    jobs/                     # job-card, job-filters, job-list
    applications/             # application-card, stepper, timeline, interview-banner
    profile/                  # resume-dropzone, skill-input, education-form
    admin/                    # kanban, dossier-panel, schedule-dialog, job-form
lib/
  api.ts  status.ts  schemas.ts  motion.ts  format.ts  utils.ts
hooks/                        # use-debounced-value, use-media-query, use-auth
public/textures/grain.svg
```

---

## 15. Build order (phases with exit criteria)

| Phase | Deliverable | Done when |
|---|---|---|
| 1. Foundation | Tokens, fonts, `globals.css`, glass utilities, `AmbientBackdrop`, `MotionConfig`, layouts | A test page shows all three glass levels legibly on the backdrop; contrast check passes |
| 2. Primitives | Button, Input family, Badge/Chip, GlassCard, Dialog/Sheet, Tabs, Tooltip, Toast, Skeleton | Storybook-style `/dev/ui` page (dev only) shows every state at 375px and 1280px |
| 3. Signature components | MatchRing, MatchBreakdown, ApplicationStepper (+ terminal variants), JobCard | Ring animates once, respects reduced motion; stepper renders all 6 statuses |
| 4. Shell | Navbar (desktop pill + mobile top/bottom), footer, admin shell | Navigation works for guest, student, admin at all breakpoints |
| 5. Public pages | Home (hero stage sequence, Lenis), Jobs (URL-state filters, sheet on mobile), Job detail (+ Apply flow) | Lighthouse a11y ≥ 95; no layout shift; filters shareable by URL |
| 6. Auth | Login, Register (2-step mobile), error states | Firebase flow + sync + fallback behave as before |
| 7. Student app | Dashboard, Applications, Profile | Optimistic withdraw/apply; resume upload validations |
| 8. Admin | Overview, Jobs manager, Applicants kanban + dossier + schedule dialog | Only valid transitions possible; emails toggle works |
| 9. Polish & QA | 404/error/offline, OG images, skeleton parity, reduced-motion pass, perf pass | Section 12 and 13 checklists all green |

### Final acceptance checklist
- [ ] No hex literals or default Tailwind colours in components (grep).
- [ ] No `dark:` classes; `color-scheme: light` set.
- [ ] Gold/grey-500 never used for small text.
- [ ] No nested glass; ≤ 6 glass surfaces per mobile viewport.
- [ ] Hero is the only auto-playing animation; everything stops under reduced motion.
- [ ] Every number on screen is real or labelled Sample.
- [ ] Every status/transition button derived from `getAllowedTransitions`.
- [ ] All tables degrade to cards on mobile; no horizontal page scroll at 320px.
- [ ] Every screen has loading, empty and error states.
- [ ] Keyboard-only walkthrough completes: sign in → apply → withdraw; admin: shortlist → schedule interview.

---

## 16. Anti-patterns (reject in code review)

- Identical rounded cards with the same shadow repeated down the page.
- Fade-up-on-scroll on every section; hover lift on every card.
- Gradient washes as decoration; neon glows; gold used as a large fill.
- ALL-CAPS tracked eyebrows; one word of a headline in a different colour; numbered markers on non-sequential content.
- Glass over plain cream with no backdrop; glass inside glass.
- `div onClick` as buttons; icon-only buttons without `aria-label`.
- Placeholder text as the only label; "Submit" as a button label.
- Fake metrics, fake testimonials, fake logos.
- Lenis or custom scroll hijacking inside app routes.
