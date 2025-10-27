# AgentProExample

## Hosted Version
This app is hosted on Vercel https://agent-pro-example.vercel.app/

## Features

- **Cat RAG Chat**: Ask questions about cats and get answers powered by a local Retrieval-Augmented Generation (RAG) system built on your own cat facts.
- **Add Your Own Cat Facts**: Users can submit new cat facts through the frontend, which are instantly added to the knowledge base and indexed for future queries.
- **Random Cat Images**: Each chat session displays a random cat image fetched from The Cat API for a fun, engaging experience.

## Project Structure

```
finalProject/
│
├── backend/         # FastAPI backend server and custom tools
│   ├── backend.py   # Main backend API entrypoint
│   └── rag_tool.py  # Custom RAG tool for cat facts
│
├── frontend/        # React frontend (Vite)
│   ├── src/         # React source code
│   └── ...          # Static files, configs, etc.
│
├── RAG/             # RAG index builder and data
│   ├── ragInit.py   # Script to build/update FAISS index
│   └── cat-facts.txt# Cat facts data file
│
├── .gitignore       # Git ignore rules
├── README.md        # Project documentation
└── ...              # Other project files
```


## Environment Variables (.env File)

Some parts of this project require configuration via a `.env` file. This file should be placed in the project root (next to `backend/`, `frontend/`, and `RAG/`).

**Example `.env` file:**

```
OPENAI_API_KEY=your_openai_key_here
APP_PASSWORD=your_app_password
```

**Notes:**
- Do **not** commit your `.env` file to version control. It is included in `.gitignore` by default.
- If you add new environment variables, make sure to update your `.env` file accordingly.

## Local Setup Instructions

### Requirements

- **Python:** 3.10 or newer (recommended: 3.13)
- **Node.js:** 18.x or newer (recommended: 22.x) [Tip: use nvm to manage multiple versions of Node]

Make sure you have both Python and Node.js installed before proceeding with backend and frontend setup.

### RAG Setup

1. **Install Python dependencies**

	Navigate to the project root and install required packages (you should use a virtual environment):

	```bash
	pip install -r requirements.txt
	```

    This is probably the hardest part lol, reach out to Jack if you're having troubles

2. **Prepare your cat facts data**

	- Edit or add facts to `RAG/cat-facts.txt` (one fact per line).

3. **Build the RAG index**

	From the project root, run:

	```bash
	python RAG/ragInit.py
	```

	This should create or update the FAISS index in `RAG/faiss_index/`.

    ### Backend Setup

1. **Install backend dependencies**

	All backend packages should be already installed

2. **Start the backend server**

	From the project root, run:

	```bash
	uvicorn backend.backend:app --reload
	```

	The backend will be available at `http://localhost:8000`.


    ### Frontend Setup

1. **Install frontend dependencies**

	From the `frontend` directory:

	```bash
	cd frontend
	npm install
	```

2. **Start the frontend dev server**

	Still in the `frontend` directory, run:

	```bash
	npm run dev
	```

	The frontend will be available at `http://localhost:5173` by default.