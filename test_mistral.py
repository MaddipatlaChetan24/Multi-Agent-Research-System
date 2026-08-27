from agents import llm
import time

try:
    print("Invoking Mistral...")
    start = time.time()
    res = llm.invoke("Hello, are you there?")
    print("Success:", res.content)
    print(f"Time: {time.time() - start:.2f}s")
except Exception as e:
    print("Error:", type(e).__name__)
    print(e)
