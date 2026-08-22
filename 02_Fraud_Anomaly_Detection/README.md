# Fraud / Anomaly Detection

An end-to-end, educational anomaly-detection project built on the public credit-card transaction dataset. It separates data understanding, preparation, individual unsupervised models, label-based evaluation, comparison, and deployable inference.

## Project layout

- `data/raw/` — original input data
- `data/processed/` — cleaned, engineered, and scaled artifacts
- `notebooks/01...14` — ordered analysis and modeling workflow
- `src/fraud_detection.py` — reusable feature engineering, evaluation helpers, and final pipeline
- `models/` — fitted model artifacts (created by notebooks)
- `reports/` — scores, leaderboard, and predictions (created by notebooks)

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
jupyter lab
```

Download `creditcard.csv` from the [Kaggle Credit Card Fraud Detection dataset](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) and place it at:

```text
data/raw/creditcard.csv
```

The dataset and generated processed CSV files are excluded from Git because each full dataset file is larger than GitHub's standard file-size limit. Run notebook 02 to create `data/processed/creditcard_cleaned.csv`.

Run notebooks in numeric order. Notebooks 07–10 intentionally use bounded, reproducible samples for algorithms whose memory or runtime grows quickly. The fraud label is excluded from training and revealed only for evaluation.

## Final reusable pipeline

```python
import pandas as pd
from src.fraud_detection import FraudAnomalyPipeline

df = pd.read_csv("data/raw/creditcard.csv")
model = FraudAnomalyPipeline(contamination=0.002).fit(df.drop(columns="Class"))
predictions = model.predict_frame(df.drop(columns="Class"))
```

`anomaly_prediction=1` means the transaction should be investigated. In a real system, tune the threshold to investigation capacity and the relative business cost of missed fraud versus false alerts.

## Reproducibility

All randomized models use seed `42`. Generated datasets, model binaries, and report CSVs are intentionally created by the notebooks rather than committed as source. The raw dataset must contain `Time`, `Amount`, `V1`–`V28`, and `Class`.
