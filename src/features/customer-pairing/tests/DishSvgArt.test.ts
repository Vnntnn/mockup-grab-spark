import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { DishSvgArt } from '../components/DishSvgArt'

describe('DishSvgArt component', () => {
  const dishes = [
    'khao-man-gai-tom',
    'khao-man-gai-tod',
    'khao-na-gai',
    'moo-satay-10',
    'gai-yang',
    'peek-gai-tod',
  ]

  it.each(dishes)('renders valid SVG and unconditionally includes [ภาพจำลอง] for %s', (slug) => {
    const html = renderToString(React.createElement(DishSvgArt, { slug }))
    expect(html).toContain('<svg')
    expect(html).toContain('ภาพจำลอง')
  })

  it('draws what the name promises: "หมูสะเต๊ะ 10 ไม้" shows exactly ten sticks', () => {
    const html = renderToString(React.createElement(DishSvgArt, { slug: 'moo-satay-10' }))
    expect(html.match(/fill="#d8b07a"/g)?.length).toBe(10)
  })

  it('hides SVG from screen readers when paired with visible text', () => {
    const html = renderToString(React.createElement(DishSvgArt, { slug: 'moo-satay-10' }))
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/)
  })

  it('provides accessible label when rendered standalone', () => {
    const html = renderToString(
      React.createElement(DishSvgArt, {
        slug: 'moo-satay-10',
        standaloneLabel: 'ภาพประกอบหมูสะเต๊ะ (ภาพจำลอง)',
      }),
    )
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="ภาพประกอบหมูสะเต๊ะ (ภาพจำลอง)"')
    expect(html).not.toMatch(/<svg[^>]*aria-hidden="true"/)
  })

  it.each(dishes)('contains zero emojis in the output for %s', (slug) => {
    const html = renderToString(React.createElement(DishSvgArt, { slug }))
    expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
  })

  it('renders fallback art gracefully for unknown slug', () => {
    const html = renderToString(React.createElement(DishSvgArt, { slug: 'unknown-dish' }))
    expect(html).toContain('<svg')
    expect(html).toContain('ภาพจำลอง')
  })

  it('renders a bare plate with the simulation caption as a figcaption, kept in the accessibility tree', () => {
    const html = renderToString(React.createElement(DishSvgArt, { slug: 'khao-man-gai-tom' }))
    expect(html).toMatch(/<figure[^>]*>.*<figcaption[^>]*>ภาพจำลอง<\/figcaption>/)
    expect(html).not.toMatch(/<figcaption[^>]*aria-hidden/)
    expect(html).not.toContain('bg-[#ede5d8]') // no tile behind the plate
  })

  it('merges custom className on wrapper', () => {
    const html = renderToString(
      React.createElement(DishSvgArt, { slug: 'moo-satay-10', className: 'custom-art-class' }),
    )
    expect(html).toContain('custom-art-class')
  })
})
