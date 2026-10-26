import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { mainLevels } from '../game/levels'
import { Scene } from '../game/render/Scene'
import { qualitySettings } from '../game/render/quality'
import { canShareJourney, journeyStats, shareJourney, type JourneyStats } from './journey'
import { JOURNEY_WIDTH, SCENE_HEIGHT, journeyImage, journeyScene } from './journey-image'
import { useApp } from './store'

const filename = '积木错位-旅程成绩.png'
const settings = qualitySettings('high')
const noop = () => undefined

class ImageBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function Capture({
  stats,
  onImage,
  onError,
}: {
  stats: JourneyStats
  onImage: (blob: Blob) => void
  onError: () => void
}) {
  const frames = useRef(0)
  const active = useRef(true)
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    active.current = true
    gl.domElement.addEventListener('webglcontextlost', onError)
    return () => {
      active.current = false
      gl.domElement.removeEventListener('webglcontextlost', onError)
    }
  }, [gl, onError])
  useFrame(({ scene, camera }) => {
    gl.render(scene, camera)
    if (++frames.current !== 4) return
    // 在绘制的同一帧复制像素，不要求游戏画布保留绘制缓冲。
    void journeyImage(gl.domElement, stats)
      .then((blob) => {
        if (active.current) onImage(blob)
      })
      .catch(() => {
        if (active.current) onError()
      })
  }, 1)
  return null
}

function JourneyScene({
  stats,
  onImage,
  onError,
}: {
  stats: JourneyStats
  onImage: (blob: Blob) => void
  onError: () => void
}) {
  const level = mainLevels[mainLevels.length - 1]!
  const sim = useMemo(() => journeyScene(level), [level])
  return (
    <div className="journey-render" aria-hidden="true" style={{ width: JOURNEY_WIDTH, height: SCENE_HEIGHT }}>
      <Canvas
        orthographic
        shadows
        dpr={1}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [30, 30, 30], zoom: 40 }}
      >
        <Scene
          level={level}
          sim={sim}
          interactive={false}
          snapshot
          quality={settings}
          reducedMotion
          onWon={noop}
          onBlocked={noop}
        />
        <Capture stats={stats} onImage={onImage} onError={onError} />
      </Canvas>
    </div>
  )
}

export default function JourneyDialog({ onClose }: { onClose: () => void }) {
  const [stats] = useState(() => journeyStats(useApp.getState().save))
  const [image, setImage] = useState<{ url: string; file: File } | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [sharing, setSharing] = useState(false)
  const [notice, setNotice] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const active = useRef(true)
  const url = useRef<string | null>(null)
  const onError = useMemo(
    () => () => {
      if (active.current) setFailed(true)
    },
    [],
  )
  const onImage = useMemo(
    () => (blob: Blob) => {
      if (!active.current) return
      const file = new File([blob], filename, { type: 'image/png' })
      const next = URL.createObjectURL(blob)
      if (url.current) URL.revokeObjectURL(url.current)
      url.current = next
      setImage({ url: next, file })
    },
    [],
  )

  useEffect(() => {
    active.current = true
    const previous = document.activeElement
    const element = dialog.current
    element?.showModal()
    close.current?.focus()
    return () => {
      active.current = false
      element?.close()
      if (url.current) URL.revokeObjectURL(url.current)
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])
  useEffect(() => {
    if (image || failed) return
    const timeout = window.setTimeout(onError, 12000)
    return () => window.clearTimeout(timeout)
  }, [image, failed, attempt, onError])

  const share = async () => {
    if (!image || sharing) return
    setSharing(true)
    const result = await shareJourney(image.file)
    if (!active.current) return
    setSharing(false)
    setNotice(result === 'failed' ? '暂时无法分享，可长按图片保存，或选择保存 PNG。' : '')
  }
  const description = `${stats.milestone}。主线 ${stats.mainDone}/${stats.mainCount}，挑战 ${stats.challengeDone}/${stats.challengeCount}。历史评价 ${stats.earned}/${stats.ratingMax}：抵达 ${stats.done}/${stats.count}，全收集 ${stats.allOrbs}/${stats.count}，最少步数 ${stats.parMet}/${stats.count}。`

  return createPortal(
    <dialog
      ref={dialog}
      className="journey-dialog"
      aria-labelledby="journey-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key !== 'Tab') return
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]'))
        const first = items[0]
        const last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
    >
      <div className="journey-heading">
        <h2 id="journey-title">旅程成绩</h2>
        <button ref={close} type="button" onClick={onClose}>
          关闭
        </button>
      </div>
      <div className="journey-body" aria-busy={!image && !failed}>
        {image ? (
          <img className="journey-image" src={image.url} alt={description} width={1080} height={2100} />
        ) : failed ? (
          <div className="journey-pending">
            <p role="alert">成绩卡暂时无法生成，游玩进度已保留。</p>
            <button
              type="button"
              onClick={() => {
                setFailed(false)
                setAttempt((value) => value + 1)
              }}
            >
              重新生成
            </button>
          </div>
        ) : (
          <>
            <p className="journey-pending" role="status">
              正在生成成绩卡…
            </p>
            <ImageBoundary key={attempt} onError={onError}>
              <JourneyScene stats={stats} onImage={onImage} onError={onError} />
            </ImageBoundary>
          </>
        )}
      </div>
      <div className="journey-footer">
        <div className="journey-actions">
          {image && canShareJourney(image.file) && (
            <button type="button" disabled={sharing} onClick={() => void share()}>
              {sharing ? '正在分享…' : '分享图片'}
            </button>
          )}
          {image && (
            <a href={image.url} download={filename}>
              保存 PNG
            </a>
          )}
        </div>
        <p>上下滑动查看完整卡片。手机可长按图片保存，也可以截图；保存 PNG 通常进入下载列表。</p>
        <p className="journey-notice" role="status">
          {notice}
        </p>
      </div>
    </dialog>,
    document.body,
  )
}
