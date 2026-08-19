# AutoML Studio

A full-stack workspace for uploading tabular datasets, training and tuning machine-learning models, comparing experiments, explaining predictions, managing a model registry, and preparing deployments.

## Stack

- FastAPI and SQLAlchemy backend
- React, TypeScript, and Vite frontend
- scikit-learn and supporting tabular-ML libraries
- Local SQLite metadata storage by default

## Structure

```text
.
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── routers/
│   ├── services/
│   └── storage/
└── frontend/
    ├── package.json
    ├── src/
    └── vite.config.ts
```

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

The API health endpoint is available at `http://localhost:8000/health`, and interactive API documentation is available at `http://localhost:8000/docs`.

### Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the URL shown by Vite, normally `http://localhost:5173`.

## Local data

Uploaded datasets, trained models, the SQLite database, dependency folders, and build outputs are intentionally excluded from Git. Placeholder files keep the required storage directories available after cloning.

## Security

Use only trusted datasets and model artifacts. Change development defaults and review authentication, CORS, storage, and deployment configuration before exposing the application publicly.
