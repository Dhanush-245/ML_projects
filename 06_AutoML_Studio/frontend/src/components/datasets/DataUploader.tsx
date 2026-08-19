import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Server } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { parseRecordData, parseTabularFile } from '../../utils/csvParser';
import { api } from '../../utils/apiClient';

export default function DataUploader() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [backendSaved, setBackendSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { setActiveDataset, setDatasets, datasets, registerBackendDatasetId } = useAppStore();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setBackendSaved(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 80 ? 80 : prev + 10));
    }, 100);

    try {
      let dataset = null;
      let localParseError: Error | null = null;
      try {
        dataset = await parseTabularFile(file);
      } catch (parseError) {
        localParseError = parseError instanceof Error ? parseError : new Error('Dataset could not be parsed');
      }
      setProgress(75);

      // Upload to the backend for durable refresh-safe storage and ML training.
      let backendDatasetId: number | null = null;
      try {
        const backendResult = await api.upload('/datasets/upload', file);
        backendDatasetId = backendResult.id;
        setBackendSaved(true);
        if (!dataset) {
          const preview = await api.get(`/datasets/${backendDatasetId}/preview?page_size=${Math.min(backendResult.rows || 10000, 100000)}`);
          dataset = parseRecordData(preview, file.name);
        }
        if (dataset) dataset = { ...dataset, backendId: backendResult.id, createdAt: backendResult.created_at };
        console.log('[AutoML Studio] Dataset saved to backend:', backendResult);
      } catch (backendErr: any) {
        console.warn('[AutoML Studio] Backend upload failed (offline mode):', backendErr.message);
        // Continue anyway — client-side preview still works
      }

      if (!dataset) throw localParseError || new Error('Dataset could not be parsed locally or by the backend');
      clearInterval(interval);
      setProgress(100);
      setSuccess(true);
      
      // Store the dataset in Zustand
      setDatasets([dataset, ...datasets]);

      // Register backend ID mapping if upload succeeded
      if (backendDatasetId !== null) {
        registerBackendDatasetId(dataset.id, backendDatasetId);
        localStorage.setItem('activeBackendDatasetId', String(backendDatasetId));
      }
      
      setTimeout(() => {
        setActiveDataset(dataset);
      }, 600);
      
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || 'Failed to parse CSV file. Ensure it is a valid CSV format.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card p-8 max-w-2xl mx-auto mt-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Upload Your Dataset</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Drag and drop your CSV or tabular data file to parse columns & statistics</p>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-brand-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={handleChange} accept=".csv,.xlsx,.parquet,.json,.txt" />
        
        <div className="flex flex-col items-center justify-center gap-4 cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <UploadCloud className="w-8 h-8 text-brand-500" />
          </div>
          
          {file ? (
            <div className="text-slate-900 dark:text-white font-medium">{file.name} ({(file.size / 1024).toFixed(1)} KB)</div>
          ) : (
            <div className="text-slate-600 dark:text-slate-300 font-medium">Drop your CSV dataset here or click to browse</div>
          )}
          
          <div className="flex gap-2 justify-center mt-2">
            {['CSV', 'Excel', 'Parquet', 'JSON'].map(type => (
              <span key={type} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded-md font-medium border border-slate-200 dark:border-slate-700">
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 space-y-3">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Dataset parsed successfully! Loading columns preview...
          </div>
          {backendSaved && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg flex items-center gap-3 text-xs border border-blue-200 dark:border-blue-800">
              <Server className="w-4 h-4 shrink-0" />
              Saved to backend — your dataset will persist after page refresh and is ready for ML training.
            </div>
          )}
        </div>
      )}

      {file && !success && (
        <div className="mt-8 space-y-4">
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>{progress < 85 ? 'Parsing columns & missing values...' : 'Syncing with backend server...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-brand-500 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
          
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {uploading ? 'Parsing & Uploading...' : 'Parse & Profile Dataset'}
          </button>
        </div>
      )}
    </div>
  );
}
