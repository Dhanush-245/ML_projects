<h1 align="center">Customer Segmentation with Unsupervised Learning</h1>

<p align="center">
  An end-to-end clustering study that turns customer behavior into actionable marketing segments.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/scikit--learn-clustering-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="scikit-learn">
  <img src="https://img.shields.io/badge/customers-200-8B5CF6?style=for-the-badge" alt="200 customers">
  <img src="https://img.shields.io/badge/final%20segments-5-10B981?style=for-the-badge" alt="Five final segments">
</p>

## Overview

An end-to-end customer segmentation study using the Mall Customers dataset. The project compares K-Means, hierarchical clustering, DBSCAN, and PCA-assisted K-Means, then translates the selected clusters into practical marketing segments.

## Highlights

- Explores 200 customers using age, annual income, and spending score.
- Compares four clustering approaches with silhouette score and coverage.
- Selects a five-cluster K-Means solution for clear, complete, and actionable segmentation.
- Exports trained preprocessing/model artifacts and customer-level segment assignments.

| Algorithm | Clusters | Silhouette score | Coverage |
|---|---:|---:|---:|
| DBSCAN | 6 | 0.558 | 88.5% |
| K-Means | 5 | 0.555 | 100% |
| PCA + K-Means | 5 | 0.555 | 100% |
| Hierarchical | 5 | 0.554 | 100% |

DBSCAN has the highest raw silhouette score, but labels 11.5% of customers as noise. K-Means is used for the final segmentation because it provides comparable separation while assigning every customer to an interpretable segment.

## Customer segments

| Segment | Customers | Typical profile |
|---|---:|---|
| High Income, Low-Spending | 35 | High income with low current engagement |
| High Value | 39 | High income and high spending |
| Low Value | 23 | Low income and low spending |
| Moderate | 81 | Mid-range income and spending |
| Young High-Spending | 22 | Younger customers with strong spending |

## Dataset

The included Mall Customers dataset contains 200 customer records.

| Feature | Description |
|---|---|
| `CustomerID` | Unique customer identifier |
| `Gender` | Recorded customer gender |
| `Age` | Customer age in years |
| `Annual Income (k$)` | Annual income in thousands of dollars |
| `Spending Score (1-100)` | Mall-assigned spending-behavior score |

Clustering uses age, annual income, and spending score. `CustomerID` is retained only for traceability, and gender is available for descriptive analysis rather than distance calculation.

## Workflow

```text
Data exploration
      ↓
Feature selection and standardization
      ↓
K-Means ─ Hierarchical ─ DBSCAN ─ PCA + K-Means
      ↓
Silhouette, coverage, and interpretability comparison
      ↓
Five final customer profiles and marketing strategies
```

## Repository structure

```text
.
├── 01_data_exploration.ipynb
├── 02_kmeans.ipynb
├── 03_hierarchical.ipynb
├── 04_dbscan.ipynb
├── 05_pca.ipynb
├── 06_comparison.ipynb
├── data/
│   └── Mall_Customers.csv
├── models/                 # Serialized fitted estimators and scalers
├── outputs/results/        # Customer assignments, profiles, and comparisons
├── requirements.txt
└── README.md
```

## Getting started

Python 3.10 or newer is recommended.

```bash
git clone <your-repository-url>
cd 05_Customer_Segmentation
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
jupyter lab
```

Run the notebooks from the repository root in numerical order. They use repository-relative paths and write results to `outputs/results/` and fitted artifacts to `models/`.

## Methodology

1. Inspect data quality and feature distributions.
2. Standardize age, annual income, and spending score.
3. Tune and evaluate K-Means, agglomerative clustering, and DBSCAN.
4. Test whether PCA improves cluster separation.
5. Compare model quality, coverage, and business interpretability.
6. Profile the final K-Means clusters and recommend a strategy for each segment.

## Outputs

- `outputs/results/final_customer_segments.csv`: customer-level final labels.
- `outputs/results/final_segment_profile.csv`: segment characteristics and marketing recommendations.
- `outputs/results/final_algorithm_comparison.csv`: model comparison summary.
- `models/final_kmeans_model.pkl` and `models/final_scaler.pkl`: final fitted artifacts.

> [!NOTE]
> Pickle/joblib files should only be loaded from trusted sources. Re-run the notebooks if your local scikit-learn version is incompatible with the committed artifacts.

## Technologies

- Python, NumPy, and pandas
- scikit-learn and SciPy
- Matplotlib and Seaborn
- JupyterLab
- Joblib model persistence

## Business applications

- Retention and loyalty campaigns for high-value customers
- Re-engagement offers for high-income, low-spending customers
- Affordable bundles for price-sensitive groups
- Cross-selling for the largest moderate segment
- Trend-led social campaigns for young, high-spending customers

The segments describe this dataset and should be revalidated before using them for real customers. Production segmentation also requires privacy review, drift monitoring, and testing for unfair or harmful targeting.

## Reproducibility

The notebooks use fixed random seeds where applicable. Exact plots or floating-point scores can vary slightly across library versions and platforms. Generated notebook outputs are retained so the analysis can be reviewed directly on GitHub.

## Future improvements

- Add cluster-stability analysis across resampled datasets
- Build an interactive segment explorer with filters and profiles
- Add recency, frequency, monetary value, and channel features
- Package preprocessing and prediction into one reusable pipeline
- Add model/data validation and automated notebook checks

## License

No license has been selected. Add a `LICENSE` file before publishing if you want others to be able to reuse or modify the project legally.

## Author

**Lingareddy Dhanush** · [GitHub](https://github.com/Dhanush-245)
