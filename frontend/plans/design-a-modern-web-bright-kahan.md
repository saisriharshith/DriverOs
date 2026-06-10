# Plan: DriverOS India — Responsive Multilingual Login System

## Context

The app already has a working 7-language login flow (en, hi, te, ta, kn, mr, bn) with phone + OTP authentication. However the current login page is designed purely as a mobile app screen — it lacks:

1. **Desktop responsiveness** — no split-panel layout for web browsers
2. **Malayalam** — the new request adds Malayalam as a required 7th Indian language (replacing or adding alongside Bengali/Marathi)
3. **Visual polish** — language selector is a plain grid; language switching has no transition animation
4. **"Website" feel** — branding is minimal; desktop users see a stretched mobile card
5. **OTP screen completeness** — timer and error states need visual improvement

The goal is to make the login page feel like a proper national-scale SaaS product entry point — responsive across all devices, with instant animated language switching and an elegant split-panel desktop layout.

---

## What Will Change

### Files Modified
- `src/app/translations.ts` — add Malayalam (`ml`) language
- `src/app/components/LoginPage.tsx` — full redesign with responsive layout + animations
- `src/app/App.tsx` — minor: update `LANGUAGE_OPTIONS` import (already exported from translations)

### Files NOT Modified
- All other screen components (Dashboard, DocumentVault, etc.) — already work with useLang()
- `LanguageContext.tsx` — already correct
- `theme.css` — no changes needed

---

## Implementation Plan

### Step 1 — Add Malayalam to `translations.ts`

Add `LangCode = "ml"` to the type and add a full `ml` entry to the translations object. Only login-page keys + navigation keys need full translation for the login demo; remaining keys can default to English for post-login screens.

Add to `LANGUAGE_OPTIONS`:
```ts
{ code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" }
```

Key Malayalam translations needed (login-specific):
```
welcomeTo: "സ്വാഗതം"
tagline: "ഇന്ത്യൻ ട്രക്ക് ഡ്രൈവർമാർക്കുള്ള ഡിജിറ്റൽ OS"
selectLanguage: "ഭാഷ തിരഞ്ഞെടുക്കുക"
enterPhone: "മൊബൈൽ നമ്പർ നൽകുക"
phonePlaceholder: "10 അക്ക മൊബൈൽ നമ്പർ"
sendOTP: "OTP അയയ്ക്കുക"
enterOTP: "OTP നൽകുക"
otpSentTo: "OTP അയച്ചു"
verifyOTP: "പരിശോധിച്ച് ലോഗിൻ ചെയ്യുക"
resendOTP: "OTP വീണ്ടും അയയ്ക്കുക"
... (all login keys + nav keys)
```

---

### Step 2 — Redesign `LoginPage.tsx`

#### Desktop Layout (≥768px): Split Panel
```
┌──────────────────────┬──────────────────────┐
│   LEFT PANEL         │   RIGHT PANEL        │
│   (bg: #1a4999)      │   (bg: white)        │
│                      │                      │
│  [DriverOS Logo]     │  [Language Selector] │
│  [Brand Name]        │                      │
│  [Tagline]           │  [Login Card]        │
│                      │  - Phone Input       │
│  Feature highlights: │  - Send OTP          │
│  📄 Documents        │  - OTP Screen        │
│  🛡️ Compliance       │                      │
│  🚨 Emergency        │  [Terms text]        │
│  🌐 Multilingual     │                      │
└──────────────────────┴──────────────────────┘
```

#### Mobile Layout (<768px): Full-screen card (existing approach, polished)
- Language pills at top
- Logo + brand
- Login form below

#### Language Selector Redesign
- **Pill-style buttons** arranged in a 3-column grid (or horizontal scroll on mobile)
- Each pill shows: `[flag] [native script]`
- Active language has blue background + checkmark
- Pills have hover states

#### Transition Animation (using `motion` from `motion/react`)
- When language changes: `AnimatePresence` + `motion.div` with `opacity: 0→1` and subtle `y: 8→0` slide-up on the text content area (150ms)
- Smooth, not distracting

#### Step Transitions
- Each step (lang → phone → otp) animates in from the right with `x: 20→0, opacity: 0→1`

#### OTP Screen Improvements
- Larger digit boxes (h-16, w-12) with number pad feel
- Timer bar — thin progress bar depleting over 30 seconds
- Success animation on correct OTP entry (green pulse)

---

### Step 3 — Minor `App.tsx` update

The `AppShell` component references `LANGUAGE_OPTIONS` from translations — no change needed. The new `ml` code will flow through automatically once added to translations.

---

## Code Patterns

### Language Switch Animation Pattern
```tsx
import { motion, AnimatePresence } from "motion/react";

// Wrap translated content blocks:
<AnimatePresence mode="wait">
  <motion.div
    key={lang}  // key change triggers re-animation
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.15 }}
  >
    {/* translated text */}
  </motion.div>
</AnimatePresence>
```

### Responsive Split Layout Pattern
```tsx
<div className="min-h-screen flex flex-col md:flex-row">
  {/* Left panel — hidden on mobile */}
  <div className="hidden md:flex md:w-1/2 bg-[#1a4999] ...">
    {/* branding + features */}
  </div>
  {/* Right panel — full width on mobile */}
  <div className="flex-1 flex items-center justify-center bg-white ...">
    {/* login form */}
  </div>
</div>
```

---

## Verification

1. Open the app — login page renders first
2. On desktop (>768px): verify split-panel layout — left blue branding, right white form
3. On mobile: verify full-screen centered card
4. Click each of the 8 language options — verify ALL visible text changes instantly with fade animation
5. Enter phone number → Send OTP → enter `123456` → verify login succeeds
6. After login, verify dashboard renders in the last-selected language
7. Open side menu → logout → verify login page returns in the last-selected language
8. Resize browser window — verify responsive breakpoint transition between layouts
