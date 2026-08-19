import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Zap, Eye, RotateCw, Sparkles, Layers, Maximize2 } from 'lucide-react';

interface Node3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  layer: number;
  label: string;
  size: number;
  color: string;
}

export default function NeuralCore3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeNode, setActiveNode] = useState<Node3D | null>(null);
  const [rotationSpeed, setRotationSpeed] = useState(0.005);
  const [particleCount, setParticleCount] = useState(120);

  const nodesRef = useRef<Node3D[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rotationRef = useRef({ rx: 0, ry: 0 });

  // Initialize 3D Neural Nodes in spherical shell
  useEffect(() => {
    const nodes: Node3D[] = [];
    const layers = ['Input', 'Dense_1 (ReLU)', 'Dense_2 (BatchNorm)', 'Dropout (0.2)', 'Output (Softmax)'];
    const colors = ['#06b6d4', '#8b5cf6', '#d946ef', '#3b82f6', '#10b981'];

    for (let i = 0; i < particleCount; i++) {
      const radius = 180 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const layerIdx = Math.floor(Math.random() * layers.length);

      nodes.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        layer: layerIdx,
        label: `${layers[layerIdx]}_Neuron_${i + 1}`,
        size: 3 + Math.random() * 3,
        color: colors[layerIdx],
      });
    }

    nodesRef.current = nodes;
  }, [particleCount]);

  // 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 550;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = (e.clientX - rect.left - canvas.width / 2) * 0.0005;
      mouseRef.current.targetY = (e.clientY - rect.top - canvas.height / 2) * 0.0005;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const focalLength = 400;

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      rotationRef.current.ry += rotationSpeed + mouseRef.current.x * 0.05;
      rotationRef.current.rx += mouseRef.current.y * 0.05;

      const cosY = Math.cos(rotationRef.current.ry);
      const sinY = Math.sin(rotationRef.current.ry);
      const cosX = Math.cos(rotationRef.current.rx);
      const sinX = Math.sin(rotationRef.current.rx);

      // Transform nodes
      const projectedNodes = nodesRef.current.map((node) => {
        // Rotate around Y
        let x1 = node.x * cosY - node.z * sinY;
        let z1 = node.z * cosY + node.x * sinY;

        // Rotate around X
        let y1 = node.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.y * sinX;

        // Perspective Projection
        const scale = focalLength / (focalLength + z2 + 300);
        const px = cx + x1 * scale;
        const py = cy + y1 * scale;

        return {
          ...node,
          px,
          py,
          scale,
          z2,
        };
      });

      // Sort by depth (Z-buffer)
      projectedNodes.sort((a, b) => b.z2 - a.z2);

      // Draw Synapse Connections
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const n1 = projectedNodes[i];
          const n2 = projectedNodes[j];

          const dx = n1.px - n2.px;
          const dy = n1.py - n2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 85 && n1.scale > 0.4) {
            const alpha = (1 - dist / 85) * 0.3 * Math.min(n1.scale, n2.scale);
            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            ctx.lineTo(n2.px, n2.py);
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 1 * n1.scale;
            ctx.stroke();
          }
        }
      }

      // Draw 3D Nodes
      projectedNodes.forEach((n) => {
        if (n.scale <= 0.1) return;

        const size = Math.max(1, n.size * n.scale);

        // Glow outer ring
        const gradient = ctx.createRadialGradient(n.px, n.py, 0, n.px, n.py, size * 3);
        gradient.addColorStop(0, n.color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(n.px, n.py, size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.4 * n.scale;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Core dot
        ctx.beginPath();
        ctx.arc(n.px, n.py, size, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [rotationSpeed, particleCount]);

  return (
    <div className="glass-card p-6 relative overflow-hidden space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-500 text-white shadow-lg shadow-violet-600/30">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
              3D Neural Core Visualizer
              <span className="px-2 py-0.5 text-[9px] uppercase font-mono bg-violet-950 text-cyan-300 border border-cyan-500/30 rounded">
                WebGL 3D
              </span>
            </h2>
            <p className="text-xs text-slate-400">Interactive 3D particle graph representing neural weights, activations & topology.</p>
          </div>
        </div>

        {/* 3D Control Panel */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-300 px-2">
            <RotateCw className="w-3.5 h-3.5 text-violet-400" />
            <span>Spin Speed</span>
            <input 
              type="range" 
              min="0" 
              max="0.02" 
              step="0.001" 
              value={rotationSpeed} 
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
              className="w-20 accent-violet-500 cursor-pointer" 
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 px-2 border-l border-slate-800">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nodes: {particleCount}</span>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative w-full h-[520px] rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden group">
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

        {/* 3D Ambient Overlay Labels */}
        <div className="absolute top-4 left-4 p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800/80 text-xs space-y-1.5 pointer-events-none">
          <div className="font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Interactive 3D Perspective
          </div>
          <p className="text-[11px] text-slate-400">Hover & move cursor to rotate 3D Neural Sphere in XYZ space.</p>
        </div>

        <div className="absolute bottom-4 right-4 flex gap-2">
          <span className="px-2.5 py-1 text-[10px] font-mono bg-violet-950/90 text-violet-300 border border-violet-700/50 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
            Dense Neurons (120)
          </span>
          <span className="px-2.5 py-1 text-[10px] font-mono bg-cyan-950/90 text-cyan-300 border border-cyan-700/50 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Synapses (420+)
          </span>
        </div>
      </div>
    </div>
  );
}
