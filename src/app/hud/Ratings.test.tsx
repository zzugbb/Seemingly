import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Ratings } from './Ratings'
import { CompleteBanner } from './CompleteBanner'

describe('精简评价呈现', () => {
  it('缺项与名称在正文可读，空记录也显示三个未获条件', () => {
    const missing = renderToStaticMarkup(<Ratings />)
    for (const name of ['抵达', '全收集', '最少步数']) {
      expect(missing).toContain(`>${name}</span>`)
      expect(missing).toContain(`aria-label="${name}：未获得"`)
    }
    expect(missing).not.toContain('待补')
    const partial = renderToStaticMarkup(<Ratings value={{ done: true, allOrbs: false, parMet: true }} />)
    expect(partial).toContain('aria-label="全收集：未获得"')
    expect(partial).not.toContain('已获</')
    expect(partial).not.toContain('<title>')
    const target = renderToStaticMarkup(<Ratings minimum={8} value={{ done: true, allOrbs: false, parMet: true }} />)
    expect(target).toContain('aria-label="最少 8 步：已获得"')
    expect(target).not.toContain('不用提示')
  })

  it('完成卡只显示本次评价，提示使用只保留简短标记', () => {
    const markup = renderToStaticMarkup(
      <CompleteBanner
        title="换乘"
        ratings={{ done: true, allOrbs: true, parMet: false }}
        usedHint
        steps={12}
        minimum={8}
        unlocked=""
        action="下一关"
        onAction={() => undefined}
        onRetry={() => undefined}
      />,
    )
    expect(markup).toContain('本次结果 · 2/3')
    expect(markup).toContain('本次步数 12 / 最少 8')
    expect(markup).toContain('已用提示')
    expect(markup).toContain('aria-label="最少步数：未获得"')
    expect(markup).not.toContain('历史评价')
    expect(markup).not.toContain('可分次补齐')
    expect(markup).not.toContain('历史最少')
  })
})
