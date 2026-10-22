import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Ratings } from './Ratings'
import { CompleteBanner } from './CompleteBanner'

describe('评价含义与本次／历史区分', () => {
  it('缺项与名称在正文可读，空记录也显示三个未获条件', () => {
    const missing = renderToStaticMarkup(<Ratings />)
    for (const name of ['抵达', '全收集', '最少步数']) {
      expect(missing).toContain(`>${name}</span>`)
      expect(missing).toContain(`aria-label="${name}：未获得"`)
    }
    expect(missing.match(/>待补</g)).toHaveLength(3)
    const partial = renderToStaticMarkup(<Ratings value={{ done: true, allOrbs: false, parMet: true }} />)
    expect(partial).toContain('aria-label="全收集：未获得"')
    expect(partial.match(/>已获</g)).toHaveLength(2)
    expect(partial).not.toContain('<title>')
  })

  it('使用提示的本次 2/3 与历史 3/3 同时展示，不把历史最少当成步数评价', () => {
    const markup = renderToStaticMarkup(
      <CompleteBanner
        title="换乘"
        ratings={{ done: true, allOrbs: true, parMet: false }}
        history={{ done: true, allOrbs: true, parMet: true, bestSteps: 8 }}
        usedHint
        steps={12}
        minimum={8}
        unlocked=""
        action="下一关"
        onAction={() => undefined}
        onRetry={() => undefined}
      />,
    )
    const [current, history] = markup.split('aria-label="历史成绩"')
    expect(current).toContain('本次结果 · 2/3')
    expect(current).toContain('本次步数 12 / 最少 8')
    expect(current).toContain('本局用过提示，未获本次最少步数评价。')
    expect(current).toContain('aria-label="最少步数：未获得"')
    expect(history).toContain('历史成绩 · 累计 3/3')
    expect(history).toContain('aria-label="最少步数：已获得"')
    expect(history).toContain('历史最少 8 步（含使用提示的局次）')
  })
})
