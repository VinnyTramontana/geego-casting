import type { STLParseResult, Vec3, BoundingBox } from "@/types";

export type { STLParseResult, Vec3, BoundingBox };

/**
 * Parse an STL file (binary or ASCII) from a Node.js Buffer.
 * Returns geometry metadata including triangle count, bounding box,
 * signed volume (absolute value), watertight status, and orientation.
 */
export function parseSTL(buffer: Buffer): STLParseResult {
  const warnings: string[] = [];

  // ── Detect binary vs ASCII ──
  // A valid ASCII STL starts with "solid" AND contains "facet" somewhere.
  // Some binary STLs happen to start with "solid" in the header, so we
  // need the secondary check for "facet".
  const headerText = buffer.subarray(0, Math.min(buffer.length, 256)).toString("ascii");
  const startsWithSolid = headerText.trimStart().startsWith("solid");
  const containsFacet = headerText.includes("facet");
  const isAscii = startsWithSolid && containsFacet;

  if (isAscii) {
    return parseASCII(buffer.toString("ascii"), warnings);
  } else {
    return parseBinary(buffer, warnings);
  }
}

// ─── Binary STL Parser ──────────────────────────────────────────

function parseBinary(buffer: Buffer, warnings: string[]): STLParseResult {
  if (buffer.length < 84) {
    throw new Error("Invalid binary STL: file too small (less than 84 bytes)");
  }

  // 80-byte header (ignored), then uint32 triangle count
  const triangleCount = buffer.readUInt32LE(80);

  const expectedSize = 84 + triangleCount * 50;
  if (buffer.length < expectedSize) {
    warnings.push(
      `File size (${buffer.length}) is smaller than expected (${expectedSize}) for ${triangleCount} triangles`
    );
  }

  const bbox: BoundingBox = {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };

  let signedVolume = 0;
  const edgeMap = new Map<string, number>();

  // Global vertex index counter for watertight edge check.
  // We assign each unique vertex position an index.
  const vertexIndexMap = new Map<string, number>();
  let nextVertexIndex = 0;

  function getVertexIndex(v: Vec3): number {
    // Round to avoid floating-point mismatch for coincident vertices
    const key = `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
    let idx = vertexIndexMap.get(key);
    if (idx === undefined) {
      idx = nextVertexIndex++;
      vertexIndexMap.set(key, idx);
    }
    return idx;
  }

  function addEdge(i1: number, i2: number): void {
    const a = Math.min(i1, i2);
    const b = Math.max(i1, i2);
    const key = `${a}-${b}`;
    edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
  }

  function updateBBox(v: Vec3): void {
    if (v.x < bbox.min.x) bbox.min.x = v.x;
    if (v.y < bbox.min.y) bbox.min.y = v.y;
    if (v.z < bbox.min.z) bbox.min.z = v.z;
    if (v.x > bbox.max.x) bbox.max.x = v.x;
    if (v.y > bbox.max.y) bbox.max.y = v.y;
    if (v.z > bbox.max.z) bbox.max.z = v.z;
  }

  for (let i = 0; i < triangleCount; i++) {
    const offset = 84 + i * 50;

    // Skip normal (12 bytes), read 3 vertices (each 12 bytes = 3 floats)
    const v1: Vec3 = {
      x: buffer.readFloatLE(offset + 12),
      y: buffer.readFloatLE(offset + 16),
      z: buffer.readFloatLE(offset + 20),
    };
    const v2: Vec3 = {
      x: buffer.readFloatLE(offset + 24),
      y: buffer.readFloatLE(offset + 28),
      z: buffer.readFloatLE(offset + 32),
    };
    const v3: Vec3 = {
      x: buffer.readFloatLE(offset + 36),
      y: buffer.readFloatLE(offset + 40),
      z: buffer.readFloatLE(offset + 44),
    };

    updateBBox(v1);
    updateBBox(v2);
    updateBBox(v3);

    // Signed volume via tetrahedron method:
    // V += v1 . (v2 x v3) / 6
    const cross: Vec3 = {
      x: v2.y * v3.z - v2.z * v3.y,
      y: v2.z * v3.x - v2.x * v3.z,
      z: v2.x * v3.y - v2.y * v3.x,
    };
    const dot = v1.x * cross.x + v1.y * cross.y + v1.z * cross.z;
    signedVolume += dot / 6;

    // Edge tracking for watertight check
    const idx1 = getVertexIndex(v1);
    const idx2 = getVertexIndex(v2);
    const idx3 = getVertexIndex(v3);
    addEdge(idx1, idx2);
    addEdge(idx2, idx3);
    addEdge(idx3, idx1);
  }

  const orientationInverted = signedVolume < 0;
  const volume = Math.abs(signedVolume);

  if (orientationInverted) {
    warnings.push("Mesh normals appear to be inverted (negative signed volume)");
  }

  // Watertight: every undirected edge must appear exactly 2 times
  let isWatertight = true;
  for (const count of edgeMap.values()) {
    if (count !== 2) {
      isWatertight = false;
      break;
    }
  }

  if (!isWatertight) {
    warnings.push("Mesh is not watertight; volume calculation may be inaccurate");
  }

  // Handle degenerate case where no triangles exist
  if (triangleCount === 0) {
    bbox.min = { x: 0, y: 0, z: 0 };
    bbox.max = { x: 0, y: 0, z: 0 };
    warnings.push("STL file contains no triangles");
  }

  return {
    triangleCount,
    boundingBox: bbox,
    volume,
    isWatertight,
    orientationInverted,
    warnings,
  };
}

// ─── ASCII STL Parser ───────────────────────────────────────────

function parseASCII(text: string, warnings: string[]): STLParseResult {
  const bbox: BoundingBox = {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };

  let signedVolume = 0;
  let triangleCount = 0;

  const edgeMap = new Map<string, number>();
  const vertexIndexMap = new Map<string, number>();
  let nextVertexIndex = 0;

  function getVertexIndex(v: Vec3): number {
    const key = `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
    let idx = vertexIndexMap.get(key);
    if (idx === undefined) {
      idx = nextVertexIndex++;
      vertexIndexMap.set(key, idx);
    }
    return idx;
  }

  function addEdge(i1: number, i2: number): void {
    const a = Math.min(i1, i2);
    const b = Math.max(i1, i2);
    const key = `${a}-${b}`;
    edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
  }

  function updateBBox(v: Vec3): void {
    if (v.x < bbox.min.x) bbox.min.x = v.x;
    if (v.y < bbox.min.y) bbox.min.y = v.y;
    if (v.z < bbox.min.z) bbox.min.z = v.z;
    if (v.x > bbox.max.x) bbox.max.x = v.x;
    if (v.y > bbox.max.y) bbox.max.y = v.y;
    if (v.z > bbox.max.z) bbox.max.z = v.z;
  }

  // Parse vertices per facet
  const lines = text.split("\n");
  let currentVertices: Vec3[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("vertex")) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        const v: Vec3 = {
          x: parseFloat(parts[1]),
          y: parseFloat(parts[2]),
          z: parseFloat(parts[3]),
        };
        if (isNaN(v.x) || isNaN(v.y) || isNaN(v.z)) {
          warnings.push(`Invalid vertex coordinates in line: "${line}"`);
          continue;
        }
        currentVertices.push(v);
      }
    } else if (line.startsWith("endfacet")) {
      if (currentVertices.length === 3) {
        const [v1, v2, v3] = currentVertices;
        triangleCount++;

        updateBBox(v1);
        updateBBox(v2);
        updateBBox(v3);

        // Signed volume
        const cross: Vec3 = {
          x: v2.y * v3.z - v2.z * v3.y,
          y: v2.z * v3.x - v2.x * v3.z,
          z: v2.x * v3.y - v2.y * v3.x,
        };
        const dot = v1.x * cross.x + v1.y * cross.y + v1.z * cross.z;
        signedVolume += dot / 6;

        // Edges
        const idx1 = getVertexIndex(v1);
        const idx2 = getVertexIndex(v2);
        const idx3 = getVertexIndex(v3);
        addEdge(idx1, idx2);
        addEdge(idx2, idx3);
        addEdge(idx3, idx1);
      } else if (currentVertices.length > 0) {
        warnings.push(
          `Facet with ${currentVertices.length} vertices instead of 3`
        );
      }
      currentVertices = [];
    }
  }

  const orientationInverted = signedVolume < 0;
  const volume = Math.abs(signedVolume);

  if (orientationInverted) {
    warnings.push("Mesh normals appear to be inverted (negative signed volume)");
  }

  let isWatertight = true;
  for (const count of edgeMap.values()) {
    if (count !== 2) {
      isWatertight = false;
      break;
    }
  }

  if (!isWatertight) {
    warnings.push("Mesh is not watertight; volume calculation may be inaccurate");
  }

  if (triangleCount === 0) {
    bbox.min = { x: 0, y: 0, z: 0 };
    bbox.max = { x: 0, y: 0, z: 0 };
    warnings.push("STL file contains no triangles");
  }

  return {
    triangleCount,
    boundingBox: bbox,
    volume,
    isWatertight,
    orientationInverted,
    warnings,
  };
}
