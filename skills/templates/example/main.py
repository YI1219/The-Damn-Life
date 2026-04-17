"""
Text Reverser Skill — 基于 basic 模板创建的完整示例。

运行方式：
    python main.py "Hello World"
    python main.py
"""

import json
import sys
from pathlib import Path


def load_manifest() -> dict:
    manifest_path = Path(__file__).parent / "manifest.json"
    with open(manifest_path, encoding="utf-8") as f:
        return json.load(f)


def run(text: str = "The Damn Life") -> dict:
    """Skill 入口：反转输入文本。"""
    return {
        "reversed": text[::-1],
        "length": len(text),
    }


def main():
    manifest = load_manifest()
    print(f"🔧 Skill: {manifest['name']} v{manifest['version']}")
    print(f"📝 {manifest['description']}\n")

    text = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "The Damn Life"

    print(f"📥 Input:  \"{text}\"")
    result = run(text=text)
    print(f"📤 Output: {json.dumps(result, ensure_ascii=False)}")


if __name__ == "__main__":
    main()
