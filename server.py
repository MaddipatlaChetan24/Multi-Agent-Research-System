from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import re
from agents import llm

app = FastAPI(title="Nova Multi-Agent Research API")

# Allow the browser (served on any port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryModel(BaseModel):
    query: str


@app.get("/")
async def serve_index():
    return FileResponse("index.html")


@app.post("/research")
async def handle_research(data: QueryModel):
    if not data.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        query_text = data.query.strip()
        
        # 1. LLM Classifier to determine if research is needed
        classifier_prompt = f"""You are a routing agent. 
Analyze the following user input. If it is a simple greeting, small talk, testing message (like 'hello', 'test', 'how are you'), or a direct question that does NOT require browsing the web to answer, reply with EXACTLY the word "YES".
If it is a complex query that requires deep web research, reply with EXACTLY the word "NO".

Input: {query_text}"""
        
        classifier_res = llm.invoke(classifier_prompt)
        
        if "YES" in classifier_res.content.strip().upper():
            answer_prompt = f"You are Nova, an elite AI research assistant. The user just said: '{query_text}'. Reply intelligently and concisely in a friendly tone."
            answer_res = llm.invoke(answer_prompt)
            return {
                "report": f"<p>{answer_res.content}</p>",
                "feedback": "",
                "sources": [],
                "confidence": "N/A",
            }

        from pipeline import run_research_pipeline
        result = run_research_pipeline(query_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Convert plain-text Markdown report → simple HTML for the front-end
    report_html = _md_to_html(result.get("report", ""))
    feedback    = result.get("feedback", "")

    # Extract sources / URLs from the report text
    urls = re.findall(r'https?://[^\s\)\]"<]+', result.get("report", ""))
    sources = [{"num": i + 1, "title": u, "url": u} for i, u in enumerate(urls[:10])]

    # Derive a confidence score from the critic feedback (e.g. "Score: 8/10")
    score_match = re.search(r"Score:\s*(\d+)/10", feedback)
    confidence  = f"{score_match.group(1)}/10" if score_match else "N/A"

    return {
        "report":     report_html,
        "feedback":   feedback,
        "sources":    sources,
        "confidence": confidence,
    }


def _md_to_html(text: str) -> str:
    """Minimal Markdown → HTML converter (headings, bold, bullets, paragraphs)."""
    lines = text.splitlines()
    html_parts = []
    for line in lines:
        if line.startswith("### "):
            html_parts.append(f"<h3>{line[4:]}</h3>")
        elif line.startswith("## "):
            html_parts.append(f"<h2>{line[3:]}</h2>")
        elif line.startswith("# "):
            html_parts.append(f"<h1>{line[2:]}</h1>")
        elif line.startswith("- ") or line.startswith("* "):
            html_parts.append(f"<li>{line[2:]}</li>")
        elif line.strip() == "":
            html_parts.append("<br>")
        else:
            # Bold **text**
            line = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", line)
            html_parts.append(f"<p>{line}</p>")
    return "\n".join(html_parts)


# Static files must be mounted AFTER all route definitions
app.mount("/", StaticFiles(directory="."), name="static")

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
