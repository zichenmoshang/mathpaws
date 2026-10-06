"""Fix Keras 3 -> tfjs model.json incompatibilities after export (recursive)."""
import json, sys, os, re

WEIGHT_PREFIX_RE = re.compile(r'^sequential(?:_\d+)?/')

def walk_layers(layers):
    for layer in layers:
        cfg = layer.get('config', {})
        if layer.get('class_name') == 'InputLayer' and 'batch_shape' in cfg:
            cfg['batchInputShape'] = cfg.pop('batch_shape')
        # nested Sequential / Functional models store their own layers
        inner = cfg.get('layers')
        if isinstance(inner, list):
            walk_layers(inner)

def fix(model_dir):
    p = os.path.join(model_dir, 'model.json')
    with open(p, 'r', encoding='utf-8') as f:
        m = json.load(f)
    top = m['modelTopology']['model_config']['config']['layers']
    walk_layers(top)
    for manifest in m.get('weightsManifest', []):
        for w in manifest.get('weights', []):
            w['name'] = WEIGHT_PREFIX_RE.sub('', w['name'])
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(m, f, separators=(',', ':'))
    print(f'Fixed {p}')

if __name__ == '__main__':
    d = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), '..', '..', 'apps', 'web', 'public', 'models', 'mnist')
    fix(os.path.abspath(d))
