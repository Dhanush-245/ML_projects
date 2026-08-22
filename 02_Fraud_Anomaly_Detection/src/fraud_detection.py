"""Reusable utilities and an inference-safe fraud anomaly pipeline."""
from pathlib import Path
import time
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import average_precision_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.preprocessing import RobustScaler


def engineer_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Create deterministic features available in the public credit-card dataset."""
    required = {"Time", "Amount"}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    out = frame.drop(columns=["Class"], errors="ignore").copy()
    if out.isna().any().any():
        out = out.fillna(out.median(numeric_only=True))
    out = out.replace([np.inf, -np.inf], np.nan).fillna(0)
    out["Amount_log"] = np.log1p(out["Amount"].clip(lower=0))
    hour = (out["Time"] / 3600) % 24
    out["Time_hours"] = out["Time"] / 3600
    out["Time_days"] = out["Time"] / 86400
    out["Hour_of_day"] = hour
    out["Hour_sin"] = np.sin(2 * np.pi * hour / 24)
    out["Hour_cos"] = np.cos(2 * np.pi * hour / 24)
    return out.astype(float)


def load_features_labels(root: Path):
    data = pd.read_csv(root / "data/processed/creditcard_cleaned.csv")
    y = data.pop("Class").astype(int)
    return engineer_features(data), y


def stratified_working_sample(X, y, max_rows=60000, random_state=42):
    if len(X) <= max_rows:
        return X.copy(), y.copy()
    fraud_idx = y[y == 1].index
    normal_idx = y[y == 0].sample(max_rows - len(fraud_idx), random_state=random_state).index
    idx = normal_idx.union(fraud_idx)
    return X.loc[idx].sample(frac=1, random_state=random_state), y.loc[idx].sample(frac=1, random_state=random_state)


def evaluate_scores(y_true, scores, model):
    y = np.asarray(y_true, dtype=int); scores = np.asarray(scores, dtype=float)
    threshold = np.quantile(scores, 1 - y.mean())
    pred = (scores >= threshold).astype(int)
    return {"model": model, "anomalies": int(pred.sum()), "precision": precision_score(y, pred, zero_division=0), "recall": recall_score(y, pred, zero_division=0), "f1": f1_score(y, pred, zero_division=0), "roc_auc": roc_auc_score(y, scores), "pr_auc": average_precision_score(y, scores)}


def save_results(results, path):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True); results.to_csv(path, index=False)


class FraudAnomalyPipeline:
    """RobustScaler + IsolationForest with a learned score threshold."""
    def __init__(self, contamination=0.002, random_state=42, n_estimators=200):
        self.contamination = contamination; self.random_state = random_state; self.n_estimators = n_estimators

    def fit(self, X):
        features = engineer_features(X)
        self.feature_names_ = features.columns.tolist()
        self.scaler_ = RobustScaler().fit(features)
        scaled = self.scaler_.transform(features)
        self.model_ = IsolationForest(n_estimators=self.n_estimators, contamination=self.contamination, random_state=self.random_state, n_jobs=-1).fit(scaled)
        scores = -self.model_.score_samples(scaled)
        self.threshold_ = float(np.quantile(scores, 1 - self.contamination))
        return self

    def score_samples(self, X):
        features = engineer_features(X).reindex(columns=self.feature_names_, fill_value=0)
        return -self.model_.score_samples(self.scaler_.transform(features))

    def predict(self, X):
        return (self.score_samples(X) >= self.threshold_).astype(int)

    def predict_frame(self, X):
        scores = self.score_samples(X)
        return pd.DataFrame({"anomaly_score": scores, "anomaly_prediction": (scores >= self.threshold_).astype(int)}, index=X.index)
