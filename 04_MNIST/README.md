# Handwritten Digit Recognition with TensorFlow and Keras

This experiment trains the same multilayer perceptron on MNIST with six hidden-layer activation functions—ReLU, tanh, sigmoid, linear, exponential, and Leaky ReLU—and compares their test performance and training time.

The verified notebook run achieved the best test accuracy with **Leaky ReLU: 98.61%**. Results can vary slightly across machines and TensorFlow versions.

## What the experiment produces

- Accuracy, precision, recall, weighted F1 score, loss, and training time
- Training and validation accuracy/loss plots
- Confusion matrices and classification reports
- Training-history JSON files
- Best model checkpoints in Keras format
- A CSV comparison table and final activation ranking

## Run locally

Python 3.10–3.12 is recommended.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
jupyter lab
```

Open `Recognizing_HandWritten_Digits_dp.ipynb`, select the virtual-environment kernel, and run all cells in order. MNIST is downloaded automatically by Keras on the first run. Training all six models can take several minutes and creates a local `results/` directory.

## Experiment setup

- Dataset: MNIST (60,000 training images and 10,000 test images)
- Input: normalized 28 × 28 grayscale images
- Network: Flatten → Dense(512) → Dense(256) → Dense(128) → Dense(10)
- Regularization: batch normalization and dropout
- Optimizer: Adam
- Loss: categorical cross-entropy
- Batch size: 128
- Maximum epochs: 20, with early stopping and learning-rate reduction
- Random seed: 42
- Numerical safety: exponential inputs are clipped to [-10, 10] before exponentiation to prevent overflow

## Saved-run summary

| Activation | Accuracy | Weighted F1 | Test loss |
|---|---:|---:|---:|
| Leaky ReLU | 0.9861 | 0.9861 | 0.0540 |
| ReLU | 0.9848 | 0.9848 | 0.0553 |
| tanh | 0.9825 | 0.9825 | 0.0662 |
| sigmoid | 0.9799 | 0.9799 | 0.0664 |
| exponential | 0.9637 | 0.9637 | 0.3100 |
| linear | 0.9252 | 0.9249 | 0.2707 |

The exponential activation required bounded inputs to avoid floating-point overflow. Even after stabilization, its higher loss suggests less well-calibrated predictions than the leading activations. Accuracy alone is therefore not sufficient for comparing the models.

## Repository notes

Generated models and result artifacts are ignored by Git because they are reproducible and model files can be large. The notebook retains the original saved outputs so the experiment results remain visible on GitHub.

## License

No license has been selected. Add a license before inviting reuse or redistribution.
