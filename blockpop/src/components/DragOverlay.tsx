import React from 'react';
import { BlockPiece } from '../types';
import { BlockCell } from './BlockCell';

interface DragOverlayProps {
  piece: BlockPiece | null;
  cellSize: number;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  innerRef: React.RefObject<HTMLDivElement | null>;
}

export const DragOverlay: React.FC<DragOverlayProps> = ({
  piece,
  cellSize,
  overlayRef,
  innerRef,
}) => {
  // Retain the last piece structure so during any smooth drop/return animation, it doesn't vanish into a blank box
  const cachedPieceRef = React.useRef<BlockPiece | null>(piece);
  if (piece) {
    cachedPieceRef.current = piece;
  }
  const displayPiece = piece || cachedPieceRef.current;

  const rows = displayPiece ? displayPiece.matrix.length : 1;
  const cols = displayPiece ? displayPiece.matrix[0].length : 1;
  const width = cols * cellSize;
  const height = rows * cellSize;

  return (
    <div
      ref={overlayRef}
      className="fixed top-0 left-0 pointer-events-none z-[100] will-change-transform"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'none',
        transform: 'translate3d(-9999px, -9999px, 0)',
      }}
    >
      <div
        ref={innerRef}
        className="w-full h-full transform will-change-transform"
        style={{
          transformOrigin: '50% 50%',
        }}
      >
        <div
          className="grid gap-1 w-full h-full"
          style={{
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          }}
        >
          {displayPiece?.matrix.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`drag-${r}-${c}`}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                }}
              >
                {val === 1 ? (
                  <BlockCell color={displayPiece.color} />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
