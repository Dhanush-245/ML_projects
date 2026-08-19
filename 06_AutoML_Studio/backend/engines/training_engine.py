import time
import numpy as np
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso, ElasticNet, BayesianRidge, SGDClassifier, HuberRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (RandomForestClassifier, RandomForestRegressor, ExtraTreesClassifier, ExtraTreesRegressor,
                              GradientBoostingClassifier, GradientBoostingRegressor, AdaBoostClassifier,
                              HistGradientBoostingClassifier, HistGradientBoostingRegressor, VotingClassifier, 
                              VotingRegressor, StackingClassifier, StackingRegressor)
from sklearn.svm import SVC, SVR
from xgboost import XGBClassifier, XGBRegressor
from lightgbm import LGBMClassifier, LGBMRegressor
from catboost import CatBoostClassifier, CatBoostRegressor
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, matthews_corrcoef,
                             confusion_matrix, roc_curve, precision_recall_curve, r2_score, mean_absolute_error, 
                             mean_squared_error, mean_absolute_percentage_error, explained_variance_score)
from sklearn.model_selection import cross_val_score

def get_available_algorithms(problem_type: str):
    if problem_type == "classification":
        return ["LogisticRegression", "GaussianNB", "KNeighborsClassifier", "DecisionTreeClassifier", 
                "RandomForestClassifier", "ExtraTreesClassifier", "GradientBoostingClassifier", "AdaBoostClassifier",
                "HistGradientBoostingClassifier", "SGDClassifier", "SVC", "XGBClassifier", "LGBMClassifier", 
                "CatBoostClassifier", "VotingClassifier", "StackingClassifier"]
    else:
        return ["LinearRegression", "Ridge", "Lasso", "ElasticNet", "BayesianRidge", "HuberRegressor", "SVR", 
                "KNeighborsRegressor", "DecisionTreeRegressor", "RandomForestRegressor", "ExtraTreesRegressor",
                "GradientBoostingRegressor", "HistGradientBoostingRegressor", "XGBRegressor", "LGBMRegressor", 
                "CatBoostRegressor", "VotingRegressor", "StackingRegressor"]

def get_model(algo_name: str, problem_type: str):
    aliases = {
        "classification": {
            "Logistic Regression": "LogisticRegression",
            "Naive Bayes": "GaussianNB",
            "KNN": "KNeighborsClassifier",
            "Decision Tree": "DecisionTreeClassifier",
            "Random Forest": "RandomForestClassifier",
            "Extra Trees": "ExtraTreesClassifier",
            "Gradient Boosting": "GradientBoostingClassifier",
            "AdaBoost": "AdaBoostClassifier",
            "HistGradientBoosting": "HistGradientBoostingClassifier",
            "SVM": "SVC",
            "XGBoost": "XGBClassifier",
            "LightGBM": "LGBMClassifier",
            "CatBoost": "CatBoostClassifier",
        },
        "regression": {
            "Linear Regression": "LinearRegression",
            "Ridge": "Ridge",
            "Lasso": "Lasso",
            "ElasticNet": "ElasticNet",
            "Bayesian Ridge": "BayesianRidge",
            "Huber Regressor": "HuberRegressor",
            "KNN": "KNeighborsRegressor",
            "Decision Tree": "DecisionTreeRegressor",
            "Random Forest": "RandomForestRegressor",
            "Extra Trees": "ExtraTreesRegressor",
            "Gradient Boosting": "GradientBoostingRegressor",
            "HistGradientBoosting": "HistGradientBoostingRegressor",
            "SVR": "SVR",
            "XGBoost": "XGBRegressor",
            "LightGBM": "LGBMRegressor",
            "CatBoost": "CatBoostRegressor",
        },
    }
    if problem_type not in aliases:
        raise ValueError("problem_type must be 'classification' or 'regression'")
    algo_name = aliases[problem_type].get(algo_name, algo_name)
    models = {
        "classification": {
            "LogisticRegression": LogisticRegression(),
            "GaussianNB": GaussianNB(),
            "KNeighborsClassifier": KNeighborsClassifier(),
            "DecisionTreeClassifier": DecisionTreeClassifier(),
            "RandomForestClassifier": RandomForestClassifier(),
            "ExtraTreesClassifier": ExtraTreesClassifier(),
            "GradientBoostingClassifier": GradientBoostingClassifier(),
            "AdaBoostClassifier": AdaBoostClassifier(),
            "HistGradientBoostingClassifier": HistGradientBoostingClassifier(),
            "SGDClassifier": SGDClassifier(),
            "SVC": SVC(probability=True),
            "XGBClassifier": XGBClassifier(use_label_encoder=False, eval_metric='logloss'),
            "LGBMClassifier": LGBMClassifier(),
            "CatBoostClassifier": CatBoostClassifier(verbose=0),
            "VotingClassifier": VotingClassifier(estimators=[('rf', RandomForestClassifier()), ('gb', GradientBoostingClassifier())]),
            "StackingClassifier": StackingClassifier(estimators=[('rf', RandomForestClassifier()), ('gb', GradientBoostingClassifier())])
        },
        "regression": {
            "LinearRegression": LinearRegression(),
            "Ridge": Ridge(),
            "Lasso": Lasso(),
            "ElasticNet": ElasticNet(),
            "BayesianRidge": BayesianRidge(),
            "HuberRegressor": HuberRegressor(),
            "SVR": SVR(),
            "KNeighborsRegressor": KNeighborsRegressor(),
            "DecisionTreeRegressor": DecisionTreeRegressor(),
            "RandomForestRegressor": RandomForestRegressor(),
            "ExtraTreesRegressor": ExtraTreesRegressor(),
            "GradientBoostingRegressor": GradientBoostingRegressor(),
            "HistGradientBoostingRegressor": HistGradientBoostingRegressor(),
            "XGBRegressor": XGBRegressor(),
            "LGBMRegressor": LGBMRegressor(),
            "CatBoostRegressor": CatBoostRegressor(verbose=0),
            "VotingRegressor": VotingRegressor(estimators=[('rf', RandomForestRegressor()), ('gb', GradientBoostingRegressor())]),
            "StackingRegressor": StackingRegressor(estimators=[('rf', RandomForestRegressor()), ('gb', GradientBoostingRegressor())])
        }
    }
    if algo_name not in models[problem_type]:
        available = ", ".join(aliases[problem_type])
        raise ValueError(f"Unsupported {problem_type} algorithm. Choose one of: {available}")
    return models[problem_type][algo_name]

def train_models(X_train, y_train, X_test, y_test, algorithms: list, problem_type: str, cv_folds: int = 5):
    results = []
    for algo in algorithms:
        model = get_model(algo, problem_type)
        start_time = time.time()
        
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv_folds, 
                                    scoring='accuracy' if problem_type == 'classification' else 'r2')
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        train_time = time.time() - start_time
        metrics = {}
        
        if problem_type == 'classification':
            probabilities = model.predict_proba(X_test) if hasattr(model, "predict_proba") else None
            metrics = {
                "accuracy": accuracy_score(y_test, y_pred),
                "precision": precision_score(y_test, y_pred, average='weighted', zero_division=0),
                "recall": recall_score(y_test, y_pred, average='weighted', zero_division=0),
                "f1": f1_score(y_test, y_pred, average='weighted', zero_division=0),
                "mcc": matthews_corrcoef(y_test, y_pred),
                "confusion_matrix": confusion_matrix(y_test, y_pred).tolist()
            }
            try:
                if probabilities is not None and probabilities.shape[1] == 2:
                    y_prob = probabilities[:, 1]
                    metrics["roc_auc"] = roc_auc_score(y_test, y_prob)
                    fpr, tpr, _ = roc_curve(y_test, y_prob)
                    metrics["roc_curve_data"] = {"fpr": fpr.tolist(), "tpr": tpr.tolist()}
                    p, r, _ = precision_recall_curve(y_test, y_prob)
                    metrics["pr_curve_data"] = {"precision": p.tolist(), "recall": r.tolist()}
                elif probabilities is not None:
                    metrics["roc_auc"] = roc_auc_score(
                        y_test, probabilities, multi_class="ovr", average="weighted"
                    )
            except ValueError:
                pass
        else:
            metrics = {
                "r2": r2_score(y_test, y_pred),
                "mae": mean_absolute_error(y_test, y_pred),
                "mse": mean_squared_error(y_test, y_pred),
                "rmse": np.sqrt(mean_squared_error(y_test, y_pred)),
                "mape": mean_absolute_percentage_error(y_test, y_pred),
                "explained_variance": explained_variance_score(y_test, y_pred),
                "residuals": (y_test - y_pred).tolist()[:100],
                "actual_vs_predicted": {"actual": y_test.tolist()[:100], "predicted": y_pred.tolist()[:100]}
            }
            
        results.append({
            "algorithm": algo,
            "metrics": metrics,
            "cv_scores": cv_scores.tolist(),
            "training_time": train_time,
            "fitted_model": model
        })
    return results
