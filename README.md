<h1 align="center">Machine Learning Projects</h1>

<p align="center">
  A portfolio of end-to-end machine-learning experiments and full-stack AI applications.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/scikit--learn-ML-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="scikit-learn">
  <img src="https://img.shields.io/badge/TensorFlow-Deep%20Learning-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow">
  <img src="https://img.shields.io/badge/React-Full%20Stack-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
</p>

## Overview

This repository brings together supervised learning, unsupervised learning, computer vision, health-product design, and automated machine-learning workflows. Each project is self-contained, documented, and includes the source, dependencies, and reproducible instructions needed to explore it locally.

## Project portfolio

| Project | Problem | Key outcome | Stack |
|---|---|---|---|
| [Loan Approval Prediction](./01_Loan_Approval_Prediction/) | Predict loan-application outcomes | Naive Bayes reached 82.5% test accuracy; XGBoost led ROC-AUC | pandas, scikit-learn, XGBoost |
| [Medora AI Health Platform](./03_health_diseases_prediction_platform/) | Present health signals in an accessible product experience | Responsive multi-role healthcare-intelligence demo with safety guardrails | React, TypeScript, vinext, Cloudflare |
| [MNIST Digit Recognition](./04_MNIST/) | Compare neural-network activation functions | Leaky ReLU achieved 98.61% saved-run test accuracy | TensorFlow, Keras, Jupyter |
| [Customer Segmentation](./05_Customer_Segmentation/) | Discover actionable customer groups | Five interpretable K-Means segments with complete customer coverage | scikit-learn, SciPy, PCA |
| [AutoML Studio](./06_AutoML_Studio/) | Automate tabular ML experimentation | Full-stack dataset, training, tuning, XAI, registry, and prediction workflow | FastAPI, React, TypeScript |

## Repository structure

```text
ML_projects/
├── 01_Loan_Approval_Prediction/
├── 03_health_diseases_prediction_platform/
├── 04_MNIST/
├── 05_Customer_Segmentation/
├── 06_AutoML_Studio/
├── .gitignore
└── README.md
```

## Getting started

Clone the collection and enter the project you want to run:

```bash
git clone https://github.com/Dhanush-245/ML_projects.git
cd ML_projects
```

Python/Jupyter projects generally use:

```bash
cd <project-directory>
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
jupyter lab
```

Web projects generally use:

```bash
cd <project-directory>
npm install
npm run dev
```

Always follow the project-level README because ports, runtimes, and setup commands differ.

## Engineering practices

- Reproducible dependency manifests and fixed random seeds where applicable
- Repository-relative data paths for portable notebooks
- Model comparison with appropriate metrics instead of accuracy alone
- Generated environments, caches, secrets, databases, and build outputs excluded from Git
- Explicit limitations for lending and health-related demonstrations
- Project-specific documentation covering setup, outputs, and future work

## Responsible use

These projects are educational portfolio work. Lending and healthcare demonstrations require fairness analysis, privacy controls, security review, domain validation, monitoring, human oversight, and regulatory compliance before any real-world use.

## License

Licensing is documented per project where available. Unless a project contains a `LICENSE` file, no reuse license is granted by default.

## Author

**Lingareddy Dhanush** · [GitHub](https://github.com/Dhanush-245)

If you find the projects useful, consider starring the repository.
