# 🔄 Text Reverser (Template Example)

基于 `basic/` 模板创建的完整可运行示例，展示模板的使用流程。

## 运行

```bash
python main.py "Hello World"
python main.py
```

## 输出示例

```
🔧 Skill: text-reverser v0.1.0
📝 模板使用示例 — 反转输入文本

📥 Input:  "Hello World"
📤 Output: {"reversed": "dlroW olleH", "length": 11}
```

## 这个示例展示了什么

1. **manifest.json** — 所有 `{{...}}` 占位符已替换为真实值
2. **main.py** — `run()` 函数实现了实际业务逻辑（文本反转）
3. **CLI 入口** — `main()` 解析参数并调用 `run()`

## 创建过程

```bash
# 从模板复制
cp -r skills/templates/basic skills/templates/example

# 替换占位符 → 实现 run() → 完成
```
