import optuna
from sklearn.model_selection import cross_val_score
from engines.training_engine import get_model

def tune_model(algorithm: str, X_train, y_train, X_test, y_test, problem_type: str, metric: str, n_trials: int = 20):
    trial_history = []
    
    def objective(trial):
        params = {}
        if algorithm in ['RandomForestClassifier', 'RandomForestRegressor']:
            params['n_estimators'] = trial.suggest_int('n_estimators', 50, 300)
            params['max_depth'] = trial.suggest_int('max_depth', 3, 20)
        elif algorithm in ['XGBClassifier', 'XGBRegressor']:
            params['n_estimators'] = trial.suggest_int('n_estimators', 50, 300)
            params['learning_rate'] = trial.suggest_float('learning_rate', 0.01, 0.3)
            params['max_depth'] = trial.suggest_int('max_depth', 3, 10)
        elif algorithm in ['LGBMClassifier', 'LGBMRegressor']:
            params['n_estimators'] = trial.suggest_int('n_estimators', 50, 300)
            params['learning_rate'] = trial.suggest_float('learning_rate', 0.01, 0.3)
            params['num_leaves'] = trial.suggest_int('num_leaves', 20, 100)
        elif algorithm in ['CatBoostClassifier', 'CatBoostRegressor']:
            params['iterations'] = trial.suggest_int('iterations', 50, 300)
            params['learning_rate'] = trial.suggest_float('learning_rate', 0.01, 0.3)
            params['depth'] = trial.suggest_int('depth', 3, 10)
        else:
            if 'C' in get_model(algorithm, problem_type).get_params():
                params['C'] = trial.suggest_float('C', 0.1, 10.0)
            
        model = get_model(algorithm, problem_type)
        model.set_params(**params)
        
        score = cross_val_score(model, X_train, y_train, cv=3, scoring=metric).mean()
        trial_history.append({"params": params, "score": score})
        return score
    
    study = optuna.create_study(direction="maximize" if metric in ["accuracy", "roc_auc", "r2", "f1"] else "minimize")
    study.optimize(objective, n_trials=n_trials)
    
    return study.best_params, study.best_value, trial_history
