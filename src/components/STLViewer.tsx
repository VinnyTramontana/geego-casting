"use client";

import { useEffect, useRef, useState } from "react";

interface STLViewerProps {
  file: File;
}

export default function STLViewer({ file }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;

    async function init() {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

        if (cancelled) return;

        const width = container.clientWidth;
        const height = 200;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x12121f);

        // Camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight1.position.set(1, 1, 1);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xc9a84c, 0.3);
        dirLight2.position.set(-1, -0.5, -1);
        scene.add(dirLight2);

        // Parse STL and build geometry
        const arrayBuffer = await file.arrayBuffer();
        if (cancelled) return;

        const geometry = parseSTLToGeometry(THREE, arrayBuffer);
        geometry.computeVertexNormals();

        // Material
        const material = new THREE.MeshPhongMaterial({
          color: 0xc9a84c,
          specular: 0x444444,
          shininess: 60,
          flatShading: false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Center and fit camera
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        mesh.position.sub(center);

        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const dist = maxDim * 1.8;
        camera.position.set(dist * 0.6, dist * 0.4, dist * 0.8);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();

        // Animation loop
        let animId: number;
        function animate() {
          animId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        }
        animate();

        setLoading(false);

        // Cleanup
        cleanupRef.current = () => {
          cancelAnimationFrame(animId);
          controls.dispose();
          renderer.dispose();
          geometry.dispose();
          material.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [file]);

  if (error) {
    return (
      <div className="w-full h-[200px] bg-[#12121f] rounded-lg border border-[#2a2a40] flex items-center justify-center text-gray-500 text-xs">
        Preview unavailable
      </div>
    );
  }

  return (
    <div className="relative w-full h-[200px] rounded-lg overflow-hidden border border-[#2a2a40]">
      {loading && (
        <div className="absolute inset-0 bg-[#12121f] flex items-center justify-center z-10">
          <div className="text-gray-500 text-xs animate-pulse">Loading preview...</div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

/**
 * Parse an STL ArrayBuffer into a Three.js BufferGeometry.
 * Handles both binary and ASCII formats.
 */
function parseSTLToGeometry(
  THREE: typeof import("three"),
  buffer: ArrayBuffer,
): import("three").BufferGeometry {
  const headerBytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 256));
  const headerText = new TextDecoder("ascii").decode(headerBytes);
  const isAscii = headerText.trimStart().startsWith("solid") && headerText.includes("facet");

  if (isAscii) {
    return parseASCIIToGeometry(THREE, buffer);
  }
  return parseBinaryToGeometry(THREE, buffer);
}

function parseBinaryToGeometry(
  THREE: typeof import("three"),
  buffer: ArrayBuffer,
): import("three").BufferGeometry {
  const view = new DataView(buffer);
  const triCount = view.getUint32(80, true);
  const vertices = new Float32Array(triCount * 9);

  for (let i = 0; i < triCount; i++) {
    const off = 84 + i * 50;
    // Skip normal (12 bytes), read 3 vertices
    for (let v = 0; v < 3; v++) {
      const vOff = off + 12 + v * 12;
      vertices[i * 9 + v * 3] = view.getFloat32(vOff, true);
      vertices[i * 9 + v * 3 + 1] = view.getFloat32(vOff + 4, true);
      vertices[i * 9 + v * 3 + 2] = view.getFloat32(vOff + 8, true);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  return geometry;
}

function parseASCIIToGeometry(
  THREE: typeof import("three"),
  buffer: ArrayBuffer,
): import("three").BufferGeometry {
  const text = new TextDecoder("ascii").decode(new Uint8Array(buffer));
  const verts: number[] = [];

  const lines = text.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("vertex")) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        verts.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verts), 3));
  return geometry;
}
