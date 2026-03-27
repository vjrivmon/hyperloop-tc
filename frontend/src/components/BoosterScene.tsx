import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

const TRACK_LEN = 50
const BOOSTER_START = 2
const BOOSTER_END = 4

function Track() {
  return (
    <>
      {/* Track principal */}
      <mesh position={[TRACK_LEN / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[TRACK_LEN, 0.2, 1.5]} />
        <meshStandardMaterial color="#374151" roughness={0.8} />
      </mesh>
      {/* Raíles */}
      <mesh position={[TRACK_LEN / 2, 0.15, 0.5]}>
        <boxGeometry args={[TRACK_LEN, 0.08, 0.08]} />
        <meshStandardMaterial color="#6b7280" metalness={0.8} />
      </mesh>
      <mesh position={[TRACK_LEN / 2, 0.15, -0.5]}>
        <boxGeometry args={[TRACK_LEN, 0.08, 0.08]} />
        <meshStandardMaterial color="#6b7280" metalness={0.8} />
      </mesh>
      {/* Sección booster (verde) */}
      <mesh position={[(BOOSTER_START + BOOSTER_END) / 2, 0.01, 0]}>
        <boxGeometry args={[BOOSTER_END - BOOSTER_START, 0.22, 1.6]} />
        <meshStandardMaterial color="#16a34a" emissive="#15803d" emissiveIntensity={0.3} transparent opacity={0.7} />
      </mesh>
      {/* Stopper al final */}
      <mesh position={[TRACK_LEN, 0.4, 0]}>
        <boxGeometry args={[0.3, 0.8, 2]} />
        <meshStandardMaterial color="#dc2626" metalness={0.6} />
      </mesh>
      {/* Labels */}
      <Text position={[1, 0.8, 0]} fontSize={0.4} color="#22c55e" anchorX="center">BOOSTER</Text>
      <Text position={[TRACK_LEN - 1, 1.2, 0]} fontSize={0.35} color="#ef4444" anchorX="center">STOP</Text>
    </>
  )
}

interface CartProps {
  position: number
  state: string
}

function Cart({ position, state }: CartProps) {
  const groupRef = useRef<THREE.Group>(null)

  const cartColor = {
    IDLE: '#6b7280',
    PRECHARGE: '#eab308',
    READY: '#22c55e',
    RUNNING: '#06b6d4',
    BOOSTING: '#a855f7',
    BRAKING: '#f97316',
    STOPPED: '#ef4444',
  }[state] ?? '#6b7280'

  const emissiveIntensity = state === 'BOOSTING' ? 0.5 : state === 'BRAKING' ? 0.3 : 0.1

  return (
    <group ref={groupRef} position={[position, 0.45, 0]}>
      {/* Cuerpo del carro */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.5, 0.9]} />
        <meshStandardMaterial color={cartColor} emissive={cartColor} emissiveIntensity={emissiveIntensity} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Superestructura */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.7]} />
        <meshStandardMaterial color={cartColor} emissive={cartColor} emissiveIntensity={emissiveIntensity * 0.5} />
      </mesh>
      {/* 4 ruedas */}
      {[[-0.45, -0.3, 0.5], [-0.45, -0.3, -0.5], [0.45, -0.3, 0.5], [0.45, -0.3, -0.5]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} />
        </mesh>
      ))}
      {/* EMS (imán) */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[0.7, 0.1, 0.3]} />
        <meshStandardMaterial color="#1d4ed8" emissive="#1d4ed8" emissiveIntensity={state === 'BOOSTING' ? 1 : 0.1} />
      </mesh>
    </group>
  )
}

interface Props {
  positionM: number
  state: string
}

export function BoosterScene({ positionM, state }: Props) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-950">
      <Canvas
        camera={{ position: [25, 8, 18], fov: 55 }}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#030712']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        <pointLight position={[BOOSTER_START + 1, 2, 0]} color="#22c55e" intensity={state === 'BOOSTING' ? 3 : 0.5} distance={6} />

        <Track />
        <Cart position={positionM} state={state} />

        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2.2}
        />

        {/* Grid floor */}
        <gridHelper args={[60, 60, '#1f2937', '#111827']} position={[25, -0.1, 0]} />
      </Canvas>
    </div>
  )
}
