# Machine Learning Projects

A collection of end-to-end machine learning and data applications covering supervised learning, unsupervised learning, computer vision, AutoML, and health prediction.

## Projects

| # | Project | Focus | Main tools |
|---:|---|---|---|
| 1 | [Loan Approval Prediction](./01_Loan_Approval_Prediction/) | Binary classification and model comparison | Python, pandas, scikit-learn, Jupyter |
| 3 | [Health Diseases Prediction Platform](./03_health_diseases_prediction_platform/) | Web-based health prediction application | TypeScript, Next.js, Cloudflare tooling |
| 4 | [MNIST Handwritten Digit Recognition](./04_MNIST/) | Computer-vision digit classification | Python, TensorFlow, Jupyter |
| 5 | [Customer Segmentation](./05_Customer_Segmentation/) | K-Means, hierarchical clustering, DBSCAN, and PCA | Python, scikit-learn, Jupyter |
| 6 | [AutoML Studio](./06_AutoML_Studio/) | Full-stack AutoML experimentation workspace | Python, TypeScript, React/Vite |

## Repository structure

Each project is self-contained and includes its own README and dependency manifest. Open a project's directory and follow its setup instructions.

```text
ML/
├── 01_Loan_Approval_Prediction/
├── 03_health_diseases_prediction_platform/
├── 04_MNIST/
├── 05_Customer_Segmentation/
└── 06_AutoML_Studio/
```

## General setup

For Python projects:

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

For JavaScript/TypeScript projects:

```bash
npm install
npm run dev
```

Dependency versions and project-specific commands may differ, so use the README inside each project as the source of truth.

## Notes

- Local virtual environments, dependency folders, caches, secrets, and build outputs are intentionally excluded from Git.
- Serialized model files should only be loaded from trusted sources.
- Dataset licenses and usage conditions may differ between projects; review each project's dataset documentation before redistribution.

## License

Licensing is documented per project where available. Unless a project includes a license file, no reuse license is granted by default.
