// 程序化星空：按方向做单元格哈希生成点状星，再叠一条低频银河带。
// footprint 是该像素在天球上覆盖的角尺度；引力透镜会把它放大，
// 用它展宽并压暗星点，避免光子环附近闪烁。

const float STAR_SIZE = 0.05;

vec3 starLayer(vec3 dir, float scale, float footprint, float seed) {
  vec3 p = dir * scale;
  vec3 cell = floor(p);
  vec3 rnd = hash33(cell + seed);
  // 留边，避免星点被格子边界裁掉
  vec3 star = cell + 0.2 + 0.6 * rnd;
  float d = length(p - star);

  float size = clamp(0.7 * footprint * scale, STAR_SIZE, 0.2);
  float energy = (STAR_SIZE * STAR_SIZE) / (size * size);
  float glow = exp(-d * d / (size * size));

  float mag = hash13(cell + seed + 7.3);
  float brightness = 0.15 + 40.0 * pow(mag, 8.0);
  float temp = mix(3000.0, 14000.0, hash13(cell + seed + 3.1));
  return blackbody(temp) * brightness * glow * energy;
}

vec3 milkyWay(vec3 dir) {
  const vec3 normal = vec3(0.3293, 0.7996, 0.5021);
  float h = dot(dir, normal);
  float band = exp(-h * h / 0.035);
  float cloud = fbm(dir * 3.5 + 11.0);
  float detail = fbm(dir * 13.0 + 5.0);
  float dust = smoothstep(0.45, 0.7, fbm(dir * 7.0 + 40.0));
  vec3 tint = mix(vec3(0.55, 0.68, 1.0), vec3(1.0, 0.82, 0.62), cloud);
  return tint * band * (0.25 + 1.6 * cloud * detail) * (1.0 - 0.75 * dust) * 0.09;
}

vec3 starfield(vec3 dir, float footprint) {
  vec3 col = starLayer(dir, 55.0, footprint, 0.0);
  col += starLayer(dir, 120.0, footprint, 19.0);
  col += milkyWay(dir);
  return col;
}
