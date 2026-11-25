import { useMemo, useRef, useState } from 'react';
import type { Automaton, FiredTransition, NodePosition } from '../core/types.ts';
import { computeAutoLayout } from '../core/presets.ts';

interface AutomatonGraphProps {
  automaton: Automaton;
  activeStates: string[];
  firedTransitions: FiredTransition[];
  finalDecision?: 'accepted' | 'rejected' | null;
  onMoveNode: (state: string, pos: NodePosition) => void;
  onAutoLayout: () => void;
}

interface GroupedEdge {
  from: string;
  to: string;
  symbols: string[];
  isActive: boolean;
}

const SVG_WIDTH = 640;
const SVG_HEIGHT = 310;
const NODE_RADIUS = 26;

export function AutomatonGraph({
  automaton,
  activeStates,
  firedTransitions,
  finalDecision = null,
  onMoveNode,
  onAutoLayout,
}: AutomatonGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingState, setDraggingState] = useState<string | null>(null);

  const fallbackPositions = useMemo(
    () => computeAutoLayout(automaton.states, SVG_WIDTH, SVG_HEIGHT),
    [automaton.states],
  );

  const positions = useMemo(() => {
    const map: Record<string, NodePosition> = {};
    for (const state of automaton.states) {
      map[state] = automaton.positions?.[state] ?? fallbackPositions[state] ?? { x: 100, y: 150 };
    }
    return map;
  }, [automaton.states, automaton.positions, fallbackPositions]);

  const activeSet = useMemo(() => new Set(activeStates), [activeStates]);
  const acceptingSet = useMemo(
    () => new Set(automaton.acceptingStates),
    [automaton.acceptingStates],
  );

  const firedEdgeKeys = useMemo(() => {
    const set = new Set<string>();
    for (const transition of firedTransitions) {
      for (const dest of transition.to) {
        set.add(`${transition.from}->${dest}::${transition.symbol}`);
      }
    }
    return set;
  }, [firedTransitions]);

  const edges = useMemo<GroupedEdge[]>(() => {
    const grouped = new Map<string, GroupedEdge>();
    for (const from of automaton.states) {
      for (const symbol of automaton.alphabet) {
        const destinations = automaton.transitions[from]?.[symbol] ?? [];
        for (const to of destinations) {
          if (!positions[from] || !positions[to]) continue;
          const key = `${from}->${to}`;
          const existing = grouped.get(key);
          const fired = firedEdgeKeys.has(`${from}->${to}::${symbol}`);
          if (existing) {
            existing.symbols.push(symbol);
            if (fired) existing.isActive = true;
          } else {
            grouped.set(key, { from, to, symbols: [symbol], isActive: fired });
          }
        }
      }
    }
    return Array.from(grouped.values());
  }, [automaton.states, automaton.alphabet, automaton.transitions, positions, firedEdgeKeys]);

  const edgeKeySet = useMemo(() => new Set(edges.map((e) => `${e.from}->${e.to}`)), [edges]);

  const clientToSvgPoint = (clientX: number, clientY: number): NodePosition => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * SVG_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * SVG_HEIGHT;
    return {
      x: Math.round(Math.max(46, Math.min(SVG_WIDTH - 36, x))),
      y: Math.round(Math.max(58, Math.min(SVG_HEIGHT - 36, y))),
    };
  };

  const handlePointerDown = (state: string, e: React.PointerEvent<SVGGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingState(state);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingState) return;
    onMoveNode(draggingState, clientToSvgPoint(e.clientX, e.clientY));
  };

  const handlePointerUp = () => {
    if (draggingState) {
      setDraggingState(null);
    }
  };

  return (
    <section className="panel graph-panel" aria-label="Grafo visual do autômato">
      <div className="panel-header">
        <div>
          <h2>Diagrama Visual (Grafo)</h2>
          <p className="panel-subtitle">
            Sincronizado com a tabela. Arraste os estados para ajustar o layout.
          </p>
        </div>
        <button
          id="btn-auto-layout"
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onAutoLayout}
        >
          Auto-organizar
        </button>
      </div>

      <div className="graph-canvas-wrap">
        <svg
          ref={svgRef}
          className="graph-svg"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          role="img"
          aria-label={`Diagrama de estados do ${automaton.name}`}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7.5"
              markerHeight="7.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#1d4ed8" />
            </marker>
            <marker
              id="arrow-start"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0f172a" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge) => {
            const p1 = positions[edge.from];
            const p2 = positions[edge.to];
            const label = edge.symbols.join(', ');
            const stroke = edge.isActive ? '#1d4ed8' : '#64748b';
            const strokeWidth = edge.isActive ? 2.6 : 1.75;
            const marker = edge.isActive ? 'url(#arrow-active)' : 'url(#arrow-default)';

            // Self-loop
            if (edge.from === edge.to) {
              const startX = p1.x - 12;
              const startY = p1.y - NODE_RADIUS + 2;
              const endX = p1.x + 12;
              const endY = p1.y - NODE_RADIUS + 2;
              const pathD = `M ${startX} ${startY} C ${p1.x - 36} ${p1.y - 82}, ${p1.x + 36} ${p1.y - 82}, ${endX} ${endY}`;
              const labelX = p1.x;
              const labelY = p1.y - 74;

              return (
                <g key={`${edge.from}->${edge.to}`} className="graph-edge">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    markerEnd={marker}
                  />
                  <rect
                    x={labelX - (label.length * 4.6 + 8)}
                    y={labelY - 11}
                    width={label.length * 9.2 + 16}
                    height={20}
                    rx={6}
                    className={`edge-label-bg ${edge.isActive ? 'edge-label-active' : ''}`}
                  />
                  <text
                    x={labelX}
                    y={labelY + 3}
                    textAnchor="middle"
                    className={`edge-label-text ${edge.isActive ? 'edge-label-text-active' : ''}`}
                  >
                    {label}
                  </text>
                </g>
              );
            }

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;
            const hasReverse = edgeKeySet.has(`${edge.to}->${edge.from}`);

            if (hasReverse) {
              // Smooth curve for bidirectional edges
              const nx = -uy;
              const ny = ux;
              const curveOffset = 34;
              const midX = (p1.x + p2.x) / 2 + nx * curveOffset;
              const midY = (p1.y + p2.y) / 2 + ny * curveOffset;

              const startAngle = Math.atan2(midY - p1.y, midX - p1.x);
              const endAngle = Math.atan2(midY - p2.y, midX - p2.x);

              const startX = p1.x + Math.cos(startAngle) * NODE_RADIUS;
              const startY = p1.y + Math.sin(startAngle) * NODE_RADIUS;
              const endX = p2.x + Math.cos(endAngle) * (NODE_RADIUS + 3);
              const endY = p2.y + Math.sin(endAngle) * (NODE_RADIUS + 3);

              const pathD = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
              const labelX = 0.25 * startX + 0.5 * midX + 0.25 * endX;
              const labelY = 0.25 * startY + 0.5 * midY + 0.25 * endY;

              return (
                <g key={`${edge.from}->${edge.to}`} className="graph-edge">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    markerEnd={marker}
                  />
                  <rect
                    x={labelX - (label.length * 4.6 + 8)}
                    y={labelY - 10}
                    width={label.length * 9.2 + 16}
                    height={20}
                    rx={6}
                    className={`edge-label-bg ${edge.isActive ? 'edge-label-active' : ''}`}
                  />
                  <text
                    x={labelX}
                    y={labelY + 4}
                    textAnchor="middle"
                    className={`edge-label-text ${edge.isActive ? 'edge-label-text-active' : ''}`}
                  >
                    {label}
                  </text>
                </g>
              );
            }

            // Straight edge
            const startX = p1.x + ux * NODE_RADIUS;
            const startY = p1.y + uy * NODE_RADIUS;
            const endX = p2.x - ux * (NODE_RADIUS + 3);
            const endY = p2.y - uy * (NODE_RADIUS + 3);
            const labelX = (startX + endX) / 2 - uy * 14;
            const labelY = (startY + endY) / 2 + ux * 14;

            return (
              <g key={`${edge.from}->${edge.to}`} className="graph-edge">
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  markerEnd={marker}
                />
                <rect
                  x={labelX - (label.length * 4.6 + 8)}
                  y={labelY - 10}
                  width={label.length * 9.2 + 16}
                  height={20}
                  rx={6}
                  className={`edge-label-bg ${edge.isActive ? 'edge-label-active' : ''}`}
                />
                <text
                  x={labelX}
                  y={labelY + 4}
                  textAnchor="middle"
                  className={`edge-label-text ${edge.isActive ? 'edge-label-text-active' : ''}`}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Initial state entry arrow */}
          {automaton.initialState && positions[automaton.initialState] && (
            <g className="initial-arrow">
              <line
                x1={Math.max(12, positions[automaton.initialState].x - NODE_RADIUS - 38)}
                y1={positions[automaton.initialState].y}
                x2={positions[automaton.initialState].x - NODE_RADIUS - 3}
                y2={positions[automaton.initialState].y}
                stroke="#0f172a"
                strokeWidth={2}
                markerEnd="url(#arrow-start)"
              />
            </g>
          )}

          {/* Nodes (States) */}
          {automaton.states.map((state) => {
            const pos = positions[state];
            const isActive = activeSet.has(state);
            const isAccepting = acceptingSet.has(state);

            let nodeClass = 'graph-node';
            if (isActive) {
              if (finalDecision === 'accepted' && isAccepting) {
                nodeClass += ' node-accepted';
              } else if (finalDecision === 'rejected') {
                nodeClass += ' node-rejected';
              } else {
                nodeClass += ' node-active';
              }
            }
            if (draggingState === state) {
              nodeClass += ' node-dragging';
            }

            return (
              <g
                key={state}
                className={nodeClass}
                transform={`translate(${pos.x}, ${pos.y})`}
                onPointerDown={(e) => handlePointerDown(state, e)}
              >
                {isActive && <circle r={NODE_RADIUS + 5} className="node-halo" />}
                <circle r={NODE_RADIUS} className="node-circle" />
                {isAccepting && <circle r={NODE_RADIUS - 5} className="node-inner-circle" />}
                <text y={5} textAnchor="middle" className="node-label">
                  {state}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="graph-legend">
        <span className="legend-item">
          <span className="legend-swatch swatch-initial" /> Estado inicial (seta)
        </span>
        <span className="legend-item">
          <span className="legend-swatch swatch-accepting" /> Aceitação (duplo círculo)
        </span>
        <span className="legend-item">
          <span className="legend-swatch swatch-active" /> Estado ativo na simulação
        </span>
      </div>
    </section>
  );
}
