import type { Action } from '../game/core/rules'

export type HintRequest = { type: 'prepare'; id: string } | { type: 'hint'; key: string; request: number }
export type HintResponse =
  | { type: 'ready'; minimum: number | null }
  | { type: 'hint'; request: number; action: Action | null }
  | { type: 'error' }

export function prepareHints(id: string) {
  const worker = new Worker(new URL('./hint.worker.ts', import.meta.url), { type: 'module' })
  let resolveReady: (minimum: number | null) => void
  let rejectReady: (error: Error) => void
  const ready = new Promise<number | null>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })
  const pending = new Map<number, { resolve: (action: Action | null) => void; reject: (error: Error) => void }>()
  let sequence = 0
  let disposed = false
  let failed = false
  const fail = () => {
    failed = true
    const error = new Error('提示暂时不可用')
    rejectReady(error)
    for (const query of pending.values()) query.reject(error)
    pending.clear()
  }
  worker.onmessage = ({ data }: MessageEvent<HintResponse>) => {
    if (data.type === 'ready') resolveReady(data.minimum)
    else if (data.type === 'error') fail()
    else {
      pending.get(data.request)?.resolve(data.action)
      pending.delete(data.request)
    }
  }
  worker.onerror = fail
  worker.postMessage({ type: 'prepare', id } satisfies HintRequest)
  return {
    ready,
    async next(key: string): Promise<Action | null> {
      await ready
      if (disposed || failed) throw new Error('提示已取消')
      const request = sequence++
      return new Promise((resolve, reject) => {
        pending.set(request, { resolve, reject })
        worker.postMessage({ type: 'hint', key, request } satisfies HintRequest)
      })
    },
    dispose() {
      disposed = true
      worker.terminate()
      fail()
    },
  }
}
