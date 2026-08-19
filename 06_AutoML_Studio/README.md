<h1 align="center">AutoML Studio</h1>

<p align="center">
  A full-stack platform for turning tabular datasets into trained, tuned, explainable, and deployable machine-learning experiments.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/scikit--learn-AutoML-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="scikit-learn">
</p>

## Overview

AutoML Studio provides one workspace for uploading tabular data, inspecting quality, configuring preprocessing, training and tuning multiple model families, comparing performance, explaining predictions, registering selected models, and testing inference. It pairs a FastAPI/SQLAlchemy backend with a responsive React and TypeScript frontend.

## Features

### Data workspace

- CSV dataset upload and lifecycle management
- Schema, type, missing-value, and quality summaries
- Data preview, profile, and side-by-side comparison
- Missing-value handling, encoding, scaling, and feature preparation

### Model development

- Automatic classification and regression workflows
- Configurable candidate-model selection
- Training progress and experiment history
- Metric comparison and leaderboard views
- Hyperparameter tuning with saved experiment state

### Explainability and delivery

- SHAP, LIME, and counterfactual explanation interfaces
- Model registry for approved artifacts
- Prediction playground for manual inference
- Deployment-management interface
- Monitoring, notifications, settings, and command palette

### Application experience

- Authentication and user-profile flows
- Responsive light/dark interface
- Visual pipeline canvas and interactive dashboards
- Typed API layer shared across frontend features

## Architecture

```text
React + TypeScript frontend
          │
          │ REST / JSON
          ▼
FastAPI application
  ├── Authentication router
  ├── Dataset router
  ├── Training and tuning routers
  ├── Explainability router
  ├── Registry and deployment routers
  └── ML engines
      ├── Data and preprocessing
      ├── Training and tuning
      └── SHAP/LIME explanations
          │
          ▼
SQLite metadata + local artifact storage
```

## Project structure

```text
.
├── backend/
│   ├── engines/
│   │   ├── data_engine.py
│   │   ├── preprocessing_engine.py
│   │   ├── training_engine.py
│   │   ├── tuning_engine.py
│   │   └── xai_engine.py
│   ├── models/
│   │   └── database.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── datasets.py
│   │   ├── training.py
│   │   ├── tuning.py
│   │   ├── explainability.py
│   │   ├── registry.py
│   │   └── deployment.py
│   ├── storage/                 # Local datasets and models (ignored)
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed backend clients
│   │   ├── components/          # Product feature modules
│   │   ├── stores/              # Application state
│   │   └── utils/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── .gitignore
└── README.md
```

## Run locally

### Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm

### 1. Start the backend

```bash
git clone https://github.com/Dhanush-245/ML_projects.git
cd ML_projects/06_AutoML_Studio/backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Backend endpoints:

- Health check: `http://localhost:8000/health`
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI schema: `http://localhost:8000/openapi.json`

### 2. Start the frontend

In a second terminal:

```bash
cd ML_projects/06_AutoML_Studio/frontend
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## Configuration

Backend `.env`:

```env
DATABASE_URL=sqlite:///./storage/automl_studio.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Zustand, Recharts, React Flow |
| Backend | FastAPI, Pydantic, SQLAlchemy, Uvicorn |
| Machine learning | pandas, NumPy, scikit-learn, XGBoost, LightGBM, CatBoost |
| Explainability | SHAP and LIME |
| Persistence | SQLite and Joblib |

## Build and validation

```bash
cd frontend
npm run build
```

The production build is intentionally ignored by Git. Uploaded datasets, fitted models, local databases, environments, dependency folders, caches, and CatBoost telemetry are also excluded.

## Security and limitations

- Use only trusted datasets and model artifacts.
- Development authentication and SQLite storage are not production security controls.
- Validate file type, size, schema, and content before processing uploads in production.
- Replace local secrets and defaults before deploying.
- Review CORS, authorization, encryption, data retention, audit logging, and rate limiting.
- Evaluate model fairness, calibration, drift, and domain suitability before acting on predictions.

## Future improvements

- Add background job queues and cancellation for long-running training
- Add persistent experiment tracking and artifact versioning
- Add role-based authorization and production identity integration
- Add automated data contracts, drift checks, and model cards
- Containerize the frontend and backend for repeatable deployment
- Add unit, integration, end-to-end, and security tests

## License

No license has been selected. Add a license before permitting reuse or redistribution.

## Author

**Lingareddy Dhanush** · [GitHub](https://github.com/Dhanush-245)
