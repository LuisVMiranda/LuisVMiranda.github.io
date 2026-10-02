// Small, dependency-free meshes and column-major transforms for the hero.
export function multiply(a, b) {
  const result = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) result[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
    }
  }
  return result;
}

export function transform(position = [0, 0, 0], scale = [1, 1, 1], angle = 0) {
  const [x, y, z] = position;
  const [sx, sy, sz] = scale;
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return new Float32Array([c * sx, s * sx, 0, 0, -s * sy, c * sy, 0, 0, 0, 0, sz, 0, x, y, z, 1]);
}

export function rotation(pitch, yaw, roll) {
  const cx = Math.cos(pitch),
    sx = Math.sin(pitch);
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw);
  const rx = new Float32Array([1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1]);
  const ry = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1]);
  return multiply(transform([0, 0, 0], [1, 1, 1], roll), multiply(ry, rx));
}

export function perspective(aspect) {
  const f = 1 / Math.tan(0.65 / 2),
    near = 0.1,
    far = 50;
  return new Float32Array([
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    (2 * far * near) / (near - far),
    0,
  ]);
}

function surface(rows, columns, point) {
  const positions = [],
    normals = [],
    indices = [];
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= columns; j++) {
      const [position, normal] = point(i / rows, j / columns);
      positions.push(...position);
      normals.push(...normal);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const a = i * (columns + 1) + j,
        b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

export function capsule(halfLength, radius) {
  return surface(40, 32, (u, v) => {
    const a = Math.PI * u,
      b = Math.PI * 2 * v;
    const nx = Math.cos(a),
      ny = Math.sin(a) * Math.cos(b),
      nz = Math.sin(a) * Math.sin(b);
    return [
      [nx * radius + Math.sign(nx) * halfLength, ny * radius, nz * radius],
      [nx, ny, nz],
    ];
  });
}

export function torus(radius, tube) {
  return surface(100, 8, (u, v) => {
    const a = 2 * Math.PI * u,
      b = 2 * Math.PI * v;
    const x = Math.cos(a),
      y = Math.sin(a),
      r = radius + tube * Math.cos(b);
    return [
      [x * r, y * r, tube * Math.sin(b)],
      [x * Math.cos(b), y * Math.cos(b), Math.sin(b)],
    ];
  });
}
