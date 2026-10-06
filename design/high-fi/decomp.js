/* Seedream 5.0 Pro layer_decomposition: extract semantic UI layers from a
 * high-fidelity design image (see docs/design/hifi-ui-extraction-spec.md).
 * CLI argv cannot carry a ~300KB base64 data URI (Windows 32K command-line
 * limit), so this wrapper reads the file itself. Key comes ONLY from
 * process.env.AGENT_PLAN_API_KEY; nothing is printed or persisted.
 * Usage: node decomp.js <input.png> <outDir> [prompt]
 */
const fs = require('fs');
const path = require('path');
const ROUTING = path.join(
  __dirname, '..', '..', '.trae', 'skills', 'byted-ark-seedream-skill',
  'scripts', 'model-routing.js'
);
const { prepareParams, buildRequestBody } = require(ROUTING);
const ENDPOINT = 'https://ark.cn-beijing.volces.com/api/plan/v3/images/generations';

(async () => {
  const [input, outDir, promptArg] = [process.argv[2], process.argv[3], process.argv[4]];
  if (!input || !outDir) { console.error('usage: node decomp.js <input.png> <outDir> [prompt]'); process.exit(2); }
  const key = process.env.AGENT_PLAN_API_KEY;
  if (!key) { console.error('KEY_MISSING: set $env:AGENT_PLAN_API_KEY'); process.exit(2); }
  fs.mkdirSync(outDir, { recursive: true });

  const buf = fs.readFileSync(input);
  const mime = /\.jpe?g$/i.test(input) ? 'image/jpeg' : 'image/png';
  const dataUri = `data:${mime};base64,` + buf.toString('base64');
  const p = prepareParams({ model: 'pro', layer_decomposition: true, watermark: false,
    ...(promptArg ? { prompt: promptArg } : {}), reference_images: [dataUri] });
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify(buildRequestBody(p)),
  });
  const json = await resp.json();
  if (resp.status !== 200) {
    console.error('HTTP', resp.status, JSON.stringify(json).slice(0, 1200));
    process.exit(1);
  }
  fs.writeFileSync(path.join(outDir, 'response.json'), JSON.stringify(json, null, 2));

  const items = json.data || [];
  const layers = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const z = it.z_index ?? i;
    const ext = it.output_format === 'png' ? 'png' : 'jpg';
    const fileName = `layer_z${String(z).padStart(2, '0')}_${String(i).padStart(2, '0')}.${ext}`;
    try {
      const r = await fetch(it.url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const bytes = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(path.join(outDir, fileName), bytes);
      layers.push({ i, z, fileName, name: it.name || null, description: it.description || null,
        output_format: it.output_format, size: it.size || null, bytes: bytes.length,
        bounding_box: it.bounding_box || null });
      console.log(`saved ${fileName} (z_index=${z}, ${bytes.length} bytes)`);
    } catch (e) {
      console.error(`download failed item ${i}: ${e.message}`);
      layers.push({ i, z, download_error: e.message, url: it.url });
    }
  }
  fs.writeFileSync(path.join(outDir, 'layers.json'), JSON.stringify(
    { model: p.model, size: p.size, count: items.length, layers }, null, 2));
  console.log('---SUMMARY---');
  console.log(JSON.stringify({ model: p.model, size: p.size, count: items.length,
    layers: layers.map(l => ({ z: l.z, file: l.fileName, name: l.name, bbox: l.bounding_box && l.bounding_box.absolute, size: l.size, bytes: l.bytes, err: l.download_error })) }, null, 2));
})();
