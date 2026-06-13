from dotenv import load_dotenv
load_dotenv()
from langchain_mistralai import ChatMistralAI

try:
    llm = ChatMistralAI(model="mistral-small-4", temperature=0)
    res = llm.invoke("hello")
    print("Success with mistral-small-4")
except Exception as e:
    print("Error with mistral-small-4:", e)
    
try:
    llm = ChatMistralAI(model="mistral-small-latest", temperature=0)
    res = llm.invoke("hello")
    print("Success with mistral-small-latest")
except Exception as e:
    print("Error with mistral-small-latest:", e)
