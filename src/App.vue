<!-- src/App.vue -->
<template>
  <div id="app">
    <header class="app-header">
      <h1>Matching Game(vue3)</h1>
    </header>

    <!-- 操作パネル -->
    <GameControls
      :initRows="rows"
      :initCols="cols"
      @update-size="handleUpdateSize"
      @shuffle-requested="handleShuffle"
      @peek-requested="handlePeek"
    />

    <!-- ステータスバー（ターン数・ペア獲得数）-->
    <div class="status-bar">
      <p>ターン数：{{ game.moves }}</p>
      <p>ペア獲得数：{{ matchedPairs }} / {{ (rows * cols) / 2 }}</p>
      <p v-if="game.isCleared" class="clear-notice">
        🎉 クリアしました！ 合計ターン数：{{ game.moves }} 🎉
      </p>
    </div>

    <!-- 盤面コンポーネントには「key」で強制再マウントをかける -->
    <MatchingBoard
      :key="boardKey"
      :rows="rows"
      :cols="cols"
      :tiles="game.tiles"
      :onSelect="handleSelect"
      :isCleared="game.isCleared"
      :moves="game.moves"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { useMatchingGame } from "@/composables/useMatchingGame";
import GameControls from "@/components/GameControls.vue";
import MatchingBoard from "@/components/MatchingBoard.vue";

//
// 1) 行数・列数を ref で管理（初期は 4×4）
//
const rows = ref<number>(4);
const cols = ref<number>(4);

//
// 2) useMatchingGame(rows, cols) を ref でラップして保持
//
const game = ref(useMatchingGame(rows.value, cols.value));

//
// 3) 「再マウント用キー」を ref で管理
//    → 初期キーは 6×6 に現在時刻を足したもの
//
const boardKey = ref<string>(`${rows.value}x${cols.value}-${Date.now()}`);

//
// 4) rows or cols が変わったら、
//    （a）game.value を新しいインスタンスで置き換え
//    （b）boardKey を更新して MatchingBoard を再マウント
//
watch(
  [rows, cols],
  ([newR, newC]) => {
    console.log(`[App.vue] watch() → new size: ${newR}×${newC}`);
    game.value = useMatchingGame(newR, newC);
    boardKey.value = `${newR}x${newC}-${Date.now()}`;
  },
  { immediate: false }
);

//
// 5) マッチ済みペア数を computed で算出
//
const matchedPairs = computed(() => {
  const matchedTiles = game.value.tiles.filter((t) => t.isMatched).length;
  return Math.floor(matchedTiles / 2);
});

//
// 6) 各ハンドラ
//

/** サイズ変更イベント */
function handleUpdateSize(payload: { rows: number; cols: number }) {
  console.log("[App.vue] handleUpdateSize →", payload);
  rows.value = payload.rows;
  cols.value = payload.cols;
  // watchの中で自動的に game と boardKey が更新される
}

/** シャッフルイベント */
function handleShuffle() {
  console.log("[App.vue] handleShuffle()");
  // 「同じ rows×cols で新インスタンスを生成＆再マウント」させる
  game.value = useMatchingGame(rows.value, cols.value);
  boardKey.value = `${rows.value}x${cols.value}-${Date.now()}`;
}

/** チラ見イベント */
function handlePeek() {
  console.log("[App.vue] handlePeek()");
  game.value.tiles.forEach((t) => {
    if (!t.isMatched) t.isRevealed = true;
  });
  setTimeout(() => {
    game.value.tiles.forEach((t) => {
      if (!t.isMatched) t.isRevealed = false;
    });
  }, 5000);
}

/** タイルクリック時 */
function handleSelect(tile: any) {
  if (!game.value.isCleared) {
    game.value.selectTile(tile);
  }
}
</script>

<style>
#app {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  font-family: Arial, sans-serif;
}
.app-header {
  margin-bottom: 1rem;
}
.status-bar {
  margin-top: 0.75rem;
  line-height: 1.5;
}
.clear-notice {
  color: #1e90ff;
  font-weight: bold;
  margin-top: 0.5rem;
}
</style>
