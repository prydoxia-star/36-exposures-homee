import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

function useLeatherTexture() {
  return useMemo(() => {
    const size = 256
    const data = new Uint8Array(size * size * 4)
    let seed = 36
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        const grain = Math.floor(random() * 24)
        const pore = ((x * 17 + y * 31) % 19 === 0) ? 13 : 0
        const value = Math.max(0, Math.min(255, 34 + grain - pore))
        data[i] = value
        data[i + 1] = value
        data[i + 2] = value
        data[i + 3] = 255
      }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2.5, 2)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
    return texture
  }, [])
}

function VerticalCylinder({ position, radius, depth, color, metalness = 0.8, roughness = 0.28 }: {
  position: [number, number, number]
  radius: number
  depth: number
  color: string
  metalness?: number
  roughness?: number
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, depth, 64]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

function LensCylinder({ z, radius, depth, color, metalness = 0.78, roughness = 0.25 }: {
  z: number
  radius: number
  depth: number
  color: string
  metalness?: number
  roughness?: number
}) {
  return (
    <mesh position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius * 0.985, depth, 96]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}

function LensRim({ z, radius, tube, color = '#c5c9c8' }: { z: number; radius: number; tube: number; color?: string }) {
  return (
    <mesh position={[0, 0, z]}>
      <torusGeometry args={[radius, tube, 12, 96]} />
      <meshStandardMaterial color={color} metalness={0.92} roughness={0.2} />
    </mesh>
  )
}

function CameraModel({ intro = false }: { intro?: boolean }) {
  const leather = useLeatherTexture()
  const modelRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!intro || !modelRef.current) return
    const progress = Math.min(clock.elapsedTime / 3.2, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    // A simultaneous horizontal orbit and vertical tumble, growing to exactly 2x.
    modelRef.current.rotation.y = -0.34 + eased * Math.PI * 2
    // Finish with the lens axis pitched slightly upward instead of returning to level.
    modelRef.current.rotation.x = 0.035 + eased * (Math.PI * 2 - 0.22)
    modelRef.current.rotation.z = Math.sin(progress * Math.PI * 2) * 0.09
    modelRef.current.scale.setScalar(0.8 + eased * 0.8)
  })
  const prismGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.57, 0)
    shape.lineTo(0.57, 0)
    shape.lineTo(0.48, 0.25)
    shape.lineTo(0.28, 0.47)
    shape.lineTo(-0.28, 0.47)
    shape.lineTo(-0.48, 0.25)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.68,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    })
  }, [])

  return (
    <Float speed={intro ? 0 : 0.55} rotationIntensity={intro ? 0 : 0.012} floatIntensity={intro ? 0 : 0.035}>
      <group ref={modelRef} rotation={[0.035, -0.34, 0]} scale={intro ? 0.8 : 1.0}>
        {/* Cast magnesium-alloy body shell */}
        <RoundedBox args={[2.48, 1.48, 0.82]} radius={0.105} smoothness={8} castShadow receiveShadow>
          <meshStandardMaterial color="#242725" roughness={0.38} metalness={0.48} />
        </RoundedBox>
        <RoundedBox args={[2.38, 1.32, 0.08]} radius={0.075} smoothness={7} position={[0, -0.005, 0.425]} castShadow>
          <meshStandardMaterial color="#303330" roughness={0.42} metalness={0.42} />
        </RoundedBox>

        {/* Top and bottom satin-chrome shells */}
        <RoundedBox args={[2.38, 0.15, 0.84]} radius={0.045} smoothness={5} position={[0, 0.69, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#b7b9b4" metalness={0.88} roughness={0.27} />
        </RoundedBox>
        <RoundedBox args={[2.38, 0.13, 0.84]} radius={0.04} smoothness={5} position={[0, -0.69, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#9da29f" metalness={0.86} roughness={0.3} />
        </RoundedBox>

        {/* Black pebbled leatherette front panels */}
        <RoundedBox args={[0.63, 1.11, 0.045]} radius={0.075} smoothness={8} position={[-0.78, -0.005, 0.48]} castShadow>
          <meshStandardMaterial map={leather} bumpMap={leather} bumpScale={0.035} color="#343634" roughness={0.92} metalness={0.02} />
        </RoundedBox>
        <RoundedBox args={[0.47, 1.1, 0.065]} radius={0.065} smoothness={8} position={[0.91, -0.005, 0.47]} castShadow>
          <meshStandardMaterial map={leather} bumpMap={leather} bumpScale={0.04} color="#343634" roughness={0.94} metalness={0.01} />
        </RoundedBox>
        <RoundedBox args={[0.48, 1.08, 0.05]} radius={0.06} smoothness={7} position={[1.17, -0.005, 0.16]} castShadow>
          <meshStandardMaterial color="#202321" roughness={0.82} />
        </RoundedBox>

        {/* Pentaprism housing: six-sided silhouette with satin finish */}
        <mesh geometry={prismGeometry} position={[0, 0.72, -0.34]} castShadow receiveShadow>
          <meshStandardMaterial color="#b7b9b4" metalness={0.83} roughness={0.31} />
        </mesh>
        <RoundedBox args={[0.82, 0.24, 0.72]} radius={0.045} smoothness={6} position={[0, 0.91, 0.355]} castShadow>
          <meshStandardMaterial color="#242725" metalness={0.36} roughness={0.46} />
        </RoundedBox>
        <RoundedBox args={[0.63, 0.15, 0.035]} radius={0.025} smoothness={4} position={[0, 0.91, 0.386]}>
          <meshStandardMaterial color="#777d7a" metalness={0.54} roughness={0.36} />
        </RoundedBox>

        {/* Cold shoe and flash shoe rails */}
        <RoundedBox args={[0.42, 0.045, 0.31]} radius={0.018} smoothness={4} position={[0, 1.215, -0.12]}>
          <meshStandardMaterial color="#454a47" metalness={0.82} roughness={0.24} />
        </RoundedBox>
        {[-0.17, 0.17].map((x) => (
          <mesh key={x} position={[x, 1.246, -0.12]} castShadow>
            <boxGeometry args={[0.035, 0.035, 0.34]} />
            <meshStandardMaterial color="#d1d3ce" metalness={0.95} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[0, 1.25, -0.12]}>
          <boxGeometry args={[0.22, 0.018, 0.25]} />
          <meshStandardMaterial color="#858a85" metalness={0.9} roughness={0.23} />
        </mesh>

        {/* Front lens mount and retaining screws */}
        <mesh position={[0, -0.015, 0.49]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.58, 0.58, 0.105, 96]} />
          <meshStandardMaterial color="#aeb2ad" metalness={0.94} roughness={0.22} />
        </mesh>
        <LensRim z={0.55} radius={0.535} tube={0.025} color="#e0e1dc" />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.505, Math.sin(a) * 0.505 - 0.015, 0.552]} rotation={[0, 0, a]}>
              <cylinderGeometry args={[0.022, 0.022, 0.018, 20]} />
              <meshStandardMaterial color="#343936" metalness={0.7} roughness={0.36} />
            </mesh>
          )
        })}

        {/* 50 mm prime lens: barrel, filter thread, aperture and focus rings */}
        <group position={[0, -0.015, 0.57]}>
          <LensCylinder z={0.11} radius={0.47} depth={0.24} color="#242825" metalness={0.58} roughness={0.34} />
          <LensCylinder z={0.28} radius={0.445} depth={0.16} color="#858a84" metalness={0.82} roughness={0.28} />
          <LensCylinder z={0.39} radius={0.455} depth={0.12} color="#252a27" metalness={0.55} roughness={0.38} />
          <LensCylinder z={0.51} radius={0.425} depth={0.21} color="#171b19" metalness={0.35} roughness={0.67} />
          <LensCylinder z={0.68} radius={0.445} depth={0.15} color="#9fa39d" metalness={0.84} roughness={0.26} />
          <LensCylinder z={0.79} radius={0.405} depth={0.105} color="#222724" metalness={0.54} roughness={0.36} />
          <LensCylinder z={0.9} radius={0.425} depth={0.1} color="#b3b7b1" metalness={0.9} roughness={0.2} />
          <LensCylinder z={0.965} radius={0.39} depth={0.055} color="#171b19" metalness={0.6} roughness={0.2} />
          <LensRim z={0.37} radius={0.447} tube={0.017} />
          <LensRim z={0.62} radius={0.444} tube={0.014} color="#cdd0c9" />
          <LensRim z={0.85} radius={0.425} tube={0.014} color="#d6d8d1" />
          <LensRim z={0.997} radius={0.375} tube={0.024} color="#d8dad4" />

          {/* Deep ridged manual-focus grip */}
          {Array.from({ length: 64 }, (_, i) => {
            const a = (i / 64) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.452, Math.sin(a) * 0.452, 0.51]} rotation={[0, 0, a + Math.PI / 2]} castShadow>
                <boxGeometry args={[0.012, 0.075, 0.19]} />
                <meshStandardMaterial color={i % 2 === 0 ? '#555b55' : '#343a35'} metalness={0.32} roughness={0.72} />
              </mesh>
            )
          })}

          {/* Aperture ring index marks */}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 0.414, Math.sin(a) * 0.414, 0.765]} rotation={[0, 0, a]}>
                <boxGeometry args={[0.012, 0.035, 0.008]} />
                <meshStandardMaterial color="#dedfd8" metalness={0.48} roughness={0.48} />
              </mesh>
            )
          })}

          {/* Front glass and recessed iris */}
          <mesh position={[0, 0, 1.002]}>
            <circleGeometry args={[0.345, 96]} />
            <meshPhysicalMaterial color="#172a30" metalness={0.58} roughness={0.12} clearcoat={1} clearcoatRoughness={0.04} transparent opacity={0.86} />
          </mesh>
          <mesh position={[0, 0, 0.987]}>
            <circleGeometry args={[0.12, 64]} />
            <meshBasicMaterial color="#050809" />
          </mesh>
          <mesh position={[-0.105, 0.12, 1.009]}>
            <circleGeometry args={[0.105, 48]} />
            <meshBasicMaterial color="#9bb2ad" transparent opacity={0.26} />
          </mesh>
          <mesh position={[0.12, -0.1, 1.01]}>
            <circleGeometry args={[0.045, 32]} />
            <meshBasicMaterial color="#d1b88a" transparent opacity={0.22} />
          </mesh>
        </group>

        {/* Shutter speed dial and shutter release on top right */}
        <group position={[0.88, 0.82, 0.12]}>
          <VerticalCylinder position={[0, 0, 0]} radius={0.19} depth={0.11} color="#333936" metalness={0.78} />
          <VerticalCylinder position={[0, 0.065, 0]} radius={0.15} depth={0.035} color="#c2c5bf" metalness={0.91} roughness={0.2} />
          <VerticalCylinder position={[0, 0.094, 0]} radius={0.095} depth={0.022} color="#6b716c" metalness={0.7} />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2
            return <mesh key={i} position={[Math.cos(a) * 0.18, 0.015, Math.sin(a) * 0.18]}><boxGeometry args={[0.018, 0.04, 0.024]} /><meshStandardMaterial color="#d2d4ce" metalness={0.85} roughness={0.24} /></mesh>
          })}
        </group>
        <group position={[1.02, 0.795, 0.37]}>
          <VerticalCylinder position={[0, 0, 0]} radius={0.105} depth={0.06} color="#bfc3bd" metalness={0.94} roughness={0.18} />
          <VerticalCylinder position={[0, 0.04, 0]} radius={0.07} depth={0.025} color="#d9dbd4" metalness={0.94} roughness={0.18} />
        </group>

        {/* Film rewind knob and folding crank on top left */}
        <group position={[-0.91, 0.81, -0.08]}>
          <VerticalCylinder position={[0, 0, 0]} radius={0.2} depth={0.11} color="#3e4540" metalness={0.79} />
          <VerticalCylinder position={[0, 0.075, 0]} radius={0.145} depth={0.055} color="#b8bdb7" metalness={0.91} roughness={0.23} />
          <VerticalCylinder position={[0, 0.115, 0]} radius={0.09} depth={0.035} color="#555c56" metalness={0.68} />
          <mesh position={[0.17, 0.13, 0.03]} rotation={[0, 0, -0.32]}>
            <boxGeometry args={[0.32, 0.025, 0.055]} />
            <meshStandardMaterial color="#d0d2cb" metalness={0.94} roughness={0.2} />
          </mesh>
          <VerticalCylinder position={[0.32, 0.13, 0.03]} radius={0.055} depth={0.045} color="#454b46" metalness={0.75} />
        </group>

        {/* Film advance lever: pivot, swept arm and thumb grip */}
        <group position={[0.58, 0.805, -0.12]}>
          <VerticalCylinder position={[0, 0.04, 0]} radius={0.17} depth={0.11} color="#4a514b" metalness={0.82} />
          <VerticalCylinder position={[0, 0.105, 0]} radius={0.12} depth={0.04} color="#c7cac3" metalness={0.94} roughness={0.2} />
          <mesh position={[-0.12, 0.14, 0.16]} rotation={[0.08, 0, 0.28]}>
            <boxGeometry args={[0.46, 0.035, 0.075]} />
            <meshStandardMaterial color="#c5c8c1" metalness={0.94} roughness={0.21} />
          </mesh>
          <RoundedBox args={[0.19, 0.06, 0.11]} radius={0.025} smoothness={4} position={[-0.31, 0.145, 0.32]}>
            <meshStandardMaterial color="#303632" roughness={0.62} />
          </RoundedBox>
        </group>

        {/* Rear film door, viewfinder eyepiece and thumb rest */}
        <RoundedBox args={[2.25, 1.18, 0.07]} radius={0.06} smoothness={7} position={[0, -0.005, -0.445]} castShadow>
          <meshStandardMaterial color="#252a27" roughness={0.65} metalness={0.22} />
        </RoundedBox>
        <RoundedBox args={[0.62, 0.25, 0.09]} radius={0.07} smoothness={7} position={[0, 0.43, -0.51]}>
          <meshStandardMaterial color="#101513" roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.48, 0.14, 0.025]} radius={0.035} smoothness={5} position={[0, 0.43, -0.565]}>
          <meshStandardMaterial color="#58615c" metalness={0.4} roughness={0.4} />
        </RoundedBox>
        <RoundedBox args={[0.35, 0.76, 0.055]} radius={0.07} smoothness={7} position={[0.86, 0.005, -0.5]}>
          <meshStandardMaterial map={leather} bumpMap={leather} bumpScale={0.03} color="#303431" roughness={0.93} />
        </RoundedBox>
        <RoundedBox args={[0.43, 0.33, 0.035]} radius={0.04} smoothness={6} position={[-0.72, 0.34, -0.49]}>
          <meshStandardMaterial color="#181d1a" roughness={0.38} metalness={0.18} />
        </RoundedBox>
        <mesh position={[-0.72, 0.34, -0.514]}>
          <planeGeometry args={[0.32, 0.2]} />
          <meshStandardMaterial color="#6d7770" metalness={0.4} roughness={0.3} />
        </mesh>
        <RoundedBox args={[1.78, 0.035, 0.018]} radius={0.012} smoothness={3} position={[0, -0.57, -0.49]}>
          <meshStandardMaterial color="#59605b" metalness={0.65} roughness={0.35} />
        </RoundedBox>

        {/* Film door hinge and latch */}
        <RoundedBox args={[0.1, 0.92, 0.13]} radius={0.025} smoothness={4} position={[-1.19, 0, -0.12]}>
          <meshStandardMaterial color="#aeb3ac" metalness={0.88} roughness={0.26} />
        </RoundedBox>
        <RoundedBox args={[0.075, 0.34, 0.11]} radius={0.02} smoothness={4} position={[1.19, 0.04, -0.17]}>
          <meshStandardMaterial color="#9da39d" metalness={0.86} roughness={0.28} />
        </RoundedBox>

        {/* Side strap lugs and metal loops */}
        {[-1.24, 1.24].map((x) => (
          <group key={x} position={[x, -0.43, -0.04]} rotation={[0, Math.PI / 2, 0]}>
            <mesh>
              <torusGeometry args={[0.105, 0.027, 12, 40]} />
              <meshStandardMaterial color="#c6cac3" metalness={0.95} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, -0.045]}>
              <cylinderGeometry args={[0.075, 0.075, 0.065, 32]} />
              <meshStandardMaterial color="#555d56" metalness={0.82} roughness={0.28} />
            </mesh>
          </group>
        ))}

        {/* Tripod socket and base details */}
        <mesh position={[0, -0.77, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.035, 48]} />
          <meshStandardMaterial color="#59615b" metalness={0.92} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.795, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.073, 0.073, 0.012, 6]} />
          <meshStandardMaterial color="#1a1f1c" metalness={0.4} roughness={0.4} />
        </mesh>
      </group>
    </Float>
  )
}

function CameraScene() {
  return (
    <Canvas camera={{ position: [3.75, 2.34, 7.48], fov: 32 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.72} />
      <directionalLight position={[4.5, 6, 6]} intensity={2.35} />
      <directionalLight position={[-4, 2.5, 2]} intensity={1.1} color="#e0e7e8" />
      <pointLight position={[1, 2.5, -4]} intensity={1.2} color="#d6b982" />
      <Suspense fallback={null}>
        <Environment preset="studio" />
        <CameraModel />
      </Suspense>
      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={0.42}
        enableDamping
        dampingFactor={0.065}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.27}
        maxPolarAngle={Math.PI * 0.72}
        target={[0, 0.08, 0.28]}
      />
    </Canvas>
  )
}

function IntroMonochromeMaterial() {
  const { scene } = useThree()

  useEffect(() => {
    const previousMaterial = scene.overrideMaterial
    const silhouetteMaterial = new THREE.MeshBasicMaterial({
      color: '#D6B982',
      side: THREE.DoubleSide,
    })
    scene.overrideMaterial = silhouetteMaterial
    return () => {
      scene.overrideMaterial = previousMaterial
      silhouetteMaterial.dispose()
    }
  }, [scene])

  return null
}

function IntroCameraScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10.6], fov: 38 }}
      dpr={[1, 1.7]}
      gl={{ antialias: true, alpha: true }}
    >
      <IntroMonochromeMaterial />
      <CameraModel intro />
    </Canvas>
  )
}

function HangingBulb() {
  const bulbRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const glassMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const bulbGeometry = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(0.105, 0),
    new THREE.Vector2(0.13, 0.08),
    new THREE.Vector2(0.2, 0.18),
    new THREE.Vector2(0.275, 0.34),
    new THREE.Vector2(0.3, 0.5),
    new THREE.Vector2(0.275, 0.65),
    new THREE.Vector2(0.2, 0.76),
    new THREE.Vector2(0.1, 0.82),
    new THREE.Vector2(0, 0.84),
  ], 48), [])

  useFrame(({ clock }) => {
    if (!bulbRef.current) return
    const time = clock.elapsedTime
    bulbRef.current.rotation.z = Math.sin(time * 0.62) * 0.014
    bulbRef.current.rotation.x = Math.sin(time * 0.43) * 0.007

    // Gentle, irregular variation gives the bulb a lived-in tungsten flicker.
    const flicker = 0.34 * Math.sin(time * 11.7) + 0.18 * Math.sin(time * 6.1 + 1.4) + 0.1 * Math.sin(time * 19.3 + 0.6)
    if (lightRef.current) lightRef.current.intensity = 13.5 + flicker
    if (glassMaterialRef.current) glassMaterialRef.current.emissiveIntensity = 0.88 + flicker * 0.035
  })

  return (
    <group ref={bulbRef} position={[0, -0.15, 0]}>
      <mesh position={[0, 2.52, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 4.9, 12]} />
        <meshStandardMaterial color="#090b0a" roughness={0.8} />
      </mesh>
      {/* Simplified socket and classic glass silhouette */}
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.135, 0.15, 0.22, 32]} />
        <meshStandardMaterial color="#98764b" metalness={0.62} roughness={0.42} />
      </mesh>
      <mesh geometry={bulbGeometry} position={[0, 0.43, 0]}>
        <meshPhysicalMaterial ref={glassMaterialRef} color="#ffe6b6" emissive="#ffb45a" emissiveIntensity={0.88} roughness={0.2} metalness={0} transparent opacity={0.86} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.08, 0.08]} color="#ffc36f" intensity={13.5} distance={10} decay={2} />
    </group>
  )
}

function BulbScene() {
  return (
    <Canvas camera={{ position: [0, 0.65, 8], fov: 31 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.32} />
      <HangingBulb />
    </Canvas>
  )
}

type IntroPhase = 'camera' | 'reveal' | 'done'

const INTERNAL_NAV_SKIP_KEY = '36exposures:skip-intro-on-internal-navigation'
let cachedInitialIntroPhase: IntroPhase | null = null

// Play on a fresh visit or manual reload, but skip the intro after an internal page change.
// Cache the result because React StrictMode may invoke lazy state initializers twice in development.
function getInitialIntroPhase(): IntroPhase {
  if (cachedInitialIntroPhase !== null) return cachedInitialIntroPhase

  let skipIntro = false
  try {
    skipIntro = window.sessionStorage.getItem(INTERNAL_NAV_SKIP_KEY) === '1'
    if (skipIntro) window.sessionStorage.removeItem(INTERNAL_NAV_SKIP_KEY)
  } catch {
    // Storage may be unavailable in private or restricted browsing contexts.
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (navigation?.type === 'back_forward') skipIntro = true

  cachedInitialIntroPhase = skipIntro ? 'done' : 'camera'
  return cachedInitialIntroPhase
}

function App() {
  const [introActive, setIntroActive] = useState<IntroPhase>(getInitialIntroPhase() === 'done' ? 'done' : 'camera')

  useEffect(() => {
    const markInternalPageChange = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest('a[href]') as HTMLAnchorElement | null
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
      try {
        const destination = new URL(link.href, window.location.href)
        const current = window.location.pathname + window.location.search
        const next = destination.pathname + destination.search
        if (destination.origin === window.location.origin && next !== current) {
          window.sessionStorage.setItem(INTERNAL_NAV_SKIP_KEY, '1')
        }
      } catch {
        // Keep navigation working if storage is unavailable.
      }
    }
    document.addEventListener('click', markInternalPageChange)
    document.querySelectorAll<HTMLElement>('[data-current-year]').forEach((node) => {
      node.textContent = String(new Date().getFullYear())
    })
    return () => document.removeEventListener('click', markInternalPageChange)
  }, [])

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>('.page-shell')
    const overlay = document.getElementById('intro-overlay')
    if (introActive === 'done') {
      overlay?.remove()
      return
    }

    const finish = () => {
      overlay?.remove()
      shell?.classList.remove('is-star-reveal')
      setIntroActive('done')
    }
    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target === shell && event.animationName === 'intro-four-star-reveal') finish()
    }
    shell?.addEventListener('animationend', handleAnimationEnd as EventListener)
    const revealTimer = window.setTimeout(() => {
      shell?.classList.add('is-star-reveal')
      overlay?.classList.add('is-revealing')
      setIntroActive('reveal')
    }, 3400)
    const fallbackTimer = window.setTimeout(finish, 5400)
    return () => {
      window.clearTimeout(revealTimer)
      window.clearTimeout(fallbackTimer)
      shell?.removeEventListener('animationend', handleAnimationEnd as EventListener)
    }
  }, [introActive === 'done'])

  const cameraMount = document.getElementById('hero-camera-mount')
  const introMount = document.getElementById('intro-camera-mount')
  const bulbMount = document.getElementById('products-bulb-mount')

  return (
    <>
      {cameraMount && createPortal(<CameraScene />, cameraMount)}
      {introMount && introActive !== 'done' && createPortal(<IntroCameraScene />, introMount)}
      {bulbMount && createPortal(<BulbScene />, bulbMount)}
    </>
  )
}

const islandsRoot = document.getElementById('react-islands')
if (islandsRoot) createRoot(islandsRoot).render(<React.StrictMode><App /></React.StrictMode>)
