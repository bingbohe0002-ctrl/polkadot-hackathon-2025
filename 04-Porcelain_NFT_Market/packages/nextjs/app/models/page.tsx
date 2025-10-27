"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useState, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

// 模型渲染组件，必须在 Canvas 内部使用
const RotatingModel = ({ gltf }: { gltf: any }) => {
    const modelRef = useRef<THREE.Object3D | null>(null);

    // 自动旋转
    useFrame(() => {
        if (modelRef.current) {
            modelRef.current.rotation.y += 0.01; // 每帧旋转
        }
    });

    return <primitive object={gltf.scene} scale={2} ref={modelRef} />;
};

const ThreeDModel = ({ modelPath }: { modelPath: string }) => {
    const [gltf, setGltf] = useState<any>(null);

    useEffect(() => {
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (loadedGltf) => {
                // 获取模型的包围盒并计算适当的缩放比例
                const box = new THREE.Box3().setFromObject(loadedGltf.scene);
                const size = new THREE.Vector3();
                box.getSize(size);
    
                const maxDimension = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDimension; // 将最大尺寸限制在 2
    
                loadedGltf.scene.scale.set(scale, scale, scale); // 设置缩放比例
    
                // 调整材质属性
                loadedGltf.scene.traverse((node) => {
                    if (node.isMesh) {
                        const material = node.material;
                        if (material) {
                            material.metalness = 0.1; // 设置金属感
                            material.roughness = 0.5; // 设置粗糙度
                        }
                    }
                });
                setGltf(loadedGltf);
            },
            undefined,
            (error) => console.error("Error loading model:", error)
        );
    }, [modelPath]);

    if (!gltf) {
        return <div>Loading...</div>; // 加载状态
    }

    return (
        <Canvas
            style={{ height: "100vh" }}
            gl={{ physicallyCorrectLights: true }} // 启用物理光照
        >
            {/* 环境光 */}
            <ambientLight intensity={0.3} />
            {/* 点光源 */}
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            {/* 方向光 */}
            <directionalLight position={[-10, 10, 5]} intensity={1.2} />

            {/* 模型渲染组件 */}
            <RotatingModel gltf={gltf} />

            {/* 控制器 */}
            <OrbitControls />

            {/* 环境贴图 */}
            <Environment preset="sunset" />
        </Canvas>
    );
};

export default function ModelPage() {
    const modelPath = "/models/labixiaoxin.glb"; // 请确保将模型文件放在 public/models 目录下

    return (
        <div style={{ width: "100%", height: "100vh" }}>
            <ThreeDModel modelPath={modelPath} />
        </div>
    );
}
