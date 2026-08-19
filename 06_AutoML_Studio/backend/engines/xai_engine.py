import shap
import lime.lime_tabular
import numpy as np
import pandas as pd
from sklearn.inspection import partial_dependence

def compute_shap_values(model, X, feature_names):
    if hasattr(X, "toarray"):
        X = X.toarray()
    X = np.asarray(X)
    try:
        explainer = shap.TreeExplainer(model)
        raw_values = explainer.shap_values(X)
        values = np.asarray(raw_values)
        if values.ndim == 3:
            values = np.abs(values).mean(axis=0)
        if values.ndim == 1:
            values = values.reshape(1, -1)
        base = explainer.expected_value
    except Exception:
        background = X[:min(50, len(X))]
        explainer = shap.Explainer(model.predict, background)
        explanation = explainer(X)
        values = np.asarray(explanation.values)
        base = explanation.base_values
    importance = np.abs(values).mean(axis=0)
    if importance.ndim > 1:
        importance = importance.mean(axis=-1)
    return {
        "base_value": np.asarray(base).ravel().tolist(),
        "feature_importance": [
            {"feature": feature, "importance": float(score)}
            for feature, score in zip(feature_names, importance.tolist())
        ],
    }

def compute_lime_explanation(model, X_train, instance, feature_names, class_names):
    if hasattr(X_train, "toarray"):
        X_train = X_train.toarray()
    explainer = lime.lime_tabular.LimeTabularExplainer(
        training_data=np.array(X_train),
        feature_names=feature_names,
        class_names=class_names,
        mode='classification' if class_names else 'regression'
    )
    if hasattr(model, "predict_proba"):
        exp = explainer.explain_instance(np.array(instance), model.predict_proba)
    else:
        exp = explainer.explain_instance(np.array(instance), model.predict)
    return exp.as_list()

def compute_pdp(model, X, feature_names, features_to_plot):
    results = {}
    if isinstance(X, np.ndarray):
        X = pd.DataFrame(X, columns=feature_names)
    for feat in features_to_plot:
        idx = feature_names.index(feat)
        pdp_res = partial_dependence(model, X, features=[idx], kind='average')
        results[feat] = {
            "values": pdp_res['grid_values'][0].tolist(),
            "average": pdp_res['average'][0].tolist()
        }
    return results

def compute_counterfactual(model, instance, desired_outcome, feature_names, X_train):
    if hasattr(X_train, "toarray"):
        X_train = X_train.toarray()
    candidates = np.asarray(X_train)
    query = np.asarray(instance, dtype=float).reshape(1, -1)
    predictions = np.asarray(model.predict(candidates))
    matching = candidates[predictions == desired_outcome]
    if len(matching) == 0:
        raise ValueError("The trained model has no reference rows for the requested outcome")

    scale = np.nanstd(candidates, axis=0)
    scale[scale == 0] = 1.0
    distances = np.linalg.norm((matching - query) / scale, axis=1)
    nearest = matching[int(np.argmin(distances))]
    deltas = nearest - query[0]
    changed_indices = np.argsort(np.abs(deltas))[::-1]
    features = {
        feature_names[index]: float(nearest[index])
        for index in changed_indices
        if abs(float(deltas[index])) > 1e-9
    }
    return {
        "message": "Nearest model-compatible counterfactual computed",
        "prediction": int(desired_outcome),
        "distance": float(np.min(distances)),
        "features": dict(list(features.items())[:10]),
    }
