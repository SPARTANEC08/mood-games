export type CellColor = 
  | 'yellow' 
  | 'orange' 
  | 'cyan' 
  | 'purple' 
  | 'green' 
  | 'red' 
  | 'blue' 
  | 'magenta';

export interface BlockPiece {
  id: string;
  name: string;
  matrix: number[][]; // 2D array of 0 or 1
  color: CellColor;
  placed?: boolean;
}

export type BoardGrid = (CellColor | null)[][]; // 8x8

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  combo?: number;
}

export type GameTheme = 'classic' | 'jewel' | 'cyber';
