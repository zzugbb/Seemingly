import { useEffect, useMemo, useRef } from 'react'
import { Object3D, Vector3, type DirectionalLight } from 'three'

const SCENE_CENTER = new Vector3(6, 1.2, 2.4)

export function Lights() {
  const lightRef = useRef<DirectionalLight>(null)
  const target = useMemo(() => {
    const obj = new Object3D()
    obj.position.copy(SCENE_CENTER)
    return obj
  }, [])
  useEffect(() => {
    if (lightRef.current) lightRef.current.target = target
  }, [target])
  return (
    <>
      <primitive object={target} />
      <hemisphereLight args={['#fff1df', '#8b6f9c', 0.95]} />
      <ambientLight intensity={0.2} color="#ffe9d6" />
      <directionalLight
        ref={lightRef}
        position={[SCENE_CENTER.x - 7, SCENE_CENTER.y + 14, SCENE_CENTER.z + 5]}
        intensity={2.5}
        color="#fff3e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={50}
      />
    </>
  )
}
