
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
            line = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", 
