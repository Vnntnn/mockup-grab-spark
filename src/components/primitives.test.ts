import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { formatGuaranteeBaht } from './primitives-data'
import { EmptyArt } from './visual'

describe('Primitives and formatting helpers', () => {
  it('formats baht amounts with tabular figures format', () => {
    expect(formatGuaranteeBaht(0)).toBe('฿ 0 บาท')
    expect(formatGuaranteeBaht(1500)).toBe('฿ 1,500 บาท')
  })

  it('renders distinct custom SVG empty state illustrations for bond, plans, campaigns, and results', () => {
    const bond = renderToStaticMarkup(createElement(EmptyArt, { kind: 'bond' }))
    const plans = renderToStaticMarkup(createElement(EmptyArt, { kind: 'plans' }))
    const campaigns = renderToStaticMarkup(createElement(EmptyArt, { kind: 'campaigns' }))
    const results = renderToStaticMarkup(createElement(EmptyArt, { kind: 'results' }))
    expect(new Set([bond, plans, campaigns, results]).size).toBe(4)
  })
})
