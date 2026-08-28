# HOLO LAB prototype v0.1

iPhone Safari / GitHub Pages 用のPWA試作です。

## モード
- 1 CARD / TILT
  - iPhoneの傾きセンサーでホログラム表現を変化
  - カード上のタッチ操作でも代替可能
- 2 CARDS / STEREO
  - 交差法で中央像を結ぶステレオペア
  - 左右ドラッグで視差量
  - 上下ドラッグでホログラム位相

## GitHub Pages
1. このフォルダ内のファイルをリポジトリ直下へアップロード
2. GitHub > Settings > Pages
3. Source: Deploy from a branch
4. Branch: main / root
5. 発行URLをiPhone Safariで開く
6. 共有 > ホーム画面に追加

## iPhoneの傾きセンサー
1 CARD / TILT の `TILT START` をタップすると、Safariがモーション・方向アクセスの許可を求めます。
許可しない場合でもタッチ操作で試せます。

※ DeviceOrientation はHTTPS上で使用してください。GitHub PagesはHTTPSなので条件を満たします。
