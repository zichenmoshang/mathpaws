// 图生图运行器：在进程内把本地参考图转 base64 data URI 注入 process.argv，
// 再调用 seedream generate.js，绕开 Windows 命令行参数长度限制。
// 用法: node edit_ref_runner.js <refFile> <prompt> <size, 如 2048x2048>
const path = require('path');
const fs = require('fs');

const [refFile, prompt, size] = process.argv.slice(2);
if (!refFile || !prompt || !size) {
  console.error('usage: node edit_ref_runner.js <refFile> <prompt> <size>');
  process.exit(1);
}

const ext = path.extname(refFile).slice(1).toLowerCase();
const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
const b64 = fs.readFileSync(refFile).toString('base64');
const dataUri = `data:${mime};base64,${b64}`;

const GENERATE = path.resolve(__dirname, '..', '..', '.trae', 'skills',
  'byted-ark-seedream-skill', 'scripts', 'generate.js');
if (!fs.existsSync(GENERATE)) throw new Error(`generate.js not found: ${GENERATE}`);

// 生成图统一落到本目录 ad-hoc 工作区（gitignored；generate.js 的 getSavePath 优先读此环境变量）
const SAVE_DIR = path.resolve(__dirname, '_tmp');
process.env.ARK_SEEDREAM_SAVE_PATH = SAVE_DIR;

process.argv = [
  process.argv[0],
  GENERATE,
  '--model', 'pro',
  '--size', size,
  '--watermark', 'false',
  '--optimize', 'false',
  '--api_key', process.env.AGENT_PLAN_API_KEY,
  '--reference_images', JSON.stringify([dataUri]),
  '--prompt', prompt,
];

const Module = require('module');
// 读取 generate.js 源码，把末尾的 require.main 守卫替换为直接执行 main()，
// 在当前模块作用域编译（process.argv 已注入参数）。
let src = fs.readFileSync(GENERATE, 'utf8');
src = src.replace(/if\s*\(require\.main\s*===\s*module\)\s*main\(\)\s*;?/, 'main();');
const compiled = new Module(GENERATE, module);
compiled.filename = GENERATE;
compiled.paths = Module._nodeModulePaths(path.dirname(GENERATE));
compiled._compile(src, GENERATE);
