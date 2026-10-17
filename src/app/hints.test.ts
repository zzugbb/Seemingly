import { afterEach, expect, it, vi } from 'vitest'
import { prepareHints, type HintRequest, type HintResponse } from './hints'

class WorkerStub {
  static latest: WorkerStub
  requests: HintRequest[] = []
  onmessage: ((event: { data: HintResponse }) => void) | null = null
  onerror: (() => void) | null = null
  terminate = vi.fn()
  constructor() {
    WorkerStub.latest = this
  }
  postMessage(request: HintRequest) {
    this.requests.push(request)
  }
  send(data: HintResponse) {
    this.onmessage?.({ data })
  }
}
afterEach(() => vi.unstubAllGlobals())
it('策略尚未就绪时排队，完成后按请求编号交付提示', async () => {
  vi.stubGlobal('Worker', WorkerStub)
  const hints = prepareHints('level-00'),
    worker = WorkerStub.latest
  const first = hints.next('state-a'),
    second = hints.next('state-b')
  expect(worker.requests).toEqual([{ type: 'prepare', id: 'level-00' }])
  worker.send({ type: 'ready', minimum: 3 })
  await expect(hints.ready).resolves.toBe(3)
  await Promise.resolve()
  expect(worker.requests.slice(1)).toEqual([
    { type: 'hint', key: 'state-a', request: 0 },
    { type: 'hint', key: 'state-b', request: 1 },
  ])
  worker.send({ type: 'hint', request: 1, action: null })
  worker.send({ type: 'hint', request: 0, action: { type: 'operate', mechanism: 'turn' } })
  await expect(first).resolves.toEqual({ type: 'operate', mechanism: 'turn' })
  await expect(second).resolves.toBeNull()
  hints.dispose()
})
it('离开关卡时终止计算并取消未完成的请求', async () => {
  vi.stubGlobal('Worker', WorkerStub)
  const hints = prepareHints('level-00')
  const ready = expect(hints.ready).rejects.toThrow()
  const query = expect(hints.next('state')).rejects.toThrow()
  hints.dispose()
  await Promise.all([ready, query])
  expect(WorkerStub.latest.terminate).toHaveBeenCalledOnce()
})
it('后台线程失败后拒绝当前及后续请求，不会永久等待', async () => {
  vi.stubGlobal('Worker', WorkerStub)
  const hints = prepareHints('level-00'),
    worker = WorkerStub.latest
  worker.send({ type: 'ready', minimum: 1 })
  await hints.ready
  const query = hints.next('state')
  await Promise.resolve()
  const rejected = expect(query).rejects.toThrow()
  worker.onerror?.()
  await rejected
  await expect(hints.next('state')).rejects.toThrow()
  hints.dispose()
})
