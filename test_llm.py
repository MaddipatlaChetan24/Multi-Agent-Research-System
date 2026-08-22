from agents import llm
import time

start = time.time()
prompt = """You are a routing agent. 
Analyze the following user input. If it is a simple greeting, small talk, testing message (like 'hello', 'test', 'how are you'), or a direct question that does NOT require browsing the web to answer, reply with EXACTLY the word "YES".
If it is a complex query that requires deep web research, reply with EXACTLY the word "NO".

Input: hello"""
res = llm.invoke(prompt)
print("Classifier returned:", repr(res.content))
print(f"Time taken: {time.time() - start:.2f}s")
