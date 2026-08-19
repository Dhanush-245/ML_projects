import React, { useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { 
  Database, 
  Rocket, 
  Layers, 
  Activity, 
  ChevronRight, 
  Upload, 
  Play, 
  BarChart2, 
  Shield, 
  Settings, 
  Server,
  Clock,
  User,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

function timeAgo(value?: string): string {
  if (!value) return 'Recently';
  const timestamp = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
  const elapsed = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'Recently';
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day(s) ago`;
}

export default function DashboardView() {
  const { 
    setActiveView, 
    setDatasetSubTab, 
    datasets, 
    experiments, 
    deployments,
    currentUser,
    backendSynced
  } = useAppStore();

  const handleOpenDatasets = () => {
    setActiveView('data');
    setDatasetSubTab('list');
  };

  const liveDatasetCount = datasets.length;
  const liveModelCount = experiments.filter((experiment) => experiment.status === 'completed').length;
  const liveDeploymentCount = deployments.length;

  const stats = [
    { 
      label: 'Datasets', 
      value: backendSynced ? String(liveDatasetCount) : '…',
      sub: !backendSynced ? 'Restoring saved workspace…' : liveDatasetCount === 0 ? 'No datasets uploaded yet' : `${liveDatasetCount} dataset(s) available`,
      icon: Database, 
      color: 'text-indigo-600 dark:text-indigo-400', 
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      action: handleOpenDatasets
    },
    { 
      label: 'Models Trained', 
      value: backendSynced ? String(liveModelCount) : '…',
      sub: !backendSynced ? 'Restoring experiment history…' : liveModelCount === 0 ? 'No completed training runs yet' : `${liveModelCount} experiment(s) complete`,
      icon: Rocket, 
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      action: () => setActiveView('training')
    },
    { 
      label: 'Active Deployments', 
      value: backendSynced ? String(liveDeploymentCount) : '…',
      sub: !backendSynced ? 'Restoring deployments…' : liveDeploymentCount === 0 ? 'No models deployed yet' : `${liveDeploymentCount} endpoint(s) active`,
      icon: Play, 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      action: () => setActiveView('deploy')
    },
  ];

  // Recent Activity Stream
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      desc: string;
      time: string;
      badge: string;
      badgeStyle: string;
      icon: any;
      action: () => void;
    }> = [];

    // 1. Persisted dataset upload history
    datasets.slice(0, 3).forEach((dataset) => {
      list.push({
        id: `act-ds-${dataset.id}`,
        title: `Dataset Profiled: ${dataset.name}`,
        desc: `${dataset.rows.toLocaleString()} rows, ${dataset.columns.length} columns (Quality Score: ${dataset.qualityScore}%)`,
        time: timeAgo(dataset.createdAt),
        badge: 'DATASET',
        badgeStyle: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        icon: Database,
        action: handleOpenDatasets
      });
    });

    // 2. Experiments History
    if (experiments.length > 0) {
      experiments.forEach((exp, idx) => {
        list.push({
          id: `act-exp-${idx}`,
          title: exp.status === 'completed' ? `AutoML Model Trained: ${exp.name}` : `AutoML Experiment ${exp.status}: ${exp.name}`,
          desc: exp.status === 'completed'
            ? `Reached ${(exp.accuracy * 100).toFixed(1)}% score using ${exp.algorithm || 'AutoML'}.`
            : `This experiment is ${exp.status}; open Training for details.`,
          time: timeAgo(exp.timestamp),
          badge: 'TRAINING',
          badgeStyle: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: Rocket,
          action: () => setActiveView('training')
        });
      });
    } else {
      list.push({
        id: 'act-exp-sample',
        title: 'AutoML Training Environment Ready',
        desc: '18 Classification & Regression algorithms loaded (XGBoost, CatBoost, LightGBM, Random Forest).',
        time: '10 mins ago',
        badge: 'TRAINING',
        badgeStyle: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        icon: Rocket,
        action: () => setActiveView('training')
      });
    }

    // 3. Deployments History
    if (deployments.length > 0) {
      deployments.forEach((dep, idx) => {
        list.push({
          id: `act-dep-${idx}`,
          title: `REST Endpoint Deployed: ${dep.name}`,
          desc: `Active prediction endpoint served on ${dep.url || 'http://localhost:8000/api/v1/predict'}`,
          time: timeAgo(dep.timestamp),
          badge: 'SERVING',
          badgeStyle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: Server,
          action: () => setActiveView('deploy')
        });
      });
    } else {
      list.push({
        id: 'act-dep-sample',
        title: 'Model Registry & Promotion Pipeline',
        desc: 'Version models and promote champions from Dev → Staging → Production.',
        time: '25 mins ago',
        badge: 'GOVERNANCE',
        badgeStyle: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        icon: Shield,
        action: () => setActiveView('registry')
      });
    }

    // 4. User Session
    if (currentUser) {
      list.push({
        id: 'act-user',
        title: `Authenticated Session: ${currentUser.full_name}`,
        desc: `Logged in as ${currentUser.email} (${currentUser.role || 'Admin'})`,
        time: 'Active',
        badge: 'AUTH',
        badgeStyle: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        icon: User,
        action: () => setActiveView('settings')
      });
    }

    return list;
  }, [datasets, experiments, deployments, currentUser]);

  const quickActions = [
    {
      title: 'Visual Pipeline Builder',
      desc: 'Drag & drop nodes to design your ML workflow DAG',
      icon: Layers,
      color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      action: () => setActiveView('pipeline')
    },
    {
      title: 'AutoML Training Studio',
      desc: 'Configure algorithms, cross-validation & metric goals',
      icon: Rocket,
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      action: () => setActiveView('training')
    },
    {
      title: 'Explainability Hub (XAI)',
      desc: 'Understand model predictions with SHAP & LIME feature importances',
      icon: BarChart2,
      color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
      action: () => setActiveView('explainability')
    },
    {
      title: 'Model Registry & Governance',
      desc: 'Manage model versions & promote through Dev → Staging → Prod',
      icon: Shield,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      action: () => setActiveView('registry')
    },
    {
      title: 'Deployment & Prediction Playground',
      desc: 'Test served endpoints and run single or batch predictions',
      icon: Server,
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      action: () => setActiveView('deploy')
    },
    {
      title: 'Platform Settings & Config',
      desc: 'Configure default hardware, training budgets & notification alerts',
      icon: Settings,
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
      action: () => setActiveView('settings')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-heading font-bold mb-4">Welcome back to AutoML Studio</h1>
          <p className="text-indigo-100 text-lg mb-8 font-body">
            Your end-to-end platform for building, training, explaining, and deploying machine learning models with zero friction.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                setActiveView('data');
                setDatasetSubTab('upload');
              }}
              className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 hover:bg-slate-100 rounded-lg font-bold transition-all shadow-md cursor-pointer"
            >
              <Upload className="w-5 h-5 text-indigo-900" />
              <span>Upload Dataset</span>
            </button>
            <button 
              onClick={() => setActiveView('training')}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-950/60 hover:bg-indigo-900 text-white border border-indigo-400/40 rounded-lg font-semibold transition-all backdrop-blur-sm cursor-pointer"
            >
              <Rocket className="w-5 h-5 text-amber-300" />
              <span>Start AutoML</span>
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-40 w-64 h-64 bg-violet-500/20 rounded-full blur-2xl" />
      </section>

      {/* Clickable Live Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={stat.action}
            className="glass-card p-6 flex items-center justify-between cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-105 transition-transform`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <h3 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Section */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            </div>
            <button 
              onClick={() => setActiveView('training')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
            {recentActivities.map((act) => (
              <div 
                key={act.id} 
                onClick={act.action}
                className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-500 dark:hover:border-indigo-400 group"
              >
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:border-indigo-500 transition-colors">
                  <act.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {act.title}
                    </p>
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border shrink-0 ${act.badgeStyle}`}>
                      {act.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{act.desc}</p>
                  
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{act.time}</span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
              </div>
            ))}
          </div>
        </section>

        {/* Clickable Quick Actions */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Quick Actions</h2>
            <span className="text-xs text-slate-500 font-mono">1-Click Launch</span>
          </div>

          <div className="grid gap-3">
            {quickActions.map((qa) => (
              <button 
                key={qa.title}
                onClick={qa.action} 
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-500 dark:hover:border-indigo-400 group text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${qa.color}`}>
                    <qa.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {qa.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{qa.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
