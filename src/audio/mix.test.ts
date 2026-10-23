import { describe, expect, it } from 'vitest'
import { feedbackFocus, focusValue, nextFocus, FOCUS_ATTACK } from './mix'

describe('反馈音的背景让位', () => {
  it('脚步不触发让位，关键反馈比普通机关保留更清晰的窗口', () => {
    expect(feedbackFocus('step')).toBeNull()
    expect(feedbackFocus('patrol')).toBeNull()
    expect(feedbackFocus('orb')!.gain).toBeLessThan(feedbackFocus('mechanism')!.gain)
    expect(feedbackFocus('lantern')!.gain).toBeLessThan(feedbackFocus('orb')!.gain)
    expect(feedbackFocus('seal')!.hold).toBeGreaterThan(5.35)
  })
  it('攻击和恢复连续，结束后回到完整背景音量', () => {
    const focus = nextFocus(undefined, feedbackFocus('orb')!, 10)
    expect(focusValue(focus, 10)).toBe(1)
    expect(focusValue(focus, 10 + FOCUS_ATTACK / 2)).toBeCloseTo((1 + focus.target) / 2)
    expect(focusValue(focus, 10 + FOCUS_ATTACK)).toBeCloseTo(focus.target)
    expect(focusValue(focus, focus.holdUntil)).toBe(focus.target)
    expect(focusValue(focus, (focus.holdUntil + focus.releaseUntil) / 2)).toBeCloseTo((1 + focus.target) / 2)
    expect(focusValue(focus, focus.releaseUntil + 1)).toBe(1)
  })
  it('重叠收光不叠乘，轻反馈不提前解除点灯让位', () => {
    const first = nextFocus(undefined, feedbackFocus('lantern')!, 0)
    const next = nextFocus(first, feedbackFocus('gate')!, 0.3)
    expect(next.from).toBe(first.target)
    expect(next.target).toBe(first.target)
    expect(next.holdUntil).toBeGreaterThanOrEqual(first.holdUntil)
    expect(next.releaseUntil).toBeGreaterThanOrEqual(first.releaseUntil)
    let focus = nextFocus(undefined, feedbackFocus('orb')!, 0)
    for (let i = 1; i <= 20; i++) focus = nextFocus(focus, feedbackFocus('orb')!, i / 10)
    expect(focus.target).toBe(feedbackFocus('orb')!.gain)
    expect(focusValue(focus, focus.releaseUntil)).toBe(1)
  })
  it('恢复中的新反馈从当前值接续，已取消的让位不会沿用旧强度', () => {
    const old = nextFocus(undefined, feedbackFocus('lantern')!, 0)
    const at = (old.holdUntil + old.releaseUntil) / 2
    const continued = nextFocus(old, feedbackFocus('turn')!, at)
    expect(continued.from).toBeCloseTo(focusValue(old, at))
    expect(focusValue(continued, at)).toBeCloseTo(focusValue(old, at))
    const cancelled = nextFocus(undefined, feedbackFocus('turn')!, at, 0.8)
    expect(cancelled.from).toBe(0.8)
    expect(cancelled.target).toBe(feedbackFocus('turn')!.gain)
  })
})
