# HOLO LAB v0.8

v0.7からの修正点

- シールをタップしても2枚表示へ遷移しないSafari系不具合を修正
  - HTMLのidを暗黙のJavaScript変数として使わず、getElementByIdで明示取得
- キャラクター名を「聖虚MIRA壽」に変更
- 読みを「セントホロミラージュ」に変更
- iPhone縦画面下部のSafe Areaが白帯になる問題を修正
  - html/bodyにもメニュー背景色を設定
- 横画面でMENU/TILT STARTがステータス領域や画面端に重なりにくいよう、
  safe-area-inset-left/rightを使って左右余白を増加
- 2枚のシール＋上下操作UIが画面内に収まるレイアウトは維持
- ホロ表現はv0.7の銀灰色＋微細凹凸＋滑らかな色変化を継続
