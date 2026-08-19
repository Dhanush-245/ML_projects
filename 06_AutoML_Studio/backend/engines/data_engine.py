import pandas as pd
import numpy as np

def load_dataset(file_path: str) -> pd.DataFrame:
    if file_path.endswith('.csv'):
        return pd.read_csv(file_path)
    elif file_path.endswith('.xlsx'):
        return pd.read_excel(file_path)
    elif file_path.endswith('.parquet'):
        return pd.read_parquet(file_path)
    elif file_path.endswith('.json'):
        return pd.read_json(file_path)
    else:
        raise ValueError("Unsupported file format")

def get_profile(df: pd.DataFrame) -> dict:
    profile = {"columns": {}}
    for col in df.columns:
        col_data = df[col]
        stats = {
            "dtype": str(col_data.dtype),
            "count": int(col_data.count()),
            "missing": int(col_data.isnull().sum()),
            "unique": int(col_data.nunique())
        }
        if pd.api.types.is_numeric_dtype(col_data):
            stats.update({
                "mean": float(col_data.mean()) if pd.notnull(col_data.mean()) else None,
                "std": float(col_data.std()) if pd.notnull(col_data.std()) else None,
                "min": float(col_data.min()) if pd.notnull(col_data.min()) else None,
                "max": float(col_data.max()) if pd.notnull(col_data.max()) else None
            })
        else:
            top = col_data.value_counts().head(5).to_dict()
            stats["top_values"] = {str(k): int(v) for k, v in top.items()}
        profile["columns"][col] = stats
    
    numeric_df = df.select_dtypes(include=[np.number])
    if not numeric_df.empty:
        profile["correlation"] = numeric_df.corr().fillna(0).to_dict()
    else:
        profile["correlation"] = {}
        
    profile["missing_counts"] = df.isnull().sum().to_dict()
    
    outliers = {}
    for col in numeric_df.columns:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        outliers[col] = int(((df[col] < (q1 - 1.5 * iqr)) | (df[col] > (q3 + 1.5 * iqr))).sum())
    profile["outliers"] = outliers
    
    return profile

def get_quality_score(df: pd.DataFrame) -> float:
    score = 100.0
    missing_ratio = df.isnull().sum().sum() / (df.shape[0] * df.shape[1])
    score -= missing_ratio * 30
    
    dup_ratio = df.duplicated().sum() / max(1, df.shape[0])
    score -= dup_ratio * 20
    
    for col in df.columns:
        if df[col].nunique() == 1:
            score -= 5
    return max(0.0, score)

def auto_clean(df: pd.DataFrame, fixes: list) -> pd.DataFrame:
    cleaned = df.copy()
    if 'impute_missing' in fixes:
        for col in cleaned.select_dtypes(include=[np.number]).columns:
            cleaned[col] = cleaned[col].fillna(cleaned[col].median())
        for col in cleaned.select_dtypes(exclude=[np.number]).columns:
            cleaned[col] = cleaned[col].fillna(cleaned[col].mode()[0] if not cleaned[col].mode().empty else 'Unknown')
    if 'remove_duplicates' in fixes:
        cleaned = cleaned.drop_duplicates()
    if 'clip_outliers' in fixes:
        for col in cleaned.select_dtypes(include=[np.number]).columns:
            q1 = cleaned[col].quantile(0.25)
            q3 = cleaned[col].quantile(0.75)
            iqr = q3 - q1
            cleaned[col] = cleaned[col].clip(lower=q1 - 1.5 * iqr, upper=q3 + 1.5 * iqr)
    return cleaned
