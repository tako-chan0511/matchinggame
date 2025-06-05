# 1. 技術スタックとプロジェクト構成

- **Vue 3 + Composition API**  
  単一ファイルコンポーネント（`*.vue`）を使い、`<script setup>` でロジックを記述。  
  主要な状態（タイル配列やターン数など）は Composition API の `ref`/`computed` を利用してリアクティブに管理。

- **Vite + TypeScript**  
  超高速なビルド・ホットリロード環境を提供する Vite 上で開発。  
  TypeScript をフル活用し、Tile 型などを定義して型安全に実装。

## コンポーネント構成

- **App.vue**  
  画面全体の管理と状態保持（`rows`/`cols`、`useMatchingGame` のインスタンス管理、各種ハンドラ）。
- **GameControls.vue**  
  上部の「サイズ変更」「シャッフル」「チラ見」ボタン群。  
  ボタンのクリックでそれぞれ親コンポーネントにイベントを `$emit` して通知するだけ。
- **MatchingBoard.vue**  
  実際のマッチング盤面を描画するグリッド（`display: grid;` を利用して行×列を配置）。  
  子コンポーネント MatchingTile.vue を `v-for` でループし、1 枚ずつタイル（`<div>`）を展開。
- **MatchingTile.vue**  
  タイル 1 枚分の見た目とクリック処理。  
  `props` で渡された tile オブジェクトの `isRevealed`/`isMatched` に応じて見た目を変更し、クリックで親のメソッドを呼ぶ。

## Composable（useMatchingGame.ts）

コアとなるゲームロジックをまとめた “Composable”（再利用可能な関数）。

- `rows × cols` を引数に受け取り、
  - `tiles: Ref<Tile[]>`（現在のすべてのタイル配列）
  - `selectTile(tile: Tile)`（クリック時のマッチ判定・ターンカウント）
  - `initGame()`（新インスタンス生成・シャッフル＋初期化）
  - `isCleared: ComputedRef<boolean>`（クリア判定）
  - `moves: ComputedRef<number>`（経過ターン数）
- …を返す形で実装。これにより「サイズ変更時」「シャッフル時」にまるっと新しいインスタンスを生成し直せる。

---

# 2. データフローと再描画の仕組み

- **App.vue（親） → GameControls（子）**  
  App.vue で保持している `rows`/`cols` を GameControls の `initRows`/`initCols` にバインド。  
  GameControls からは `@update-size` / `@shuffle-requested` / `@peek-requested` というカスタムイベントを発火し、App.vue がそれを受け取って状態 (`rows`/`cols`, game の再生成など) を更新。

- **App.vue（親） → MatchingBoard（子）**  
  `rows`/`cols`/`game.tiles`/`game.isCleared`/`game.moves` を Props 経由で渡す。  
  Props が変わると自動的に子コンポーネントが再描画される。  
  さらに `<MatchingBoard :key="boardKey" …>` のように key を付与しているため、`rows`/`cols` の変更や「シャッフルで同じサイズなのに盤面をまるっと新規にする」場合も強制再マウント。

### タイル選択の流れ

1. MatchingBoard 内部の MatchingTile.vue でクリックされたタイル情報を親（App.vue）にコールバックで通知。
2. 親 → Composable（useMatchingGame 内の `selectTile(tile)`）を呼び出し、
3. 内部で「2 枚目がクリックされたらマッチ判定 → tiles 配列を更新 → moves を増やす → 1 秒後に裏返し or マッチ済みフラグを立てる」…という流れ。
4. その結果、tiles の中身が変わると、画面上のタイルも反応して色・数字の表示が自動更新される。

---

# 3. 再利用性・拡張性の確保

- **Composable 化によるロジック分離**  
  `useMatchingGame(rows, cols)` によって「行数×列数による盤面生成」「シャッフル」「マッチ判定」「ターン数カウント」…をすべてひとまとめに。  
  将来「同じ仕組みで別の画面に埋め込みたい」「テストを書きたい」という要件が出ても、すぐにインポートして使える。

- **Props/UI は“できるだけプレゼンテーションに専念”**  
  GameControls.vue と MatchingBoard.vue はあくまで「見た目＋親へのイベント通知」に徹し、ロジック中身は持たない。  
  これにより、「見た目を CSS／レイアウトだけで変えたい」「別のデザインに差し替えたい」といったときもロジックに影響を与えにくい。

- **キーによる強制再マウント**  
  `boardKey`（`${rows}x${cols}-${timestamp}`）を使うことで、
  - 「行数・列数を変えたとき」
  - 「シャッフルでまったく新しい並びにしたいとき」
  …に、Vue が古いコンポーネント状態をキャッシュせず、新しいインスタンスに置き換えてくれる。

- **TypeScript 型定義**  
  `Tile` 型 (`{ id: number; value: number; isRevealed: boolean; isMatched: boolean }`) を明示的に定義し、  
  各コンポーネントの Props でも `defineProps<{ … }>()` を使って型を付与。  
  これにより、実装中に「タイポで tile.value の値を取り違えた」などのミスをコンパイル時に検知できる。

---

# 4. 全体のコントロールフローまとめ

- **アプリ起動時**
  - `rows = 4`, `cols = 4`（デフォルト）
  - `game = useMatchingGame(4, 4)` → 初期タイル 16 枚をシャッフルして game.tiles にセット
  - ステータスバーは「ターン数 0」「ペア 0/8」、盤面に裏向き 16 枚を描画

- **サイズ変更（例：6×8）**
  - GameControls から `@update-size` を受け取る
  - `rows = 6`, `cols = 8` に更新 → `watch([rows,cols])` 内で
  - `game = useMatchingGame(6,8)` → タイル 48 枚を新生成＋シャッフル
  - `boardKey` も更新 → `<MatchingBoard>` を強制再マウント
  - ステータスバーは「ターン数 0」「ペア 0/24」、盤面は裏向き 48 枚

- **シャッフル**
  - 同じサイズのまま GameControls から `@shuffle-requested` を受け取り、`handleShuffle()` 内で
  - `game = useMatchingGame(rows,cols)` → 新インスタンス・新シャッフル
  - `boardKey` 更新 → `<MatchingBoard>` 再マウント
  - 盤面は同じサイズかつ新ランダム配置、ターン数 0、ペア 0 から再スタート

- **チラ見**
  - `@peek-requested` を受け取り、`handlePeek()` 内で
  - 現在裏向きのタイルすべてを一時的に `isRevealed = true` にして 1～2 秒後に戻す
  - マッチ済みタイルは `isMatched = true` のままなので、常に表向き表示。

- **タイルを 2 枚めくったとき**
  - MatchingTile.vue から `@click` イベント → `handleSelect(tile)` → `game.selectTile(tile)` を呼び出す。
  - 1 枚目は firstSelected に格納、2 枚目でマッチ判定
    - 成功 → `isMatched = true` にして緑色をキープ
    - 失敗 → 0.5～1 秒後に両方を `isRevealed = false` に戻す
  - 判定ごとに `moveCount` を +1、ステータスバーの「ターン数」が更新

- **クリア**
  - `game.isCleared` が true になると、ステータスバー下に「🎉 クリアしました！合計ターン数：○○ 🎉」 を表示。

---

# まとめ

- **責務の分離**  
  UI（見た目／ボタン配置）は GameControls.vue と MatchingBoard.vue に分担し、  
  複雑なロジックは useMatchingGame.ts に一本化。  
  App.vue は各コンポーネント間の「つなぎ役」と、「サイズ変更」「シャッフル」「チラ見」の制御ロジックを持つ。

- **リアクティブ設計 + キーによる強制再マウント**  
  Composition API の `ref`/`computed` を駆使し、  
  `boardKey` を更新して Vue に「新しい盤面」として認識させることで、常に正しい状態を描画。

- **TypeScript による型担保**  
  Tile 型の定義や `defineProps` でミスをコンパイル時にキャッチしやすくすることで、保守性・可読性を向上。

これらの設計方針により、拡張性・可読性の高い構造を保ちながら、「行×列 を自在に変えられる」「いつでもシャッフルできる」「チラ見でヒントを出せる」など、柔軟なマッチングゲームを実現しています。

---