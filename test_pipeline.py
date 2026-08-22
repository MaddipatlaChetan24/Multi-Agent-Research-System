from pipeline import run_research_pipeline
import time

try:
    print("Running pipeline...")
    start = time.time()
    res = run_research_pipeline("Open-Source LLM Ecosystem Analysis 2026")
    print("Success. Length of report:", len(res.get("report", "")))
    print(f"Time: {time.time() - start:.2f}s")
except Exception as e:
    import traceback
    print("Error:")
    traceback.print_exc()
