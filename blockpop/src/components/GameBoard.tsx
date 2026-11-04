import React from 'react';
import { BoardGrid, CellColor, FloatingText } from '../types';
import { BlockCell } from './BlockCell';

interface GameBoardProps {
  grid: BoardGrid;
  ghostCells: { row: number; col: number; color: CellColor }[] | null;
  clearingCells: Set<string>;
  floatingTexts: FloatingText[];
  gridRef: React.RefObject<HTMLDivElement | null>;
  isShaking: boolean;
  onCellClick?: (row: number, col: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  ghostCells,
  clearingCells,
  floatingTexts,
  gridRef,
  isShaking,
  onCellClick,
}) => {
  // Convert ghost cells to map for instant lookup
  const ghostMap = React.useMemo(() => {
    if (!ghostCells || ghostCells.length === 0) return null;
    const map = new Map<string, CellColor>();
    ghostCells.forEach((c) => map.set(`${c.row},${c.col}`, c.color));
    return map;
  }, [ghostCells]);

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Crisp Board Frame */}
      <div
        className={`relative aspect-square w-[min(88vw,calc(100vh-250px),390px)] p-2 sm:p-2.5 rounded-2xl bg-[#0c132c] border-2 border-[#1c274c] shadow-[0_10px_30px_rgba(0,0,0,0.6)] ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Exact 8x8 Grid with ref directly on the grid container */}
        <div
          ref={gridRef}
          className="grid grid-cols-8 grid-rows-8 gap-1 w-full h-full"
        >
          {grid.map((row, r) =>
            row.map((cellColor, c) => {
              const cellKey = `${r},${c}`;
              const isClearing = clearingCells.has(cellKey);
              const ghostColor = ghostMap?.get(cellKey);

              let renderColor: CellColor | null = cellColor;
              let isGhost = false;

              if (ghostColor && !cellColor) {
                renderColor = ghostColor;
                isGhost = true;
              }

              return (
                <div
                  key={cellKey}
                  data-row={r}
                  data-col={c}
                  onClick={() => onCellClick?.(r, c)}
                  className="relative w-full h-full aspect-square"
                >
                  <BlockCell
                    color={renderColor}
                    isEmpty={!renderColor}
                    isGhost={isGhost}
                    isClearing={isClearing}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Floating Scores & Combo Overlays */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className="absolute pointer-events-none z-30 font-['Rubik'] font-black transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 animate-float-fade"
            style={{
              left: `${ft.x}%`,
              top: `${ft.y}%`,
              color: ft.color,
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              fontSize: `${ft.combo && ft.combo > 1 ? 24 : 20}px`,
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>
    </div>
  );
};
