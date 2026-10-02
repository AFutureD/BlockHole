// 逐像素反向追踪 Schwarzschild 光线，输出线性 HDR。
// 所有长度以 Rs 为单位；吸积盘坐标系里盘面为 y = 0。

#define PI 3.14159265359

layout(location = 0) out highp vec4 fragColor;

in vec2 vNdc;

uniform vec3 uCameraPos;
uniform mat4 uCameraWorld;
uniform mat4 uProjInv;
uniform mat3 uWorldToDisk;
uniform float uTime;

uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uDiskTemp;
uniform float uDiskOpacity;
uniform float uDiskBrightness;

// 效果开关，0 或 1
uniform float uDoppler;
uniform float uGravRedshift;
uniform float uBeaming;
uniform float uFlux;
uniform float uTexture;
uniform float uStars;

uniform sampler2D uBlackbody;
uniform vec2 uBlackbodyLogRange;

// 色温 → 线性 sRGB 色度（最大通道归一化为 1）
vec3 blackbody(float temp) {
  float u = (log(temp) - uBlackbodyLogRange.x) / (uBlackbodyLogRange.y - uBlackbodyLogRange.x);
  return texture(uBlackbody, vec2(clamp(u, 0.0, 1.0), 0.5)).rgb;
}

#include chunks/noise.glsl;
#include chunks/starfield.glsl;
#include chunks/geodesic.glsl;
#include chunks/disk.glsl;

void main() {
  vec4 view = uProjInv * vec4(vNdc, 1.0, 1.0);
  vec3 dirWorld = normalize(mat3(uCameraWorld) * (view.xyz / view.w));

  vec3 pos = uWorldToDisk * uCameraPos;
  float r0 = length(pos);
  vec3 vel = localToCoordinate(uWorldToDisk * dirWorld, pos / r0, r0);

  vec3 hvec = cross(pos, vel);
  float h2 = dot(hvec, hvec);
  float rEscape = max(2.0 * r0, 30.0);

  vec3 color = vec3(0.0);
  float transmittance = 1.0;
  bool escaped = false;

  for (int i = 0; i < MAX_STEPS; i++) {
    float r = length(pos);
    if (r < 1.0) break;
    if (r > rEscape && dot(pos, vel) > 0.0) {
      escaped = true;
      break;
    }

    vec3 prevPos = pos;
    vec3 prevVel = vel;
    stepRK4(pos, vel, h2, STEP_SCALE * r);

    // 穿过盘面：主像、次像、三次像都在这里累积
    if (prevPos.y * pos.y < 0.0) {
      float t = prevPos.y / (prevPos.y - pos.y);
      vec3 hit = mix(prevPos, pos, t);
      float rHit = length(hit);
      if (rHit > uDiskInner && rHit < uDiskOuter) {
        vec4 disk = shadeDisk(hit, normalize(mix(prevVel, vel, t)), rHit, r0);
        color += transmittance * disk.a * disk.rgb;
        transmittance *= 1.0 - disk.a;
        if (transmittance < 0.01) break;
      }
    }
  }

  vec3 dirOut = normalize(transpose(uWorldToDisk) * vel);
  float footprint = max(length(dFdx(dirOut)), length(dFdy(dirOut)));
  if (escaped && uStars > 0.5) {
    color += transmittance * starfield(dirOut, footprint);
  }

  fragColor = vec4(color, 1.0);
}
