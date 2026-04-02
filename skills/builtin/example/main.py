"""
Hello World Skill — 最小可运行的内置技能示例。

运行方式：
    python main.py
    python main.py --user_name Alice
"""

import json
import sys
from pathlib import Path


def load_manifest() -> dict:
    manifest_path = Path(__file__).parent / "manifest.json"
    with open(manifest_path, encoding="utf-8") as f:
        return json.load(f)


def run(user_name: str = "World") -> dict:
    """Skill 入口：接收输入，返回输出。"""
    greeting = f"Hello, {user_name}! 👋 Welcome to The Damn Life."
    return {"greeting": greeting}


def main():
    """CLI 入口：解析参数并执行 Skill。"""
    manifest = load_manifest()
    print(f"🔧 Skill: {manifest['name']} v{manifest['version']}")
    print(f"📝 {manifest['description']}\n")

    # 简单参数解析
    user_name = "World"
    for i, arg in enumerate(sys.argv[1:]):
        if arg == "--user_name" and i + 1 < len(sys.argv) - 1:
            user_name = sys.argv[i + 2]

    result = run(user_name=user_name)
    print(f"✅ Output: {json.dumps(result, ensure_ascii=False)}")


if __name__ == "__main__":
    main()
