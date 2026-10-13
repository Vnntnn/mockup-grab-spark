# GemBond — ต้นแบบสาธิต (prototype)

Interactive UI prototype of a collaborative merchant-growth platform for small restaurants.
All merchants, numbers and outcomes are **synthetic**. No backend, no real campaigns, no payments.

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck && npm run lint && npm test && npm run build
```

Stack: React 19, TypeScript (strict), Vite, Tailwind v4, shadcn/ui (radix-nova), React Router, lucide-react.
Fonts (IBM Plex Sans Thai) are bundled via `@fontsource`; nothing loads from a remote service.

## Demo flow (open "เครื่องมือสาธิต" bottom-right)
1. Dashboard → ดูแผนที่แนะนำ → read the Guided Growth Plan → สนใจและยืนยันเงื่อนไข.
2. Status is "คุณสนใจแล้ว — รอร้านคู่ค้ายืนยัน"; แคมเปญ page shows start is blocked.
3. Demo panel → จำลองการยืนยันจากร้านคู่ค้า (or จำลองร้านคู่ค้าขอเปลี่ยนเงื่อนไข to see consent invalidated).
4. แคมเปญ → เริ่มแคมเปญ (enabled only when all four activation checks pass).
5. Demo panel → จำลองการจบแคมเปญ → ผลลัพธ์.
6. รีเซ็ตข้อมูลตัวอย่าง restores everything.

## Layout
- `src/domain` pure rules: `matching`, `fairness`, `consent`, `plans`, `campaign-lifecycle`, `calculations` (+ `domain.test.ts`).
- `src/app` reducer (single source of state, persisted to localStorage), selectors, routes.
- `src/data` synthetic merchants, templates, result series.
- `src/features/*` screens; `src/components` shared UI (shadcn in `components/ui`).
