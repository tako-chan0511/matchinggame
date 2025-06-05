// src/composables/useMatchingGame.ts
import { ref, computed } from "vue";
import type { Tile } from "@/types";

// 2∼10 の範囲を受け取るようにする
export function useMatchingGame(rows: number = 6, cols: number = 6) {
  console.log(`[useMatchingGame] new instance → rows=${rows}, cols=${cols}`);
  const tiles = ref<Tile[]>([]);
  const firstSelected = ref<Tile | null>(null);
  const secondSelected = ref<Tile | null>(null);
  const lockBoard = ref<boolean>(false); // 2 枚開いたあとの待ち時間中は操作を無効化
  const moveCount = ref<number>(0);

  /** 盤面を初期化（rows×cols 枚作ってシャッフル） */
  function initGame() {
    // ペア数は (rows*cols)/2、必ず rows*cols は偶数になるように caller で保証する
    const pairCount = (rows * cols) / 2;
    // 1～pairCount の数字をそれぞれ 2 枚ずつ作成 → 合計 rows*cols 枚
    const values: number[] = [];
    for (let v = 1; v <= pairCount; v++) {
      values.push(v, v);
    }
    // 配列を Fisher–Yates シャッフル
    for (let i = values.length - 1; i >= 1; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    // Tile オブジェクト配列を作成
    const arr: Tile[] = values.map((val, idx) => ({
      id: idx,
      value: val,
      isRevealed: false,
      isMatched: false,
    }));
    tiles.value = arr;
    // 変数クリア
    firstSelected.value = null;
    secondSelected.value = null;
    moveCount.value = 0;
    lockBoard.value = false;
  }

  /** タイルをクリックしたときの処理 */
  function selectTile(tile: Tile) {
    if (lockBoard.value) return;
    if (tile.isRevealed || tile.isMatched) return;

    tile.isRevealed = true;

    if (!firstSelected.value) {
      // １枚目の選択
      firstSelected.value = tile;
      return;
    }

    // 2 枚目の選択
    secondSelected.value = tile;
    lockBoard.value = true; // 判定待ち
    moveCount.value++;      // 1 ターンとしてカウント

    // 短時間（500ms）おいてからマッチ判定 & board のロック解除
    setTimeout(() => {
      if (
        firstSelected.value &&
        secondSelected.value &&
        firstSelected.value.value === secondSelected.value.value
      ) {
        // マッチ成功
        firstSelected.value.isMatched = true;
        secondSelected.value.isMatched = true;
      } else {
        // マッチ失敗 → 両方を非表示に戻す
        if (firstSelected.value) firstSelected.value.isRevealed = false;
        if (secondSelected.value) secondSelected.value.isRevealed = false;
      }
      // 次のターンに備えてリセット
      firstSelected.value = null;
      secondSelected.value = null;
      lockBoard.value = false;
    }, 500);
  }

  /** すべてマッチ済みかどうか */
  const isCleared = computed(() => {
    return tiles.value.every((t) => t.isMatched);
  });

  /** 現在の moveCount を返す */
  const moves = computed(() => moveCount.value);

  // 初期化を自動実行
  initGame();

  return {
    tiles,
    selectTile,
    isCleared,
    moves,
    initGame,
  };
}
