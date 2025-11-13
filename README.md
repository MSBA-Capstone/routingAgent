# AI Roadtrip Planner

## Hosted Version

This app is hosted on Vercel: [Live App](https://agent-pro-example.vercel.app/)


## Features

* Route feasibility checker based on time and distance constraints
* Utility-focused/  itinerary generator with day-by-day plans
* Agent prompt system for multiple task types
* Integrated geocoding and directions tools
* Frontend and backend integration using React and FastAPI

## Project Structure

```
finalProject/
│
├── backend/             # FastAPI backend and agent logic
│   ├── backend.py           # Main API entrypoint
│   ├── agent_prompts.py     # Prompt templates for agents
│   ├── baseAgent.py         # (Possibly legacy) base class for agent
│   ├── tools/               # AI tool wrappers
│       ├── ddgs_tool.py         # DuckDuckGo search
│       ├── directions_tool.py   # Route calculation
│       ├── geocoding_tool.py    # Address to coordinate
│       ├── linkup_tool.py       # Tool coordination
│       ├── rag_tool.py          # (Deprecated) RAG functionality
│
├── frontend/            # React app (Vite + Tailwind)
│   ├── src/                  # React source code
│   ├── public/               # Static assets
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── ...
│
├── RAG/                 # (Deprecated) RAG setup scripts
│   ├── ragInit.py           # Build FAISS index
│   └── cat-facts.txt        # RAG functionality testing text data
│
├── requirements.txt     # Python dependencies
├── agent.ipynb          # Jupyter notebook (dev)
├── README.md            # Project documentation
└── ...
```

## Local Setup Instructions

### Requirements

* Python 3.10+
* Node.js 18+

---

## Backend Setup

1. Create and activate a conda env:

```bash
conda create -n roadtrip python=3.10
conda activate roadtrip
```

2. Install backend dependencies:

```bash
pip install -r requirements.txt
```

3. Start the backend:

```bash
cd backend
uvicorn backend:app --reload
```

Visit: `http://localhost:8000`

---

## Frontend Setup

1. Navigate to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run the dev server:

```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## Notes

* Environment variables can be set via `.env` file (if needed)
* Backend and frontend run independently in dev mode
* RAG components are currently deprecated

---

## Status

Active development — frontend recently revamped, backend agents stable, older RAG logic deprecated.

## Maintainers

AI dev – core logic
Data engineer – README, testing, & support
