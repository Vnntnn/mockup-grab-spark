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

  it('applies size classes for sm, md, lg variants', () => {
    const smHtml = renderToString(React.createElement(DishSvgArt, { slug: 'khao-man-gai-tom', size: 'sm' }))
    const mdHtml = renderToString(React.createElement(DishSvgArt, { slug: 'khao-man-gai-tom', size: 'md' }))
    const lgHtml = renderToString(React.createElement(DishSvgArt, { slug: 'khao-man-gai-tom', size: 'lg' }))

    expect(smHtml).toContain('w-24')
    expect(mdHtml).toContain('max-w-sm')
    expect(lgHtml).toContain('max-w-md')
  })

  it('merges custom className on wrapper', () => {
    const html = renderToString(
      React.createElement(DishSvgArt, { slug: 'moo-satay-10', className: 'custom-art-class' }),
    )
    expect(html).toContain('custom-art-class')
  })
})
