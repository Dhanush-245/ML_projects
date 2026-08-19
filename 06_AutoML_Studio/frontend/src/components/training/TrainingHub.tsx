import React, { useState } from 'react';
import AutoMLConfig from './AutoMLConfig';
import TrainingProgress from './TrainingProgress';
import Leaderboard from './Leaderboard';
import ModelEvaluation from './ModelEvaluation';

export default function TrainingHub() {
  const [view, setView] = useState<'config' | 'progress' | 'leaderboard' | 'evaluation'>('config');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [experimentId, setExperimentId] = useState<number | null>(null);

  const handleLaunch = (expId?: number) => {
    if (expId) setExperimentId(expId);
    setView('progress');
  };

  const handleSelectModel = (id: string) => {
    setSelectedModel(id);
    setView('evaluation');
  };

  return (
    <div className="h-full">
      {view === 'config' && <AutoMLConfig onLaunch={handleLaunch} />}
      {view === 'progress' && <TrainingProgress experimentId={experimentId} onComplete={() => setView('leaderboard')} />}
      {view === 'leaderboard' && <Leaderboard experimentId={experimentId} onSelectModel={handleSelectModel} />}
      {view === 'evaluation' && <ModelEvaluation experimentId={experimentId} modelId={selectedModel} onBack={() => setView('leaderboard')} />}
    </div>
  );
}
