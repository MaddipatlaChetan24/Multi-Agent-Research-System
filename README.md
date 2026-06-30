<div align="center">

# Nova

### Autonomous Multi-Agent Research System

Built with **LangGraph**, **LangChain**, and **FastAPI**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)]()
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent%20Workflow-black?style=flat-square)]()
[![LangChain](https://img.shields.io/badge/LangChain-Framework-green?style=flat-square)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)]()

An autonomous AI research platform that coordinates multiple specialized agents to search the web, analyze information, synthesize knowledge, and generate citation-backed research reports.

</div>

---

# Overview

Nova is a production-oriented multi-agent AI research system built using **LangGraph** and **LangChain**. Instead of relying on a single LLM response, Nova orchestrates multiple specialized AI agents that collaborate to perform comprehensive web research.

The system automatically:

- Searches relevant sources
- Reads and extracts information
- Synthesizes structured research reports
- Reviews its own output
- Assigns confidence scores
- Provides citation-backed conclusions

---

# Features

## Multi-Agent Architecture

| Agent | Responsibility |
|--------|----------------|
| Search Agent | Generates optimized search queries and discovers relevant sources |
| Reader Agent | Extracts information from articles and web pages |
| Writer Agent | Produces structured research reports |
| Critic Agent | Reviews reports and assigns confidence scores |

---

## Real-Time Dashboard

The web interface provides:

- Live agent status
- Pipeline progress
- Runtime tracking
- Token estimation
- Final report visualization

---

## Research Output

Nova generates:

- Structured Markdown reports
- Source citations
- Confidence scores
- Executive summaries
- Evidence-based conclusions

---

# Architecture

```text
User Query
     │
     ▼
FastAPI Backend
     │
     ▼
LangGraph Workflow
     │
     ├──────── Search Agent
     ├──────── Reader Agent
     ├──────── Writer Agent
     └──────── Critic Agent
              │
              ▼
      Final Research Report
```

---

# Project Structure

```text
Nova/
│
├── server.py
├── pipeline.py
├── agents.py
├── tools.py
├── prompts.py
├── requirements.txt
├── .env
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/<username>/Nova.git

cd Nova
```

## Create Virtual Environment

**Linux / macOS**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows**

```powershell
python -m venv .venv
.venv\Scripts\activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Configure Environment Variables

Create a `.env` file.

```env
OPENAI_API_KEY=
SEARCH_API_KEY=
LANGCHAIN_API_KEY=
LANGSMITH_API_KEY=
```

---

# Running the Project

Start the backend server.

```bash
python server.py
```

The application will be available at

```
http://127.0.0.1:8000
```

---

# Technology Stack

**Frameworks**

- LangGraph
- LangChain

**Backend**

- FastAPI
- Python

**LLM Providers**

- OpenAI Compatible Models

**Utilities**

- Requests
- BeautifulSoup
- Markdown

**Frontend**

- HTML
- CSS
- JavaScript

---

# Roadmap

- PDF report generation
- Vector database integration
- Memory-enabled agents
- Multi-modal research
- Docker deployment
- Kubernetes deployment
- Authentication
- Streaming responses
- Multi-user support

---

# Contributing

Contributions are welcome.

```bash
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature
```

Then open a Pull Request.

---

# License

This project is distributed under the MIT License.
