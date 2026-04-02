# 📊 Word Counter Skill (Experimental)

实验性技能示例 — 统计文本的字数、行数与字符数。

## ⚠️ 实验状态

此技能处于实验阶段，API 可能随时变更。

## 运行

```bash
# 直接传入文本
python main.py "Hello World, this is a test."

# 从 stdin 读取
echo "line one\nline two" | python main.py --stdin

# 使用默认示例文本
python main.py
```

## 输出示例

```
🔧 Skill: word-counter v0.1.0-experimental
📝 实验性技能示例 — 统计文本的字数、行数与字符数

📊 Input (27 chars):
   Hello World, this is a test.

✅ Output: {"chars": 28, "words": 6, "lines": 1}
```

## 文件说明

| 文件            | 作用                                       |
| --------------- | ------------------------------------------ |
| `manifest.json` | Skill 元信息，含 `experimental: true` 标记 |
| `main.py`       | Skill 入口，包含 `run()` 函数              |

## 与 builtin 的区别

- `manifest.json` 中 `experimental: true`
- 版本号带 `-experimental` 后缀
- 不保证稳定性与向后兼容
