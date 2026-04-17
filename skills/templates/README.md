# 🧬 Skill Templates

技能开发模板 — 骨架代码，快速创建新 Skill。

## 🎯 Role

系统的**技能脚手架**，为开发者提供标准化的起始模板，确保新 Skill 从一开始就符合规范。

```
开发者 ──copy──► templates/basic/ ──► 开始开发
                     │
                     ├── manifest.json  (已配置)
                     ├── main.py        (入口骨架)
                     └── README.md      (说明模板)
```

## ✅ Responsibility

- 提供符合 `docs/skill-spec/` 规范的模板骨架
- 包含 manifest、入口文件、README 模板
- 提供可运行的示例帮助理解模板用法

## 🚧 Boundaries

- 模板本身不是业务技能，不可直接作为 Skill 运行
- 不包含具体业务逻辑
- 不替代 Skill 开发文档（见 `docs/skill-spec/`）

## 📁 目录结构

```
templates/
├── README.md
├── basic/               # 基础模板骨架
│   ├── manifest.json
│   ├── main.py
│   └── README.md
└── example/             # 模板使用示例（可运行）
    ├── manifest.json
    ├── main.py
    └── README.md
```
