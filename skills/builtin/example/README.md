# 👋 Hello World Skill

最小可运行的内置技能示例。

## 运行

```bash
# 默认
python main.py

# 指定用户名
python main.py --user_name Alice
```

## 输出示例

```
🔧 Skill: hello-world v0.1.0
📝 最小可运行的内置技能示例 — 接收用户名，返回问候语

✅ Output: {"greeting": "Hello, Alice! 👋 Welcome to The Damn Life."}
```

## 文件说明

| 文件            | 作用                          |
| --------------- | ----------------------------- |
| `manifest.json` | Skill 元信息、输入输出定义    |
| `main.py`       | Skill 入口，包含 `run()` 函数 |

## 要点

- `run()` 是 Runtime 调用的标准入口
- `manifest.json` 的 `inputs` / `outputs` 定义了接口契约
- `permissions: []` 表示此 Skill 无需任何系统权限
