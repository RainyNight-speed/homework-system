import os
import json
import requests


def ai_grade_assignment(assignment_title, student_content):
    api_key = os.getenv('QWEN_API_KEY', '')
    model = os.getenv('QWEN_MODEL', 'qwen-turbo')
    base_url = os.getenv('QWEN_BASE_URL', 'https://llm-71eppg2mcy2j2qlf.cn-beijing.maas.aliyuncs.com/compatible-mode/v1')

    if not api_key:
        raise ValueError('QWEN_API_KEY 未配置，请在 .env 文件中设置')

    prompt = f"""你是一位大学教师，正在批改学生作业。

作业题目：{assignment_title}
学生提交内容：
{student_content}

请从以下维度评分（满分100分），并给出评语：
1. 内容完整性（30分）
2. 逻辑清晰度（30分）
3. 创新性（20分）
4. 表达规范性（20分）

请仅返回JSON格式（不要其他文字）：
{{"score": 分数, "comment": "详细评语"}}"""

    response = requests.post(
        f"{base_url}/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}]
        },
        timeout=30
    )

    if response.status_code != 200:
        raise Exception(f"API请求失败: {response.status_code} - {response.text}")

    result = response.json()
    content = result["choices"][0]["message"]["content"]

    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

    return json.loads(content)
