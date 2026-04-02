# 🧬 Basic Template

Skill 基础模板骨架 — 复制后填充占位符即可开始开发。

## 使用方式

```bash
# 1. 复制模板
cp -r skills/templates/basic skills/builtin/my-skill

# 2. 替换所有 {{...}} 占位符
# 3. 实现 run() 函数
# 4. 验证
python skills/builtin/my-skill/main.py
```

## 占位符说明

| 占位符                   | 含义         | 示例                 |
| ------------------------ | ------------ | -------------------- |
| `{{skill_name}}`         | 技能名称     | `file-organizer`     |
| `{{description}}`        | 技能简介     | `自动整理下载文件夹` |
| `{{author}}`             | 开发者       | `YI1219`             |
| `{{input_name}}`         | 输入参数名   | `folder_path`        |
| `{{input_description}}`  | 输入参数说明 | `要整理的目录路径`   |
| `{{output_name}}`        | 输出字段名   | `moved_count`        |
| `{{output_description}}` | 输出字段说明 | `移动的文件数量`     |
