import os
import re
import sys

def main():
    # GitHub Actions 会自动注入 GITHUB_REF_NAME 环境变量
    tag = os.environ.get('GITHUB_REF_NAME', '')

    if not tag:
        print("警告: 环境变量 GITHUB_REF_NAME 为空，可能不在 tag 推送流程中。")

    try:
        with open('doc/CHANGE.MD', 'r', encoding='utf-8') as f:
            content = f.read()

        # 精准匹配当前 tag 标题到下一个标题之间的内容
        pattern = rf'^# {tag}\n(.*?)(?=\n# v|\Z)'
        match = re.search(pattern, content, re.MULTILINE | re.DOTALL)
        notes = match.group(1).strip() if match else f'未找到 {tag} 版本的更新日志'

    except FileNotFoundError:
        notes = '提取日志失败: 找不到 doc/CHANGE.MD 文件'
    except Exception as e:
        notes = f'提取日志失败: {e}'

    # 写入结果文件供后续 Release 步骤使用
    try:
        with open('release_notes.txt', 'w', encoding='utf-8') as f:
            f.write(notes)
        print("日志提取完成，已写入 release_notes.txt")
    except Exception as e:
        print(f"写入 release_notes.txt 失败: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
