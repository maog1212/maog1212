import os
import re
import tempfile
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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

app = FastAPI(title="VoiceChart")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Whisper (lazy-loaded, optional) ──────────────────────────────────────────
_whisper_model = None
_whisper_checked = False


def get_whisper():
    global _whisper_model, _whisper_checked
    if _whisper_checked:
        return _whisper_model
    _whisper_checked = True
    try:
        from faster_whisper import WhisperModel
        size = os.getenv("WHISPER_MODEL", "base")
        print(f"[VoiceChart] Loading Whisper '{size}' model …")
        _whisper_model = WhisperModel(size, device="cpu", compute_type="int8")
        print("[VoiceChart] Whisper ready.")
    except ImportError:
        print("[VoiceChart] faster-whisper not installed — server-side STT disabled.")
    except Exception as e:
        print(f"[VoiceChart] Whisper load error: {e}")
    return _whisper_model


# ── Styles ────────────────────────────────────────────────────────────────────
STYLES = {
    "flowchart": {"name": "流程图",   "en": "Flowchart",   "icon": "⬡",
                  "hint": "标准流程图，flowchart TD 语法，展示步骤与决策"},
    "sequence":  {"name": "时序图",   "en": "Sequence",    "icon": "↔",
                  "hint": "时序图，sequenceDiagram 语法，展示系统交互"},
    "mindmap":   {"name": "思维导图", "en": "Mind Map",    "icon": "✦",
                  "hint": "思维导图，mindmap 语法，展示知识结构"},
    "class":     {"name": "类图",     "en": "Class",       "icon": "◫",
                  "hint": "UML类图，classDiagram 语法，展示面向对象设计"},
    "state":     {"name": "状态图",   "en": "State",       "icon": "◈",
                  "hint": "状态机图，stateDiagram-v2 语法，展示状态转换"},
    "er":        {"name": "ER 图",    "en": "ER Diagram",  "icon": "⊞",
                  "hint": "实体关系图，erDiagram 语法，展示数据库结构"},
    "gantt":     {"name": "甘特图",   "en": "Gantt",       "icon": "▦",
                  "hint": "甘特图，gantt 语法，展示项目计划与时间线"},
    "pie":       {"name": "饼图",     "en": "Pie Chart",   "icon": "◔",
                  "hint": "饼图，pie 语法，展示数据占比关系"},
}

SYSTEM_PROMPT = """你是一位专业的流程图设计师，精通Mermaid图表语法。根据用户描述生成准确、美观的Mermaid图表代码。

严格规则：
1. 只输出纯Mermaid代码，绝对不要包含 ```mermaid 或 ``` 代码块标记
2. 代码必须语法正确，可直接被Mermaid渲染
3. 节点显示文字可使用中文；节点ID只能使用英文字母和数字
4. flowchart 默认使用 TD 布局；图表清晰、层次分明

语法速查：
flowchart TD: A[开始]-->B{判断}-->|是|C[执行]-->D[结束]
sequenceDiagram: participant A\nA->>B: 消息
mindmap: root\n  主题\n    子节点
classDiagram: class Animal\nAnimal:+name
stateDiagram-v2: [*]-->状态A\n状态A-->状态B
erDiagram: E1 ||--o{ E2 : 关系
gantt: title T\ndateFormat YYYY-MM-DD\nsection S\n任务:2024-01-01,7d
pie: title T\n"A":30\n"B":70"""


# ── Routes ────────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    text: str
    style: str = "flowchart"


def clean_mermaid(code: str) -> str:
    code = code.strip()
    code = re.sub(r"^```(?:mermaid)?\s*\n?", "", code)
    code = re.sub(r"\n?```\s*$", "", code)
    return code.strip()


@app.get("/")
async def root():
    return FileResponse("static/index.html")


@app.get("/api/styles")
async def api_styles():
    return STYLES


@app.get("/api/capabilities")
async def api_capabilities():
    # Trigger lazy load so the check is accurate after first request
    whisper = get_whisper()
    return {"whisper": whisper is not None}


@app.post("/api/transcribe")
async def api_transcribe(
    audio: UploadFile = File(...),
    lang: str = Form("zh-CN"),
):
    model = get_whisper()
    if model is None:
        raise HTTPException(503, "服务器端语音识别不可用。请确认已安装 faster-whisper 并重启服务。")

    data = await audio.read()
    if not data:
        raise HTTPException(400, "音频数据为空")

    ct = audio.content_type or ""
    ext = ".mp4" if "mp4" in ct or "m4a" in ct else \
          ".ogg" if "ogg" in ct else \
          ".wav" if "wav" in ct else ".webm"

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as f:
        f.write(data)
        tmp = f.name

    try:
        language = "zh" if "zh" in lang else "en" if "en" in lang else None
        segments, info = model.transcribe(
            tmp,
            language=language,
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
        )
        text = "".join(s.text for s in segments).strip()
        return {"text": text, "language": info.language, "success": True}
    except Exception as e:
        raise HTTPException(500, f"转录失败: {e}")
    finally:
        try:
            os.unlink(tmp)
        except Exception:
            pass


@app.post("/api/generate")
async def api_generate(req: GenerateRequest):
    if not req.text.strip():
        raise HTTPException(400, "请提供描述文字")

    info = STYLES.get(req.style, STYLES["flowchart"])
    prompt = (
        f"用户描述：{req.text}\n\n"
        f"请生成【{info['name']}】类型的Mermaid图表。\n"
        f"提示：{info['hint']}\n\n"
        f"直接输出Mermaid代码，不要任何解释或代码块标记。"
    )

    try:
        resp = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=2048,
        )
        return {"code": clean_mermaid(resp.choices[0].message.content),
                "success": True, "style": req.style}
    except Exception as e:
        raise HTTPException(500, f"生成失败: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
