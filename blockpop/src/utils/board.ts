import { BlockPiece, BoardGrid, CellColor } from '../types';

export const BOARD_SIZE = 8;

/**
 * Creates an empty 8x8 board grid
 */
export function createEmptyBoard(): BoardGrid {
  return Array.from({ length: BOARD_SIZE }, () => 
    Array.from({ length: BOARD_SIZE }, () => null)
  );
}

/**
 * Checks if a piece can be placed at (startRow, startCol)
 */
export function canPlacePiece(
  board: BoardGrid,
  matrix: number[][],
  startRow: number,
  startCol: number
): boolean {
  const rows = matrix.length;
  const cols = matrix[0].length;

  // Check bounds
  if (startRow < 0 || startCol < 0) return false;
  if (startRow + rows > BOARD_SIZE || startCol + cols > BOARD_SIZE) return false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 1) {
        const boardRow = startRow + r;
        const boardCol = startCol + c;
        if (board[boardRow][boardCol] !== null) {
          return false; // Cell already occupied
        }
      }
    }
  }

  return true;
}

/**
 * Checks if a piece can be placed anywhere on the entire 8x8 board
 */
export function canPieceFitAnywhere(board: BoardGrid, matrix: number[][]): boolean {
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
 * Checks if all remaining unplaced pieces in the tray are unplaceable
 */
export function isGameOver(board: BoardGrid, pieces: BlockPiece[]): boolean {
  const activePieces = pieces.filter((p) => !p.placed);
  if (activePieces.length === 0) return false;

  for (const piece of activePieces) {
    if (canPieceFitAnywhere(board, piece.matrix)) {
      return false; // At least one piece can be placed!
    }
  }

  return true; // None can fit! Game Over.
}

/**
 * Places a piece onto the board and returns the new board
 */
export function placePieceOnBoard(
  board: BoardGrid,
  matrix: number[][],
  startRow: number,
  startCol: number,
  color: CellColor
): BoardGrid {
  const newBoard = board.map((row) => [...row]);
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 1) {
        newBoard[startRow + r][startCol + c] = color;
      }
    }
  }

  return newBoard;
}

export interface ClearResult {
  newBoard: BoardGrid;
  clearedRows: number[];
  clearedCols: number[];
  clearedCells: { row: number; col: number; color: CellColor }[];
  totalLines: number;
}

/**
 * Detects full rows and columns, clears them, and returns cleared info
 */
export function checkAndClearLines(board: BoardGrid): ClearResult {
  const fullRows: number[] = [];
  const fullCols: number[] = [];

  // Check full horizontal rows
  for (let r = 0; r < BOARD_SIZE; r++) {
    let isFull = true;
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      fullRows.push(r);
    }
  }

  // Check full vertical columns
  for (let c = 0; c < BOARD_SIZE; c++) {
    let isFull = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (board[r][c] === null) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      fullCols.push(c);
    }
  }

  const totalLines = fullRows.length + fullCols.length;
  if (totalLines === 0) {
    return {
      newBoard: board,
      clearedRows: [],
      clearedCols: [],
      clearedCells: [],
      totalLines: 0,
    };
  }

  const clearedCells: { row: number; col: number; color: CellColor }[] = [];
  const cellSet = new Set<string>();

  // Collect cells from rows
  for (const r of fullRows) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r},${c}`;
      if (!cellSet.has(key)) {
        cellSet.add(key);
        clearedCells.push({ row: r, col: c, color: board[r][c] || 'yellow' });
      }
    }
  }

  // Collect cells from columns
  for (const c of fullCols) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      const key = `${r},${c}`;
      if (!cellSet.has(key)) {
        cellSet.add(key);
        clearedCells.push({ row: r, col: c, color: board[r][c] || 'yellow' });
      }
    }
  }

  // Create cleared board
  const newBoard = board.map((row, r) =>
    row.map((val, c) => (cellSet.has(`${r},${c}`) ? null : val))
  );

  return {
    newBoard,
    clearedRows: fullRows,
    clearedCols: fullCols,
    clearedCells,
    totalLines,
  };
}

/**
 * Calculate points for placing a shape
 */
export function getPlacementPoints(matrix: number[][]): number {
  let count = 0;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === 1) count++;
    }
  }
  return count;
}

/**
 * Calculate bonus points for clearing lines + combos
 */
export function getLineClearScore(lines: number, combo: number): number {
  if (lines <= 0) return 0;
  // Multiplier scales sharply with simultaneous line clears:
  // 1 line = 10 pts
  // 2 lines = 30 pts
  // 3 lines = 60 pts
  // 4 lines = 100 pts
  // 5 lines = 150 pts
  // 6 lines = 210 pts
  const basePoints = (lines * (lines + 1) / 2) * 10;
  
  // Combo multiplier: combo 1 = 1x, combo 2 = 1.5x, combo 3 = 2x, etc.
  const comboMultiplier = combo > 0 ? 1 + (combo - 1) * 0.5 : 1;
  return Math.round(basePoints * comboMultiplier);
}

/**
 * Returns fun energetic cheer text for combos
 */
export function getCheerText(lines: number, combo: number): string {
  if (lines >= 4 || combo >= 5) return 'UNBELIEVABLE!';
  if (lines === 3 || combo >= 4) return 'AMAZING!';
  if (lines === 2 || combo >= 3) return 'EXCELLENT!';
  if (combo === 2) return 'GREAT!';
  if (lines === 1) return 'NICE!';
  return 'GOOD!';
}
