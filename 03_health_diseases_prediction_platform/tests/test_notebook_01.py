from pathlib import Path
import hashlib
import json
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "datasets" / "diabetes" / "pima_diabetes.csv"
NOTEBOOK = ROOT / "notebooks" / "01_Project_Setup_and_Data_Understanding.ipynb"
COLUMNS = ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI", "DiabetesPedigreeFunction", "Age", "Outcome"]

def test_dataset_snapshot_and_schema():
    assert hashlib.sha256(DATA.read_bytes()).hexdigest() == "6bfe5d0f379d17a0e0819b996407e3c09bf80febd4287f2ed212190dfff154af"
    df = pd.read_csv(DATA, names=COLUMNS)
    assert df.shape == (768, 9)
    assert df["Outcome"].isin([0, 1]).all()
    assert not df.duplicated().any()

def test_notebook_is_executed_without_errors():
    notebook = json.loads(NOTEBOOK.read_text())
    code_cells = [cell for cell in notebook["cells"] if cell["cell_type"] == "code"]
    assert code_cells
    assert all(cell.get("execution_count") is not None for cell in code_cells)
    errors = [output for cell in code_cells for output in cell.get("outputs", []) if output.get("output_type") == "error"]
    assert errors == []
