# HOLO LAB v2.4

- デフォルトのシール画像を廃止。全スロットは画像未登録から開始します。
- ユーザー画像をメタデータとは別の IndexedDB `images` ストアへ ArrayBuffer として保存。
- v2.3 の Data URL 画像は初回起動時に新しい画像ストアへ移行します。
- 旧同梱画像（天変・溟流・曐暴）は初回起動時に解除します。
- SAVE は書き込み成功後だけ `SAVED ✓`。失敗時は `SAVE FAILED` を表示し、選択画像を保持します。
- EXPORT ALL / IMPORT ALL は画像データも含む v3 バックアップ形式に更新。
- v2.3 のキラ背景、KIRA COLOR、コンパクトな COLLECTION UI は維持。
