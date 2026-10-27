import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, transformWithOxc } from 'vite'

const root = fileURLToPath(new URL('../../', import.meta.url))
assert(
  process.argv.slice(2).every((x) => x === '--runtime'),
  '只支持--runtime',
)
const runtimeMode = process.argv.includes('--runtime')
const sources = new Map(),
  baselines = new Map()
const temporary = await mkdtemp(join(tmpdir(), 'seemingly-challenges-types-'))
try {
  const files = []
  for (let n = 1; n <= 5; n++) {
    const id = `challenge-${n}`,
      text = await readFile(new URL(`./${id}.md`, import.meta.url), 'utf8')
    const code = text.match(/## 完整参考实现\s+```ts\n([\s\S]*?)\n```/)?.[1]
    const baseline = text.match(/## 自动验证基准\s+```json\n([\s\S]*?)\n```/)?.[1]
    assert(code && baseline, `${id} 缺完整代码或基准`)
    const resolved = code
      .replaceAll(/(['"])\.\/builders\1/g, JSON.stringify(root + 'src/game/levels/builders'))
      .replaceAll(/(['"])\.\/types\1/g, JSON.stringify(root + 'src/game/levels/types'))
    sources.set('\0design:' + id, resolved)
    baselines.set(id, JSON.parse(baseline))
    const file = join(temporary, id + '.ts')
    await writeFile(file, resolved)
    files.push(file)
  }
  await promisify(execFile)(root + 'node_modules/.bin/tsc', [
    '--ignoreConfig',
    '--noEmit',
    '--strict',
    '--noUnusedLocals',
    '--noUnusedParameters',
    '--isolatedModules',
    '--module',
    'ESNext',
    '--moduleResolution',
    'bundler',
    '--target',
    'ES2022',
    '--skipLibCheck',
    ...files,
  ])
} finally {
  await rm(temporary, { recursive: true, force: true })
}
const server = await createServer({
  root,
  configFile: false,
  server: { middlewareMode: true, ws: false },
  appType: 'custom',
  plugins: [
    {
      name: 'challenge-design-docs',
      resolveId: (id) => (id.startsWith('design:') ? '\0' + id + '.ts' : null),
      load: async (id) => {
        const code = sources.get(id.endsWith('.ts') ? id.slice(0, -3) : id)
        return code ? (await transformWithOxc(code, 'design.ts')).code : null
      },
      transform: (code, id) =>
        id === root + 'src/game/core/clearance.ts'
          ? code + '\nexport {parts,settledParts,movingParts,intersects,bearingContact,actorIntersects}'
          : null,
    },
  ],
})
try {
  const rules = await server.ssrLoadModule('/src/game/core/rules.ts'),
    solver = await server.ssrLoadModule('/src/game/core/solver.ts'),
    geometry = await server.ssrLoadModule('/src/game/core/clearance.ts'),
    shapes = await server.ssrLoadModule('/src/game/core/shapes.ts'),
    { surfaceY } = await server.ssrLoadModule('/src/game/core/iso.ts')
  const { validateLevel } = await server.ssrLoadModule('/src/game/core/validate.ts'),
    { measureLevel } = await server.ssrLoadModule('/src/game/core/metrics.ts')
  const runtime = await server.ssrLoadModule('/src/game/levels/index.ts'),
    { targets } = await server.ssrLoadModule('/src/game/levels/targets.ts')
  const formalHashes = [
    'ab96d7db7fbc8fc464d85c8953ac372bc842708a72a1c21070fcb73aa049e891',
    'b14e89fca8fbec1a87ca2d2ae7014d4cbf625f5af4ab851dfb2e744ff008465b',
    'ad8fd5cd0792ef95f1c75e329d74725e3012decc6918226b64b237f05f26392c',
    '28de386257c611fc2834adedbfcd60f893b153f81463571babaea84958d6c634',
    'f964d35ee37c17f8e73df2781070089d02f60dc60482c06070dd5eda251e9157',
    '8c2fc796f49c633457c11c770137b1e31a90bcd6121f2800f83804fc54baf82c',
    '1c35ef5bd5df1b750c2651f781d945ed88b2c00b42d6b933557a542b30ccb3a5',
    'ff4803b4ae0951b3df26580ddfed2050ab10b97cd79dcd0f17205693f7860538',
    'ec3731b0236adf98dfb92d2b98ecad5b3466913ae56988c1855da4a121be5db4',
    '8f13e947b7a512e840404503f7936073b944ebf095087811c21e064a7fe38df7',
    'dc74c17f256426d3f7738898c9cc627331cb69a3e6ad64953987c4f7be8fe8b3',
    '41d776fb20f7801d3f3fa9ea4e9b4a73866bc28384f381428254a17c5d33a262',
    '20fa4d93230038a3bc3e4f53e9c853c850798acce56d0e112ea383b45f43580b',
    'bd33e76458282396cc05bfe81f04581203d6c3706b0971f2f6103c6057639856',
    'ca75b5e59d99ca055bb4dd549ef6755969850bb9a889e3a99056fe207c51181d',
  ]
  assert.deepEqual(
    runtime.mainLevels.map((l) => createHash('sha256').update(JSON.stringify(l)).digest('hex')),
    formalHashes,
    '十五关完整对象不能漂移',
  )
  if (runtimeMode) assert.equal(runtime.challengeLevels.length, 5, '正式挑战必须包含五关')
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify(runtime.mainLevels.map((l) => targets[l.id])))
      .digest('hex'),
    '85dde878c51eee6f3b996fd11b9f6443da2d06dbd55554cb25a79e4550963dd6',
    '十五关targets不能漂移',
  )
  if (runtimeMode)
    assert.deepEqual(
      runtime.challengeLevels.map((l) => l.id),
      [...baselines.keys()],
      '挑战顺序不能漂移',
    )
  for (const [id, baseline] of baselines) {
    const documented = (await server.ssrLoadModule('design:' + id)).default
    const level = runtimeMode ? runtime.challengeLevels.find((l) => l.id === id) : documented
    if (runtimeMode) {
      assert.deepEqual(level, documented, `${id}正式对象漂移`)
      assert.deepEqual(targets[id], baseline.target)
    }
    assert.equal(level.id, id)
    assert.equal(level.chapter, Number(id.at(-1)))
    assert.equal(level.challenge, true)
    assert.equal(level.revision, 1)
    assert.equal(level.soundtrack, 'courtyard')
    assert.equal(level.ending, undefined)
    const started = performance.now()
    solver.analyze(level)
    const coldMs = performance.now() - started
    assert(coldMs < 2000, `${id}冷求解${coldMs.toFixed(0)}ms超过两秒`)
    assert.deepEqual(validateLevel(level, new Set(), baseline.target), [], `${id}结构及难度校验`)
    assert.deepEqual(measureLevel(level, 80), baseline.metrics, `${id}指标漂移`)
    assert(baseline.metrics.minActions >= 16 && baseline.metrics.minActions <= 30)
    assert(baseline.metrics.reachableStates >= 150 && baseline.metrics.reachableStates <= 100000)
    assert.equal(baseline.all.length, baseline.metrics.minActionsAll)
    assert.deepEqual(validateLevel({ ...level, solution: baseline.all }), [], `${id}全收集解法`)
    replay(level, level.solution, rules, false)
    replay(level, baseline.all, rules, true)
    assert(level.decor.islands.length >= 2 && level.decor.islands.length <= 4)
    const decor =
      level.decor.trees.length +
      level.decor.flowers.length +
      level.decor.windows.length +
      (level.decor.lanterns?.length ?? 0)
    assert(decor >= 3 && decor <= 6)
    if (level.chapter === 1)
      assert(
        level.mechanisms.every((m) => m.type === 'rotator' && !m.links?.length) &&
          !level.crates?.length &&
          !level.patrols?.length,
      )
    if (level.chapter <= 2)
      assert(
        level.mechanisms.every((m) => ['rotator', 'mover'].includes(m.type) && !m.links?.length) &&
          !level.crates?.length &&
          !level.patrols?.length,
      )
    if (level.chapter <= 3)
      assert(
        !level.crates?.length &&
          !level.patrols?.length &&
          level.blocks.every((b) => !b.oneWay) &&
          level.mechanisms.every((m) => m.type !== 'plate' || m.mode !== 'hold'),
      )
    if (level.chapter <= 4) assert(!level.patrols?.length)
    const net =
      level.chapter <= 2
        ? geometry.checkMotionClearance(level)
        : checkBuildings(level, { rules, solver, geometry, shapes, surfaceY })
    assert.deepEqual(net.issues, [], `${id}181姿态离散净空`)
    assert.deepEqual(net, baseline.clearance)
    const checks = facts(level, rules, solver)
    assert.deepEqual(checks, baseline.counterfactuals, `${id}阶段依赖或恢复边界漂移`)
    assert.equal(checks.unsafe1, 0)
    assert.equal(checks.unsafe2, 0)
    for (const [name, value] of Object.entries(checks.blocked))
      assert.equal(value, level.chapter === 1 && name === 'middleBeforeFar' ? 27 : null, `${id}反事实${name}`)
    if (level.chapter >= 2) assert.equal(checks.scheduleAll, null, '选做必须改变操作安排，不能只在主线插行走')
    console.log(
      id,
      JSON.stringify({
        coldMs: Math.round(coldMs),
        ...baseline.metrics,
        clearance: { ...net, issues: net.issues.length },
        counterfactuals: checks,
      }),
    )
  }
} finally {
  await server.close()
}
function replay(level, steps, rules, all) {
  let state = rules.initialState(level)
  for (const step of steps) {
    const action =
      step.type === 'walk'
        ? {
            type: 'walk',
            tileId: [...rules.tilesOf(level, state).values()].find((t) => t.pos.join(',') === step.to.join(','))?.id,
          }
        : step
    const tr = action.tileId === undefined && action.type === 'walk' ? null : rules.applyAction(level, state, action)
    assert(tr, `非法解法${JSON.stringify(step)}`)
    state = tr.state
  }
  assert(state.won)
  if (all) assert.equal(state.orbs.length, level.orbs.length)
}

function facts(level, rules, solver) {
  const { initialState, legalActions, applyAction, stateKey, tilesOf } = rules
  const nodes = [{ state: initialState(level), edges: [], depth: 0, prev: -1, action: null }],
    indices = new Map([[stateKey(nodes[0].state), 0]])
  for (let i = 0; i < nodes.length; i++)
    for (const action of legalActions(level, nodes[i].state)) {
      const tr = applyAction(level, nodes[i].state, action)
      const key = stateKey(tr.state)
      let to = indices.get(key)
      if (to === undefined) {
        to = nodes.length
        indices.set(key, to)
        nodes.push({ state: tr.state, edges: [], depth: nodes[i].depth + 1, prev: i, action })
      }
      nodes[i].edges.push({ action, to })
    }
  const distance = (all = false, allow = () => true) => {
    const q = [{ at: 0, depth: 0 }],
      seen = new Set([0])
    for (let i = 0; i < q.length; i++) {
      const { at, depth } = q[i],
        node = nodes[at]
      if (node.state.won && (!all || node.state.orbs.length === level.orbs.length)) return depth
      for (const edge of node.edges) {
        if (seen.has(edge.to) || !allow(node.state, edge.action, nodes[edge.to].state)) continue
        seen.add(edge.to)
        q.push({ at: edge.to, depth: depth + 1 })
      }
    }
    return null
  }
  const scheduleDistance = (all) => {
    const schedule = level.solution.filter((a) => a.type !== 'walk').map((a) => JSON.stringify(a))
    const q = [{ at: 0, phase: 0, depth: 0 }],
      seen = new Set(['0/0'])
    for (let i = 0; i < q.length; i++) {
      const { at, phase, depth } = q[i]
      if (
        nodes[at].state.won &&
        phase === schedule.length &&
        (!all || nodes[at].state.orbs.length === level.orbs.length)
      )
        return depth
      for (const e of nodes[at].edges) {
        let next = phase
        if (e.action.type !== 'walk') {
          if (JSON.stringify(e.action) !== schedule[phase]) continue
          next++
        }
        const key = e.to + '/' + next
        if (!seen.has(key)) {
          seen.add(key)
          q.push({ at: e.to, phase: next, depth: depth + 1 })
        }
      }
    }
    return null
  }
  const incoming = nodes.map(() => []),
    dist = nodes.map(() => -1),
    q = []
  nodes.forEach((node, i) => {
    node.edges.forEach((e) => incoming[e.to].push(i))
    if (node.state.won) {
      dist[i] = 0
      q.push(i)
    }
  })
  for (let i = 0; i < q.length; i++)
    for (const prev of incoming[q[i]])
      if (dist[prev] < 0) {
        dist[prev] = dist[q[i]] + 1
        q.push(prev)
      }
  const policy = solver.buildPolicy(level)
  nodes.forEach((node, i) => {
    const hint = policy.get(stateKey(node.state))
    if (node.state.won || dist[i] < 0) assert.equal(hint, null)
    else {
      assert(hint)
      assert(
        node.edges.some((e) => JSON.stringify(e.action) === JSON.stringify(hint) && dist[e.to] === dist[i] - 1),
        '提示必须减少获胜距离',
      )
    }
  })
  const path = (index) => {
    const route = []
    for (; nodes[index].prev >= 0; index = nodes[index].prev) route.push(nodes[index].action)
    let st = nodes[0].state
    return route.reverse().map((a) => {
      const step = a.type === 'walk' ? { type: 'walk', to: tilesOf(level, st).get(a.tileId).pos } : a
      st = applyAction(level, st, a).state
      return step
    })
  }
  const dead = nodes.findIndex((node, i) => !node.state.won && dist[i] < 0)
  const first = nodes[0].edges
  const second = first.flatMap((e) => nodes[e.to].edges)
  const out = {
    first: first.length,
    second: second.length,
    unsafe1: first.filter((e) => dist[e.to] < 0).length,
    unsafe2: second.filter((e) => dist[e.to] < 0).length,
    badPath: dead < 0 ? null : path(dead),
    scheduleAll: scheduleDistance(true),
    blocked: {},
  }
  if (dead >= 0) assert(dist[nodes[dead].prev] >= 0, '最短误操作撤销一次应回到有解状态')
  const n = level.chapter
  if (n === 1) {
    out.blocked.middleBeforeFar = distance(false, (a, b, c) => !(!a.orbs.includes('orb-1') && c.orbs.includes('orb-2')))
    for (const id of ['west', 'middle', 'far'])
      out.blocked['no-' + id] = distance(false, (_, a) => a.type !== 'operate' || a.mechanism !== id)
  }
  if (n === 2) {
    out.blocked.noSecondEnd = distance(
      true,
      (a, b) => b.type !== 'operate' || b.mechanism !== 'shuttle' || a.at !== 'shuttle#1',
    )
    out.blocked.noShuttle = distance(false, (_, a) => a.type !== 'operate' || a.mechanism !== 'shuttle')
  }
  if (n === 3)
    for (const id of ['pair', 'relay'])
      out.blocked['no-' + id] = distance(false, (_, a) => a.type !== 'operate' || a.mechanism !== id)
  if (n === 4) {
    for (const [name, pos, all] of [
      ['no-middle', '8,2,5', false],
      ['no-home', '9,3,7', false],
      ['no-bonus', '7,2,5', true],
    ])
      out.blocked[name] = distance(all, (_, a, b) => b.crates['crate-0'] !== pos)
    out.blocked.noArchive = distance(false, (_, a, b) => !b.spentPlates.includes('archive'))
    out.winsArchived = nodes
      .filter((x) => x.state.won)
      .every((x) => x.state.spentPlates.includes('archive') && x.state.crates['crate-0'] === '9,3,7')
  }
  if (n === 5) {
    for (const [name, pos, all] of [
      ['no-home', '6,2,4', false],
      ['no-far', '13,2,3', false],
      ['no-bonus', '15,3,4', true],
    ])
      out.blocked[name] = distance(all, (_, a, b) => b.crates['crate-0'] !== pos)
    out.blocked.noPatrolHome = distance(false, (_, a, b) => b.patrols['patrol-0'].index !== 2)
    out.winsBoxHome = nodes.filter((x) => x.state.won).every((x) => x.state.crates['crate-0'] === '6,2,4')
  }
  return out
}

function checkBuildings(level, { rules, solver, geometry, shapes, surfaceY }) {
  const { parts, settledParts, movingParts: forwardParts, intersects, bearingContact, actorIntersects } = geometry
  const movingParts = (m, state, next, t) =>
    forwardParts(
      m,
      state,
      next,
      m.type === 'rotator' && (next.rotator[m.id] - state.rotator[m.id] + 4) % 4 === 3 ? -t : t,
    )
  const { islandLayers, CHARACTER_HEIGHT, advanceBrace, braceScale } = shapes
  const { applyAction, legalActions, tilesOf, gatesOf } = rules
  const mechanisms = level.mechanisms.filter((m) => m.type === 'rotator' || m.type === 'mover')
  const staticParts = level.blocks.flatMap((b) =>
    parts(b.pos.join(','), b.pos, b.kind === 'path').map((p) => ({ ...p, staticBlock: true })),
  )
  const rocks = level.decor.islands.flatMap((island, i) =>
    islandLayers(island).map((layer, j) => ({
      id: `island-${i}#${j}`,
      pos: layer.position,
      angle: 0,
      half: layer.size.map((v) => v / 2 - 0.08),
      radius: 0.08,
    })),
  )
  const bases = mechanisms
    .filter((m) => m.type === 'rotator')
    .map((m) => ({
      id: `${m.id}/base`,
      pos: [m.pivot[0], m.pivot[1] - 0.55, m.pivot[2]],
      angle: 0,
      half: [1.214, 0.034, 1.214],
      radius: 0.001,
    }))
  // 0.76高包络含箱子上角饰；箱子本体保持世界朝向，与现有cratePose一致。
  const crateBox = (id, pos) => ({
    id,
    pos: [pos[0], surfaceY(pos[1]) + 0.38, pos[2]],
    angle: 0,
    half: [0.3, 0.32, 0.3],
    radius: 0.06,
  })
  const gateBoxes = (state) =>
    level.mechanisms.flatMap((g) => {
      if (g.type !== 'gate') return []
      const y = surfaceY(g.tile[1]) - (gatesOf(level, state)[g.id] ? 0.62 : 0)
      const box = (suffix, pos, half, radius) => ({ id: `${g.id}/${suffix}`, pos, half, radius, angle: 0 })
      return [
        box('post-a', [g.tile[0] - 0.3, y + 0.275, g.tile[2]], [0.035, 0.275, 0.035], 0.001),
        box('post-b', [g.tile[0] + 0.3, y + 0.275, g.tile[2]], [0.035, 0.275, 0.035], 0.001),
        box('bar', [g.tile[0], y + 0.48, g.tile[2]], [0.315, 0.04, 0.015], 0.025),
        ...(g.mode === 'hold'
          ? [box('dot', [g.tile[0], y + 0.48, g.tile[2] + 0.05], [0.001, 0.001, 0.001], 0.04)]
          : []),
      ]
    })
  const structural = new Set(),
    characters = new Set(),
    issues = []
  const samples = 181
  for (const state of solver.reachableStates(level))
    for (const action of legalActions(level, state)) {
      const transition = applyAction(level, state, action)
      const active = mechanisms.filter((m) => transition.moved.includes(m.id))
      if (!active.length) continue

      const next = transition.state
      assert(
        active.every(
          (m) => m.type !== 'rotator' || [1, 3].includes((next.rotator[m.id] - state.rotator[m.id] + 4) % 4),
        ),
        '只接受一次正向或反向90度',
      )
      for (const mechanism of active) {
        const end = movingParts(mechanism, state, next, 1)
        const settled = settledParts(mechanism, next)
        assert.equal(end.length, settled.length)
        end.forEach((part, index) => {
          assert.equal(part.id, settled[index].id)
          assert(
            part.pos.every((value, axis) => Math.abs(value - settled[index].pos[axis]) < 1e-8),
            '正反运动末姿态必须与规则一致',
          )
        })
      }
      const activeIds = new Set(active.map((m) => m.id))
      const key = JSON.stringify([state.rotator, state.mover, state.crates, gatesOf(level, state), [...activeIds]])
      const actorKey = `${key}/${next.at}/${JSON.stringify(state.patrols)}`
      const structure = !structural.has(key),
        actor = !characters.has(actorKey)
      if (!structure && !actor) continue
      structural.add(key)
      characters.add(actorKey)
      const tiles = tilesOf(level, state),
        nextTiles = tilesOf(level, next)
      const fixed = [
        ...staticParts,
        ...rocks,
        ...bases,
        ...mechanisms.filter((m) => !activeIds.has(m.id)).flatMap((m) => settledParts(m, state)),
        ...gateBoxes({ ...next, patrols: state.patrols }),
      ]
      const ridingCrates = Object.entries(state.crates).filter(([, at]) =>
        active.some((m) => at.startsWith(`${m.id}#`)),
      )
      for (const [id, at] of Object.entries(state.crates))
        if (!ridingCrates.some(([cid]) => cid === id)) fixed.push(crateBox(id, tiles.get(at).pos))
      const patrols = Object.entries(rules.patrolTilesOf(level, state))
      let structureHit = false,
        actorHit = false
      for (let i = 0; i < samples; i++) {
        const fraction = i / (samples - 1)
        const durations = active.map((m) =>
          m.type === 'rotator'
            ? 0.9
            : Math.abs(m.stops[next.mover[m.id].stopIndex] - m.stops[state.mover[m.id].stopIndex]) * 0.45,
        )
        const elapsedTime =
          (fraction < 0.5 ? Math.cbrt(fraction / 4) : 1 - Math.cbrt((1 - fraction) / 4)) * Math.max(...durations)
        const groups = active.map((m, j) => {
          const t = Math.min(1, elapsedTime / durations[j])
          const progress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          return { m, boxes: movingParts(m, state, next, progress) }
        })
        const moving = groups.flatMap((p) => p.boxes)
        const crates = ridingCrates.map(([id, at]) => crateBox(id, moving.find((b) => b.id === at).pos))
        const issue = (object, obstacle) =>
          issues.push({ mechanism: [...activeIds].join('+'), fraction, object, obstacle })
        if (structure && !structureHit) {
          for (const { m, boxes } of groups) {
            for (const box of boxes) {
              const hit = [
                ...fixed.filter((b) => b.id !== `${m.id}/base`),
                ...groups.filter((p) => p.m !== m).flatMap((p) => p.boxes),
              ].find((b) => !bearingContact(m, box, b) && intersects(box, b))
              if (hit) {
                issue(box.id, hit.id)
                structureHit = true
                break
              }
            }
            if (structureHit) break
          }
          for (const box of crates) {
            const hit = [...fixed, ...moving, ...crates.filter((c) => c !== box)].find((b) => intersects(box, b))
            if (hit) {
              issue(box.id, hit.id)
              structureHit = true
              break
            }
          }
        }
        if (actor && !actorHit) {
          for (const [id, at] of patrols) {
            const ride = active.find((m) => at.startsWith(`${m.id}#`))
            const pos = ride ? moving.find((b) => b.id === at).pos : nextTiles.get(at).pos
            const body = {
              id,
              pos: [pos[0], surfaceY(pos[1]) + 0.220001, pos[2]],
              half: [0.000001, 0.000001, 0.000001],
              radius: 0.22,
              angle: 0,
            }
            const hit = [...fixed, ...moving.filter((b) => b.id !== at && b.id !== `${at}/slab`), ...crates].find((b) =>
              intersects(body, b),
            )
            if (hit) {
              issue(id, hit.id)
              actorHit = true
              break
            }
          }

          const ride = active.find((m) => next.at.startsWith(`${m.id}#`))
          const pos = ride ? moving.find((b) => b.id === next.at).pos : nextTiles.get(next.at).pos
          const elapsed = elapsedTime
          const height = CHARACTER_HEIGHT * (i === samples - 1 ? 1 : braceScale(advanceBrace(0, true, elapsed)))
          const obstacles = ride
            ? [...fixed, ...moving.filter((b) => b.id !== next.at && b.id !== `${next.at}/slab`), ...crates]
            : [...moving, ...crates]
          const hit = obstacles.find((b) => actorIntersects(pos, height, b))
          if (hit) {
            issue(`character@${next.at}`, hit.id)
            actorHit = true
          }
        }
      }
    }
  return { structuralTransitions: structural.size, characterTransitions: characters.size, samples, issues }
}
