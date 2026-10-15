# GrabSpark (GemBond & GemHunter)

Interactive frontend prototype exploring collaborative merchant growth for small, independent restaurants in Thailand.

This prototype demonstrates two connected concepts:
- **GemBond**: A partnership network where non-competing neighbourhood restaurants run shared cross-promotions without hidden advertising fees or commission clawbacks.
- **GemHunter**: A preparatory storefront programme inside the delivery platform where merchants audit dish names, collect real photo reviews, and graduate into GemBond.

All shop profiles, transaction histories, and partner responses are simulated locally in the browser. There is no remote backend, no payment processing, and no live merchant data.

## Quick Start

Requirements: Node.js 20+ (recommended 22+) and npm.

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run test suite, type checking, and production build
npm test
npm run typecheck
npm run build
```

The application runs at `http://localhost:5173`.

## How the Demo Works

The interface is presented from the perspective of a small food stall owner (*ร้านหมูสะเต๊ะบ้านสวน* in central Bangkok). You can walk through both GemHunter and GemBond, using the presenter drawer (**เครื่องมือสาธิต**) to simulate customer actions and partner decisions without needing another user account.

### 1. GemHunter: Storefront Readiness

Start at `/gemhunter`:
1. **Invitation & Conditions**: Review the programme terms. The merchant pays zero baht, gives no mandatory discounts, and keeps normal delivery sales untouched.
2. **Menu Audit**: Review and approve dish names. Customers see clearer titles, and prices remain identical.
3. **Customer Discovery View**: Preview how the store looks inside the customer app.
4. **Photo & Review Bank**: Inspect customer photos and ratings across all score tiers (1 to 5 stars).
5. **Graduation & GemBond Handoff**: Once 10 reviews pass moderation, the store meets the criteria to unlock GemBond. Handoff is voluntary and requires explicit owner confirmation.

### 2. GemBond: Collaborative Growth Plans

Navigate to `/dashboard` or accept the handoff from GemHunter:
1. **Opportunities**: Browse matched partner stores in the same district (such as *ร้านข้าวหอม*, a nearby rice dish restaurant).
2. **Plan Inspection**: Read the prepared plan terms, financial estimates, privacy boundaries, and mutual responsibilities.
3. **Independent Consent**: Both stores must consent to the exact same terms version. If one merchant requests a change, previous consents are invalidated and require re-confirmation.
4. **Campaign Activation**: Campaigns only launch after four guardrails pass: dual confirmation, partner operational readiness, fairness review, and active platform standing.
5. **Fair Ledger & Results**: When the campaign finishes, the ledger transparently separates baseline organic revenue from estimated partnership impact, showing net gain after dish costs.

### Presenter Controls

Click **เครื่องมือสาธิต** in the top navigation (GemHunter) or bottom corner (GemBond) to:
- Simulate partner store confirmations or requested revisions
- Fast-forward customer reviews and moderation
- Advance or reset campaign lifecycles
- Reset the prototype back to the initial state

## Project Structure

```text
src/
├── app/               # Root router, global app state reducer, and selectors
├── components/        # Reusable presentation components, charts, and layout shells
│   └── ui/            # Base primitives built on Radix UI and Tailwind v4
├── data/              # Synthetic seed data for stores, menus, reviews, and past sales
├── domain/            # Pure business logic and domain rules
│   ├── matching.ts            # Merchant affinity and compatibility scoring
│   ├── fairness.ts            # Fairness checks and guardrail validators
│   ├── consent.ts             # Version-locked mutual consent state machine
│   ├── campaign-lifecycle.ts  # Campaign phases, transitions, and handoff rules
│   └── calculations.ts        # Margin, commission, and net benefit estimators
├── features/          # Screen-level feature modules
│   ├── dashboard/             # Merchant overview, action dock, and recent stats
│   ├── growth-plans/          # Plan details, terms versioning, and consent dialog
│   ├── partner-discovery/     # Partner matching cards and rationale
│   ├── campaigns/             # Active campaign tracking and live progress
│   ├── results/               # Waterfall charts, attribution, and accounting ledger
│   ├── store-profile/         # Store operational settings and partner preferences
│   ├── support/               # Assistance and issue reporting form
│   └── gemhunter/             # Store audit, photo bank, discovery, and handoff
└── styles/            # Global stylesheet, design tokens, and CSS variables
```

## Architecture and Engineering Highlights

- **Pure Domain Rules**: Core business policies (matching, consent versioning, fairness, and campaign lifecycle) live in isolated pure TypeScript functions in `src/domain/`. They are tested independently without React or browser mocks.
- **Client-Side State Machine**: Application state is managed through deterministic reducers in `src/app/reducer.ts` and `src/features/gemhunter/domain/reducer.ts`, with state persisted across browser refreshes in `localStorage`.
- **Thai Typography & Layout Polish**: Typography is tuned for Thai script using Sarabun and IBM Plex Sans Thai, bundled locally through `@fontsource` with zero remote runtime font requests. Text containers maintain proper vertical line heights to ensure tone marks and sub-baseline vowels render without clipping.
- **Design Token Discipline**: Styled with Tailwind CSS v4 using semantic color tokens based on Grab brand green, tinted neutral darks, and clear visual hierarchy without decorative gradients or unnecessary nesting.
- **Automated Verification**: Over 190 automated unit and invariant walk tests cover domain logic, view adapters, and state transitions via Vitest.

## Scripts

- `npm run dev`: Starts the Vite development server with hot module replacement.
- `npm run build`: Type-checks and compiles the production bundle into `dist/`.
- `npm run typecheck`: Runs strict TypeScript compiler diagnostics without emitting files.
- `npm run lint`: Checks source files with ESLint.
- `npm test`: Runs the Vitest test suite.
- `npm run preview`: Locally previews the compiled production build.

## License

Private prototype for demonstration and evaluation purposes.
