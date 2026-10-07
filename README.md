# 中3 評定アップ

中学3年生向けの、評定2→3を目指す期末テスト対策アプリ（国語・社会・数学・理科・技術・家庭・英語）。

- 本番: https://chu3-hyotei.vercel.app
- Vite + React + TypeScript、Vercel にデプロイ
- 単元ごとの「まとめ」＋練習10問、実力テスト、今日のおすすめ、間違いノート、テスト範囲・日付の設定、学習記録
- 進捗は localStorage（`chu3-prog-v1`）に保存し、PIN を入れると `api/sync.ts` 経由で Neon Postgres（`chu3_progress` テーブル）に同期

## 開発

```bash
npm install
npm run dev      # フロントのみ（/api は vercel dev か本番で動作）
npm run build
npm run lint
```

`api/sync.ts` には環境変数 `DATABASE_URL`（Neon）が必要です。

## 構成

- `src/data/*.ts` — 教科ごとの単元・まとめ・問題（`gens` は自動生成問題）
- `src/progress.ts` — 進捗データ、記録・マージ
- `src/cloud.ts` / `api/sync.ts` — PIN によるクラウド同期
- `src/App.tsx` — 画面
