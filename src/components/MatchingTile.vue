<!-- src/components/MatchingTile.vue -->
<template>
  <div
    class="tile"
    :class="{
      revealed: tile.isRevealed || tile.isMatched,
      matched: tile.isMatched
    }"
    @click="handleClick"
  >
    <span v-if="tile.isRevealed || tile.isMatched">{{ tile.value }}</span>
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from "vue";
import type { Tile } from "@/types";

const props = defineProps<{
  tile: Tile;
  onSelect: (tile: Tile) => void;
}>();

function handleClick() {
  props.onSelect(props.tile);
}
</script>

<style scoped>
.tile {
  width: 60px;
  height: 60px;
  background-color: #444;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  font-size: 1.25rem;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s, color 0.3s;
}

.tile.revealed {
  background-color: #fff;
  color: #333;
}

.tile.matched {
  background-color: #3cb371;
  color: #fff;
  cursor: default;
}
</style>
