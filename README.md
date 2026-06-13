# Nova Multi-Agent Research System

Nova is a powerful, autonomous, multi-agent AI research assistant built with **LangGraph** and **LangChain**. It performs deep web research, scrapes articles, and synthesizes comprehensive research reports with citations and confidence scoring, all presented in a sleek, real-time UI.

## 🚀 Features

- **Multi-Agent Architecture**: 
  - 🟢 **Search Agent**: Formulates queries and finds relevant URLs.
  - 🟡 **Reader Agent**: Scrapes and extracts deep content from specific articles.
  - 🔵 **Writer Agent**: Synthesizes the gathered research into structured Markdown reports.
  - 🟠 **Critic Agent**: Reviews the report, provides constructive feedback, and assigns a confidence score.
- **Real-Time UI (Command Center)**: A modern frontend that tracks agent status, elapsed time, and token estimates.
- **FastAPI Backend**: A lightweight Python server that orchestrates the LangGraph pipeline.

## 🛠️ Prerequisites

- Python 3.10+
- LLM API Key (configure in your environment)
- Web Search API Key (configure in your environment)

## ⚙️ Installation

1. **Clone the repository** (or navigate to your project folder):
   ```bash
   cd "multi agent system"
   ```

2. **Set up a virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add your required environment variables for your chosen LLM and search provider:
   ```env
   # Add your specific API keys here based on the models and tools you configure
   ```

## 🏃‍♂️ Running the System

1. **Start the backend server**:
   ```bash
   source .venv/bin/activate
   python server.py
   ```
   *The server will start running at `http://127.0.0.1:8000`.*

2. **Open the UI**:
   Navigate to [http://127.0.0.1:8000](http://127.0.0.1:8000) in your web browser.

3. **Run a Research Query**:
   Type a topic like *"Open-Source LLM Ecosystem Analysis 2026"* into the search bar and click **Research**. 
   - Simple greetings (like "hello") are answered instantly via a fast-path LLM router.
   - Complex topics automatically trigger the full 4-agent research pipeline.

## 🧠 Architecture Overview

- `server.py`: FastAPI server that serves the UI and routes requests to the pipeline.
- `pipeline.py`: Defines the execution flow (`run_research_pipeline`) connecting all agents.
- `agents.py`: Contains the LangChain/LangGraph agent definitions, prompts, and LLM setup.
- `tools.py`: Contains the web search and scraping functions.
- `index.html` / `style.css` / `script.js`: The frontend interface.
