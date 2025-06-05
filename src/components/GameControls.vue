<!-- src/components/GameControls.vue -->
<template>
  <div class="controls">
    <label>
      行数 (Rows):
      <input
        type="number"
        v-model.number="r"
        min="2"
        max="10"
        @change="clearError"
      />
    </label>
    <label>
      列数 (Cols):
      <input
        type="number"
        v-model.number="c"
        min="2"
        max="10"
        @change="clearError"
      />
    </label>
    <button @click="applySize">サイズ反映</button>
    <button @click="onShuffle">
      <!-- ここを押したらログが出るはず -->
      シャッフル
    </button>
    <button @click="onPeek">
      <!-- ここを押したらログが出るはず -->
      チラ見
    </button>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, defineEmits, defineProps } from "vue";

const props = defineProps<{
  initRows: number;
  initCols: number;
}>();

const emits = defineEmits<{
  (e: "updateSize", payload: { rows: number; cols: number }): void;
  (e: "shuffleRequested"): void;
  (e: "peekRequested"): void;
}>();

const r = ref<number>(props.initRows);
const c = ref<number>(props.initCols);
const errorMsg = ref<string>("");

function clearError() {
  errorMsg.value = "";
}

function applySize() {
  if (
    !Number.isInteger(r.value) ||
    !Number.isInteger(c.value) ||
    r.value < 2 ||
    c.value < 2 ||
    r.value > 10 ||
    c.value > 10 ||
    (r.value * c.value) % 2 !== 0
  ) {
    errorMsg.value =
      "行数・列数は 2〜10 の整数で、合計マスは偶数にしてください。";
    return;
  }
  console.log("[GameControls] applySize が呼ばれました → emit updateSize", {
    rows: r.value,
    cols: c.value,
  });
  emits("updateSize", { rows: r.value, cols: c.value });
}

function onShuffle() {
  console.log(
    "[GameControls] onShuffle が呼ばれました → emit shuffleRequested"
  );
  emits("shuffleRequested");
}

function onPeek() {
  console.log("[GameControls] onPeek が呼ばれました → emit peekRequested");
  emits("peekRequested");
}
</script>

<style scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
}

label {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

input[type="number"] {
  width: 4rem;
  text-align: center;
}

button {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.error {
  width: 100%;
  color: red;
  margin-top: 0.5rem;
}
</style>
