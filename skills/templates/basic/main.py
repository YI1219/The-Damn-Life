"""
{{skill_name}} — {{description}}

使用步骤：
    1. 复制整个 basic/ 目录并重命名
    2. 替换所有 {{...}} 占位符
    3. 实现 run() 函数
    4. 运行 python main.py 验证
"""

import json
import sys
from pathlib import Path


def load_manifest() -> dict:
    manifest_path = Path(__file__).parent / "manifest.json"
    with open(manifest_path, encoding="utf-8") as f:
        return json.load(f)


def run(**inputs) -> dict:
    """Skill 入口 — 在此实现业务逻辑。"""
    # TODO: 替换为实际实现
    raise NotImplementedError("Please implement the run() function.")


def main():
    manifest = load_manifest()
    print(f"🔧 Skill: {manifest['name']} v{manifest['version']}")
    print(f"📝 {manifest['description']}\n")

    # TODO: 解析实际输入参数
    try:
        result = run()
        print(f"✅ Output: {json.dumps(result, ensure_ascii=False)}")
    except NotImplementedError as e:
        print(f"⚠️ {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
