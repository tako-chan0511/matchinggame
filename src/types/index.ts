// src/types/index.ts

export interface Tile {
  id: number;       // 一意の ID（0 ～ rows*cols-1）
  value: number;    // 1 ～ (rows*cols/2)、ペアごとに同じ数字
  isRevealed: boolean; // 表示中 (true) か隠れている (false) か
  isMatched: boolean;  // すでにペア成立しているかどうか
}
