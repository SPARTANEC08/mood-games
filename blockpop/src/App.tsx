import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BlockPiece, BoardGrid, CellColor, FloatingText, Particle } from './types';
import {
  createEmptyBoard,
  canPlacePiece,
  placePieceOnBoard,
  checkAndClearLines,
  getPlacementPoints,
  getLineClearScore,
  BOARD_SIZE,
} from './utils/board';
import { generateChallengingSolvableTrio } from './utils/smartGenerator';
import { sound } from './utils/audio';
import { yandex } from './utils/yandexGames';
import { getTranslation, Translations, Lang, getLocalizedCheer } from './utils/i18n';
import { ScoreHeader } from './components/ScoreHeader';
import { GameBoard } from './components/GameBoard';
import { PieceTray } from './components/PieceTray';
import { DragOverlay } from './components/DragOverlay';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { RulesModal } from './components/RulesModal';
import { ParticleLayer, createParticlesForCells } from './components/ParticleLayer';
import { MoodBackButton } from './components/MoodBackButton';

export default function App() {
  // Game State
  const [grid, setGrid] = useState<BoardGrid>(createEmptyBoard);
  const [trayPieces, setTrayPieces] = useState<BlockPiece[]>(() =>
    generateChallengingSolvableTrio(createEmptyBoard())
  );
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    const saved = localStorage.getItem('blockpop_best_score') || localStorage.getItem('blockblast_best_score');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [totalLinesCleared, setTotalLinesCleared] = useState<number>(0);
  const [lastCheer, setLastCheer] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [canRevive, setCanRevive] = useState<boolean>(true);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Localization & Modals
  const [lang, setLang] = useState<Lang>(() => yandex.getLang());
  const t: Translations = getTranslation(lang);
  const [isPauseOpen, setIsPauseOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  // Sync document lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const handleToggleLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('blockpop_lang', newLang);
      localStorage.setItem('blockblast_lang', newLang);
    }
  }, []);

  // Interaction State
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [draggingPiece, setDraggingPiece] = useState<BlockPiece | null>(null);
  const [ghostCells, setGhostCells] = useState<{ row: number; col: number; color: CellColor }[] | null>(null);
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Refs for zero-rerender hardware-accelerated drag with dynamic physics
  const gridRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const lastTargetKey = useRef<string>('');
  const dragPointerType = useRef<string>('touch');
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTimeRef = useRef<number>(0);
  const vxRef = useRef<number>(0);
  const vyRef = useRef<number>(0);
  const hasMovedSignificantly = useRef<boolean>(false);
  const currentPieceRect = useRef<DOMRect | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nextTextId = useRef<number>(1);

  // Measure exact grid cell size dynamically
  const [cellSize, setCellSize] = useState<number>(40);

  const updateCellSize = useCallback(() => {
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const computedCellSize = rect.width / BOARD_SIZE;
      if (computedCellSize > 10) {
        setCellSize(computedCellSize);
      }
    }
  }, []);

  useEffect(() => {
    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, [updateCellSize]);

  // Initialize Yandex Games SDK & restore cloud save
  useEffect(() => {
    yandex.init().then(({ bestScore: cloudBest, lang: detectedLang }) => {
      if (detectedLang) {
        setLang(detectedLang as Lang);
      }

      if (typeof cloudBest === 'number') {
        setBestScore((prev) => {
          const highest = Math.max(prev, cloudBest);
          localStorage.setItem('blockpop_best_score', highest.toString());
          localStorage.setItem('blockblast_best_score', highest.toString());
          return highest;
        });
      }
    });
    yandex.gameplayStart();

    const unsubPause = yandex.onPauseChange((paused) => {
      if (paused) {
        setIsPauseOpen(true);
      }
    });

    return () => {
      unsubPause();
    };
  }, []);

  // Update best score in localStorage and Yandex Cloud / Leaderboards
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      setIsNewBest(true);
      localStorage.setItem('blockpop_best_score', score.toString());
      localStorage.setItem('blockblast_best_score', score.toString());
      yandex.saveScore(score);
    }
  }, [score, bestScore]);

  // Restart Game: closes pause menu immediately and resets board
  const handleRestart = useCallback(() => {
    yandex.showFullscreenAd();
    yandex.gameplayStart();

    const freshBoard = createEmptyBoard();
    const freshPieces = generateChallengingSolvableTrio(freshBoard);
    setGrid(freshBoard);
    setTrayPieces(freshPieces);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTotalLinesCleared(0);
    setLastCheer(null);
    setGameOver(false);
    setIsPauseOpen(false);
    setIsRulesOpen(false);
    setCanRevive(true);
    setIsNewBest(false);
    setSelectedPieceId(null);
    setDraggingPiece(null);
    setGhostCells(null);
    setClearingCells(new Set());
    setFloatingTexts([]);
    particlesRef.current = [];
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none';
      overlayRef.current.style.transform = 'translate3d(-9999px, -9999px, 0)';
    }
  }, []);

  // Revive / Second Chance (watched rewarded video ad)
  const handleRevive = useCallback(() => {
    const newBoard = grid.map((row, rIdx) => {
      if (rIdx % 2 === 0 || rIdx === 3 || rIdx === 4) {
        return Array(BOARD_SIZE).fill(null);
      }
      return [...row];
    });

    const clearedCells: { row: number; col: number; color: CellColor }[] = [];
    grid.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell !== null && newBoard[rIdx][cIdx] === null) {
          clearedCells.push({ row: rIdx, col: cIdx, color: cell });
        }
      });
    });

    if (gridRef.current && clearedCells.length > 0) {
      const gridRect = gridRef.current.getBoundingClientRect();
      const newParticles = createParticlesForCells(clearedCells, gridRect);
      particlesRef.current.push(...newParticles);
    }

    setGrid(newBoard);
    setGameOver(false);
    setCanRevive(false);
    yandex.gameplayStart();
  }, [grid]);

  // Check Game Over condition
  const verifyGameOver = useCallback((currentGrid: BoardGrid, pieces: BlockPiece[]) => {
    const activePieces = pieces.filter((p) => !p.placed);
    if (activePieces.length === 0) return;

    let anyPlaceable = false;
    for (const p of activePieces) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (canPlacePiece(currentGrid, p.matrix, r, c)) {
            anyPlaceable = true;
            break;
          }
        }
        if (anyPlaceable) break;
      }
      if (anyPlaceable) break;
    }

    if (!anyPlaceable) {
      setTimeout(() => {
        sound.playGameOver();
        yandex.gameplayStop();
        setGameOver(true);
        yandex.showFullscreenAd();
      }, 350);
    }
  }, []);

  // Execute placement on board
  const executePlacement = useCallback(
    (piece: BlockPiece, targetRow: number, targetCol: number) => {
      if (!canPlacePiece(grid, piece.matrix, targetRow, targetCol)) {
        return false;
      }

      // 1. Play place sound
      sound.playPlace();

      // 2. Mark piece placed in tray
      const updatedPieces = trayPieces.map((p) =>
        p.id === piece.id ? { ...p, placed: true } : p
      );

      // 3. Place block on board
      const newGrid = placePieceOnBoard(grid, piece.matrix, targetRow, targetCol, piece.color);

      // Add placement score
      let roundScore = getPlacementPoints(piece.matrix);

      // 4. Check line clears
      const clearResult = checkAndClearLines(newGrid);

      if (clearResult.totalLines > 0) {
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        setMaxCombo((prev) => Math.max(prev, nextCombo));
        setTotalLinesCleared((prev) => prev + clearResult.totalLines);

        const cheer = getLocalizedCheer(clearResult.totalLines, nextCombo, lang);
        setLastCheer(cheer);

        const lineScore = getLineClearScore(clearResult.totalLines, nextCombo);
        roundScore += lineScore;

        sound.playLineClear(clearResult.totalLines, nextCombo);
        if (nextCombo > 1) {
          sound.playComboFanfare(nextCombo);
        }

        // Camera shake
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 240);

        // Flash cells
        const clearingKeys = new Set(
          clearResult.clearedCells.map((c) => `${c.row},${c.col}`)
        );
        setClearingCells(clearingKeys);

        // Spawn particles
        if (gridRef.current) {
          const gridRect = gridRef.current.getBoundingClientRect();
          const newParticles = createParticlesForCells(clearResult.clearedCells, gridRect);
          particlesRef.current.push(...newParticles);
        }

        // Add Floating Text
        const avgRow =
          clearResult.clearedCells.reduce((sum, c) => sum + c.row, 0) /
          clearResult.clearedCells.length;
        const avgCol =
          clearResult.clearedCells.reduce((sum, c) => sum + c.col, 0) /
          clearResult.clearedCells.length;

        const floatX = (avgCol + 0.5) * 12.5;
        const floatY = (avgRow + 0.5) * 12.5;

        const newText: FloatingText = {
          id: nextTextId.current++,
          text: `+${lineScore}${nextCombo > 1 ? ` x${nextCombo}` : ''}`,
          x: Math.max(20, Math.min(80, floatX)),
          y: Math.max(20, Math.min(80, floatY)),
          color: nextCombo > 1 ? '#fbbf24' : '#22d3ee',
          scale: 1,
          combo: nextCombo,
        };

        setFloatingTexts((prev) => [...prev, newText]);
        setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== newText.id));
        }, 850);

        // Delay clearing flash to render explosion
        setTimeout(() => {
          setClearingCells(new Set());
          setGrid(clearResult.newBoard);

          const remaining = updatedPieces.filter((p) => !p.placed);
          if (remaining.length === 0) {
            const nextTrio = generateChallengingSolvableTrio(clearResult.newBoard);
            setTrayPieces(nextTrio);
            verifyGameOver(clearResult.newBoard, nextTrio);
          } else {
            setTrayPieces(updatedPieces);
            verifyGameOver(clearResult.newBoard, updatedPieces);
          }
        }, 160);
      } else {
        setCombo(0);
        setLastCheer(null);
        setGrid(newGrid);

        const remaining = updatedPieces.filter((p) => !p.placed);
        if (remaining.length === 0) {
          const nextTrio = generateChallengingSolvableTrio(newGrid);
          setTrayPieces(nextTrio);
          verifyGameOver(newGrid, nextTrio);
        } else {
          setTrayPieces(updatedPieces);
          verifyGameOver(newGrid, updatedPieces);
        }
      }

      setScore((prev) => prev + roundScore);
      setSelectedPieceId(null);
      setGhostCells(null);
      return true;
    },
    [grid, trayPieces, combo, lang, verifyGameOver]
  );

  // Smart placement calculation with generous magnetic snapping and edge assistance
  const calculateTargetPlacement = useCallback(
    (piece: BlockPiece, clientX: number, clientY: number) => {
      if (!gridRef.current) return null;
      const gridRect = gridRef.current.getBoundingClientRect();
      const cellStep = gridRect.width / BOARD_SIZE;

      const pieceCols = piece.matrix[0].length;
      const pieceRows = piece.matrix.length;
      const pieceWidth = pieceCols * cellStep;
      const pieceHeight = pieceRows * cellStep;

      // Ergonomic vertical offset:
      // Touch: lifted so bottom of piece is comfortably 36px above thumb
      // Mouse: centered or slightly above cursor for PC precision
      const isTouch = dragPointerType.current === 'touch' || dragPointerType.current === 'pen';
      const offsetY = isTouch ? pieceHeight / 2 + 36 : 14;

      const pieceLeft = clientX - pieceWidth / 2;
      const pieceTop = clientY - pieceHeight / 2 - offsetY;

      // Board grid relative continuous coordinates
      const contCol = (pieceLeft - gridRect.left) / cellStep;
      const contRow = (pieceTop - gridRect.top) / cellStep;

      // Base rounded integer coordinates
      const r0 = Math.round(contRow);
      const c0 = Math.round(contCol);

      let targetPlacement: { row: number; col: number } | null = null;
      let minDistance = Infinity;

      // 1. Direct placement check
      if (canPlacePiece(grid, piece.matrix, r0, c0)) {
        targetPlacement = { row: r0, col: c0 };
        minDistance = Math.hypot(r0 - contRow, c0 - contCol);
      }

      // 2. Generous magnetic tolerance: search surrounding neighbors within ~1.35 cells
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const cr = r0 + dr;
          const cc = c0 + dc;
          if (
            cr >= 0 &&
            cr + pieceRows <= BOARD_SIZE &&
            cc >= 0 &&
            cc + pieceCols <= BOARD_SIZE
          ) {
            if (canPlacePiece(grid, piece.matrix, cr, cc)) {
              const dist = Math.hypot(cr - contRow, cc - contCol);
              if (dist < 1.35 && dist < minDistance) {
                minDistance = dist;
                targetPlacement = { row: cr, col: cc };
              }
            }
          }
        }
      }

      // 3. Clamped edge magnet: if player dragged near outer borders, snap directly to edge
      const clampedR = Math.max(0, Math.min(BOARD_SIZE - pieceRows, r0));
      const clampedC = Math.max(0, Math.min(BOARD_SIZE - pieceCols, c0));
      if (canPlacePiece(grid, piece.matrix, clampedR, clampedC)) {
        const dist = Math.hypot(clampedR - contRow, clampedC - contCol);
        if (dist < 1.45 && dist < minDistance) {
          minDistance = dist;
          targetPlacement = { row: clampedR, col: clampedC };
        }
      }

      return {
        pieceLeft,
        pieceTop,
        cellStep,
        gridRect,
        targetRow: targetPlacement?.row ?? null,
        targetCol: targetPlacement?.col ?? null,
        canPlace: targetPlacement !== null,
      };
    },
    [grid]
  );

  // Drag Start handler: immediately positions overlay at touch location with zero delay
  const handleDragStart = useCallback(
    (
      piece: BlockPiece,
      clientX: number,
      clientY: number,
      pieceRect?: DOMRect,
      pointerType: string = 'touch'
    ) => {
      dragPointerType.current = pointerType;
      dragStartPos.current = { x: clientX, y: clientY };
      lastPosRef.current = { x: clientX, y: clientY };
      lastTimeRef.current = performance.now();
      vxRef.current = 0;
      vyRef.current = 0;
      hasMovedSignificantly.current = false;
      currentPieceRect.current = pieceRect || null;

      sound.playPickup();
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch (_) {}
      }

      setDraggingPiece(piece);
      setSelectedPieceId(piece.id);
      lastTargetKey.current = '';

      // Position overlay immediately and synchronously at touch point
      const target = calculateTargetPlacement(piece, clientX, clientY);
      if (target && overlayRef.current) {
        overlayRef.current.style.transition = 'none';
        overlayRef.current.style.opacity = '1';
        overlayRef.current.style.display = 'block';
        overlayRef.current.style.transform = `translate3d(${target.pieceLeft}px, ${target.pieceTop}px, 0)`;

        if (innerRef.current) {
          innerRef.current.style.transition = 'transform 0.12s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
          innerRef.current.style.transform = 'scale(1.06) rotate(0deg)';
          innerRef.current.style.filter = 'drop-shadow(0 16px 28px rgba(0,0,0,0.6))';
        }

        if (target.canPlace && target.targetRow !== null && target.targetCol !== null) {
          lastTargetKey.current = `${target.targetRow},${target.targetCol}`;
          const ghosts: { row: number; col: number; color: CellColor }[] = [];
          piece.matrix.forEach((rArr, rIdx) => {
            rArr.forEach((val, cIdx) => {
              if (val === 1) {
                ghosts.push({
                  row: target.targetRow! + rIdx,
                  col: target.targetCol! + cIdx,
                  color: piece.color,
                });
              }
            });
          });
          setGhostCells(ghosts);
        } else {
          setGhostCells(null);
        }
      }
    },
    [calculateTargetPlacement]
  );

  // Dynamic velocity physics & responsive drag with magnetic snap and tilt
  useEffect(() => {
    if (!draggingPiece) return;

    let rafId: number | null = null;
    let latestX = lastPosRef.current.x;
    let latestY = lastPosRef.current.y;

    const applyMove = (clientX: number, clientY: number) => {
      const now = performance.now();
      const dt = Math.max(8, now - lastTimeRef.current);
      const dx = clientX - lastPosRef.current.x;
      const dy = clientY - lastPosRef.current.y;
      const instantVx = dx / dt;
      const instantVy = dy / dt;
      lastTimeRef.current = now;
      lastPosRef.current = { x: clientX, y: clientY };

      // Check if finger moved beyond tap threshold (6px)
      if (
        !hasMovedSignificantly.current &&
        Math.hypot(clientX - dragStartPos.current.x, clientY - dragStartPos.current.y) > 6
      ) {
        hasMovedSignificantly.current = true;
      }

      // Smooth velocity tracking (low pass filter)
      vxRef.current = vxRef.current * 0.65 + instantVx * 0.35;
      vyRef.current = vyRef.current * 0.65 + instantVy * 0.35;

      const target = calculateTargetPlacement(draggingPiece, clientX, clientY);
      if (!target) return;

      let drawX = target.pieceLeft;
      let drawY = target.pieceTop;

      // Tactile magnetic snap pull when near valid placement
      if (target.canPlace && target.targetRow !== null && target.targetCol !== null && gridRef.current) {
        const snapX = target.gridRect.left + target.targetCol * target.cellStep;
        const snapY = target.gridRect.top + target.targetRow * target.cellStep;
        drawX += (snapX - drawX) * 0.28;
        drawY += (snapY - drawY) * 0.28;
      }

      // 1. Direct instantaneous hardware transform on overlay container (ZERO LAG)
      if (overlayRef.current) {
        overlayRef.current.style.display = 'block';
        overlayRef.current.style.transform = `translate3d(${drawX}px, ${drawY}px, 0)`;
      }

      // 2. Velocity-responsive physical dynamics (tilt, stretch, dynamic elevation shadow)
      if (innerRef.current) {
        const speed = Math.hypot(vxRef.current, vyRef.current);
        const tilt = Math.max(-7.5, Math.min(7.5, vxRef.current * 4.2));
        const scale = target.canPlace ? 1.03 : 1.06 + Math.min(0.06, speed * 0.03);
        const shadowY = 14 + Math.min(14, speed * 8);
        const shadowBlur = 22 + Math.min(16, speed * 10);
        const brightness = target.canPlace ? 'brightness(1.08)' : 'brightness(1.0)';
        innerRef.current.style.transform = `rotate(${tilt}deg) scale(${scale})`;
        innerRef.current.style.filter = `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.62)) ${brightness}`;
      }

      // 3. Update ghost cells on board when snapped location changes
      const key =
        target.canPlace && target.targetRow !== null && target.targetCol !== null
          ? `${target.targetRow},${target.targetCol}`
          : '';

      if (key !== lastTargetKey.current) {
        lastTargetKey.current = key;
        if (key && target.targetRow !== null && target.targetCol !== null) {
          const ghosts: { row: number; col: number; color: CellColor }[] = [];
          draggingPiece.matrix.forEach((rArr, rIdx) => {
            rArr.forEach((val, cIdx) => {
              if (val === 1) {
                ghosts.push({
                  row: target.targetRow! + rIdx,
                  col: target.targetCol! + cIdx,
                  color: draggingPiece.color,
                });
              }
            });
          });
          setGhostCells(ghosts);
          if ('vibrate' in navigator) {
            try {
              navigator.vibrate(8);
            } catch (_) {}
          }
        } else {
          setGhostCells(null);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      latestX = e.clientX;
      latestY = e.clientY;
      applyMove(latestX, latestY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      // Check if it was merely a tap on the piece in the tray
      if (!hasMovedSignificantly.current) {
        if (overlayRef.current) {
          overlayRef.current.style.display = 'none';
          overlayRef.current.style.transform = 'translate3d(-9999px, -9999px, 0)';
        }
        setDraggingPiece(null);
        setGhostCells(null);
        lastTargetKey.current = '';
        sound.playPickup();
        setSelectedPieceId((prev) => (prev === draggingPiece.id ? null : draggingPiece.id));
        return;
      }

      const target = calculateTargetPlacement(draggingPiece, e.clientX, e.clientY);
      if (
        target &&
        target.canPlace &&
        target.targetRow !== null &&
        target.targetCol !== null
      ) {
        // Successful drop on board
        executePlacement(draggingPiece, target.targetRow, target.targetCol);
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate(15);
          } catch (_) {}
        }
        if (overlayRef.current) {
          overlayRef.current.style.display = 'none';
          overlayRef.current.style.transform = 'translate3d(-9999px, -9999px, 0)';
        }
        setDraggingPiece(null);
        setGhostCells(null);
        lastTargetKey.current = '';
      } else {
        // Invalid drop: smooth snap-back animation to tray slot (Block Blast style)
        setGhostCells(null);
        if (currentPieceRect.current && overlayRef.current) {
          const slotRect = currentPieceRect.current;
          const returnX = slotRect.left + (slotRect.width - overlayRef.current.offsetWidth) / 2;
          const returnY = slotRect.top + (slotRect.height - overlayRef.current.offsetHeight) / 2;
          overlayRef.current.style.transition = 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.18s ease-out';
          overlayRef.current.style.transform = `translate3d(${returnX}px, ${returnY}px, 0) scale(0.65)`;
          overlayRef.current.style.opacity = '0.3';
          if (innerRef.current) {
            innerRef.current.style.transform = 'rotate(0deg) scale(0.9)';
          }
          setTimeout(() => {
            if (overlayRef.current) {
              overlayRef.current.style.display = 'none';
              overlayRef.current.style.transition = 'none';
              overlayRef.current.style.opacity = '1';
              overlayRef.current.style.transform = 'translate3d(-9999px, -9999px, 0)';
            }
            setDraggingPiece(null);
            lastTargetKey.current = '';
          }, 180);
        } else {
          if (overlayRef.current) {
            overlayRef.current.style.display = 'none';
            overlayRef.current.style.transform = 'translate3d(-9999px, -9999px, 0)';
          }
          setDraggingPiece(null);
          lastTargetKey.current = '';
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [draggingPiece, calculateTargetPlacement, executePlacement]);

  // Click on Board Cell (for Tap-to-Place accessibility)
  const handleBoardCellClick = (row: number, col: number) => {
    if (!selectedPieceId) return;
    const piece = trayPieces.find((p) => p.id === selectedPieceId && !p.placed);
    if (!piece) return;

    if (canPlacePiece(grid, piece.matrix, row, col)) {
      executePlacement(piece, row, col);
    } else {
      const rows = piece.matrix.length;
      const cols = piece.matrix[0].length;
      const centeredRow = row - Math.floor(rows / 2);
      const centeredCol = col - Math.floor(cols / 2);
      if (canPlacePiece(grid, piece.matrix, centeredRow, centeredCol)) {
        executePlacement(piece, centeredRow, centeredCol);
      }
    }
  };

  // Select piece handler
  const handlePieceSelect = (piece: BlockPiece) => {
    sound.playPickup();
    setSelectedPieceId((prev) => (prev === piece.id ? null : piece.id));
  };

  return (
    <main className="fixed inset-0 w-full h-full bg-[#080d21] flex flex-col items-center justify-between select-none touch-none overflow-hidden">
      {/* Particle Blast Layer */}
      <ParticleLayer particlesRef={particlesRef} />

      {/* GPU Accelerated Dragging Piece Floating Overlay */}
      <DragOverlay
        piece={draggingPiece}
        cellSize={cellSize}
        overlayRef={overlayRef}
        innerRef={innerRef}
      />

      {/* Centered responsive container that always fits viewport without distortion */}
      <div className="w-full max-w-[440px] h-full flex flex-col items-center justify-between mx-auto py-2 px-3">
        {/* Game Header */}
        <div className="w-full flex flex-col items-center flex-shrink-0">
          <ScoreHeader
            score={score}
            bestScore={bestScore}
            combo={combo}
            lastCheer={lastCheer}
            t={t}
            onOpenPause={() => setIsPauseOpen(true)}
            onOpenRules={() => setIsRulesOpen(true)}
          />
        </div>

        {/* 8x8 Board Container */}
        <div className="my-auto flex items-center justify-center flex-shrink-0">
          <GameBoard
            grid={grid}
            ghostCells={ghostCells}
            clearingCells={clearingCells}
            floatingTexts={floatingTexts}
            gridRef={gridRef}
            isShaking={isShaking}
            onCellClick={handleBoardCellClick}
          />
        </div>

        {/* Bottom Piece Tray */}
        <div className="w-full flex flex-col items-center flex-shrink-0 pb-1">
          <PieceTray
            pieces={trayPieces}
            board={grid}
            selectedPieceId={selectedPieceId}
            draggingPieceId={draggingPiece?.id || null}
            onPieceSelect={handlePieceSelect}
            onDragStart={handleDragStart}
          />
        </div>

        {/* Возврат в Mood — маленькая кнопка в самом низу экрана */}
        <div className="mt-1 flex w-full shrink-0 items-center justify-center pb-[max(2px,env(safe-area-inset-bottom))]">
          <MoodBackButton />
        </div>
      </div>

      {/* Pause Modal */}
      <PauseModal
        isOpen={isPauseOpen && !gameOver}
        t={t}
        currentLang={lang}
        isMuted={sound.isMuted()}
        onResume={() => setIsPauseOpen(false)}
        onRestart={handleRestart}
        onToggleSound={() => sound.toggleMute()}
        onToggleLang={handleToggleLang}
        onOpenRules={() => {
          setIsPauseOpen(false);
          setIsRulesOpen(true);
        }}
      />

      {/* Rules & Tutorial Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        t={t}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameOver}
        score={score}
        bestScore={bestScore}
        maxCombo={maxCombo}
        linesCleared={totalLinesCleared}
        isNewBest={isNewBest}
        canRevive={canRevive}
        t={t}
        onRevive={handleRevive}
        onRestart={handleRestart}
      />
    </main>
  );
}
