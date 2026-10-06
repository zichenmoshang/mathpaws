# AI 上下文 / Token 优化手册（跨项目可复用）

> 面向在 IDE 中与 AI 协作编程的项目（Trae / 类似 Agent 工具）。
> 目标：在不改业务代码的前提下，降低"找文件、读上下文、视觉、返工"四类 token 浪费。
> 用法：把第 4 节三份模板复制进新项目，按占位符 `<project>` 调整即可。

---

## 1. 核心心智模型：三层分工

不要指望一个忽略文件解决所有问题。token 控制分三层，各管一条通道：

| 层 | 文件 | 职责 |
|----|------|------|
| 硬屏蔽层 | `.trae/.ignore`（或工具等价物） | 不许进**语义索引 / 自动上下文** |
| 工具通道层 | `.gitignore` | 让 **git + ripgrep(Grep)** 同时遵守 |
| 行为规则层 | `.trae/rules/*.md` | 允许访问但**要克制**（图片、探索、文档加载） |

关键认知：**忽略配置不是全局生效的，不同工具走不同通道。**

| 工具通道 | 读 `.trae/.ignore` | 读 `.gitignore` |
|----------|:---:|:---:|
| 语义检索（SearchCodebase 类） | ✅ | — |
| Grep（ripgrep） | ❌ | ✅（需在 git 仓库内，或树内有标准 ignore） |
| LS（原始列目录） | ❌ | ❌（用自带 ignore 参数） |
| 显式 Read 点名读取 | ❌（不拦截） | ❌ |

---

## 2. 常见瓶颈清单（按影响排序）

1. **依赖巨树**：`node_modules`、Python `venv/.venv` —— 搜索召回被依赖库淹没。
2. **非 git 仓库**：无法用 `git status/diff` 定位改动，只能全量时间戳扫描，输出巨大。
3. **文档多且互相冲突**：每次任务要读多份文档对齐，口径不一致导致返工。
4. **图片读取**：图片走视觉 token，单张成本是文本数十倍以上；批量看图是最大单笔开销。
5. **跨层扇出**：小改动需读 config → store → db → UI 多个文件才敢动手。
6. **资产组合膨胀**：笛卡尔积式预制变体（如 N 套装 × M 帽子），数量乘法增长。
7. **环境缺失导致失败回灌**：未装依赖时反复跑编译命令，错误输出反复进上下文。
8. **构建产物与源码并存**：搜索命中 `dist/build` 里的压缩混淆文件。
9. **流程固定税**：系统提示、工具 schema、压缩摘要常驻（硬底，不可削减）。

---

## 3. 优化动作

### 3.1 搜索与列举
- LS：优先列**具体子目录**；大范围列举时显式传 ignore。
- Grep：一律 `path` 限定到源码/文档目录 + `glob` 过滤，不在仓库根裸搜。
- 永远不把 venv / node_modules / dist / 参考图库作为搜索目标。

### 3.2 图片克制
- UI 任务只读当前任务直接对应的 1–2 张高保真图，不批量预读。
- 资产盘点优先读**文本台账**（manifest/json），不用"看图"代替读清单。
- 不为"确认文件存在"而读图。

### 3.3 委派 sub-agent
- 大范围探索 / 多文件读取 / 跨层调研，委派子 agent：噪声留在子上下文，主上下文只收摘要。
- 相互独立的调研并行发起。
- 已知路径的简单读写直接做，不为委派而委派。

### 3.4 文档瘦身
- 不整篇 Read 长文档，用 Grep 取片段、读最小行区间；避免编辑前后重复读同一文件。
- 一次性盘点类文档（如已删除的 current-state）不作为常驻参考。

### 3.5 会话与失败
- **同一失败不重复试探**；环境前置缺失（如无 node_modules）先说明、由人决定是否安装。
- 长任务按里程碑开新会话，避免触发压缩后摘要长期常驻。
- skill / MCP descriptor 按需加载，不用不预载。
- 先对齐口径再动手，减少审批返工。

### 3.6 一次性环境动作（收益大）
- `git init` 后 ripgrep 立即遵守 `.gitignore`；首次 commit 后可用 `git status/diff` 精准定位改动。
- 决定 AI 工具目录（如 `.trae/`）是否进 git：
  - 个人项目：可整体忽略；
  - 团队项目：提交 rules/specs，忽略 skills 实体目录与 cache/logs（类比"提交 lock、忽略 node_modules"）。

---

## 4. 三份可复制模板

### 模板 A：`.gitignore`（节选，按项目增删）

```gitignore
# Node
node_modules/

# Python venv（即 <project> 的 .venv / venv312）
.venv/
.venv-*/
venv/
venv312/
__pycache__/
*.py[cod]

# 构建产物
dist/
build/
out/
.vite/
*.tsbuildinfo

# 日志 / 临时
*.log
*.tmp
*.swp
*~

# 参考素材（体量大，仅供人工查看）
ref_assets/

# 离线权重（保留运行时模型时勿全局忽略 *.bin）
*.safetensors
*.ckpt
*.pt
*.npy

# 个人项目：AI 工具目录整体仅本机使用（团队项目见 3.6）
.trae/

# IDE / OS
.vscode/
.idea/
.DS_Store
Thumbs.db
```

### 模板 B：`.trae/.ignore`（头部生效说明 + 忽略正文）

```text
# 生效范围：
#   ✅ 语义索引 / 自动上下文注入：遵守本文件
#   ❌ LS：原始列目录，不读本文件（用其 ignore 参数）
#   ❌ Grep：认标准 .gitignore，不读本文件（用 path+glob）
#   ❌ 显式 Read：点名读取不拦截
# 裁量性规则见 .trae/rules/context-usage.md

node_modules/
**/node_modules/
.venv/
.venv-*/
venv/
venv312/
dist/
build/
*.bin
*.safetensors
*.glb
*.png
*.jpg
*.jpeg
*.webp
ref_assets/
*.log
```

> 注意：模板 B 里若全局忽略 `*.png/jpg`，AI 将无法看图；需要 AI 做视觉核对的项目，
> 改成只忽略参考图库目录、保留高保真目录可访问。

### 模板 C：`.trae/rules/context-usage.md`

```markdown
# 上下文与 Token 使用规则

> 本文件是行为规则层；硬屏蔽由 .trae/.ignore 负责。

## 搜索
- LS 优先列具体子目录；大范围列举传 ignore（排除 venv/node_modules/dist/ref_assets）。
- Grep 用 path 限定源码/文档目录 + glob 过滤，不在根目录裸搜。

## 图片
- UI 任务只读对应 1–2 张高保真图，不批量预读。
- 资产盘点优先读 manifest/json，不用看图代替读清单。

## 委派
- 大范围探索/跨层调研委派 sub-agent，主上下文只收摘要；独立调研并行。

## 文档
- 不整篇 Read 长文档，Grep 取片段；不重复读同一文件。

## 会话与失败
- 同一失败不重试；环境缺失先说明、由人决定是否安装。
- 按里程碑开新会话；skill/MCP 按需加载。
```

---

## 5. 落地检查（新项目 10 分钟）

- [ ] 复制模板 A 为 `.gitignore`，按项目语言/目录调整
- [ ] `git init` → `git add .` → 首次 `git commit`（确认噪声被排除）
- [ ] 复制模板 B 为 `.trae/.ignore`，决定图片是硬屏蔽还是可访问
- [ ] 复制模板 C 为 `.trae/rules/context-usage.md`
- [ ] 决定 `.trae/` 整体忽略（个人）还是分类提交（团队）
- [ ] 验证：在子目录 Grep 一次，确认不再命中 venv/dist
