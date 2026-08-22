"""Generate the remaining tutorial notebooks with a consistent, reproducible layout."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
NB = ROOT / "notebooks"


def repair_legacy_markdown_cells():
    """Correct prose cells that were accidentally saved as executable code."""
    prose_cells = {
        "01_Data_Loading_and_Understanding.ipynb": (0, 16),
        "02_Data_Cleaning.ipynb": (0,),
        "03_EDA.ipynb": (0, 28),
        "04_Feature_Engineering.ipynb": (0, 31),
    }
    for filename, indices in prose_cells.items():
        path = NB / filename
        if not path.exists():
            continue
        notebook = json.loads(path.read_text())
        for index in indices:
            notebook["cells"][index]["cell_type"] = "markdown"
            notebook["cells"][index].pop("execution_count", None)
            notebook["cells"][index].pop("outputs", None)
        path.write_text(json.dumps(notebook, indent=1) + "\n")


def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": text.strip().splitlines(True)}


def code(text):
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": text.strip().splitlines(True)}


def write(name, title, objective, sections):
    cells = [md(f"# Fraud / Anomaly Detection\n## {title}\n\n### Objective\n{objective}")]
    for heading, body, interpretation, decision in sections:
        cells += [md(f"## {heading}"), code(body)]
        if interpretation:
            cells.append(md(f"**Interpretation.** {interpretation}"))
        if decision:
            cells.append(md(f"**ML decision.** {decision}"))
    notebook = {"cells": cells, "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}, "language_info": {"name": "python", "version": "3"}}, "nbformat": 4, "nbformat_minor": 5}
    (NB / name).write_text(json.dumps(notebook, indent=1) + "\n")


COMMON = """from pathlib import Path
import sys, numpy as np, pandas as pd
ROOT = Path.cwd().resolve()
if ROOT.name == 'notebooks': ROOT = ROOT.parent
sys.path.insert(0, str(ROOT))
from src.fraud_detection import load_features_labels, evaluate_scores, save_results
X, y = load_features_labels(ROOT)
RANDOM_STATE = 42
print('Features:', X.shape, '| fraud:', int(y.sum()))"""

write("05_Preprocessing_and_Scaling.ipynb", "Notebook 05 — Preprocessing and Scaling", "Compare common scalers, create the canonical robust-scaled feature matrix, and save a fitted preprocessor.", [
    ("Imports and data", COMMON + "\nfrom sklearn.preprocessing import StandardScaler, RobustScaler, MinMaxScaler\nimport joblib", "Labels are loaded only for later evaluation; they are never passed to a scaler.", "Use all numeric engineered features and fit transformations without target leakage."),
    ("Compare transformations", """scalers = {'standard': StandardScaler(), 'robust': RobustScaler(), 'minmax': MinMaxScaler()}
summary = []
for name, scaler in scalers.items():
    transformed = scaler.fit_transform(X)
    summary.append({'scaler': name, 'min': transformed.min(), 'max': transformed.max(), 'mean_abs': np.abs(transformed).mean()})
pd.DataFrame(summary)""", "Standard scaling is useful for approximately symmetric variables, robust scaling is less affected by extreme transaction values, and min-max scaling has bounded output.", "Choose RobustScaler because genuine fraud-related extremes should not dominate preprocessing."),
    ("Fit and save canonical preprocessing", """scaler = RobustScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=X.columns, index=X.index)
assert np.isfinite(X_scaled.to_numpy()).all()
(ROOT/'data/processed').mkdir(parents=True, exist_ok=True)
(ROOT/'models').mkdir(exist_ok=True)
X_scaled.to_csv(ROOT/'data/processed/creditcard_scaled.csv', index=False)
joblib.dump(scaler, ROOT/'models/robust_scaler.joblib')
X_scaled.describe().T.head()""", "The saved matrix and fitted scaler make all subsequent experiments reproducible.", "Reuse this exact representation for model comparison."),
])

write("06_Statistical_Anomaly_Detection.ipynb", "Notebook 06 — Statistical Anomaly Detection", "Build transparent Z-score, IQR, and Mahalanobis baselines.", [
    ("Imports and data", COMMON + "\nfrom scipy.stats import chi2\nfrom sklearn.covariance import LedoitWolf", "Statistical rules provide explainable reference baselines.", "Evaluate their continuous severity scores, not only binary flags."),
    ("Z-score and IQR", """amount = X['Amount'].to_numpy()
z_score = np.abs((amount - amount.mean()) / amount.std())
q1, q3 = np.quantile(amount, [.25, .75]); iqr = q3-q1
iqr_score = np.maximum((q1-amount)/iqr, (amount-q3)/iqr)
pd.DataFrame([evaluate_scores(y, z_score, 'Z-Score'), evaluate_scores(y, iqr_score, 'IQR')])""", "These univariate baselines detect unusual amounts but miss multivariate fraud patterns.", "Keep them as interpretable baselines."),
    ("Mahalanobis distance", """cols = [c for c in X.columns if c.startswith('V')]
sample = X[cols].sample(min(50000, len(X)), random_state=RANDOM_STATE)
cov = LedoitWolf().fit(sample)
mahal = cov.mahalanobis(X[cols])
results = pd.DataFrame([evaluate_scores(y, z_score, 'Z-Score'), evaluate_scores(y, iqr_score, 'IQR'), evaluate_scores(y, mahal, 'Mahalanobis')])
save_results(results, ROOT/'reports/statistical_results.csv'); results""", "Shrinkage covariance stabilizes Mahalanobis distance in correlated high-dimensional data.", "Pass the strongest statistical baseline to the comparison stage."),
])

MODEL_IMPORT = COMMON + "\nfrom src.fraud_detection import stratified_working_sample"
write("07_Isolation_Forest.ipynb", "Notebook 07 — Isolation Forest", "Train the primary tree-based anomaly detector and save its scores and model.", [
    ("Imports and sample", MODEL_IMPORT + "\nfrom sklearn.ensemble import IsolationForest\nimport joblib\nXw, yw = stratified_working_sample(X, y, max_rows=60000, random_state=RANDOM_STATE)", "A bounded stratified working set makes experiments fast while retaining every rare fraud example.", "Isolation Forest is the primary scalable candidate."),
    ("Train, score, and save", """model = IsolationForest(n_estimators=200, contamination='auto', random_state=RANDOM_STATE, n_jobs=-1)
model.fit(Xw)
scores = -model.score_samples(Xw)
result = evaluate_scores(yw, scores, 'Isolation Forest')
joblib.dump(model, ROOT/'models/isolation_forest.joblib')
pd.DataFrame({'row_index': Xw.index, 'label': yw, 'score': scores}).to_csv(ROOT/'reports/isolation_forest_scores.csv', index=False)
result""", "Higher negative score-sample values indicate observations isolated in fewer splits.", "Use PR-AUC and recall to decide whether this remains the primary model."),
])

write("08_Local_Outlier_Factor.ipynb", "Notebook 08 — Local Outlier Factor", "Detect anomalies that are sparse relative to their local neighborhoods.", [
    ("Imports and sample", MODEL_IMPORT + "\nfrom sklearn.neighbors import LocalOutlierFactor\nXw, yw = stratified_working_sample(X, y, max_rows=30000, random_state=RANDOM_STATE)", "LOF is quadratic-ish in practical neighbor search cost, so a smaller sample is intentional.", "Use novelty mode only when scoring unseen data; this experiment evaluates the fitted sample."),
    ("Fit and evaluate", """model = LocalOutlierFactor(n_neighbors=35, contamination='auto', n_jobs=-1)
model.fit_predict(Xw)
scores = -model.negative_outlier_factor_
result = evaluate_scores(yw, scores, 'Local Outlier Factor')
pd.DataFrame({'row_index': Xw.index, 'label': yw, 'score': scores}).to_csv(ROOT/'reports/lof_scores.csv', index=False)
result""", "LOF can find local pockets that a global detector misses.", "Compare it fairly using ranked scores rather than its default threshold."),
])

write("09_One_Class_SVM.ipynb", "Notebook 09 — One-Class SVM", "Learn a nonlinear boundary around the majority transaction pattern.", [
    ("Imports and sample", MODEL_IMPORT + "\nfrom sklearn.svm import OneClassSVM\nXw, yw = stratified_working_sample(X, y, max_rows=15000, random_state=RANDOM_STATE)", "Kernel SVM training scales poorly with row count, so this notebook uses a documented cap.", "Treat One-Class SVM as a quality-versus-runtime comparison candidate."),
    ("Fit and evaluate", """model = OneClassSVM(kernel='rbf', gamma='scale', nu=max(yw.mean(), 0.005))
model.fit(Xw)
scores = -model.decision_function(Xw).ravel()
result = evaluate_scores(yw, scores, 'One-Class SVM')
pd.DataFrame({'row_index': Xw.index, 'label': yw, 'score': scores}).to_csv(ROOT/'reports/one_class_svm_scores.csv', index=False)
result""", "The decision score measures distance beyond the learned normal boundary.", "Reject this model if its gain does not justify substantially higher runtime."),
])

write("10_DBSCAN_Anomaly_Detection.ipynb", "Notebook 10 — DBSCAN Anomaly Detection", "Treat low-density DBSCAN noise points as anomalies.", [
    ("Imports and sample", MODEL_IMPORT + "\nfrom sklearn.cluster import DBSCAN\nfrom sklearn.neighbors import NearestNeighbors\nXw, yw = stratified_working_sample(X, y, max_rows=12000, random_state=RANDOM_STATE)", "DBSCAN is sensitive to scale, dimension, and memory use.", "Use a bounded sample and estimate epsilon from neighbor distances."),
    ("Estimate epsilon and fit", """nn = NearestNeighbors(n_neighbors=10, n_jobs=-1).fit(Xw)
distances, _ = nn.kneighbors(Xw)
kdist = distances[:, -1]
eps = float(np.quantile(kdist, .95))
labels = DBSCAN(eps=eps, min_samples=10, n_jobs=-1).fit_predict(Xw)
scores = kdist
result = evaluate_scores(yw, scores, 'DBSCAN k-distance')
result.update({'eps': eps, 'noise_points': int((labels == -1).sum())})
pd.DataFrame({'row_index': Xw.index, 'label': yw, 'score': scores, 'cluster': labels}).to_csv(ROOT/'reports/dbscan_scores.csv', index=False)
result""", "K-neighbor distance provides a continuous density anomaly score; cluster -1 is DBSCAN's hard noise assignment.", "Use the continuous score for metrics and the hard label for cluster interpretation."),
])

write("11_PCA_Anomaly_Visualization.ipynb", "Notebook 11 — PCA Anomaly Visualization", "Project high-dimensional transactions into two dimensions and visualize fraud and anomaly scores.", [
    ("Imports and sample", COMMON + "\nimport matplotlib.pyplot as plt, seaborn as sns\nfrom sklearn.decomposition import PCA\nfrom src.fraud_detection import stratified_working_sample\nXw, yw = stratified_working_sample(X, y, max_rows=20000, random_state=RANDOM_STATE)", "PCA is used for visualization, not as proof of separability.", "Preserve labels only for plot coloring."),
    ("Project and plot", """pca = PCA(n_components=2, random_state=RANDOM_STATE)
points = pca.fit_transform(Xw)
plot_df = pd.DataFrame({'PC1': points[:,0], 'PC2': points[:,1], 'Class': yw.to_numpy()})
plt.figure(figsize=(10,7)); sns.scatterplot(data=plot_df, x='PC1', y='PC2', hue='Class', alpha=.45, s=18)
plt.title(f'PCA projection — explained variance {pca.explained_variance_ratio_.sum():.1%}'); plt.show()""", "Overlap is expected: PCA preserves global variance, while fraud may be locally or nonlinearly anomalous.", "Do not select a model from this plot alone."),
])

write("12_Model_Comparison.ipynb", "Notebook 12 — Model Comparison", "Create an AutoML-style leaderboard from saved model score files.", [
    ("Load score artifacts", """from pathlib import Path
import pandas as pd
ROOT = Path.cwd().resolve(); ROOT = ROOT.parent if ROOT.name == 'notebooks' else ROOT
files = {'Isolation Forest':'isolation_forest_scores.csv', 'LOF':'lof_scores.csv', 'One-Class SVM':'one_class_svm_scores.csv', 'DBSCAN':'dbscan_scores.csv'}
missing = [f for f in files.values() if not (ROOT/'reports'/f).exists()]
if missing: raise FileNotFoundError('Run notebooks 07–10 first. Missing: ' + ', '.join(missing))""", "Each score artifact includes its own sampled labels, so metrics remain honest for that model's working set.", "Rank primarily by PR-AUC due to severe class imbalance."),
    ("Build leaderboard", """import sys; sys.path.insert(0, str(ROOT))
from src.fraud_detection import evaluate_scores
rows=[]
for model, filename in files.items():
    frame=pd.read_csv(ROOT/'reports'/filename)
    rows.append(evaluate_scores(frame.label, frame.score, model))
leaderboard=pd.DataFrame(rows).sort_values(['pr_auc','recall'], ascending=False).reset_index(drop=True)
leaderboard.to_csv(ROOT/'reports/model_leaderboard.csv', index=False)
leaderboard""", "PR-AUC measures ranking performance under imbalance; threshold metrics use a predicted anomaly count equal to observed fraud prevalence for comparison.", "Advance the top-ranked deployable model to final evaluation."),
])

write("13_Evaluation.ipynb", "Notebook 13 — Evaluation", "Evaluate the selected model with threshold metrics, ROC/PR curves, and a confusion matrix.", [
    ("Load best available scores", """from pathlib import Path
import pandas as pd, numpy as np, matplotlib.pyplot as plt, seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, RocCurveDisplay, PrecisionRecallDisplay
ROOT=Path.cwd().resolve(); ROOT=ROOT.parent if ROOT.name=='notebooks' else ROOT
board=pd.read_csv(ROOT/'reports/model_leaderboard.csv')
mapping={'Isolation Forest':'isolation_forest_scores.csv','LOF':'lof_scores.csv','One-Class SVM':'one_class_svm_scores.csv','DBSCAN':'dbscan_scores.csv'}
best=board.iloc[0].model; scores=pd.read_csv(ROOT/'reports'/mapping[best]); best""", "Labels are revealed here for final evaluation, never for model fitting.", "Choose the operating threshold using business cost after model ranking."),
    ("Threshold evaluation", """threshold=np.quantile(scores.score, 1-scores.label.mean())
pred=(scores.score>=threshold).astype(int)
print(classification_report(scores.label, pred, digits=4, zero_division=0))
cm=confusion_matrix(scores.label,pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues'); plt.xlabel('Predicted'); plt.ylabel('Actual'); plt.show()
RocCurveDisplay.from_predictions(scores.label,scores.score); plt.show()
PrecisionRecallDisplay.from_predictions(scores.label,scores.score); plt.show()""", "Accuracy is misleading because predicting every transaction as normal is already near-perfect on this dataset.", "Prefer PR-AUC, fraud recall, and investigation capacity when setting the threshold."),
])

write("14_Final_Anomaly_Detection_Pipeline.ipynb", "Notebook 14 — Final Anomaly Detection Pipeline", "Run the reusable end-to-end pipeline, persist it, and produce final predictions.", [
    ("Train pipeline", """from pathlib import Path
import pandas as pd, joblib, sys
ROOT=Path.cwd().resolve(); ROOT=ROOT.parent if ROOT.name=='notebooks' else ROOT
sys.path.insert(0,str(ROOT))
from src.fraud_detection import FraudAnomalyPipeline
raw=pd.read_csv(ROOT/'data/raw/creditcard.csv')
pipeline=FraudAnomalyPipeline(random_state=42, contamination=0.002)
pipeline.fit(raw.drop(columns=['Class']))
joblib.dump(pipeline, ROOT/'models/final_fraud_pipeline.joblib')""", "The pipeline owns feature preparation, robust scaling, anomaly scoring, and thresholding.", "Persist one object so inference uses the exact training transformations."),
    ("Predict and save", """predictions=pipeline.predict_frame(raw.drop(columns=['Class']))
predictions['actual_class']=raw['Class'].to_numpy()
predictions.to_csv(ROOT/'reports/final_predictions.csv',index=False)
predictions.head(), predictions.anomaly_prediction.value_counts()""", "Anomaly scores are continuous; predictions are thresholded flags where 1 means investigate.", "Monitor score drift and retrain when transaction behavior changes."),
])

repair_legacy_markdown_cells()
print("Generated notebooks 05 through 14 and repaired legacy prose cells")
