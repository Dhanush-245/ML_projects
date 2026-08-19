import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, PowerTransformer, OneHotEncoder, OrdinalEncoder
from sklearn.decomposition import PCA
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE, ADASYN
import numpy as np

def build_preprocessing_pipeline(config: dict) -> Pipeline:
    numeric_features = config.get("numeric_features", [])
    categorical_features = config.get("categorical_features", [])
    
    numeric_transformer_steps = []
    num_imputer_type = config.get("num_imputer", "mean")
    if num_imputer_type == "mean":
        numeric_transformer_steps.append(("imputer", SimpleImputer(strategy="mean")))
    elif num_imputer_type == "median":
        numeric_transformer_steps.append(("imputer", SimpleImputer(strategy="median")))
    elif num_imputer_type == "knn":
        numeric_transformer_steps.append(("imputer", KNNImputer()))
        
    scaler_type = config.get("scaler", "standard")
    if scaler_type == "standard":
        numeric_transformer_steps.append(("scaler", StandardScaler()))
    elif scaler_type == "minmax":
        numeric_transformer_steps.append(("scaler", MinMaxScaler()))
    elif scaler_type == "robust":
        numeric_transformer_steps.append(("scaler", RobustScaler()))
    elif scaler_type == "power":
        numeric_transformer_steps.append(("scaler", PowerTransformer()))
        
    if config.get("use_pca", False):
        numeric_transformer_steps.append(("pca", PCA(n_components=config.get("pca_components", 0.95))))
        
    numeric_transformer = Pipeline(steps=numeric_transformer_steps)
    
    categorical_transformer_steps = []
    cat_imputer_type = config.get("cat_imputer", "most_frequent")
    if cat_imputer_type == "most_frequent":
        categorical_transformer_steps.append(("imputer", SimpleImputer(strategy="most_frequent")))
    else:
        categorical_transformer_steps.append(("imputer", SimpleImputer(strategy="constant", fill_value="missing")))
        
    encoder_type = config.get("encoder", "onehot")
    if encoder_type == "onehot":
        categorical_transformer_steps.append(("encoder", OneHotEncoder(handle_unknown="ignore")))
    elif encoder_type == "ordinal":
        categorical_transformer_steps.append(("encoder", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)))
        
    categorical_transformer = Pipeline(steps=categorical_transformer_steps)
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features)
        ])
        
    steps = [("preprocessor", preprocessor)]
    
    imbalance_strategy = config.get("imbalance_strategy", "none")
    if imbalance_strategy == "smote":
        steps.append(("resample", SMOTE()))
    elif imbalance_strategy == "adasyn":
        steps.append(("resample", ADASYN()))
        
    if imbalance_strategy in ["smote", "adasyn"]:
        return ImbPipeline(steps=steps)
    return Pipeline(steps=steps)

def apply_pipeline(df: pd.DataFrame, target_col: str, pipeline_config: dict):
    from sklearn.model_selection import train_test_split
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    if "numeric_features" not in pipeline_config or not pipeline_config["numeric_features"]:
        pipeline_config["numeric_features"] = X.select_dtypes(include=[np.number]).columns.tolist()
    if "categorical_features" not in pipeline_config or not pipeline_config["categorical_features"]:
        pipeline_config["categorical_features"] = X.select_dtypes(exclude=[np.number]).columns.tolist()
        
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline = build_preprocessing_pipeline(pipeline_config)
    X_train_processed = pipeline.fit_transform(X_train, y_train)
    X_test_processed = pipeline.transform(X_test)
    
    return X_train_processed, X_test_processed, y_train, y_test, pipeline
