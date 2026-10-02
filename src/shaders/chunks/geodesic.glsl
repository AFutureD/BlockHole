// Schwarzschild 光线，单位 Rs = 1。
// 光线轨迹满足 Binet 方程 u'' + u = 1.5 u²（u = 1/r），
// 等价于笛卡尔坐标下受有心力 a = -1.5 h² x / r⁵ 的质点，h = |x × v| 守恒。

// 静止观察者本地正交系里的方向 → Schwarzschild 坐标方向。
// 本地径向固有长度 = dr / sqrt(1 - 1/r)，所以径向分量要乘 sqrt(1 - 1/r)。
vec3 localToCoordinate(vec3 n, vec3 er, float r) {
  float f = sqrt(max(1.0 - 1.0 / r, 1e-4));
  return normalize(n + (f - 1.0) * dot(n, er) * er);
}

vec3 coordinateToLocal(vec3 v, vec3 er, float r) {
  float f = sqrt(max(1.0 - 1.0 / r, 1e-4));
  return normalize(v + (1.0 / f - 1.0) * dot(v, er) * er);
}

vec3 geodesicAccel(vec3 x, float h2) {
  float r2 = dot(x, x);
  return -1.5 * h2 * x / (r2 * r2 * sqrt(r2));
}

void stepRK4(inout vec3 x, inout vec3 v, float h2, float dt) {
  vec3 k1x = v;
  vec3 k1v = geodesicAccel(x, h2);
  vec3 k2x = v + 0.5 * dt * k1v;
  vec3 k2v = geodesicAccel(x + 0.5 * dt * k1x, h2);
  vec3 k3x = v + 0.5 * dt * k2v;
  vec3 k3v = geodesicAccel(x + 0.5 * dt * k2x, h2);
  vec3 k4x = v + dt * k3v;
  vec3 k4v = geodesicAccel(x + dt * k3x, h2);
  x += dt / 6.0 * (k1x + 2.0 * k2x + 2.0 * k3x + k4x);
  v += dt / 6.0 * (k1v + 2.0 * k2v + 2.0 * k3v + k4v);
}
