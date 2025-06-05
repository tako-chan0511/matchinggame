<!-- src/components/MatchingBoard.vue -->
<template>
  <div class="board-wrapper">
    <div
      class="board-grid"
      :style="{
        '--rows': rows,
        '--cols': cols
      }"
    >
      <MatchingTile
        v-for="tile in tiles"
        :key="tile.id"
        :tile="tile"
        :onSelect="onSelect"
      />
    </div>
    <p v-if="isCleared" class="cleared-message">
      🎉 クリア！ ターン数：{{ moves }} 回 🎉
    </p>
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from "vue";
import MatchingTile from "./MatchingTile.vue";
import type { Tile } from "@/types";

const props = defineProps<{
  rows: number;
  cols: number;
  tiles: Tile[];
  onSelect: (tile: Tile) => void;
  isCleared: boolean;
  moves: number;
}>();

// すべて props から渡ってくるので、中に特にロジックはなし
const rows = props.rows;
const cols = props.cols;
const tiles = props.tiles;
const onSelect = props.onSelect;
const isCleared = props.isCleared;
const moves = props.moves;
</script>

<style scoped>
.board-wrapper {
  margin-top: 1rem;
  /* グリッドを縦中央に寄せたい場合は高さを指定し、以下を追加 */
  display: flex; 
  /* justify-content: center; */
  /* align-items: center; */
  /* height: 80vh; */
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  gap: 8px;
  max-width: 90vw;
  margin: 0 auto;
}

.cleared-message {
  margin-top: 1rem;
  text-align: center;
  font-size: 1.2rem;
  color: #ff6347;
  font-weight: bold;
}
</style>
