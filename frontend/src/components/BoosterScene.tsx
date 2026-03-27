import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, Line } from '@react-three/drei'
import * as THREE from 'three'

const TRACK_LEN = 50
const BOOSTER_START = 2
const BOOSTER_END = 4

// Cámara que sigue al carro suavemente
function FollowCamera({ target }: { target: React.MutableRefObject<THREE.Group | null> }) {
  const { camera } = useThree()

  useFrame(() => {
    if (!target.current) return
    const cartX = target.current.position.x

    // Offset fijo relativo al carro: lateral + elevado + algo de profundidad
    const desiredX = cartX + 6
    const desiredY = 4
    const desiredZ = 8

    // Interpolación suave (lerp) para que la cámara no salte
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, desiredX, 0.06)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredY, 0.06)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, desiredZ, 0.06)

    // Mirar siempre al carro
    const lookAt = new THREE.Vector3(cartX, 0.5, 0)
    camera.lookAt(lookAt)
  })

  return null
}

function Track() {
  return (
    <>
      {/* Base del track */}
      <mesh position={[TRACK_LEN / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[TRACK_LEN, 0.15, 1.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Raíles */}
      <mesh position={[TRACK_LEN / 2, 0.18, 0.55]}>
        <boxGeometry args={[TRACK_LEN, 0.07, 0.07]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[TRACK_LEN / 2, 0.18, -0.55]}>
        <boxGeometry args={[TRACK_LEN, 0.07, 0.07]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Traviesas cada 2m */}
      {Array.from({ length: 26 }, (_, i) => (
        <mesh key={i} position={[i * 2, 0.1, 0]}>
          <boxGeometry args={[0.15, 0.08, 1.6]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      ))}

      {/* Sección booster — brilla */}
      <mesh position={[(BOOSTER_START + BOOSTER_END) / 2, 0.01, 0]}>
        <boxGeometry args={[BOOSTER_END - BOOSTER_START, 0.17, 1.9]} />
        <meshStandardMaterial
          color="#15803d"
          emissive="#16a34a"
          emissiveIntensity={0.4}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Marcadores km */}
      {[0, 10, 20, 30, 40, 50].map(m => (
        <group key={m} position={[m, 0, 1.2]}>
          <mesh>
            <boxGeometry args={[0.05, 0.6, 0.05]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <Text position={[0, 0.7, 0]} fontSize={0.35} color="#64748b" anchorX="center">
            {m}m
          </Text>
        </group>
      ))}

      {/* Label booster */}
      <Text position={[3, 1.1, 0]} fontSize={0.3} color="#4ade80" anchorX="center">
        ⚡ BOOSTER
      </Text>

      {/* Stopper final */}
      <mesh position={[TRACK_LEN + 0.15, 0.5, 0]} castShadow>
        <boxGeometry args={[0.3, 1.0, 2.2]} />
        <meshStandardMaterial color="#dc2626" metalness={0.5} roughness={0.3} />
      </mesh>
      <Text position={[TRACK_LEN - 0.5, 1.4, 0]} fontSize={0.3} color="#ef4444" anchorX="center">
        STOP
      </Text>
    </>
  )
}

interface CartProps {
  position: number
  state: string
  cartRef: React.MutableRefObject<THREE.Group | null>
}

const STATE_COLORS: Record<string, string> = {
  IDLE: '#6b7280',
  PRECHARGE: '#eab308',
  READY: '#22c55e',
  RUNNING: '#06b6d4',
  BOOSTING: '#a855f7',
  BRAKING: '#f97316',
  STOPPED: '#ef4444',
}

function Cart({ position, state, cartRef }: CartProps) {
  const color = STATE_COLORS[state] ?? '#6b7280'
  const isBoosting = state === 'BOOSTING'
  const isBraking = state === 'BRAKING'
  const isStopped = state === 'STOPPED'

  // Ruedas giran si está en movimiento
  const wheelRef1 = useRef<THREE.Mesh>(null)
  const wheelRef2 = useRef<THREE.Mesh>(null)
  const wheelRef3 = useRef<THREE.Mesh>(null)
  const wheelRef4 = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    const speed = isStopped ? 0 : isBoosting ? 4 : isBraking ? 1 : 2
    const spin = speed * delta
    ;[wheelRef1, wheelRef2, wheelRef3, wheelRef4].forEach(r => {
      if (r.current) r.current.rotation.x += spin
    })
  })

  return (
    <group ref={cartRef} position={[position, 0.42, 0]}>
      {/* Cuerpo principal */}
      <mesh castShadow>
        <boxGeometry args={[1.4, 0.45, 1.0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isBoosting ? 0.6 : 0.15}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Cabina superior */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.9, 0.18, 0.75]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} />
      </mesh>

      {/* EMS (imán) — brilla en BOOSTING */}
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.8, 0.08, 0.35]} />
        <meshStandardMaterial
          color="#1d4ed8"
          emissive="#3b82f6"
          emissiveIntensity={isBoosting ? 1.5 : 0.05}
        />
      </mesh>

      {/* 4 ruedas */}
      <mesh ref={wheelRef1} position={[-0.52, -0.26, 0.56]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh ref={wheelRef2} position={[-0.52, -0.26, -0.56]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh ref={wheelRef3} position={[0.52, -0.26, 0.56]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh ref={wheelRef4} position={[0.52, -0.26, -0.56]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Label estado */}
      <Text position={[0, 0.75, 0]} fontSize={0.22} color={color} anchorX="center">
        {state}
      </Text>
    </group>
  )
}

interface Props {
  positionM: number
  state: string
}

export function BoosterScene({ positionM, state }: Props) {
  const cartRef = useRef<THREE.Group>(null)

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [6, 4, 8], fov: 60 }}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#020617']} />

        {/* Iluminación */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[10, 20, 10]} intensity={0.9} castShadow />
        <pointLight
          position={[positionM, 1.5, 0]}
          color={STATE_COLORS[state] ?? '#ffffff'}
          intensity={state === 'BOOSTING' ? 4 : 1}
          distance={8}
        />

        {/* Suelo */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TRACK_LEN / 2, -0.09, 0]} receiveShadow>
          <planeGeometry args={[TRACK_LEN + 10, 10]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        <Track />
        <Cart position={positionM} state={state} cartRef={cartRef} />
        <FollowCamera target={cartRef} />
      </Canvas>
    </div>
  )
}
