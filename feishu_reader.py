"""
飞书文档内容读取脚本
运行前请先安装依赖：
  pip install requests
"""

import requests
import json
import re

TARGET_URL = "https://kvodb27hf3.feishu.cn/wiki/KIsKw99pri4hwEk4eLncoCtFnCo"
PASSWORD = "91&74C42"

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Referer": "https://kvodb27hf3.feishu.cn/",
})

def step1_get_page():
    print("[1] 访问文档页面...")
    resp = session.get(TARGET_URL, timeout=15)
    print(f"    状态码: {resp.status_code}")

    # 提取 token（飞书会在页面里嵌入 csrf token / share_token 等）
    token_match = re.search(r'"token"\s*:\s*"([^"]+)"', resp.text)
    wiki_token_match = re.search(r'wiki/([A-Za-z0-9]+)', TARGET_URL)

    page_token = token_match.group(1) if token_match else None
    wiki_token = wiki_token_match.group(1) if wiki_token_match else None
    print(f"    Wiki token: {wiki_token}")
    return resp.text, wiki_token

def step2_submit_password(wiki_token, raw_html):
    """尝试通过 API 提交密码解锁文档"""
    print("[2] 提交密码...")

    # 飞书分享密码验证接口
    verify_url = f"https://kvodb27hf3.feishu.cn/space/api/wiki/v2/space_node/check_share_password/"
    payload = {
        "token": wiki_token,
        "password": PASSWORD,
    }

    # 尝试多个可能的端点
    endpoints = [
        f"https://kvodb27hf3.feishu.cn/space/api/wiki/v2/share/check_password",
        f"https://kvodb27hf3.feishu.cn/wiki/check_password",
        f"https://kvodb27hf3.feishu.cn/space/api/share_entity/check_password",
    ]

    session.headers["Content-Type"] = "application/json"
    session.headers["X-Requested-With"] = "XMLHttpRequest"

    for ep in endpoints:
        try:
            r = session.post(ep, json={"token": wiki_token, "password": PASSWORD}, timeout=10)
            print(f"    [{r.status_code}] {ep}")
            if r.status_code == 200:
                print(f"    响应: {r.text[:300]}")
                return r
        except Exception as e:
            print(f"    错误: {e}")

def step3_get_content(wiki_token):
    """获取文档正文内容"""
    print("[3] 获取文档内容...")

    api_url = f"https://kvodb27hf3.feishu.cn/space/api/wiki/v2/wiki_nodes/{wiki_token}?with_content=true"
    r = session.get(api_url, timeout=15)
    print(f"    状态码: {r.status_code}")

    if r.status_code == 200:
        try:
            data = r.json()
            print(json.dumps(data, ensure_ascii=False, indent=2)[:5000])
        except Exception:
            print(r.text[:3000])
    else:
        print(r.text[:1000])

def extract_text_from_html(html):
    """简单从 HTML 中提取可读文字"""
    # 去掉 script/style
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
    # 去掉标签
    text = re.sub(r'<[^>]+>', ' ', html)
    # 去掉多余空白
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def main():
    print("=" * 50)
    print("飞书文档读取工具")
    print("=" * 50)

    raw_html, wiki_token = step1_get_page()

    if not wiki_token:
        print("[!] 无法提取 wiki token，尝试直接解析 HTML...")
        text = extract_text_from_html(raw_html)
        print("\n--- 页面文字内容 ---")
        print(text[:5000])
        return

    step2_submit_password(wiki_token, raw_html)
    step3_get_content(wiki_token)

    print("\n--- 备用：HTML 文本提取 ---")
    text = extract_text_from_html(raw_html)
    print(text[:3000])

if __name__ == "__main__":
    main()
