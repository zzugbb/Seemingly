/// <reference lib="webworker" />
import { challengeLevels, mainLevels } from '../game/levels'
import { applyAction, initialState, stateKey, type Action } from '../game/core/rules'
import { buildPolicy } from '../game/core/solver'
import type { HintRequest, HintResponse } from './hints'

const scope = self as unknown as DedicatedWorkerGlobalScope
let policy = new Map<string, Action | null>()
const send = (response: HintResponse) => scope.postMessage(response)
scope.onmessage = ({ data }: MessageEvent<HintRequest>) => {
  try {
    if (data.type === 'hint') {
      send({ type: 'hint', request: data.request, action: policy.get(data.key) ?? null })
      return
    }
    const level = [...mainLevels, ...challengeLevels].find((item) => item.id === data.id)
    if (!level) throw new Error('未知关卡')
    policy = buildPolicy(level)
    let state = initialState(level)
    let minimum = 0
    while (!state.won) {
      const action = policy.get(stateKey(state))
      if (!action) {
        send({ type: 'ready', minimum: null })
        return
      }
      state = applyAction(level, state, action)!.state
      minimum++
    }
    send({ type: 'ready', minimum })
  } catch {
    send({ type: 'error' })
  }
}
