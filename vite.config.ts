import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // every JSX element goes through src/i18n/jsx-runtime so Thai text can be shown in English at render.
  // A root-relative path (not '@/i18n') keeps Vite from pre-bundling the runtime as a dependency, which would give it its own copy of the language state.
  plugins: [react({ jsxImportSource: '/src/i18n' }), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: { include: ['src/**/*.test.ts'] },
})
