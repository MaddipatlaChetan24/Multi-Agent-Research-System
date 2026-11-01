def _md_to_html(text: str) -> str:
    """Minimal Markdown → HTML converter (headings, bold, bullets, paragraphs)."""
    import html as html_lib

    def apply_inline(line: str) -> str:
        line = html_lib.escape(line)
        line = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", line)
        line = re.sub(r"\*(.+?)\*", r"<em>\1</em>", line)
        return line

    lines = text.splitlines()
    html_parts = []
    in_list = False

    def close_list():
        nonlocal in_list
        if in_list:
            html_parts.append("</ul>")
            in_list = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("### "):
            close_list()
            html_parts.append(f"<h3>{apply_inline(stripped[4:])}</h3>")
        elif stripped.startswith("## "):
            close_list()
            html_parts.append(f"<h2>{apply_inline(stripped[3:])}</h2>")
        elif stripped.startswith("# "):
            close_list()
            html_parts.append(f"<h1>{apply_inline(stripped[2:])}</h1>")
        elif stripped.startswith("- ") or stripped.startswith("* "):
            if not in_list:
                html_parts.append("<ul>")
        elif stripped == "":
            close_list()
            html_parts.append("<
            html_parts.append(f"<p>{apply_inline(stripped)}</p>")

    close_list()
    return "\n".join(html_parts)
