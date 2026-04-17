"""
Word Counter Skill — 实验性技能示例。

运行方式：
    python main.py "Hello World"
    python main.py "第一行\n第二行\n第三行"
    echo "some text" | python main.py --stdin
"""

import json
import sys
from pathlib import Path


def load_manifest() -> dict:
    manifest_path = Path(__file__).parent / "manifest.json"
    with open(manifest_path, encoding="utf-8") as f:
        return json.load(f)


def run(text: str) -> dict:
    """Skill 入口：统计文本的字符数、词数和行数。"""
    return {
        "chars": len(text),
        "words": len(text.split()),
        "lines": text.count("\n") + 1 if text else 0,
    }


def main():
    """CLI 入口：从参数或 stdin 读取文本并统计。"""
    manifest = load_manifest()
    print(f"🔧 Skill: {manifest['name']} v{manifest['version']}")
    print(f"📝 {manifest['description']}\n")

    # 读取输入
    if "--stdin" in sys.argv:
        text = sys.stdin.read()
    elif len(sys.argv) > 1 and not sys.argv[1].startswith("--"):
        text = sys.argv[1]
    else:
        text = "The Damn Life is an AI agent runtime platform.\nIt runs skills in a sandbox."

    result = run(text)
    print(f"📊 Input ({len(text)} chars):")
    print(f"   {text[:80]}{'...' if len(text) > 80 else ''}\n")
    print(f"✅ Output: {json.dumps(result)}")


if __name__ == "__main__":
    main()
