import os
import re
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("DEEPSEEK_API_KEY", "sk-e7216164cf9c419da7503ce66586a8dd")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://api.deepseek.com",
)

app = FastAPI(title="VoiceChart - Voice Flowchart Generator")
app.mount("/static", StaticFiles(directory="static"), name="static")

STYLES = {
    "flowchart": {
        "name": "流程图",
        "en": "Flowchart",
        "icon": "⬡",
        "hint": "标准流程图，使用 flowchart TD 语法，适合展示步骤和决策",
    },
    "sequence": {
        "name": "时序图",
        "en": "Sequence",
        "icon": "↔",
        "hint": "时序图，使用 sequenceDiagram 语法，适合展示系统交互和消息传递",
    },
    "mindmap": {
        "name": "思维导图",
        "en": "Mind Map",
        "icon": "✦",
        "hint": "思维导图，使用 mindmap 语法，适合展示知识结构和概念关联",
    },
    "class": {
        "name": "类图",
        "en": "Class",
        "icon": "◫",
        "hint": "UML类图，使用 classDiagram 语法，适合展示面向对象设计",
    },
    "state": {
        "name": "状态图",
        "en": "State",
        "icon": "◈",
        "hint": "状态机图，使用 stateDiagram-v2 语法，适合展示状态转换",
    },
    "er": {
        "name": "ER图",
        "en": "ER Diagram",
        "icon": "⊞",
        "hint": "实体关系图，使用 erDiagram 语法，适合展示数据库结构",
    },
    "gantt": {
        "name": "甘特图",
        "en": "Gantt",
        "icon": "▦",
        "hint": "甘特图，使用 gantt 语法，适合展示项目计划和时间线",
    },
    "pie": {
        "name": "饼图",
        "en": "Pie Chart",
        "icon": "◔",
        "hint": "饼图，使用 pie 语法，适合展示数据占比关系",
    },
}

SYSTEM_PROMPT = """你是一位专业的流程图设计师，精通Mermaid图表语法。根据用户的语音描述，生成准确、美观的Mermaid图表代码。

严格规则：
1. 只输出纯Mermaid代码，绝对不要包含 ```mermaid 或 ``` 代码块标记
2. 代码必须语法完全正确，可以直接被Mermaid渲染
3. 节点显示文字可以使用中文
4. 节点ID只能使用英文字母和数字（如 A、B1、start、end），绝对不能有中文ID
5. 图表要清晰、结构合理、层次分明
6. flowchart 默认使用 TD 布局
7. 如果描述简单，不要过度复杂化；如果描述复杂，确保完整覆盖所有节点

Mermaid语法参考：
- flowchart TD: A[开始] --> B{判断} --> |是| C[执行] --> D[结束]
- sequenceDiagram: participant A\nA->>B: 消息
- mindmap: root\n  分支1\n    子节点
- classDiagram: class Animal\nAnimal : +name
- stateDiagram-v2: [*] --> 状态A\n状态A --> 状态B
- erDiagram: ENTITY1 ||--o{ ENTITY2 : relation
- gantt: title 项目\ndateFormat YYYY-MM-DD\nsection 阶段\n任务 :2024-01-01, 7d
- pie: title 标题\n"A" : 30\n"B" : 70"""


class GenerateRequest(BaseModel):
    text: str
    style: str = "flowchart"


def clean_mermaid_code(code: str) -> str:
    code = code.strip()
    code = re.sub(r"^```(?:mermaid)?\s*\n?", "", code)
    code = re.sub(r"\n?```\s*$", "", code)
    return code.strip()


@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.get("/api/styles")
async def get_styles():
    return STYLES


@app.post("/api/generate")
async def generate_flowchart(request: GenerateRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="请提供描述文字")

    style_info = STYLES.get(request.style, STYLES["flowchart"])
    user_prompt = f"""用户描述：{request.text}

请生成【{style_info['name']}】类型的Mermaid图表。
图表类型提示：{style_info['hint']}

直接输出Mermaid代码，不要任何解释或代码块标记。"""

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=2048,
        )

        code = clean_mermaid_code(response.choices[0].message.content)
        return {"code": code, "success": True, "style": request.style}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
