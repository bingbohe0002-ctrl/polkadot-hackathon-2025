import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PresentationControls, Float, ContactShadows, useGLTF } from '@react-three/drei'
import { Group } from 'three'

function Model() {
  const group = useRef<Group>(null)
  // const { scene } = useGLTF('/models/mysteryBox.glb')
  const { scene } = useGLTF('/models/mysteryBox.glb')

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y += 0.005
    }
  })

  return (
    <group ref={group}>
      <primitive object={scene} scale={2} position={[0, 0.3, 0]} />
    </group>
  )
}

export function MysteryBox3D() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 45 }}
      style={{ height: '460px', width: '440px' }}
    >
      <PresentationControls
        global
        rotation={[0.13, 0.1, 0]}
        polar={[-Math.PI / 2, Math.PI / 2]}
        azimuth={[-Infinity, Infinity]}
        config={{ mass: 2, tension: 400 }}
        snap={{ mass: 4, tension: 400 }}
      >
        <Float
          rotationIntensity={0.2}
          floatIntensity={0.5}
          speed={2}
        >
          <Model />
        </Float>
      </PresentationControls>

      <ContactShadows
        opacity={0.3}
        scale={8}
        blur={2}
        far={4}
        resolution={256}
        color="#000000"
        position={[0, -1, 0]}
      />

      <ambientLight intensity={1.2} />
      
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={1} castShadow />
      <directionalLight position={[5, 5, -5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, 5]} intensity={1} castShadow />

      <pointLight position={[5, 0, 0]} intensity={0.5} color="#ff6b6b" />
      <pointLight position={[-5, 0, 0]} intensity={0.5} color="#ff6b6b" />
      <pointLight position={[0, 0, 5]} intensity={0.5} color="#ffd93d" />
      <pointLight position={[0, 0, -5]} intensity={0.5} color="#ffd93d" />

      <spotLight
        position={[0, 8, 0]}
        intensity={0.8}
        angle={Math.PI / 2}
        penumbra={1}
        color="#ffffff"
      />
      <spotLight
        position={[0, -8, 0]}
        intensity={0.4}
        angle={Math.PI / 2}
        penumbra={1}
        color="#ffffff"
      />
    </Canvas>
  )
}

// 预加载模型
// useGLTF.preload('/models/mysteryBox.glb') 
useGLTF.preload('/models/mysteryBox.glb') 