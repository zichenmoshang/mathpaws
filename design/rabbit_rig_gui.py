import bpy, bmesh, os
from mathutils import Matrix, Vector

# ===== 路径（相对仓库根目录自动定位，如需可改） =====
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(REPO_ROOT, "apps", "web", "src", "assets", "models", "pets", "rabbit.glb")
OUT = os.path.join(REPO_ROOT, "apps", "web", "src", "assets", "models", "pets", "rabbit_rigged.glb")

# 清空当前场景里的默认物体（不重置工程，保留 GUI 上下文）
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# 导入兔子
bpy.ops.import_scene.gltf(filepath=SRC)
ob = next(o for o in bpy.data.objects if o.type == 'MESH')
me = ob.data

# 脚底移到 z=0
bm = bmesh.new(); bm.from_mesh(me)
minz = min(v.co.z for v in bm.verts)
bmesh.ops.transform(bm, matrix=Matrix.Translation((0, 0, -minz)), verts=bm.verts[:])
bm.to_mesh(me); bm.free()
print("feet z0, minz was %.3f" % minz)

# ===== 建 humanoid 骨架 =====
arm_data = bpy.data.armatures.new("Rig")
arm = bpy.data.objects.new("Rig", arm_data)
bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones
def bone(name, h, t, parent=None):
    b = eb.new(name); b.head = Vector(h); b.tail = Vector(t)
    if parent: b.parent = eb[parent]
bone("hips", (0, 0, 0.55), (0, 0, 0.78))
bone("spine", (0, -0.02, 0.78), (0, -0.03, 1.02), "hips")
bone("chest", (0, -0.03, 1.02), (0, -0.03, 1.26), "spine")
bone("neck", (0, -0.02, 1.26), (0, -0.02, 1.44), "chest")
bone("head", (0, -0.02, 1.44), (0, -0.02, 1.72), "neck")
for s, x in (("L", -1), ("R", 1)):
    bone("upper_arm." + s, (0.26 * x, -0.02, 1.18), (0.38 * x, -0.02, 0.98), "chest")
    bone("lower_arm." + s, (0.38 * x, -0.02, 0.98), (0.43 * x, -0.02, 0.80), "upper_arm." + s)
    bone("hand." + s, (0.43 * x, -0.02, 0.80), (0.45 * x, -0.02, 0.72), "lower_arm." + s)
    bone("upper_leg." + s, (0.18 * x, 0, 0.60), (0.18 * x, 0, 0.32), "hips")
    bone("lower_leg." + s, (0.18 * x, 0, 0.32), (0.18 * x, -0.03, 0.10), "upper_leg." + s)
    bone("foot." + s, (0.18 * x, -0.03, 0.10), (0.18 * x, -0.12, 0.03), "lower_leg." + s)
bone("ear.L", (-0.20, -0.02, 1.58), (-0.25, -0.02, 1.92), "head")
bone("ear.R", (0.20, -0.02, 1.58), (0.25, -0.02, 1.92), "head")
bone("tail", (0, 0.16, 0.55), (0, 0.34, 0.42), "hips")
bpy.ops.object.mode_set(mode='OBJECT')
for b in arm.pose.bones:
    b.rotation_mode = 'XYZ'

# ===== 自动权重（GUI 下热权重可正确计算） =====
bpy.ops.object.select_all(action='DESELECT')
ob.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
cnt = sum(1 for v in me.vertices if any(g.weight > 0.01 for g in v.groups))
print("VERTS_WITH_WEIGHT %d of %d" % (cnt, len(me.vertices)))

# 导出（不覆盖原始 rabbit.glb）
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_skins=True)
print("RIG_READY, exported:", OUT)
print("请在 Layout 选中 Rig，Ctrl+Tab 进 Pose Mode 转动 head/neck/upper_leg 验证")
