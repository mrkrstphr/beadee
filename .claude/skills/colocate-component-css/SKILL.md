---
name: colocate-component-css
description: Refactor a React component to colocate its CSS alongside it. Creates a directory for the component, moves it inside as index.tsx, extracts its styles from app/index.css into a colocated CSS file, and converts those styles to Tailwind @apply. Use when the user asks to colocate, extract, or move component styles, or refactor a component's CSS.
---

# Colocate Component CSS

## Pattern

Each component lives in its own directory with a colocated CSS file:

```
app/components/MyComponent/
├── index.tsx        ← moved from MyComponent.tsx
└── MyComponent.css  ← extracted from app/index.css
```

## Steps

For each component being refactored:

### 1. Research

- Read the component file
- `grep` for all CSS classes it uses in `app/index.css` to find the relevant section(s)
- `grep` for all importers of the component across `app/**/*.{tsx,jsx}` to know what paths to update

### 2. Move the component

```bash
mkdir -p app/components/MyComponent
mv app/components/MyComponent.tsx app/components/MyComponent/index.tsx
```

### 3. Fix imports inside the moved file

- Deepen relative paths by one level: `../foo` → `../../foo`
- Add `import './MyComponent.css';` at the top with other imports

### 4. Fix imports in all consumers

Update every file that imports this component:

- `from './MyComponent.jsx'` → `from './MyComponent/index.jsx'`
- `from '../MyComponent.jsx'` → `from '../MyComponent/index.jsx'`

### 5. Create the CSS file

Create `app/components/MyComponent/MyComponent.css` and convert the extracted styles to Tailwind `@apply` (see Tailwind conversion rules below).

### 6. Remove from `app/index.css`

Delete the extracted rules from `app/index.css`. Remove the entire section comment block too.

Also check the `@media (max-width: 640px)` block near the bottom of `app/index.css` — mobile overrides for the component may live there separately.

### 7. Verify

```bash
npx tsc --noEmit
```

---

## Tailwind Conversion Rules

Every colocated CSS file must start with:

```css
@reference "tailwindcss";
```

### Use `@apply` for

Static utility-mappable properties: `display`, `flex`, `grid`, `position`, `overflow`, `padding`, `margin`, `gap`, `width`, `height`, `font-size`, `font-weight`, `color` (Tailwind color scale only), `border-radius`, `cursor`, `opacity`, `transition`, `transform`, `z-index`, `white-space`, `text-align`, `align-items`, `justify-content`, etc.

Use Tailwind's built-in keyframe animations where available (e.g. `animate-spin` instead of a hand-rolled `@keyframes spin`).

### Keep as raw CSS (do not `@apply`)

- `var(--*)` design tokens — always raw: `color: var(--text-muted);`
- `content: ''` on `::before` / `::after` pseudo-elements
- `font-family` with custom font stacks
- Complex values with no Tailwind equivalent: `linear-gradient(...)`, `color-mix(...)`, custom `box-shadow` with `var(--*)`, `-webkit-*` vendor prefixes, `calc(...)`, `grid-template-columns: ...`

### Arbitrary values

Use when the exact value isn't on Tailwind's default scale:

```css
/* Instead of: font-size: 13px; */
@apply text-[13px];

/* Instead of: width: 200px; */
@apply w-[200px];

/* Instead of: gap: 5px; */
@apply gap-[5px];
```

### Color tokens

Prefer Tailwind color utilities over hardcoded hex/rgba when there's a close match. For dynamic themed colors, always use `var(--*)` as raw CSS.

---

## Shared styles stay in `app/index.css`

Before removing a class from `app/index.css`, verify it isn't used by other components:

```bash
rg 'class-name' app --include='*.tsx' --include='*.jsx'
```

If a class is used by 2+ unrelated components, leave it in `app/index.css` with a comment noting which components share it. Colocate it only when you also refactor those other components.

---

## Example

**Before** (`app/index.css`):

```css
/* ============================================================
   MY COMPONENT
   ============================================================ */

.my-component {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--text);
  font-size: 13px;
}
```

**After** (`app/components/MyComponent/MyComponent.css`):

```css
@reference "tailwindcss";

.my-component {
  color: var(--text);
  @apply flex flex-col gap-3 text-[13px];
}
```
