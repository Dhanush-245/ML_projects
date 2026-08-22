# Healthcare Disease Prediction Research Track

This repository contains a notebook-first multi-disease machine-learning research track alongside the Medora AI product demo.

## Milestone 1: Diabetes data understanding

The executed `notebooks/01_Project_Setup_and_Data_Understanding.ipynb` establishes:

- dataset provenance and a pinned SHA-256 checksum;
- schema, dimensions, types, ranges, duplicates, and target validation;
- literal missing-value checks and an audit of physiologically implausible zero sentinels;
- outcome-class balance and initial descriptive statistics;
- raw feature distributions, group comparisons, and correlations;
- limitations and leakage-safe decisions for the cleaning notebook.

The Pima dataset snapshot is preserved unchanged under `datasets/diabetes/`. Generated plots are written to `figures/notebook_01/`.

## Environment

```bash
python -m pip install -r requirements-ml.txt
jupyter lab notebooks/01_Project_Setup_and_Data_Understanding.ipynb
```

Regenerate and re-execute the notebook:

```bash
python scripts/generate_notebook_01.py
jupyter nbconvert --to notebook --execute \
  notebooks/01_Project_Setup_and_Data_Understanding.ipynb \
  --output 01_Project_Setup_and_Data_Understanding.ipynb \
  --output-dir notebooks
python -m pytest tests/test_notebook_01.py -q
```

## Responsible use

This work is educational research, not a diagnostic tool or certified medical device. The dataset is small, historic, and population-specific. Any later model must undergo external validation, calibration, subgroup fairness analysis, clinical review, privacy review, and regulatory assessment before real-world use.
