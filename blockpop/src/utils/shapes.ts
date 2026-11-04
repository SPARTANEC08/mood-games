import { BlockPiece, CellColor } from '../types';

interface ShapeTemplate {
  name: string;
  matrix: number[][];
  color: CellColor;
  weight: number; // probability weight
}

export const SHAPE_TEMPLATES: ShapeTemplate[] = [
  // 1x1
  {
    name: 'dot',
    matrix: [[1]],
    color: 'yellow',
    weight: 8,
  },

  // 2x1 and 1x2
  {
    name: 'domino_h',
    matrix: [[1, 1]],
    color: 'cyan',
    weight: 10,
  },
  {
    name: 'domino_v',
    matrix: [[1], [1]],
    color: 'cyan',
    weight: 10,
  },

  // 3x1 and 1x3
  {
    name: 'triomino_h',
    matrix: [[1, 1, 1]],
    color: 'green',
    weight: 9,
  },
  {
    name: 'triomino_v',
    matrix: [[1], [1], [1]],
    color: 'green',
    weight: 9,
  },

  // 4x1 and 1x4
  {
    name: 'tetromino_h',
    matrix: [[1, 1, 1, 1]],
    color: 'blue',
    weight: 7,
  },
  {
    name: 'tetromino_v',
    matrix: [[1], [1], [1], [1]],
    color: 'blue',
    weight: 7,
  },

  // 5x1 and 1x5
  {
    name: 'pentomino_h',
    matrix: [[1, 1, 1, 1, 1]],
    color: 'red',
    weight: 4,
  },
  {
    name: 'pentomino_v',
    matrix: [[1], [1], [1], [1], [1]],
    color: 'red',
    weight: 4,
  },

  // 2x2 square
  {
    name: 'square_2x2',
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: 'yellow',
    weight: 9,
  },

  // 3x3 square (rare big piece)
  {
    name: 'square_3x3',
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    color: 'magenta',
    weight: 2,
  },

  // Corner 2x2 (3 cells)
  {
    name: 'corner_tl',
    matrix: [
      [1, 1],
      [1, 0],
    ],
    color: 'orange',
    weight: 8,
  },
  {
    name: 'corner_tr',
    matrix: [
      [1, 1],
      [0, 1],
    ],
    color: 'orange',
    weight: 8,
  },
  {
    name: 'corner_bl',
    matrix: [
      [1, 0],
      [1, 1],
    ],
    color: 'orange',
    weight: 8,
  },
  {
    name: 'corner_br',
    matrix: [
      [0, 1],
      [1, 1],
    ],
    color: 'orange',
    weight: 8,
  },

  // Corner 3x3 (5 cells)
  {
    name: 'corner_big_tl',
    matrix: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
    ],
    color: 'purple',
    weight: 4,
  },
  {
    name: 'corner_big_tr',
    matrix: [
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
    ],
    color: 'purple',
    weight: 4,
  },
  {
    name: 'corner_big_bl',
    matrix: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: 'purple',
    weight: 4,
  },
  {
    name: 'corner_big_br',
    matrix: [
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: 'purple',
    weight: 4,
  },

  // L-Shapes (4 cells)
  {
    name: 'L_up',
    matrix: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    color: 'blue',
    weight: 7,
  },
  {
    name: 'L_down',
    matrix: [
      [1, 1],
      [0, 1],
      [0, 1],
    ],
    color: 'blue',
    weight: 7,
  },
  {
    name: 'L_flat_1',
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: 'blue',
    weight: 7,
  },
  {
    name: 'L_flat_2',
    matrix: [
      [1, 1, 1],
      [1, 0, 0],
    ],
    color: 'blue',
    weight: 7,
  },

  // J-Shapes (4 cells)
  {
    name: 'J_up',
    matrix: [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
    color: 'green',
    weight: 7,
  },
  {
    name: 'J_down',
    matrix: [
      [1, 1],
      [1, 0],
      [1, 0],
    ],
    color: 'green',
    weight: 7,
  },
  {
    name: 'J_flat_1',
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: 'green',
    weight: 7,
  },
  {
    name: 'J_flat_2',
    matrix: [
      [1, 1, 1],
      [0, 0, 1],
    ],
    color: 'green',
    weight: 7,
  },

  // T-Shapes (4 cells)
  {
    name: 'T_up',
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: 'magenta',
    weight: 6,
  },
  {
    name: 'T_down',
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: 'magenta',
    weight: 6,
  },
  {
    name: 'T_left',
    matrix: [
      [0, 1],
      [1, 1],
      [0, 1],
    ],
    color: 'magenta',
    weight: 6,
  },
  {
    name: 'T_right',
    matrix: [
      [1, 0],
      [1, 1],
      [1, 0],
    ],
    color: 'magenta',
    weight: 6,
  },

  // Z & S shapes (4 cells)
  {
    name: 'Z_h',
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: 'red',
    weight: 6,
  },
  {
    name: 'Z_v',
    matrix: [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    color: 'red',
    weight: 6,
  },
  {
    name: 'S_h',
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: 'green',
    weight: 6,
  },
  {
    name: 'S_v',
    matrix: [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    color: 'green',
    weight: 6,
  },

  // Plus / Cross shape
  {
    name: 'plus',
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: 'cyan',
    weight: 3,
  },
];

let pieceCounter = 0;

/**
 * Weighted random selection of a shape template
 */
export function getRandomShapeTemplate(): ShapeTemplate {
  const totalWeight = SHAPE_TEMPLATES.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of SHAPE_TEMPLATES) {
    if (random < item.weight) {
      return item;
    }
    random -= item.weight;
  }
  return SHAPE_TEMPLATES[0];
}

/**
 * Generate 3 random shapes for the player's tray
 */
export function generateShapeTrio(): BlockPiece[] {
  return [0, 1, 2].map(() => {
    const template = getRandomShapeTemplate();
    pieceCounter++;
    return {
      id: `piece_${pieceCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: template.name,
      matrix: template.matrix,
      color: template.color,
      placed: false,
    };
  });
}
