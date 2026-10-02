// 吸积盘着色。盘面为 y = 0，单位 Rs = 1。
// 公式取自 wjxway/Realistic_Blackhole_Accretion_Disk：
// FrequencyMult（多普勒 × 引力红移）、orbitω、Flux（Page–Thorne）。

// Page–Thorne 通量，M = Rs / 2；在 ISCO（r = 3）处为 0
float pageThorneFlux(float r) {
  const float M = 0.5;
  float sr = sqrt(r);
  float s3 = sqrt(3.0 * M);
  float bracket = sqrt(r / M) - 2.4494897
    - 0.8660254 * log((sr - s3) / (sr + s3))
    + 0.8660254 * log(0.1715729);
  return 3.0 * pow(M, 1.5) / (8.0 * PI * pow(r, 2.5) * (r - 3.0 * M)) * bracket;
}

// 通量峰值在 r ≈ 4.776 Rs
const float FLUX_PEAK_RADIUS = 4.776;

// 一层随盘较差旋转的条纹噪声。tau 是相对"未剪切"时刻的时间偏移。
float diskStreaks(vec3 p, float r, float tau, float seed) {
  float omega = sqrt(0.5 / (r * r * r));
  float a = atan(p.z, p.x) + omega * tau;
  vec3 q = vec3(cos(a) * 2.5, sin(a) * 2.5, r * 2.2) + seed;
  return fbm(q);
}

// 两层相位错开的噪声循环交叉淡入，避免剪切随时间无限缠绕
float diskPattern(vec3 p, float r) {
  const float PERIOD = 36.0;
  float t = uTime / PERIOD;
  float phase0 = fract(t);
  float phase1 = fract(t + 0.5);
  float n0 = diskStreaks(p, r, (phase0 - 0.5) * PERIOD, floor(t) * 13.7);
  float n1 = diskStreaks(p, r, (phase1 - 0.5) * PERIOD, floor(t + 0.5) * 13.7 + 5.3);
  float w0 = 1.0 - abs(2.0 * phase0 - 1.0);
  return mix(n1, n0, w0);
}

// p：交点；v：反向追踪光线在交点处的坐标方向；r0：观察者半径
// 返回 rgb = 观测到的辐亮度，a = 不透明度
vec4 shadeDisk(vec3 p, vec3 v, float r, float r0) {
  vec3 er = p / r;
  // 公转方向：从 +y 看为逆时针，默认视角下左侧朝向观察者
  vec3 ephi = normalize(cross(vec3(0.0, 1.0, 0.0), er));

  // 圆轨道在本地静止系中的速度
  float beta = sqrt(0.5 / (r - 1.0));
  // 光子实际传播方向是 -v，换到本地静止正交系
  vec3 photon = -coordinateToLocal(v, er, r);
  float cosAlpha = dot(photon, ephi);

  float doppler = sqrt(1.0 - beta * beta) / (1.0 - beta * cosAlpha);
  float gravity = sqrt((1.0 - 1.0 / r) / (1.0 - 1.0 / r0));
  float g = mix(1.0, doppler, uDoppler) * mix(1.0, gravity, uGravRedshift);

  vec3 chroma = blackbody(g * uDiskTemp);
  // 面亮度不变量 I / ν³ → 总辐亮度 ∝ g⁴
  float beaming = mix(1.0, g * g * g * g, uBeaming);

  float flux = max(pageThorneFlux(r), 0.0) / pageThorneFlux(FLUX_PEAK_RADIUS);
  float radial = mix(1.0, flux, uFlux);

  float pattern = diskPattern(p, r);
  float density = mix(1.0, smoothstep(0.25, 0.7, pattern), uTexture);
  float glow = mix(1.0, 0.35 + 1.5 * pattern * pattern, uTexture);

  float width = uDiskOuter - uDiskInner;
  float edge = smoothstep(uDiskInner, uDiskInner + 0.04 * width, r)
    * (1.0 - smoothstep(uDiskOuter - 0.12 * width, uDiskOuter, r));

  vec3 emission = chroma * uDiskBrightness * beaming * radial * glow;
  float alpha = uDiskOpacity * edge * mix(1.0, 0.25 + 0.75 * density, uTexture);
  return vec4(emission, alpha);
}
