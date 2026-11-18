// src/util/queensAc3.ts

export type Domains = number[][]; // domains[col] = lista de filas válidas (0..7)
export type Arc = [number, number]; // [Xi, Xj]

export interface SolverStep {
  type: 'ASSIGN' | 'AC3_REVISE' | 'AC3_PRUNE' | 'BACKTRACK' | 'SOLVED';
  message: string;
  domains: Domains;
  assigned: (number | null)[]; // assigned[col] = row | null
  activeArc?: Arc;
  prunedCell?: { col: number; row: number };
}

export interface SolveResult {
  solved: boolean;
  solution: (number | null)[];
  steps: SolverStep[];
  stats: {
    arcsChecked: number;
    valuesPruned: number;
    backtracks: number;
  };
}

/**
 * Verifica si colocar reinas en (col1, row1) y (col2, row2) es consistente
 */
export function isConsistent(col1: number, row1: number, col2: number, row2: number): boolean {
  if (row1 === row2) return false; // Misma fila
  if (Math.abs(row1 - row2) === Math.abs(col1 - col2)) return false; // Misma diagonal
  return true;
}

/**
 * Clona profundamente los dominios actuales
 */
function cloneDomains(domains: Domains): Domains {
  return domains.map((d) => [...d]);
}

/**
 * Función REVISE del algoritmo AC-3:
 * Elimina valores de D[xi] que no tengan ningún soporte válido en D[xj].
 */
function revise(
  domains: Domains,
  xi: number,
  xj: number,
  assigned: (number | null)[],
  steps: SolverStep[],
  stats: { arcsChecked: number; valuesPruned: number; backtracks: number }
): boolean {
  let revised = false;
  const toKeep: number[] = [];

  for (const rowI of domains[xi]) {
    // Buscamos si existe al menos un rowJ en D[xj] consistente con rowI
    const hasSupport = domains[xj].some((rowJ) => isConsistent(xi, rowI, xj, rowJ));

    if (hasSupport) {
      toKeep.push(rowI);
    } else {
      revised = true;
      stats.valuesPruned++;
      // Registramos la poda solo después de actualizar el dominio
      const snapshot = cloneDomains(domains);
      snapshot[xi] = snapshot[xi].filter((r) => r !== rowI);
      domains[xi] = snapshot[xi];

      steps.push({
        type: 'AC3_PRUNE',
        message: `AC-3 poda fila ${rowI + 1} en Col ${xi + 1} (sin soporte en Col ${xj + 1})`,
        domains: cloneDomains(domains),
        assigned: [...assigned],
        activeArc: [xi, xj],
        prunedCell: { col: xi, row: rowI },
      });
    }
  }

  domains[xi] = toKeep;
  return revised;
}

/**
 * Algoritmo AC-3 completo:
 * Propaga restricciones en la cola de arcos hasta alcanzar consistencia de arco
 * o detectar un dominio vacío (fallo temprano).
 */
export function runAC3(
  domains: Domains,
  initialQueue: Arc[],
  assigned: (number | null)[],
  steps: SolverStep[],
  stats: { arcsChecked: number; valuesPruned: number; backtracks: number },
  n = 8
): boolean {
  const queue: Arc[] = [...initialQueue];

  while (queue.length > 0) {
    const arc = queue.shift();
    if (!arc) break;
    const [xi, xj] = arc;
    stats.arcsChecked++;

    if (revise(domains, xi, xj, assigned, steps, stats)) {
      if (domains[xi].length === 0) {
        return false; // Inconsistencia detectada: dominio vacío
      }
      // Reinsertar todos los arcos vecinos (Xk, Xi) con Xk != Xj
      for (let xk = 0; xk < n; xk++) {
        if (xk !== xi && xk !== xj) {
          queue.push([xk, xi]);
        }
      }
    }
  }

  return true;
}

/**
 * Genera todos los arcos iniciales entre variables distintas
 */
function buildAllArcs(n = 8): Arc[] {
  const arcs: Arc[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) arcs.push([i, j]);
    }
  }
  return arcs;
}

/**
 * Resuelve el problema de las N-Reinas combinando Backtracking + AC-3 (MAC),
 * permitiendo opcionalmente fijar una reina inicial elegida por el usuario.
 */
export function solveNQueensWithAC3(
  n = 8,
  initialFixedQueen?: { col: number; row: number } | null
): SolveResult {
  const domains: Domains = Array.from({ length: n }, () =>
    Array.from({ length: n }, (_, r) => r)
  );
  const assigned: (number | null)[] = Array(n).fill(null);
  const steps: SolverStep[] = [];
  const stats = { arcsChecked: 0, valuesPruned: 0, backtracks: 0 };

  // Si el usuario fijó una reina inicial en el tablero, reducimos su dominio primero
  if (initialFixedQueen) {
    const { col, row } = initialFixedQueen;
    domains[col] = [row];
    assigned[col] = row;
    steps.push({
      type: 'ASSIGN',
      message: `Reina inicial fijada en Col ${col + 1}, Fila ${row + 1}`,
      domains: cloneDomains(domains),
      assigned: [...assigned],
    });
  }

  // Ejecución inicial de AC-3
  const initialConsistent = runAC3(domains, buildAllArcs(n), assigned, steps, stats, n);
  if (!initialConsistent) {
    return { solved: false, solution: assigned, steps, stats };
  }

  // Heurística MRV (Minimum Remaining Values): elige la columna sin asignar con menor dominio
  function selectUnassignedVariable(currDomains: Domains, currAssigned: (number | null)[]): number {
    let bestCol = -1;
    let minLen = Infinity;
    for (let c = 0; c < n; c++) {
      if (currAssigned[c] === null && currDomains[c].length < minLen) {
        minLen = currDomains[c].length;
        bestCol = c;
      }
    }
    return bestCol;
  }

  function backtrack(currDomains: Domains, currAssigned: (number | null)[]): (number | null)[] | null {
    const col = selectUnassignedVariable(currDomains, currAssigned);
    if (col === -1) {
      // Todas las columnas tienen reina asignada
      return currAssigned;
    }

    for (const row of currDomains[col]) {
      const nextDomains = cloneDomains(currDomains);
      const nextAssigned = [...currAssigned];

      nextDomains[col] = [row];
      nextAssigned[col] = row;

      steps.push({
        type: 'ASSIGN',
        message: `Asignando Reina en Col ${col + 1}, Fila ${row + 1} -> Ejecutando AC-3`,
        domains: cloneDomains(nextDomains),
        assigned: [...nextAssigned],
      });

      // Cola de arcos afectados por la asignación en `col`
      const affectedArcs: Arc[] = [];
      for (let other = 0; other < n; other++) {
        if (other !== col) {
          affectedArcs.push([other, col]);
        }
      }

      const ok = runAC3(nextDomains, affectedArcs, nextAssigned, steps, stats, n);

      if (ok) {
        const result = backtrack(nextDomains, nextAssigned);
        if (result) return result;
      }

      stats.backtracks++;
      steps.push({
        type: 'BACKTRACK',
        message: `Conflicto tras Col ${col + 1}, Fila ${row + 1} -> Backtrack`,
        domains: cloneDomains(currDomains),
        assigned: [...currAssigned],
      });
    }

    return null;
  }

  const finalSolution = backtrack(domains, assigned);

  if (finalSolution) {
    steps.push({
      type: 'SOLVED',
      message: '¡Solución consistente encontrada con AC-3!',
      domains: finalSolution.map((r) => (r !== null ? [r] : [])),
      assigned: [...finalSolution],
    });
    return { solved: true, solution: finalSolution, steps, stats };
  }

  return { solved: false, solution: assigned, steps, stats };
}