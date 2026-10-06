"""自动 patch tensorflowjs 4.22，使其在 Windows 上无需安装
tensorflow-decision-forests / jax 即可完成 Keras 模型转换。

所有替换均为幂等，可重复运行。安装依赖后执行：python patch.py
"""
import os
import sys

site_packages = None
for p in sys.path:
    if 'site-packages' in p:
        site_packages = p
        break

if not site_packages:
    print('未找到 site-packages，请在 venv 内运行')
    sys.exit(1)

print(f'site-packages: {site_packages}')


def patch_file(rel_path, old, new, marker):
    path = os.path.join(site_packages, rel_path)
    if not os.path.exists(path):
        print(f'跳过（文件不存在）: {rel_path}')
        return
    with open(path, 'r', encoding='utf-8') as fp:
        content = fp.read()
    if marker in content:
        print(f'无需 patch: {rel_path}')
        return
    if old not in content:
        print(f'警告：未找到预期内容，未修改: {rel_path}')
        return
    with open(path, 'w', encoding='utf-8') as fp:
        fp.write(content.replace(old, new, 1))
    print(f'已 patch: {rel_path}')


# 1) TFDF 仅用于 TFDF saved_model 转换，Keras 转换不需要；改为可选导入。
patch_file(
    os.path.join('tensorflowjs', 'converters', 'tf_saved_model_conversion_v2.py'),
    'import tensorflow_decision_forests',
    ('try:\n'
     '  import tensorflow_decision_forests\n'
     'except ImportError:\n'
     '  tensorflow_decision_forests = None'),
    'tensorflow_decision_forests = None',
)

# 2) JAX 转换模块（jax/flax）改为可选导入。
patch_file(
    os.path.join('tensorflowjs', 'converters', '__init__.py'),
    'from tensorflowjs.converters.jax_conversion import convert_jax',
    ('try:\n'
     '  from tensorflowjs.converters.jax_conversion import convert_jax\n'
     'except ImportError:\n'
     '  convert_jax = None'),
    'convert_jax = None',
)

# 3) 兼容老版本 tfjs 的 np.object（4.22 一般已无此问题，保留作幂等兜底）。
for rel in [os.path.join('tensorflowjs', 'read_weights.py'),
            os.path.join('tensorflowjs', 'write_weights.py')]:
    path = os.path.join(site_packages, rel)
    if not os.path.exists(path):
        print(f'跳过（文件不存在）: {rel}')
        continue
    with open(path, 'r', encoding='utf-8') as fp:
        content = fp.read()
    if 'np.object' not in content:
        print(f'无需 patch: {rel}')
    else:
        with open(path, 'w', encoding='utf-8') as fp:
            fp.write(content.replace('np.object', 'object'))
        print(f'已 patch: {rel}')

print('patch 完成')
