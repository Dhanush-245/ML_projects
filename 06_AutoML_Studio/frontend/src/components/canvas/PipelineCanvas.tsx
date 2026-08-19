import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Connection,
  Edge,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Code, Database, Sliders, Settings, Box, BarChart2, Layers, Cpu, CheckCircle, Upload } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

// Custom Nodes
const CustomNode = ({ data, icon: Icon, colorClass }: any) => (
  <div className={`px-4 py-3 rounded-lg border-2 bg-white dark:bg-slate-900 shadow-sm min-w-[150px] ${colorClass}`}>
    <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-slate-400" />
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-md ${colorClass.replace('border-', 'bg-').replace('500', '100').replace('dark:border-', 'dark:bg-').replace('400', '900/30')} ${colorClass.replace('border-', 'text-')}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{data.label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{data.subLabel}</div>
      </div>
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-slate-400" />
  </div>
);

const nodeTypes = {
  dataSource: (props: any) => <CustomNode {...props} icon={Database} colorClass="border-blue-500 dark:border-blue-400" />,
  preprocess: (props: any) => <CustomNode {...props} icon={Sliders} colorClass="border-purple-500 dark:border-purple-400" />,
  feature: (props: any) => <CustomNode {...props} icon={Settings} colorClass="border-indigo-500 dark:border-indigo-400" />,
  model: (props: any) => <CustomNode {...props} icon={Box} colorClass="border-amber-500 dark:border-amber-400" />,
  evaluate: (props: any) => <CustomNode {...props} icon={BarChart2} colorClass="border-emerald-500 dark:border-emerald-400" />,
  distill: (props: any) => <CustomNode {...props} icon={Cpu} colorClass="border-cyan-500 dark:border-cyan-400" />,
};

// Data Split → Feature Transform → Architecture Search → CV Training → Ensemble → Distill → Validate → Upload
const initialNodes = [
  { id: '1', type: 'dataSource', position: { x: 50, y: 150 }, data: { label: 'Data Split', subLabel: '80/10/10' } },
  { id: '2', type: 'feature', position: { x: 250, y: 150 }, data: { label: 'Feature Transform', subLabel: 'Auto-encoding' } },
  { id: '3', type: 'preprocess', position: { x: 450, y: 150 }, data: { label: 'Architecture Search', subLabel: 'AutoML' } },
  { id: '4', type: 'model', position: { x: 650, y: 150 }, data: { label: 'CV Training', subLabel: '5 Folds' } },
  { id: '5', type: 'model', position: { x: 850, y: 150 }, data: { label: 'Ensemble', subLabel: 'Top 5 Models' } },
  { id: '6', type: 'distill', position: { x: 1050, y: 150 }, data: { label: 'Distill', subLabel: 'Knowledge Distillation' } },
  { id: '7', type: 'evaluate', position: { x: 1250, y: 150 }, data: { label: 'Validate', subLabel: 'Holdout Set' } },
  { id: '8', type: 'dataSource', position: { x: 1450, y: 150 }, data: { label: 'Upload', subLabel: 'Model Registry' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e5-6', source: '5', target: '6', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e6-7', source: '6', target: '7', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e7-8', source: '7', target: '8', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
];

let id = 9;
const getId = () => `${id++}`;

function CanvasFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges as Edge[]);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } } as Edge, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: label, subLabel: 'New Node' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  return (
    <div className="flex-1 flex relative" ref={reactFlowWrapper}>
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 z-10 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Components</h3>
        <div className="space-y-3">
          {[
            { type: 'dataSource', label: 'Data Source', icon: Database, color: 'text-blue-500' },
            { type: 'preprocess', label: 'Preprocessing', icon: Sliders, color: 'text-purple-500' },
            { type: 'feature', label: 'Feature Eng', icon: Settings, color: 'text-indigo-500' },
            { type: 'model', label: 'Model', icon: Box, color: 'text-amber-500' },
            { type: 'evaluate', label: 'Evaluate', icon: BarChart2, color: 'text-emerald-500' },
            { type: 'distill', label: 'Distill', icon: Cpu, color: 'text-cyan-500' },
          ].map((c) => (
            <div 
              key={c.type} 
              onDragStart={(event: React.DragEvent) => {
                event.dataTransfer.setData('application/reactflow', c.type);
                event.dataTransfer.setData('application/label', c.label);
                event.dataTransfer.effectAllowed = 'move';
              }}
              className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-grab hover:border-brand-300 transition-colors shadow-sm" 
              draggable
            >
              <c.icon className={`w-5 h-5 ${c.color}`} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 h-full w-full absolute inset-0 pl-64">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-50 dark:bg-slate-950"
        >
          <Background color="#cbd5e1" gap={16} />
          <Controls className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
          <MiniMap className="bg-white dark:bg-slate-800" maskColor="rgba(0,0,0,0.1)" />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function PipelineCanvas() {
  const { preprocessingConfig, setPreprocessingConfig, pipelineApplied, setPipelineApplied } = useAppStore();
  return (
    <div className="h-[80vh] flex flex-col glass-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 z-20">
        <h2 className="font-heading font-semibold text-lg">Visual Pipeline Builder</h2>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
            <Code className="w-4 h-4" />
            Export Code
          </button>
          <button onClick={() => setPipelineApplied(true)} className="flex items-center gap-2 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md transition-colors text-sm font-medium shadow-sm">
            <Play className="w-4 h-4" />
            {pipelineApplied ? 'Pipeline Applied' : 'Apply Pipeline'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-brand-50/40 dark:bg-brand-900/10">
        <select aria-label="Numeric imputer" value={preprocessingConfig.num_imputer} onChange={(e) => setPreprocessingConfig({ num_imputer: e.target.value as any })} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          <option value="median">Median imputation</option><option value="mean">Mean imputation</option><option value="knn">KNN imputation</option>
        </select>
        <select aria-label="Categorical imputer" value={preprocessingConfig.cat_imputer} onChange={(e) => setPreprocessingConfig({ cat_imputer: e.target.value as any })} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          <option value="most_frequent">Most-frequent categories</option><option value="constant">Constant missing category</option>
        </select>
        <select aria-label="Feature scaler" value={preprocessingConfig.scaler} onChange={(e) => setPreprocessingConfig({ scaler: e.target.value as any })} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          <option value="standard">Standard scaling</option><option value="minmax">Min-max scaling</option><option value="robust">Robust scaling</option><option value="power">Power transform</option>
        </select>
        <select aria-label="Categorical encoder" value={preprocessingConfig.encoder} onChange={(e) => setPreprocessingConfig({ encoder: e.target.value as any })} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm">
          <option value="onehot">One-hot encoding</option><option value="ordinal">Ordinal encoding</option>
        </select>
      </div>
      <ReactFlowProvider>
        <CanvasFlow />
      </ReactFlowProvider>
    </div>
  );
}
