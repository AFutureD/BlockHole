import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
import { BlackHoleMaterial } from './blackhole/BlackHoleMaterial'
import { createGUI } from './gui'
import { CAMERA_DISTANCE, CAMERA_ELEVATION_DEG, CAMERA_FOV, params } from './params'
import { createPostProcessing } from './postprocessing'
import './styles.css'

const canvas = document.querySelector<HTMLCanvasElement>('#app')!
const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })

// 这个相机只提供位姿，射线在 shader 里重建；位置单位为 Rs
const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 1000)
const elevation = MathUtils.degToRad(CAMERA_ELEVATION_DEG)
camera.position.set(0, CAMERA_DISTANCE * Math.sin(elevation), CAMERA_DISTANCE * Math.cos(elevation))

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false
// 静止观察者只存在于视界之外
controls.minDistance = 2
controls.maxDistance = 60

// 覆盖全屏的单个三角形
const geometry = new BufferGeometry()
geometry.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
const material = new BlackHoleMaterial(camera)
const mesh = new Mesh(geometry, material)
mesh.frustumCulled = false
const scene = new Scene()
scene.add(mesh)

const post = createPostProcessing(renderer, scene, new Camera())

function resize(): void {
  const width = window.innerWidth
  const height = window.innerHeight
  const pixelRatio = Math.min(window.devicePixelRatio, 2) * params.renderScale
  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(width, height)
  post.composer.setPixelRatio(pixelRatio)
  post.composer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function applyParams(): void {
  material.applyParams(params)
  post.applyParams(params)
  if (renderer.getPixelRatio() !== Math.min(window.devicePixelRatio, 2) * params.renderScale) resize()
}

createGUI(params, applyParams)
applyParams()
resize()
window.addEventListener('resize', resize)

const stats = new Stats()
document.body.appendChild(stats.dom)

const timer = new Timer()
timer.connect(document)

renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp)
  // 盘面时间，单位 Rs/c
  material.uniforms.uTime.value += timer.getDelta() * params.rotationSpeed
  controls.update()
  camera.updateMatrixWorld()
  post.composer.render()
  stats.update()
})
