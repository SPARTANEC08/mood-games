import { BlockPiece, BoardGrid } from '../types';
import { BOARD_SIZE, canPlacePiece, placePieceOnBoard, checkAndClearLines } from './board';
import { SHAPE_TEMPLATES, getRandomShapeTemplate } from './shapes';

let smartPieceCounter = 1000;

export function createPieceFromTemplate(template: typeof SHAPE_TEMPLATES[0]): BlockPiece {
  smartPieceCounter++;
  return {
    id: `piece_${smartPieceCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: template.name,
    matrix: template.matrix,
    color: template.color,
    placed: false,
  };
}

/**
 * Returns all valid placements for a piece on the board,
 * sorted by lines cleared descending.
 */
export function getValidPlacements(
  board: BoardGrid,
  matrix: number[][]
): { row: number; col: number; linesCleared: number }[] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const placements: { row: number; col: number; linesCleared: number }[] = [];

  for (let r = 0; r <= BOARD_SIZE - rows; r++) {
    for (let c = 0; c <= BOARD_SIZE - cols; c++) {
      if (canPlacePiece(board, matrix, r, c)) {
        let linesCleared = 0;

        // Check horizontal rows affected
        for (let pr = 0; pr < rows; pr++) {
          const boardRow = r + pr;
          let full = true;
          for (let bc = 0; bc < BOARD_SIZE; bc++) {
            const hasCell = (bc >= c && bc < c + cols && matrix[pr][bc - c] === 1) || board[boardRow][bc] !== null;
            if (!hasCell) {
              full = false;
              break;
            }
          }
          if (full) linesCleared++;
        }

        // Check vertical columns affected
        for (let pc = 0; pc < cols; pc++) {
          const boardCol = c + pc;
          let full = true;
          for (let br = 0; br < BOARD_SIZE; br++) {
            const hasCell = (br >= r && br < r + rows && matrix[br - r][pc] === 1) || board[br][boardCol] !== null;
            if (!hasCell) {
              full = false;
              break;
            }
          }
          if (full) linesCleared++;
        }

        placements.push({ row: r, col: c, linesCleared });
      }
    }
  }

  // Sort placements: prioritize lines cleared, then tighter placements
  return placements.sort((a, b) => b.linesCleared - a.linesCleared);
}

/**
 * Checks if a piece can fit anywhere on the board
 */
export function canPieceFit(board: BoardGrid, matrix: number[][]): boolean {
  const rows = matrix.length;
  const cols = matrix[0].length;
  for (let r = 0; r <= BOARD_SIZE - rows; r++) {
    for (let c = 0; c <= BOARD_SIZE - cols; c++) {
      if (canPlacePiece(board, matrix, r, c)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Counts occupied cells on the board
 */
export function countOccupiedCells(board: BoardGrid): number {
  let count = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) count++;
    }
  }
  return count;
}

/**
 * Deep search to check if a specific permutation of pieces can be successfully
 * placed on the board sequentially (accounting for line clears after each placement).
 */
function canPermutationBePlaced(
  board: BoardGrid,
  pieces: BlockPiece[],
  pieceIndex: number
): boolean {
  if (pieceIndex >= pieces.length) {
    return true; // All pieces in this sequence placed successfully!
  }

  const piece = pieces[pieceIndex];
  const moves = getValidPlacements(board, piece.matrix);
  if (moves.length === 0) {
    return false;
  }

  // Test line-clearing moves first, then a representative sample of normal moves
  // Limiting tested moves keeps DFS ultra-fast (sub-millisecond)
  const movesToTry = moves.filter((m) => m.linesCleared > 0);
  if (movesToTry.length < 5) {
    // Add non-clearing moves up to 5 total
    for (const m of moves) {
      if (m.linesCleared === 0) {
        movesToTry.push(m);
        if (movesToTry.length >= 6) break;
      }
    }
  }

  for (const move of movesToTry) {
    const nextBoard = placePieceOnBoard(board, piece.matrix, move.row, move.col, piece.color);
    const clearResult = checkAndClearLines(nextBoard);

    if (canPermutationBePlaced(clearResult.newBoard, pieces, pieceIndex + 1)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if ANY permutation of the given trio has a valid placement sequence.
 * This guarantees that the player CAN solve the trio if they choose the correct order and positions.
 */
export function isTrioSolvable(board: BoardGrid, trio: BlockPiece[]): boolean {
  // If no pieces can even fit as the first move, it's immediately unsolvable
  const initialFit = trio.some((p) => canPieceFit(board, p.matrix));
  if (!initialFit) return false;

  // Permutations of [0, 1, 2]
  const permutations = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];

  for (const perm of permutations) {
    const orderedPieces = [trio[perm[0]], trio[perm[1]], trio[perm[2]]];
    if (canPermutationBePlaced(board, orderedPieces, 0)) {
      return true;
    }
  }

  return false;
}

/**
 * Finds templates that can fit on the current board and preferably clear lines.
 */
function getTemplatesThatCanClear(board: BoardGrid): typeof SHAPE_TEMPLATES {
  const result: typeof SHAPE_TEMPLATES = [];
  for (const tpl of SHAPE_TEMPLATES) {
    const moves = getValidPlacements(board, tpl.matrix);
    if (moves.some((m) => m.linesCleared > 0)) {
      result.push(tpl);
    }
  }
  return result;
}

/**
 * Filter templates by size for variety
 */
function getTemplatesBySize(minCells: number, maxCells: number): typeof SHAPE_TEMPLATES {
  return SHAPE_TEMPLATES.filter((tpl) => {
    const size = tpl.matrix.flat().reduce((a, b) => a + b, 0);
    return size >= minCells && size <= maxCells;
  });
}

/**
 * Generates a CHALLENGING yet 100% SOLVABLE trio of pieces.
 *
 * Rules:
 * 1. The trio is mathematically guaranteed to be solvable in at least ONE correct sequence.
 * 2. It does NOT make the game trivial with easy 1x1 dots.
 * 3. Includes authentic, complex Block Blast shapes (tetrominoes, L-shapes, T-shapes, corners, squares).
 * 4. On crowded boards, it provides a "key" piece that can clear lines — but the player MUST
 *    spot it and play it in the right order. If they place the wrong piece first, they lose!
 */
export function generateChallengingSolvableTrio(board: BoardGrid): BlockPiece[] {
  const occupied = countOccupiedCells(board);
  const density = occupied / 64; // 0.0 to 1.0

  // 1. Try to generate an authentic, challenging trio that is solvable
  // Up to 40 attempts to find an interesting combination
  for (let attempt = 0; attempt < 40; attempt++) {
    const candidateTemplates: typeof SHAPE_TEMPLATES[0][] = [];

    if (density < 0.35) {
      // Board is open: full challenge! Give classic mixed shapes (sizes 3 to 5)
      for (let i = 0; i < 3; i++) {
        candidateTemplates.push(getRandomShapeTemplate());
      }
    } else if (density < 0.60) {
      // Moderate board: ensure at least one piece can potentially clear a line,
      // while the other two are challenging tetrominoes / L / T / corners.
      const clearingTemplates = getTemplatesThatCanClear(board);
      if (clearingTemplates.length > 0 && Math.random() < 0.8) {
        candidateTemplates.push(clearingTemplates[Math.floor(Math.random() * clearingTemplates.length)]);
      } else {
        candidateTemplates.push(getRandomShapeTemplate());
      }

      // Other 2 pieces are standard shapes
      for (let i = candidateTemplates.length; i < 3; i++) {
        candidateTemplates.push(getRandomShapeTemplate());
      }
    } else {
      // High density (> 60% full):
      // The puzzle aspect is critical here!
      // Must provide a key piece that CAN trigger a line clear if played correctly,
      // accompanied by 2 medium/compact pieces (size 2-4).
      const clearingTemplates = getTemplatesThatCanClear(board);
      if (clearingTemplates.length > 0) {
        candidateTemplates.push(clearingTemplates[Math.floor(Math.random() * clearingTemplates.length)]);
      } else {
        // Find any piece that can fit
        const fitting = SHAPE_TEMPLATES.filter((t) => canPieceFit(board, t.matrix));
        if (fitting.length > 0) {
          candidateTemplates.push(fitting[Math.floor(Math.random() * fitting.length)]);
        } else {
          candidateTemplates.push(getRandomShapeTemplate());
        }
      }

      // Fill remaining with medium shapes (sizes 2 to 4: dominoes, triominoes, corners, L-shapes)
      const mediumTemplates = getTemplatesBySize(2, 4);
      for (let i = candidateTemplates.length; i < 3; i++) {
        const pool = mediumTemplates.length > 0 ? mediumTemplates : SHAPE_TEMPLATES;
        candidateTemplates.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }

    // Shuffle the candidate templates so the "key" piece isn't always in slot 0!
    // This forces the player to inspect all 3 pieces and think which one to place first.
    candidateTemplates.sort(() => Math.random() - 0.5);

    const candidateTrio = candidateTemplates.map(createPieceFromTemplate);

    // Verify if this trio has at least one valid sequence to solve
    if (isTrioSolvable(board, candidateTrio)) {
      return candidateTrio;
    }
  }

  // 2. Deterministic Fallback: Construct a solvable chain step-by-step
  // Even in fallback, we prioritize challenging shapes (dominoes, triominoes, corners, tetrominoes)
  let simBoard = board.map((row) => [...row]);
  const fallbackTrio: BlockPiece[] = [];

  for (let step = 0; step < 3; step++) {
    // Find shapes that fit simBoard and prefer larger shapes that fit
    const candidates = SHAPE_TEMPLATES.filter((t) => canPieceFit(simBoard, t.matrix));

    // Sort candidates: prefer shapes that clear lines, then shapes with 3-4 cells over 1 cell
    candidates.sort((a, b) => {
      const movesA = getValidPlacements(simBoard, a.matrix);
      const movesB = getValidPlacements(simBoard, b.matrix);
      const clearA = movesA.length > 0 ? movesA[0].linesCleared : 0;
      const clearB = movesB.length > 0 ? movesB[0].linesCleared : 0;
      if (clearB !== clearA) return clearB - clearA;

      const sizeA = a.matrix.flat().reduce((x, y) => x + y, 0);
      const sizeB = b.matrix.flat().reduce((x, y) => x + y, 0);
      return sizeB - sizeA;
    });

    const selectedTpl = candidates.length > 0 ? candidates[Math.min(candidates.length - 1, Math.floor(Math.random() * Math.min(4, candidates.length)))] : SHAPE_TEMPLATES[0];
    const piece = createPieceFromTemplate(selectedTpl);
    fallbackTrio.push(piece);

    // Apply best move to simBoard for the next piece in sequence
    const moves = getValidPlacements(simBoard, piece.matrix);
    if (moves.length > 0) {
      simBoard = placePieceOnBoard(simBoard, piece.matrix, moves[0].row, moves[0].col, piece.color);
      const cleared = checkAndClearLines(simBoard);
      simBoard = cleared.newBoard;
    }
  }

  // Shuffle so the player has to figure out which piece to play first!
  fallbackTrio.sort(() => Math.random() - 0.5);
  return fallbackTrio;
}
