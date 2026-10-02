const vertexSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uProjection, uView, uGlobal, uModel;
uniform vec3 uScale;
varying vec3 vNormal, vPosition;
void main() {
  vec4 world = uGlobal * uModel * vec4(aPosition, 1.0);
  vPosition = world.xyz;
  vNormal = normalize(mat3(uGlobal * uModel) * (aNormal / (uScale * uScale)));
  gl_Position = uProjection * uView * world;
}`;

const fragmentSource = `
precision mediump float;
uniform vec3 uColor;
uniform float uShine;
varying vec3 vNormal, vPosition;
void main() {
  vec3 n = normalize(vNormal);
  vec3 light = normalize(vec3(-3.0, 5.0, 7.0) - vPosition);
  vec3 view = normalize(vec3(0.0, 0.0, 10.0) - vPosition);
  float diffuse = max(dot(n, light), 0.0);
  float rim = pow(1.0 - max(dot(n, view), 0.0), 3.0);
  float specular = pow(max(dot(n, normalize(light + view)), 0.0), 62.0) * uShine;
  float bounce = max(dot(n, normalize(vec3(3.0, -2.0, 4.0))), 0.0) * 0.13;
  vec3 color = uColor * (0.34 + diffuse * 0.69 + bounce);
  color += vec3(0.94, 1.0, 0.88) * specular * 0.68 + vec3(0.25, 0.30, 0.19) * rim * uShine;
  gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}`;

function shader(gl, type, source) {
  const result = gl.createShader(type);
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error('3D shader unavailable');
  return result;
}

export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  if (!gl) throw new Error('WebGL unavailable');
  const program = gl.createProgram();
  const shaders = [
    shader(gl, gl.VERTEX_SHADER, vertexSource),
    shader(gl, gl.FRAGMENT_SHADER, fragmentSource),
  ];
  shaders.forEach((item) => gl.attachShader(program, item));
  gl.linkProgram(program);
  shaders.forEach((item) => gl.deleteShader(item));
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('3D program unavailable');
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  const locations = {};
  for (const name of ['uProjection', 'uView', 'uGlobal', 'uModel', 'uScale', 'uColor', 'uShine'])
    locations[name] = gl.getUniformLocation(program, name);
  const attributes = ['aPosition', 'aNormal'].map((name) => gl.getAttribLocation(program, name));
  const buffers = [];

  function upload(data) {
    const mesh = { count: data.indices.length, buffers: [] };
    for (const source of [data.positions, data.normals]) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, source, gl.STATIC_DRAW);
      mesh.buffers.push(buffer);
    }
    mesh.index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
    buffers.push(...mesh.buffers, mesh.index);
    return mesh;
  }

  function draw(mesh, model, material, scale) {
    mesh.buffers.forEach((buffer, index) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(attributes[index]);
      gl.vertexAttribPointer(attributes[index], 3, gl.FLOAT, false, 0, 0);
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index);
    gl.uniformMatrix4fv(locations.uModel, false, model);
    gl.uniform3fv(locations.uScale, scale);
    gl.uniform3fv(locations.uColor, material.color);
    gl.uniform1f(locations.uShine, material.shine);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
  }

  return {
    upload,
    draw,
    begin(projection, view, global) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      for (const [name, value] of [
        ['uProjection', projection],
        ['uView', view],
        ['uGlobal', global],
      ])
        gl.uniformMatrix4fv(locations[name], false, value);
    },
    dispose() {
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteProgram(program);
    },
  };
}

export function material(hex, shine = 0.5) {
  const color = hex.match(/[a-f\d]{2}/gi).map((value) => Math.pow(parseInt(value, 16) / 255, 2.2));
  return { color, shine };
}
