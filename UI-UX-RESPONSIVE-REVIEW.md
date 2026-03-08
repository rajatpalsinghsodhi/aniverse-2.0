# UI/UX & Responsive Review – Issues & Fixes

## Summary
Review covered mobile (360px–414px), tablet (768px), and desktop (1280px+). Tailwind breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px.

---

## 1. Section padding (8pt grid)

| Component/Screen | Viewport | Issue | Fix |
|------------------|----------|--------|-----|
| App.tsx (Genre, Trending, Top Rated) | Mobile | Fixed `px-8` too large on small screens | Use `px-4 sm:px-6 md:px-8` |
| TopCharts.tsx | All | Fixed `p-8` | Use `p-4 sm:p-6 md:p-8` |
| MyLibrary.tsx | All | Fixed `p-8` | Use `p-4 sm:p-6 md:p-8` |
| RightSidebar.tsx | xl+ | Fixed `p-8` | Use `p-4 md:p-6 xl:p-8` for consistency |

---

## 2. Layout & grids

| Component/Screen | Viewport | Issue | Fix |
|------------------|----------|--------|-----|
| App.tsx main content | All | No max-width on very wide screens | Optional: wrap content in `max-w-[1600px] mx-auto` for readability |
| MyLibrary search | Mobile | Fixed `w-64` wastes space | Use `w-full sm:w-48 md:w-64` |
| TopCharts filter buttons | Mobile | Three buttons may cramp | Ensure `flex-wrap` and responsive padding |

---

## 3. Modals

| Component/Screen | Viewport | Issue | Fix |
|------------------|----------|--------|-----|
| IdentificationModal | Mobile | Inner `p-8` heavy on small screens | Use `p-4 sm:p-6 md:p-8` |
| IdentificationModal | Mobile | Upload area `p-12` | Use `p-6 sm:p-8 md:p-12` |
| LoginModal | Already good | `p-8 md:p-10` | No change |
| AnimeDetailsModal | Already good | Responsive padding and layout | No change |

---

## 4. Touch targets & accessibility

| Component/Screen | Viewport | Issue | Fix |
|------------------|----------|--------|-----|
| AnimeCard | Mobile | Whole card is tap target (OK) | Ensure min 44px height for text row (already adequate with aspect card) |
| Header buttons | Mobile | Icon-only buttons | Already `p-2.5` (~40px); consider `min-w-[44px] min-h-[44px]` for strict 44pt |
| Sidebar NavItem | All | `py-3` (~44px) | OK |

---

## 5. Hero

| Component/Screen | Viewport | Issue | Fix |
|------------------|----------|--------|-----|
| Hero.tsx | Mobile | Already uses `px-4 md:px-8`, `p-6 md:p-12` | No change |

---

## 6. Fixes applied
- **App.tsx**: Section padding `px-4 sm:px-6 md:px-8` for Genre, Trending, Top Rated; main content wrapped in `max-w-[1600px] mx-auto`; header icon buttons use `min-w-[44px] min-h-[44px]` for touch targets.
- **TopCharts.tsx**: Page padding `p-4 sm:p-6 md:p-8`; filter bar `flex-wrap gap-2` for small screens.
- **MyLibrary.tsx**: Page padding `p-4 sm:p-6 md:p-8`; search input `w-full md:w-64`.
- **RightSidebar.tsx**: Padding `p-6 xl:p-8`.
- **IdentificationModal.tsx**: Content area `p-4 sm:p-6 md:p-8`; upload zone `p-6 sm:p-8 md:p-12`.
- **LoginModal / AnimeDetailsModal**: Already responsive; no changes.
