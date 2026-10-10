# 三路兵营战（W3C Fight）Stable Diffusion 素材生成指南

> 版本：v1.0
> 适用游戏：HTML5 Canvas 三路推塔游戏，魔兽争霸3风格，Q版侧视
> 单位在游戏中渲染约 50–80px 高（3倍缩放后），源精灵建议 256×256

---

## 目录

1. [通用风格规范与共享提示词](#1-通用风格规范与共享提示词)
2. [图片尺寸与精灵表规格](#2-图片尺寸与精灵表规格)
3. [16 个兵种精灵图提示词](#3-16-个兵种精灵图提示词)
4. [建筑素材提示词](#4-建筑素材提示词)
5. [UI 图标提示词](#5-ui-图标提示词)
6. [弹道与死亡特效参考图](#6-弹道与死亡特效参考图)
7. [SD 工作流建议](#7-sd-工作流建议)
8. [推荐模型与 LoRA](#8-推荐模型与-lora)
9. [外部辅助需求（音效/字体/粒子/BGM）](#9-外部辅助需求)
10. [素材命名规范](#10-素材命名规范)

---

## 1. 通用风格规范与共享提示词

### 1.1 美术风格定位

- **风格**：Q版/chibi 二头身，2D 游戏精灵图，魔兽争霸3那种"微缩兵人"质感
- **视角**：纯侧视（profile view），角色面朝右（facing right），敌方由游戏引擎水平翻转
- **线条**：简洁黑色描边（2–3px），色块为主，少量渐变高光
- **光源**：统一左上 45°，右下带软阴影
- **背景**：纯黑或纯品红（#FF00FF）底，方便后期色键抠图；**不要**生成透明背景，SD 生成透明图质量差
- **色彩**：饱和但不刺眼，每个兵种有明确的主识别色

### 1.2 通用正向提示词前缀（所有角色共用）

**中文：**
```
Q版二头身游戏精灵，chibi风格，魔兽争霸3微缩兵人质感，2D侧视图，角色面朝右侧站立，全身像，简洁黑色描边，色块平涂加少量渐变高光，统一左上光源，厚涂游戏原画风格，纯净背景，高分辨率，精致细节，游戏立绘
```

**English:**
```
chibi 2-heads-tall game sprite, warcraft 3 miniature unit style, 2D side profile view, character facing right, full body, clean black outline, flat colors with subtle gradient highlights, single light source from top-left, painted game art style, solid color background, high resolution, detailed, game character art
```

### 1.3 通用负面提示词

**中文：**
```
3D渲染，写实风格，照片，真人，复杂背景，风景，多人，透视变形，正面视角，背面视角，模糊，低分辨率，畸形肢体，多余手指，多余武器，文字，水印，签名，复杂装饰，过度渐变，噪点
```

**English:**
```
3D render, realistic, photorealistic, photo, human, complex background, landscape, multiple people, distorted perspective, front view, back view, blurry, low resolution, deformed limbs, extra fingers, extra weapons, text, watermark, signature, over-detailed, heavy gradient, noise
```

### 1.4 阵营配色规则

游戏中通过脚下光环 + 血条颜色区分阵营，**美术素材本身不区分阵营**，只生成一套"中立/我方蓝色调"基底，敌方由引擎着色（hue shift 到红色）或后期统一改色。

| 阵营 | 主色倾向 | 光环色 |
|---|---|---|
| 我方 | 蓝/银/白甲系 | #4FC3F7 |
| 敌方 | 红/暗红/黑甲系 | #EF5350 |

> **建议**：角色本体生成中性灰蓝甲，后期用 Photoshop 色相/饱和度统一批量改色，比单独生成两套省一半工作量。

---

## 2. 图片尺寸与精灵表规格

### 2.1 单帧与精灵表尺寸

| 素材类型 | 单帧尺寸 | 帧数 | 精灵表尺寸（横排） |
|---|---|---|---|
| 步兵类（刀盾/弓/法/近战升级） | 256×256 | idle 6 + attack 6 + move 6 + death 4 = 22 | 5632×256 |
| 攻城类（车/炮/火箭/特斯拉） | 320×256（车更宽） | idle 4 + attack 4 + move 4 + death 4 = 16 | 5120×256 |
| 防御塔 | 256×320 | idle 2 + attack 2 = 4 | 1024×320 |
| 基地 | 384×384 | idle 2 + damaged 2 = 4 | 1536×384 |
| 祭坛 | 256×320 | idle 2 | 512×320 |
| UI 图标 | 128×128 | 1 | 单图 |

### 2.2 精灵表排列约定

- **横排连续排列**，不分行，方便 Canvas 按帧索引切图
- 顺序固定：`idle 帧 1..n → attack 帧 1..n → move 帧 1..n → death 帧 1..n`
- 每帧之间留 8px 间距，避免后期切图时边缘染色
- 角色在每帧中**脚底对齐同一水平线**，身体居中偏上

### 2.3 生成参数基准

```
采样器: DPM++ 2M Karras 或 Euler a
步数: 25–30
CFG Scale: 7
尺寸: 512×512（生成后裁剪缩放到 256×256）
批量: 每次 4 张，挑选最佳
Hires.fix: 可选，R-ESRGAN 4x+，0.4 重绘幅度
```

---

## 3. 16 个兵种精灵图提示词

> 以下每个兵种给出：外观描述 + 角色正向提示词（追加在通用前缀之后）+ 各动作的姿势提示词。
> 通用前缀见 §1.2，下文不再重复。

### 3.1 基础兵种

---

#### 3.1.1 刀盾手（melee）

**外观定位**：重甲步兵，一手长剑一手圆盾，稳重前排。蓝银配色，棕色皮带，铁盔顶红缨。

**角色外观提示词（追加）：**
- 中文：`年轻男战士，蓝色铁盔带红色盔缨，银色胸甲，蓝色披风，左手持蓝色圆铁盾，右手持单手剑，棕色皮带，黑色短靴，勇敢表情`
- English: `young male warrior, blue iron helmet with red plume, silver breastplate, blue cape, holding a blue round iron shield in left hand, holding a one-handed sword in right hand, brown leather belt, black boots, brave expression`

**各动作姿势：**

| 动作 | 中文提示词追加 | English append | 帧数 |
|---|---|---|---|
| idle | `站立姿势，盾牌在身前，剑垂在身侧，呼吸动画微浮动` | `standing pose, shield in front, sword at side, subtle breathing idle` | 6 |
| attack | `挥剑横劈动作，从右向左砍出，身体前倾，盾牌微收` | `sword slash animation, horizontal swing from right to left, leaning forward, shield tucked` | 6 |
| move | `行走迈步，左腿前迈右腿后蹬，盾牌随步伐晃动` | `walking stride, left leg forward right leg back, shield swaying with steps` | 6 |
| death | `倒下动画，盾牌掉落，剑脱手，仰面倒地` | `death animation, shield drops, sword falls, collapsing backward` | 4 |

**生成参数**：512×512，CFG 7，30 步，每动作生成 6 张选最佳。

---

#### 3.1.2 弓手（archer）

**外观定位**：轻甲弓箭手，绿/棕游侠风，长弓，皮甲，兜帽。

**角色外观提示词：**
- 中文：`年轻女弓箭手，绿色兜帽，棕色皮甲，绿色短披风，背后箭壶插满箭，双手持木质长弓，精灵耳，灵巧眼神`
- English: `young female archer, green hood, brown leather armor, green short cape, quiver full of arrows on back, holding a wooden longbow, elf ears, agile eyes`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `站立，长弓竖持身前，头微抬，警觉` | `standing, longbow held vertically, head slightly up, alert` | 6 |
| attack | `拉弓射箭动作，右手勾弦拉到脸颊，左手推弓，箭指向右前方` | `drawing bow, right hand pulling string to cheek, left hand pushing bow, arrow pointing right-forward` | 6 |
| move | `轻盈行走，脚步快，弓横持身前` | `light walking, quick steps, bow held horizontally` | 6 |
| death | `弓脱手，跪倒后向前扑倒` | `bow drops, kneels then falls forward` | 4 |

---

#### 3.1.3 法师（mage）

**外观定位**：治疗系白袍法师，法杖带蓝水晶，温和。

**角色外观提示词：**
- 中文：`老年男法师，白色长胡须，蓝色尖顶法师帽，白色长袍镶金边，右手持木法杖顶端蓝色发光水晶，左手抬起施法姿态，睿智慈祥`
- English: `old male wizard, long white beard, blue pointed wizard hat, white robe with gold trim, holding a wooden staff with glowing blue crystal on top in right hand, left hand raised casting, wise kind face`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `站立，法杖拄地，左手自然垂下，长袍微动` | `standing, staff planted on ground, left hand resting, robe gently moving` | 6 |
| attack | `举起法杖，顶端水晶发光，左手向前推出施法` | `raising staff, crystal glowing at tip, left hand pushing forward casting spell` | 6 |
| move | `慢步前行，法杖随步伐轻点地，长袍摆动` | `slow walking, staff tapping ground, robe swaying` | 6 |
| death | `法杖倒地，双手垂下，缓缓跪下` | `staff falls, hands drop, slowly kneeling down` | 4 |

---

#### 3.1.4 攻城车（cannon）

**外观定位**：木质投石/火炮车，双轮，黑铁炮管，配重铁。

**角色外观提示词：**
- 中文：`中世纪木质攻城炮车，深棕色橡木车身，两个大木轮包铁边，黑色铸铁长炮管指向右前方，车身带铆钉和铁链，烟囱冒小烟，机械感`
- English: `medieval wooden siege cannon cart, dark oak wooden body, two large wooden wheels with iron rims, black cast iron long barrel pointing right-forward, rivets and chains on body, small chimney smoke, mechanical feel`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `静止停放，炮管微抬，烟囱轻烟` | `stationary, barrel slightly raised, thin smoke from chimney` | 4 |
| attack | `开炮后坐力，炮管向后缩，炮口闪光，轮子微震` | `firing recoil, barrel kicking back, muzzle flash, wheels jolting` | 4 |
| move | `缓慢前进，轮子转动，车身微晃` | `slowly moving forward, wheels rotating, body swaying` | 4 |
| death | `车身爆炸碎裂，轮子脱落，木板飞散，黑烟` | `exploding, wheels falling off, wood planks flying, black smoke` | 4 |

---

### 3.2 近战升级（3 个）

---

#### 3.2.1 斧头野蛮人（barbarian）

**外观定位**：狂战士，双持巨斧，赤裸上身，兽皮裙，怒脸，战纹。

**角色外观提示词：**
- 中文：`肌肉发达的男野蛮人，赤裸上身带蓝色战纹，棕色莫霍克发型，毛皮腰带和短裙，手腕骨镯，双手各持一把双刃大斧，怒吼表情，赤脚`
- English: `muscular male barbarian, bare chest with blue war paint, brown mohawk hairstyle, fur belt and loincloth, bone wristbands, holding a double-bladed battle axe in each hand, roaring expression, barefoot`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `双脚开立，双斧垂在两侧，胸口起伏喘气` | `feet apart, axes hanging at sides, chest heaving` | 6 |
| attack | `双斧交叉劈下，跳跃下劈动作，怒吼` | `dual axes crossing and slamming down, jumping overhead chop, roaring` | 6 |
| move | `大步奔跑，双斧随身体晃动，前倾冲锋` | `running strides, axes swaying, leaning forward charging` | 6 |
| death | `双斧落地，向前扑倒，趴在地上` | `axes drop, falling forward, face down on ground` | 4 |

---

#### 3.2.2 圣骑士（paladin）

**外观定位**：圣光骑士，金白重甲，圣光剑，十字架纹章，威严。

**角色外观提示词：**
- 中文：`圣洁男圣骑士，全身金色板甲带白色披风，银色头盔带金色十字纹章，右手持发光圣光长剑，左手持刻有十字架的银盾，背后圣光光环，庄严表情`
- English: `holy male paladin, full golden plate armor with white cape, silver helmet with gold cross emblem, holding a glowing holy longsword in right hand, holding a silver shield engraved with cross, holy halo behind, solemn expression`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `站立，剑竖拄地，盾在胸前，微光环绕` | `standing, sword planted on ground, shield at chest, faint glow around` | 6 |
| attack | `圣光剑下劈，剑身发光，盾向前顶` | `holy sword downward slash, blade glowing, shield thrust forward` | 6 |
| move | `重甲行走，步伐稳重，披风飘动` | `heavy armor walking, steady steps, cape flowing` | 6 |
| death | `剑断，盾掉落，单膝跪地后倒下，光环消散` | `sword breaks, shield drops, kneels then falls, halo fading` | 4 |

---

#### 3.2.3 格斗家（fighter）

**外观定位**：武术家，轻装，拳套，敏捷，发带。

**角色外观提示词：**
- 中文：`年轻男格斗家，蓝色武道服，白色腰带，红色头带飘带，双手缠白色拳击绑带，赤手空拳，站姿马步，锐利眼神，黑短发`
- English: `young male martial artist, blue martial arts uniform, white belt, red headband with flowing tails, white hand wraps on both fists, bare-handed, fighting stance, sharp eyes, black short hair`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `马步站，双拳抬起护脸，重心下沉` | `horse stance, fists up guarding face, low center of gravity` | 6 |
| attack | `直拳出击，右拳快速打出，身体拧转` | `straight punch, right fist thrown fast, body twisting` | 6 |
| move | `快速冲刺滑步，前手护脸后手蓄力` | `quick dash step, front hand guarding face, rear hand coiled` | 6 |
| death | `被击飞，向后飞出倒地，尘土扬起` | `knocked flying, falling backward, dust rising` | 4 |

---

### 3.3 弓手升级（3 个）

---

#### 3.3.1 火枪手（musketeer）

**外观定位**：近代火枪兵，双排扣军装，燧发枪，三角帽。

**角色外观提示词：**
- 中文：`中年男火枪手，深蓝色双排扣军装，白色马裤，黑色三角帽，白色手套，双手持棕色燧发长枪，腰间火药袋，冷峻表情，小胡子`
- English: `middle-aged male musketeer, dark blue double-breasted military coat, white breeches, black tricorn hat, white gloves, holding a brown flintlock musket, powder horn at waist, stern expression, mustache`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `站立，火枪竖在身侧，目光平视` | `standing, musket held vertically at side, looking forward` | 6 |
| attack | `举枪瞄准射击，枪托抵肩，枪口闪光` | `aiming and firing, stock against shoulder, muzzle flash` | 6 |
| move | `行军步伐，火枪扛在肩上` | `marching, musket resting on shoulder` | 6 |
| death | `火枪掉落，向后仰倒` | `musket drops, falling backward` | 4 |

---

#### 3.3.2 游侠（ranger）

**外观定位**：精灵游侠，长弓，绿斗篷，优雅。

**角色外观提示词：**
- 中文：`精灵男游侠，深绿色长斗篷带兜帽，棕色皮甲，金色长发，精灵尖耳，双手持精致长弓嵌银纹，背后箭壶，冷静眼神，轻盈身材`
- English: `elf male ranger, dark green long cloak with hood, brown leather armor, long blond hair, pointed elf ears, holding an ornate longbow with silver inlay, quiver on back, calm eyes, slender build`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `站立，长弓横持，风吹斗篷` | `standing, longbow held horizontally, wind blowing cloak` | 6 |
| attack | `满弦拉弓，瞄准右上方，箭已搭好` | `fully drawing bow, aiming upper right, nocked arrow` | 6 |
| move | `林间轻快步伐，斗篷下摆飘动` | `light forest walking, cloak hem flowing` | 6 |
| death | `弓断，缓慢跪倒，斗篷盖身` | `bow snaps, slowly kneeling, cloak covering body` | 4 |

---

#### 3.3.3 破甲弩手（crossbow）

**外观定位**：重弩手，金属重甲弩，短弩臂，机械感。

**角色外观提示词：**
- 中文：`矮壮男弩手，灰色链甲外套，铁盔，双手持大型钢制重弩带绞盘结构，腰间挂弩箭，冷峻，短胡子`
- English: `stocky male crossbowman, gray chainmail under coat, iron helmet, holding a large steel heavy crossbow with winch mechanism, bolts at waist, stern, short beard`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `站立，重弩斜挎在身前` | `standing, heavy crossbow held diagonally in front` | 6 |
| attack | `扣机发射，弩箭飞出，弩身微震` | `trigger pull firing, bolt released, crossbow jolting` | 6 |
| move | `沉重步伐，弩随身体上下颠` | `heavy steps, crossbow bobbing with body` | 6 |
| death | `弩砸地，倒地` | `crossbow smashing on ground, falling` | 4 |

---

### 3.4 法师升级（3 个）

---

#### 3.4.1 奥战法（arcane）

**外观定位**：奥术法师，紫蓝魔法，悬浮奥术球，法阵。

**角色外观提示词：**
- 中文：`年轻男奥术师，紫色尖顶帽，紫蓝色长袍镶星纹，右手持法杖顶端悬浮紫色奥术球，左手张开掌心有紫色魔法阵，神秘眼神，深色短发`
- English: `young male arcanist, purple pointed hat, violet-blue robe with star patterns, holding a staff with floating purple arcane orb on top in right hand, left hand open with purple magic circle on palm, mysterious eyes, dark short hair`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `站立，奥术球在杖顶旋转浮动` | `standing, arcane orb floating and rotating on staff tip` | 6 |
| attack | `推出奥术飞弹，左手前伸，紫色光球飞出` | `launching arcane missile, left hand extended, purple orb flying out` | 6 |
| move | `漂浮般前行，脚不沾地，袍角飘起` | `walking as if floating, feet not touching ground, robe hem lifting` | 6 |
| death | `奥术球爆裂，法师化为紫色光点消散` | `arcane orb bursting, mage dissolving into purple sparks` | 4 |

---

#### 3.4.2 冰法（ice）

**外观定位**：冰雪法师，冰蓝长袍，冰晶法杖，寒气。

**角色外观提示词：**
- 中文：`女性冰法师，白色长辫，冰蓝色长袍带白色毛边，头戴冰晶皇冠，右手持冰晶法杖顶端蓝色雪花结晶，左手呼出寒气，清冷眼神，蓝白色调`
- English: `female ice mage, long white braid, ice-blue robe with white fur trim, wearing an ice crystal crown, holding an ice crystal staff with blue snowflake crystal on top in right hand, left hand exhaling cold mist, cold elegant eyes, blue-white color palette`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `站立，杖顶雪花缓缓旋转，周围飘小雪花` | `standing, snowflake on staff slowly rotating, small snowflakes around` | 6 |
| attack | `举起法杖释放冰锥，前方冰晶生成` | `raising staff releasing ice shards, ice crystals forming in front` | 6 |
| move | `轻盈行走，脚下留下冰痕` | `light walking, leaving frost trail under feet` | 6 |
| death | `身体碎成冰块散落` | `body shattering into ice pieces` | 4 |

---

#### 3.4.3 暗火法（fire/darkfire）

**外观定位**：暗黑火焰术士，暗红黑袍，黑火，骷髅召唤。

**角色外观提示词：**
- 中文：`神秘男暗火术士，黑色兜帽遮住半脸，暗红色长袍带黑色火焰纹，右手持黑铁法杖顶端燃烧黑红色火焰，左手掌心冒黑烟，眼睛发光红，阴森`
- English: `mysterious male dark warlock, black hood covering half face, dark red robe with black flame patterns, holding an iron staff with black-red flame burning on top in right hand, left palm emitting black smoke, glowing red eyes, sinister`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `站立，黑火在杖顶跳动，黑烟袅袅` | `standing, black flame dancing on staff, black smoke curling` | 6 |
| attack | `甩出黑火球，左手前推，火焰拖尾` | `throwing black fireball, left hand pushing forward, flame trail` | 6 |
| move | `滑行前行，脚下留焦痕` | `gliding forward, scorch marks under feet` | 6 |
| death | `身体化为黑灰飞散，火焰熄灭` | `body turning to black ash, flame extinguishing` | 4 |

---

### 3.5 攻城升级（3 个）

---

#### 3.5.1 火箭炮（rocket）

**外观定位**：多管火箭发射车，金属车架，火箭弹巢。

**角色外观提示词：**
- 中文：`现代风格多管火箭炮车，橄榄绿色金属车架，四个橡胶轮，车顶倾斜安装四联装火箭发射巢，露出四枚尖头火箭弹，车身带铆钉和警示条纹`
- English: `modern style multi-barrel rocket launcher vehicle, olive green metal frame, four rubber wheels, roof tilted with quad rocket pod, four pointed rockets exposed, rivets and warning stripes on body`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `停放，发射巢仰角，火箭弹待命` | `parked, launcher pod tilted up, rockets on standby` | 4 |
| attack | `齐射两枚火箭，尾焰喷出，车身后座` | `firing two rockets, exhaust flames, vehicle recoiling` | 4 |
| move | `缓慢前进，轮子转动` | `slowly moving forward, wheels rotating` | 4 |
| death | `发射巢爆炸，火箭殉爆，火球` | `launcher exploding, rockets detonating, fireball` | 4 |

---

#### 3.5.2 特斯拉（tesla）

**外观定位**：特斯拉电磁塔/车，电弧，线圈，科技感。

**角色外观提示词：**
- 中文：`黄铜色特斯拉电塔车，维多利亚蒸汽朋克风格，车架上两个铜线圈塔，顶端金属球之间跳跃蓝色电弧，仪表盘和玻璃真空管，黄铜齿轮装饰`
- English: `brass tesla coil vehicle, Victorian steampunk style, two copper coil towers on frame, blue electric arcs jumping between top metal spheres, gauges and glass vacuum tubes, brass gear decorations`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `停放，线圈间持续跳动小电弧` | `parked, small arcs continuously jumping between coils` | 4 |
| attack | `释放强电弧，一道粗壮闪电击向右侧，光效刺眼` | `discharging strong arc, thick lightning bolt striking right, bright flash` | 4 |
| move | `缓慢前行，电弧随车身晃动` | `slowly moving forward, arcs swaying with vehicle` | 4 |
| death | `线圈爆裂，玻璃碎裂，电火花四溅后熄灭` | `coils bursting, glass shattering, sparks flying out then dying` | 4 |

---

#### 3.5.3 攻城炮（siege）

**外观定位**：重型攻城加农炮，铁炮管，炮架，巨大。

**角色外观提示词：**
- 中文：`超重型攻城加农炮，黑色粗大铸铁炮管，黄铜炮箍，厚重木质炮架，四个铁边木轮，炮口巨大，旁边弹药箱，威严厚重`
- English: `super heavy siege cannon, thick black cast iron barrel, brass barrel bands, heavy wooden gun carriage, four iron-rimmed wooden wheels, massive muzzle, ammunition crate beside, imposing and heavy`

**各动作：**

| 动作 | 中文 | English | 帧数 |
|---|---|---|---|
| idle | `停放，炮管平指右方` | `parked, barrel pointing right horizontally` | 4 |
| attack | `开炮，巨大炮口闪光和浓烟，炮身后座，轮子跳起` | `firing, massive muzzle flash and smoke, carriage recoiling, wheels lifting` | 4 |
| move | `极慢前进，轮子沉重转动` | `very slow forward, wheels turning heavily` | 4 |
| death | `炮管炸裂，炮架散架，浓烟大火` | `barrel bursting, carriage collapsing, heavy smoke and fire` | 4 |

---

## 4. 建筑素材提示词

### 4.1 防御塔（tower）

**通用外观**：中世纪石塔，尖顶，射箭孔。

**正向提示词（追加在通用前缀后，建筑类去掉角色描述）：**
- 中文：`中世纪石制防御箭塔，灰色石块砌成，锥形红瓦尖顶，一层木质门楼带铁门，二层射箭窗，塔顶小旗，基座石台阶，侧面视角`
- English: `medieval stone defense arrow tower, gray stone masonry, conical red tile roof, wooden gatehouse with iron door on first floor, arrow slits on second floor, small flag on top, stone steps at base, side view`

**动作帧：**

| 帧 | 中文 | English |
|---|---|---|
| idle 1 | `静止，小旗飘动` | `stationary, small flag waving` |
| idle 2 | `静止，旗帜角度变化` | `stationary, flag at different angle` |
| attack 1 | `塔顶炮口闪光，向下发射` | `muzzle flash from top, firing downward` |
| attack 2 | `烟从塔顶冒出` | `smoke rising from tower top` |

**尺寸**：256×320。我方蓝灰石，敌方红灰石（后期色相调整）。

---

### 4.2 基地（base）

**通用外观**：城堡主堡，大门，双塔楼。

**正向提示词：**
- 中文：`中世纪城堡主堡，灰色石墙，中央拱形大门包铁皮，左右两个圆塔楼，深蓝色旗帜，城垛，整体侧面视角，宏伟`
- English: `medieval castle keep, gray stone walls, central arched iron-plated gate, two round towers on sides, dark blue flags, battlements, overall side view, grand`

**动作帧：**

| 帧 | 中文 | English |
|---|---|---|
| idle 1 | `完整城堡，旗帜飘扬` | `intact castle, flags flying` |
| idle 2 | `完整城堡，旗帜另一角度` | `intact castle, flags at another angle` |
| damaged 1 | `城墙有裂缝，一个塔楼冒烟，旗帜破洞` | `cracked walls, one tower smoking, torn flag` |
| damaged 2 | `半边墙塌，碎石堆，大火燃烧` | `half wall collapsed, rubble pile, burning fire` |

**尺寸**：384×384。

---

### 4.3 祭坛（altar）

**通用外观**：圆形石祭坛，符文，召唤光圈。

**正向提示词：**
- 中文：`古老石制召唤祭坛，圆形灰色石台，台上刻蓝色发光符文，四角小石柱，中央蓝色魔法光圈升起，侧面视角，神秘`
- English: `ancient stone summoning altar, circular gray stone platform, glowing blue runes carved on top, small stone pillars at four corners, blue magic circle rising in center, side view, mysterious`

**动作帧：**

| 帧 | 中文 | English |
|---|---|---|
| idle 1 | `符文微光，光圈缓慢旋转` | `runes faintly glowing, magic circle slowly rotating` |
| idle 2 | `符文明亮一度，光圈升起更高` | `runes brighter, magic circle rising higher` |

**尺寸**：256×320。我方蓝光，敌方红光（后期改色）。

---

## 5. UI 图标提示词

> 图标统一风格：正方形，Q版图标，居中构图，深色底或透明底，128×128。
> 通用图标前缀：`游戏UI图标，Q版，正方形居中，简洁清晰，深色背景，游戏道具图标风格，high quality game icon, chibi, centered, dark background`

### 5.1 四个基础兵种图标

| 图标 | 中文提示词 | English |
|---|---|---|
| 刀盾手图标 | `小盾牌和交叉剑，蓝色调` | `small shield and crossed sword, blue tone` |
| 弓手图标 | `木长弓和一支箭，绿色调` | `wooden longbow and an arrow, green tone` |
| 法师图标 | `法杖顶端蓝水晶发光` | `staff with glowing blue crystal` |
| 攻城车图标 | `小炮车侧面，黑烟` | `small cannon cart side view, smoke` |

### 5.2 十二个高级兵种图标

| 图标 | 提示词 |
|---|---|
| 野蛮人 | `交叉双斧，棕色毛皮，战斗感` |
| 圣骑士 | `金色剑盾带十字，圣光环绕` |
| 格斗家 | `交叉拳套，红色头带飘带` |
| 火枪手 | `燧发枪，火焰枪口` |
| 游侠 | `精致长弓，银纹，绿斗篷一角` |
| 破甲弩手 | `钢制重弩，弩箭` |
| 奥战法 | `悬浮紫色奥术球，魔法阵` |
| 冰法 | `蓝色雪花冰晶，雪花结晶` |
| 暗火法 | `黑色火焰，骷髅头` |
| 火箭炮 | `火箭发射巢，尾焰` |
| 特斯拉 | `铜线圈间蓝色闪电` |
| 攻城炮 | `巨大炮管，黄铜箍` |

### 5.3 技能图标（约 20 个）

| 技能 | 图标提示词 |
|---|---|
| 双击（刀盾） | `两把剑交叉闪电` |
| 反射（刀盾） | `盾牌反弹箭头特效` |
| 毒箭（弓） | `绿色毒箭，毒液滴落` |
| 后跳（弓） | `向后跳的弧形箭头` |
| 治疗术（法） | `金色十字光环，爱心` |
| 溅射（攻城车） | `爆炸波纹，碎石` |
| 旋风斩（野蛮人） | `旋转双斧，旋风轨迹` |
| 圣光庇护（圣骑士） | `金色盾牌光罩` |
| 一闪（格斗家） | `快速剑影，白色光痕` |
| 穿透射击（火枪） | `子弹穿过多个靶` |
| 箭雨（游侠） | `从天而降的箭群` |
| 连发（弩手） | `快速连弩，多支箭` |
| 变羊（奥法） | `紫色法阵里一只羊` |
| 群体护盾（奥法） | `蓝色护盾罩住多人` |
| 暴风雪（冰法） | `雪花漩涡，冰锥` |
| 暗炎爆发（暗火法） | `黑色火焰爆炸` |
| 火箭突袭（火箭炮） | `火箭从天而降` |
| 眩晕3连（特斯拉） | `三道闪电，星星眩晕` |
| 重击2连（攻城炮） | `炮弹两连，地裂` |
| 奥术闪现（奥法） | `紫色传送门残影` |

### 5.4 Buff 图标（5 个阵营加成）

| Buff | 提示词 |
|---|---|
| 四系齐全（攻+15%） | `四面旗帜交汇，金色加号` |
| 近战齐全（反弹10%） | `盾牌反弹箭头，近战系` |
| 弓手齐全（攻速+10%） | `三支箭，时钟，绿色` |
| 法师齐全（血+15%） | `心形，蓝色水晶` |
| 攻城齐全（出兵-2s） | `沙漏，红色，攻城锤` |

---

## 6. 弹道与死亡特效参考图

> 这些不是精灵帧，而是**参考图**，用于后期在 Canvas 里手绘粒子时找配色和形状灵感，或直接作为贴图使用。
> 风格：纯黑底，中心发光物体，无背景。

### 6.1 弹道特效

| 特效 | 提示词 |
|---|---|
| 普通箭矢 | `一支木箭飞行，带轻微白色拖尾，侧视，黑底` |
| 毒箭 | `绿色毒箭，绿色毒液滴落，绿色光晕` |
| 子弹（火枪） | `黄铜子弹飞行，白色闪光拖尾` |
| 炮弹（攻城车） | `黑色圆球炮弹飞行，橙红火尾，冒烟` |
| 火箭 | `红色火箭弹，喷射火焰尾焰，白烟` |
| 闪电（特斯拉） | `蓝色锯齿形闪电，分叉，发光` |
| 奥术飞弹 | `紫色光球飞行，紫色尾迹拖尾` |
| 冰锥 | `透明蓝色冰锥，冰晶棱角` |
| 黑火球 | `黑色火球，边缘暗红火焰，黑烟` |
| 圣光剑刃光 | `金色剑形光刃，发光拖尾` |

### 6.2 死亡特效

| 特效 | 提示词 |
|---|---|
| 普通死亡 | `白色闪光粒子消散，黑底` |
| 爆炸死亡 | `橙红色火球爆开，冲击波环，黑烟` |
| 冰碎死亡 | `蓝色冰块碎裂，冰晶飞散` |
| 奥术消散 | `紫色光点向上升空消散` |
| 黑火化灰 | `黑色灰烬飘落，火星` |
| 重伤跪地 | `角色单膝跪地，头顶小魂灵飘起（可选）` |

---

## 7. SD 工作流建议

### 7.1 批量生成策略

1. **先定角色基准**：每个兵种先生成 1 张满意的 idle 站立图，作为"角色锚点"
2. **动作复用**：用这张锚点图作为 img2img 的输入（重绘幅度 0.55–0.65），只改动作描述词，保证角色外观一致
3. **批量出图**：每个动作一次出 4 张，选最满意的
4. **后期统一**：所有选定帧导入 Photoshop / Aseprite，统一调色、对齐脚底、裁剪

### 7.2 ControlNet 保持姿势一致

**强烈建议启用 ControlNet**，否则 SD 生成的同一角色每帧长相差异巨大，动画会鬼畜。

推荐 ControlNet 组合：
- **OpenPose**：锁定人体骨骼姿势。先画一张关键姿势骨架图，所有帧都用这个骨架约束，保证动作流畅
- **Lineart / Soft Edge**：锁定角色轮廓线，保证服装、武器造型一致
- **Reference Only (IP-Adapter)**：把满意的那张角色图作为 IP-Adapter 参考，权重 0.6–0.7，强制保持角色长相

**推荐流程**：
1. 生成满意的 idle 图 → 提取它的 OpenPose 骨架
2. 攻击/移动/死亡帧：用同一骨架 + 不同动作描述 + IP-Adapter 参考图
3. 每帧之间姿势是连贯的（手绘关键帧姿势图，用 OpenPose 渲染）

### 7.3 动画帧一致性技巧

- **帧间过渡**：相邻两帧用 img2img，重绘幅度 0.3，保持大体一致只改局部
- **固定种子**：同一角色的所有帧尽量用同一 seed，只改动作词
- **Color Matching**：后期用 Photoshop 的"匹配颜色"功能，把所有帧对齐到基准帧的色调

### 7.4 去背景与裁剪

1. SD 生成时用**纯黑底**或**纯品红底**（#FF00FF）
2. 用 [rembg](https://github.com/danielgatis/rembg)（AI 抠图）批量去背景
3. 导入 Aseprite 或 Photoshop：
   - 裁剪到内容包围盒
   - 统一缩放到 256×256（攻城车 320×256）
   - 脚底对齐同一水平线（y = 220 左右）
   - 导出 PNG 序列，再拼接成 sprite sheet

---

## 8. 推荐模型与 LoRA

### 8.1 底模推荐

| 模型 | 特点 | 适用场景 |
|---|---|---|
| **Anything V5 / Anything V4** | 二次元风格强，线条干净 | Q版角色首选 |
| **Counterfeit V3** | 精致二次元，色彩饱和 | 角色立绘 |
| **MeinaMix** | 动漫+厚涂混合，柔和 | 偏厚涂质感 |
| **SDXL 1.0 + 二次元 LoRA** | 分辨率高，细节好 | 建筑、图标 |
| **DreamShaper 8** | 半写实半卡通，风格折中 | 攻城车、机械类 |

> **推荐组合**：角色用 Anything V5（512×512），建筑和图标用 SDXL（1024×1024）。

### 8.2 推荐 LoRA

| LoRA | 用途 |
|---|---|
| `chibi style` / `2-heads character` | 固定 Q版二头身比例 |
| `game sprite` / `pixel art` | 强化游戏精灵图质感 |
| `warcraft style` | 魔兽争霸风格参考 |
| `side view character` | 强制侧视图 |
| `flat colors / cel shading` | 色块平涂赛璐璐着色 |
| `mechanical / steampunk` | 攻城车、特斯拉机械类 |

LoRA 权重建议 0.6–0.8，不要太高否则压过主体描述。

### 8.3 VAE 推荐

- `Anything V4 VAE` 或 `OrangeMix VAE`：让颜色更通透

---

## 9. 外部辅助需求

### 9.1 音效清单（约 30 个）

| 类别 | 音效 | 文件名建议 |
|---|---|---|
| **攻击音** | 挥剑 | `sword_swing_1.mp3` |
| | 射箭 | `bow_shoot_1.mp3` |
| | 火枪射击 | `gunshot_1.mp3` |
| | 法术释放 | `cast_magic_1.mp3` |
| | 大炮开炮 | `cannon_fire_1.mp3` |
| | 闪电电击 | `tesla_zap_1.mp3` |
| **死亡音** | 普通死亡 | `death_normal_1.mp3` |
| | 爆炸死亡 | `death_explode_1.mp3` |
| | 冰冻碎裂 | `death_ice_1.mp3` |
| | 燃烧化灰 | `death_burn_1.mp3` |
| **技能音** | 治疗术 | `heal_1.mp3` |
| | 圣光 | `holy_light_1.mp3` |
| | 暴风雪 | `blizzard_1.mp3` |
| | 箭雨 | `arrow_rain_1.mp3` |
| | 旋风斩 | `whirlwind_1.mp3` |
| | 闪现 | `blink_1.mp3` |
| **UI 音** | 按钮点击 | `ui_click_1.mp3` |
| | 建造完成 | `ui_build_1.mp3` |
| | 解锁栏位 | `ui_unlock_1.mp3` |
| | 金币获得 | `ui_gold_1.mp3` |
| | 错误提示 | `ui_error_1.mp3` |
| **胜负音** | 胜利号角 | `victory_fanfare.mp3` |
| | 失败低沉 | `defeat_sad.mp3` |
| | 基地被攻击警报 | `base_alert_1.mp3` |
| **环境音** | 战场底噪（可选） | `battle_ambient.mp3` |
| **其他** | 金币掉落 | `coin_drop_1.mp3` |
| | 升级叮 | `level_up_1.mp3` |
| | 复活完成 | `revive_done_1.mp3` |
| | 塔被摧毁 | `tower_destroy_1.mp3` |
| | 英雄转职 | `promote_1.mp3` |

> 推荐素材站：freesound.org、zapsplat、itch.io（免费游戏音效包）。

### 9.2 字体推荐

| 用途 | 推荐字体 | 说明 |
|---|---|---|
| 游戏标题 | **站酷快乐体 / 思源黑体 Bold** | 粗、醒目 |
| UI 正文 | **思源黑体 Regular / 微软雅黑** | 清晰易读 |
| 数字/金币 | **DIN Alternate / Roboto Mono** | 等宽数字 |
| 技能名（点缀） | **方正字迹 / 汉仪粗黑** | 有游戏感 |
| 战斗日志 | 思源黑体 Light | 小字不抢戏 |

> 全部用免费可商用字体，避免版权问题。

### 9.3 粒子特效需求清单

| 粒子 | 用途 |
|---|---|
| 爆炸火球 | 攻城车死亡、火箭、炮击 |
| 闪电链 | 特斯拉 |
| 治疗光晕 | 法师治疗、圣骑士回血 |
| 毒雾绿泡 | 毒箭 |
| 雪花冰晶 | 冰法暴风雪 |
| 黑火余烬 | 暗火法 |
| 奥术紫光点 | 奥战法 |
| 圣光金光 | 圣骑士大招 |
| 箭矢轨迹 | 弓手射击拖尾 |
| 尘土飞扬 | 格斗家冲锋、攻城车移动 |
| 死亡魂灵 | 单位死亡时小灵魂上升 |
| 护盾光圈 | 群体护盾、冰霜护盾 |
| 眩晕星星 | 被击晕单位头顶旋转星星 |
| 暴击闪光 | 暴击时数字旁闪光 |

> Canvas 实现：用 `requestAnimationFrame` + 粒子数组，每粒子有 x/y/vx/vy/life/color/size。

### 9.4 BGM 推荐风格

- **战斗主 BGM**：史诗管弦乐，参考《魔兽争霸3》人类/兽人战斗曲，节奏快，铜管+鼓点
- **首页/菜单 BGM**：舒缓一点的奇幻风，竖琴+长笛
- **胜利**：号角齐鸣，参考帝国时代胜利音乐
- **失败**：低沉弦乐

推荐免费 BGM 站：
- OpenGameArt.org（CC0 游戏音乐）
- Kevin MacLeod（incompetech.com，CC BY）
- itch.io 免费音乐包

---

## 10. 素材命名规范

### 10.1 文件命名规则

```
{阵营}_{兵种代号}_{动作}_{帧号}.png
```

- **阵营**：`ally`（我方）/ `enemy`（敌方）/ `neutral`（中立，未改色前）
- **兵种代号**：用英文小写，见下表
- **动作**：`idle` / `attack` / `move` / `death`
- **帧号**：3 位数字，从 001 开始

### 10.2 兵种代号表

| 兵种 | 代号 |
|---|---|
| 刀盾手 | `melee` |
| 弓手 | `archer` |
| 法师 | `mage` |
| 攻城车 | `cannon` |
| 野蛮人 | `barbarian` |
| 圣骑士 | `paladin` |
| 格斗家 | `fighter` |
| 火枪手 | `musketeer` |
| 游侠 | `ranger` |
| 破甲弩手 | `crossbow` |
| 奥战法 | `arcane` |
| 冰法 | `ice` |
| 暗火法 | `fire`（或 `darkfire`） |
| 火箭炮 | `rocket` |
| 特斯拉 | `tesla` |
| 攻城炮 | `siege` |

### 10.3 命名示例

```
neutral_melee_idle_001.png
neutral_melee_idle_002.png
neutral_melee_attack_001.png
neutral_archer_move_003.png
neutral_cannon_death_001.png

ally_tower_idle_001.png
enemy_base_damaged_001.png
neutral_altar_idle_001.png

icon_melee.png
icon_barbarian.png
skill_whirlwind.png
buff_melee_set.png

fx_arrow_trail.png
fx_explosion.png
```

### 10.4 目录结构建议

```
assets/
├── sprites/
│   ├── units/
│   │   ├── melee/
│   │   ├── archer/
│   │   └── ...
│   ├── buildings/
│   │   ├── tower/
│   │   ├── base/
│   │   └── altar/
│   └── summons/
│       ├── golem/
│       └── skeleton/
├── icons/
│   ├── units/
│   ├── skills/
│   └── buffs/
├── fx/
│   ├── projectiles/
│   └── death/
├── audio/
│   ├── attack/
│   ├── death/
│   ├── skills/
│   ├── ui/
│   └── bgm/
└── fonts/
```

---

## 附录：快速启动 Checklist

- [ ] 选定底模（推荐 Anything V5）+ 安装 chibi/game sprite LoRA
- [ ] 先生成刀盾手 idle 基准图，确认风格满意
- [ ] 用 IP-Adapter + ControlNet OpenPose 流程生成刀盾手全套 22 帧
- [ ] 确认帧间动画流畅后，批量推进其余 15 个兵种
- [ ] 生成防御塔/基地/祭坛
- [ ] 生成 16 个兵种图标 + 20 技能图标 + 5 buff 图标
- [ ] 统一去背景、裁剪、对齐、拼接 sprite sheet
- [ ] 批量色相改色生成敌方版本
- [ ] 整理音效、BGM、字体到 assets 目录
- [ ] 在游戏代码中按 `{unit}_{action}_{frame}` 加载

---

> 本文档所有提示词可直接复制粘贴到 Stable Diffusion 提示词框使用。建议先用少量图测试风格，再批量生成，避免返工。
