// src/components/EightQueensAC3.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  solveNQueensWithAC3,
  type SolveResult,
  type SolverStep,
} from './utils/utils';

const BOARD_SIZE = 8;

export const Queenoeight: React.FC = () => {
  const [fixedQueen, setFixedQueen] = useState<{ col: number; row: number } | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(150);

  // Ejecutamos el solver cada vez que cambia la reina inicial fijada por el usuario
  const solveResult: SolveResult = useMemo(() => {
    return solveNQueensWithAC3(BOARD_SIZE, fixedQueen);
  }, [fixedQueen]);

  const currentStep: SolverStep | undefined = solveResult.steps[stepIndex];

  // Control de reproducción automática
  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= solveResult.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, speedMs, solveResult.steps.length]);

  const handleCellClick = (col: number, row: number) => {
    setIsPlaying(false);
    setStepIndex(0);
    if (fixedQueen && fixedQueen.col === col && fixedQueen.row === row) {
      setFixedQueen(null); // Desmarcar si vuelve a hacer clic en la misma
    } else {
      setFixedQueen({ col, row });
    }
  };

  const handleJumpToEnd = () => {
    setIsPlaying(false);
    setStepIndex(Math.max(0, solveResult.steps.length - 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setFixedQueen(null);
    setStepIndex(0);
  };

  const activeDomains = currentStep
    ? currentStep.domains
    : Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, (_, r) => r));

  const activeAssigned = currentStep ? currentStep.assigned : Array(BOARD_SIZE).fill(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#0f172a',
        color: '#f1f5f9',
        minHeight: '100vh',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 6px 0' }}>Problema de las 8 Reinas — Algoritmo AC-3 (CSP)</h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
          Haz clic en una casilla para fijar una reina inicial y observa la propagación de restricciones AC-3.
        </p>
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={() => setIsPlaying((p) => !p)}
          style={btnStyle(isPlaying ? '#f59e0b' : '#10b981', '#000')}
        >
          {isPlaying ? 'Pausar' : 'Reproducir AC-3'}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            setStepIndex((i) => Math.max(0, i - 1));
          }}
          disabled={stepIndex === 0}
          style={btnStyle('#334155', '#fff')}
        >
          ◀ Paso Anterior
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            setStepIndex((i) => Math.min(solveResult.steps.length - 1, i + 1));
          }}
          disabled={stepIndex >= solveResult.steps.length - 1}
          style={btnStyle('#334155', '#fff')}
        >
          Paso Siguiente ▶
        </button>

        <button onClick={handleJumpToEnd} style={btnStyle('#3b82f6', '#fff')}>
          Ir a la Solución
        </button>

        <button onClick={handleReset} style={btnStyle('#ef4444', '#fff')}>
          Reiniciar
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          Velocidad:
          <select
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            style={{
              backgroundColor: '#1e293b',
              color: '#fff',
              border: '1px solid #475569',
              borderRadius: '4px',
              padding: '4px 8px',
            }}
          >
            <option value={400}>Lenta (400ms)</option>
            <option value={150}>Normal (150ms)</option>
            <option value={30}>Rápida (30ms)</option>
          </select>
        </label>
      </div>

      {/* Contenedor Principal: Tablero + Panel de Datos */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', alignItems: 'flex-start' }}>
        {/* Tablero 8x8 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 54px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 54px)`,
            border: '3px solid #475569',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: BOARD_SIZE }).map((_, row) =>
            Array.from({ length: BOARD_SIZE }).map((__, col) => {
              const isDark = (row + col) % 2 === 1;
              const hasQueen = activeAssigned[col] === row;
              const isInDomain = activeDomains[col]?.includes(row);
              const isJustPruned =
                currentStep?.prunedCell?.col === col && currentStep?.prunedCell?.row === row;
              const isArcTarget = currentStep?.activeArc?.[0] === col;

              let bg = isDark ? '#1e293b' : '#334155';
              if (isJustPruned) bg = '#991b1b';
              else if (hasQueen) bg = '#065f46';
              else if (isArcTarget) bg = isDark ? '#1e3a5f' : '#284b7a';

              return (
                <div
                  key={`${row}-${col}`}
                  onClick={() => handleCellClick(col, row)}
                  title={`Columna ${col + 1}, Fila ${row + 1}`}
                  style={{
                    width: '54px',
                    height: '54px',
                    backgroundColor: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    transition: 'background-color 0.15s ease',
                    userSelect: 'none',
                  }}
                >
                  {hasQueen ? (
                    <span style={{ fontSize: '30px', lineHeight: 1 }}>♛</span>
                  ) : isJustPruned ? (
                    <span style={{ color: '#fca5a5', fontWeight: 'bold', fontSize: '18px' }}>✕</span>
                  ) : isInDomain ? (
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#38bdf8',
                        opacity: 0.75,
                      }}
                    />
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '12px' }}>·</span>
                  )}

                  {/* Coordenada sutil en bordes */}
                  {col === 0 && (
                    <span style={{ position: 'absolute', top: 2, left: 3, fontSize: '9px', color: '#94a3b8' }}>
                      {row + 1}
                    </span>
                  )}
                  {row === BOARD_SIZE - 1 && (
                    <span style={{ position: 'absolute', bottom: 1, right: 3, fontSize: '9px', color: '#94a3b8' }}>
                      C{col + 1}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Panel Lateral de Estado y Dominios */}
        <div
          style={{
            width: '340px',
            backgroundColor: '#1e293b',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '0.9rem',
          }}
        >
          <div>
            <strong>Progreso:</strong> Paso {stepIndex + 1} de {solveResult.steps.length}
            <div
              style={{
                marginTop: '6px',
                padding: '10px',
                borderRadius: '6px',
                backgroundColor:
                  currentStep?.type === 'SOLVED'
                    ? '#064e3b'
                    : currentStep?.type === 'BACKTRACK'
                    ? '#7f1d1d'
                    : '#0f172a',
                border: '1px solid #334155',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
              }}
            >
              {currentStep?.message ?? 'Listo para iniciar'}
            </div>
          </div>

          {/* Métricas del algoritmo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8' }}>
                {solveResult.stats.arcsChecked}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Arcos AC-3</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f87171' }}>
                {solveResult.stats.valuesPruned}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Podas</div>
            </div>
            <div style={statBoxStyle}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24' }}>
                {solveResult.stats.backtracks}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Backtracks</div>
            </div>
          </div>

          {/* Dominios actuales por variable (Columna) */}
          <div>
            <strong>Dominios Restantes ($D_i$):</strong>
            <div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.5' }}>
              {activeDomains.map((dom, colIdx) => (
                <div key={colIdx}>
                  <span style={{ color: '#94a3b8' }}>Col {colIdx + 1}:</span>{' '}
                  {`{ ${dom.map((r) => r + 1).join(', ')} }`}
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda */}
          <div style={{ borderTop: '1px solid #334155', paddingTop: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <div>♛ Reina asignada &nbsp;|&nbsp; <span style={{ color: '#38bdf8' }}>●</span> Valor válido en dominio</div>
            <div><span style={{ color: '#fca5a5' }}>✕</span> Valor podado por inconsistencia de arco</div>
          </div>
        </div>
      </div>
    </div>
  );
};

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '8px 14px',
    backgroundColor: bg,
    color,
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.85rem',
  };
}

const statBoxStyle: React.CSSProperties = {
  backgroundColor: '#0f172a',
  padding: '8px 4px',
  borderRadius: '6px',
  border: '1px solid #334155',
};