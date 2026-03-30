import os
import re
import sys

# ✅ 强制 stdout UTF-8（解决 Windows CI 炸）
sys.stdout.reconfigure(encoding='utf-8')

def main():
    tag = os.environ.get('GITHUB_REF_NAME', '')

    if not tag:
        print("Warning: GITHUB_REF_NAME is empty")

    try:
        with open('doc/CHANGE.MD', 'r', encoding='utf-8') as f:
            content = f.read()

        # ✅ 兼容 ## / # + Windows 换行
        pattern = rf'^(#+)\s*{re.escape(tag)}\s*\r?\n(.*?)(?=\r?\n#+\s*v|\Z)'

        match = re.search(pattern, content, re.MULTILINE | re.DOTALL)

        if match:
            notes = match.group(2).strip()
        else:
            notes = f'No changelog found for {tag}'

    except FileNotFoundError:
        notes = 'ERROR: doc/CHANGE.MD not found'
    except Exception as e:
        notes = f'ERROR: {e}'

    # ✅ 改成 .md（支持 GitHub 渲染）
    try:
        with open('release_notes.md', 'w', encoding='utf-8') as f:
            f.write(notes)

        print("Changelog extracted -> release_notes.md")

    except Exception as e:
        print(f"Write failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
