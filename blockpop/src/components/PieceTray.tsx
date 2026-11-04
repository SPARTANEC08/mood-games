import React, { useRef } from 'react';
import { BlockPiece } from '../types';
import { BlockCell } from './BlockCell';
import { canPieceFitAnywhere } from '../utils/board';
import { BoardGrid } from '../types';

interface PieceTrayProps {
  pieces: BlockPiece[];
  board: BoardGrid;
  selectedPieceId: string | null;
  draggingPieceId: string | null;
  onPieceSelect: (piece: BlockPiece) => void;
  onDragStart: (
    piece: BlockPiece,
    clientX: number,
    clientY: number,
    pieceRect?: DOMRect,
    pointerType?: string
  ) => void;
}

export const PieceTray: React.FC<PieceTrayProps> = ({
  pieces,
  board,
  selectedPieceId,
  draggingPieceId,
  onPieceSelect,
  onDragStart,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[440px] px-2 sm:px-3 py-1 sm:py-2 flex items-center justify-between gap-2.5 select-none touch-none"
    >
      {pieces.map((piece, index) => {
        if (piece.placed) {
          // Empty placeholder slot
          return (
            <div
              key={`empty_slot_${index}`}
              className="flex-1 h-28 sm:h-32 rounded-2xl bg-[#0e1531]/40 border border-[#1a254c]/30 flex items-center justify-center opacity-25"
            >
              <div className="w-9 h-9 rounded-full border border-dashed border-slate-600/40" />
            </div>
          );
        }

        const canFit = canPieceFitAnywhere(board, piece.matrix);
        const isSelected = selectedPieceId === piece.id;
        const isDragging = draggingPieceId === piece.id;

        const rows = piece.matrix.length;
        const cols = piece.matrix[0].length;

        // Optimized cell size for crisp preview
        const maxDim = Math.max(rows, cols);
        const previewCellSize = maxDim > 3 ? 18 : maxDim === 3 ? 22 : 26;

        const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
          if (!canFit) return;
          e.preventDefault();
          const target = e.currentTarget;
          const rect = target.getBoundingClientRect();
          onDragStart(piece, e.clientX, e.clientY, rect, e.pointerType);
        };

        return (
          <div
            key={piece.id}
            onPointerDown={handlePointerDown}
            className={`flex-1 h-28 sm:h-32 rounded-2xl bg-[#111938] border transition-all duration-150 flex items-center justify-center cursor-grab active:cursor-grabbing relative overflow-hidden group touch-none select-none ${
              isSelected
                ? 'border-amber-400 ring-2 ring-amber-400/50 bg-[#162149] scale-105 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                : canFit
                ? 'border-[#22315e] hover:border-[#3b5296] hover:bg-[#152147] shadow-[0_4px_16px_rgba(0,0,0,0.4)] active:scale-95 active:bg-[#182654]'
                : 'border-[#1b2548]/40 opacity-30 grayscale-[60%] cursor-not-allowed'
            } ${isDragging ? 'opacity-20 scale-90' : ''}`}
          >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-black/20 pointer-events-none" />

            {/* Shape Grid */}
            <div
              className="grid gap-[2.5px] items-center justify-center pointer-events-none transform transition-transform group-active:scale-105"
              style={{
                gridTemplateRows: `repeat(${rows}, ${previewCellSize}px)`,
                gridTemplateColumns: `repeat(${cols}, ${previewCellSize}px)`,
              }}
            >
              {piece.matrix.map((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: `${previewCellSize}px`,
                      height: `${previewCellSize}px`,
                    }}
                  >
                    {val === 1 ? (
                      <BlockCell color={piece.color} />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
