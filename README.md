# BlockHole

用 three.js 实时渲染 Schwarzschild 黑洞与吸积盘。在线地址：https://blackhole.huanan.app

fragment shader 逐像素反向积分光线，包含引力透镜、多普勒频移、引力红移、相对论集束，以及被透镜扭曲的程序化星空。

## 运行

```bash
npm install
npm run dev
```

## 发布

```bash
npm run deploy
```

## 参考

物理公式来自 Jingxian Wang 的文章与代码：

- [How black holes and accretion disks around them actually look](https://community.wolfram.com/t/how-black-holes-and-accretion-disks-around-them-actually-look/16274)
- [wjxway/Realistic_Blackhole_Accretion_Disk](https://github.com/wjxway/Realistic_Blackhole_Accretion_Disk)（MIT）

原实现是 Mathematica 的预计算查找表加正向投影；这里改成了 GLSL 里逐像素积分，星空和 Bloom 是额外加的。
