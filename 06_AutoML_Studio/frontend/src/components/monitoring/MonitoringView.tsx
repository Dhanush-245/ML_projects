import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, TrendingUp, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';

const DRIFT_DATA = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  psi: Math.random() * 0.1 + (i > 18 ? 0.15 : 0.02)
}));

const PERF_DATA = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  accuracy: 0.95 - (Math.random() * 0.02) - (i > 18 ? 0.05 : 0)
}));

const VOLUME_DATA = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  requests: Math.floor(Math.random() * 500) + 100 + (i > 10 && i < 16 ? 800 : 0)
}));

export default function MonitoringView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Model Monitoring</h1>
          <p className="text-slate-500 dark:text-slate-400 font-body">Track production model performance, drift, and usage.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium border border-emerald-200 dark:border-emerald-800/30">
          <CheckCircle className="w-4 h-4" />
          System Healthy
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests (24h)', value: '12.4K', change: '+14%', positive: true },
          { label: 'Avg Latency', value: '45ms', change: '-2ms', positive: true },
          { label: 'Data Drift (PSI)', value: '0.12', change: '+0.05', positive: false },
          { label: 'Errors', value: '0.01%', change: '0%', positive: true },
        ].map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="glass-card p-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${stat.positive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-500" /> Data Drift (PSI)
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DRIFT_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="psi" stroke="#f43f5e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Model Performance (Accuracy)
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERF_DATA}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickMargin={10} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="accuracy" stroke="#10b981" fillOpacity={1} fill="url(#colorAcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-500" /> Prediction Volume
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={VOLUME_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{fill: '#334155', opacity: 0.1}} />
                <Bar dataKey="requests" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
