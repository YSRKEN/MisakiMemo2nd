# MisakiMemo2nd
ミリシタの一周年任務の進捗をメモるためのWebツール

## 導入方法

- 単純に、WebサイトをWebブラウザで開けばそのまま使用できます
- アプリケーションに入力した進捗状況は、Webブラウザごとに保持されます。 **データ移行する場合は、後述する「進捗を出力」「進捗を入力」ボタンをご利用ください**
- 当アプリはPWA技術に対応しています。Webブラウザのメニューから「ホーム画面に追加」 or 「デスクトップに追加」を選択することにより、まるで普通のスマホアプリ・PCアプリのようにアイコンを登録して使用できます

## 使い方

- 画面は、上部の「フィルター・各種操作」部分、下部の「アイドル一覧」部分の二部構成です
- **フィルター・各種操作部分について**
  - アイドルの名前の一部(名前・ふりがな両対応)、属性で表示する対象を選択できます
  - ミッションの種類が「☆ミッション達成数」ならば、アイドル達のミッション達成数が表示されます。そうでない場合、指定したミッションにおける進捗状況を表示します
  - ソート順は、アイドルID順・進捗順(昇順・降順)から選べます
  - 「完遂者を非表示」させると、全ミッションを達成した(＝10個とも消化した)アイドルは一覧から非表示になります
  - 「進捗を出力」ボタンを押すと、左のテキストボックスに進捗データが **Base64形式で出力されます** 。これを別に起動した当Webアプリのテキストボックスに貼り付けて、「進捗を入力」ボタンを押すと、その進捗が画面に反映されます
- **アイドル一覧部分について**
  - ミッションの種類が「☆ミッション達成数」ならば、「詳細」ボタンを押すことで、どのミッションを達成・未達成したかがダイアログ表示されます
  - ミッションの種類がそれ以外ならば、達成・未達成の表示の他、それを切り替えるためのボタンが表示されます
- アプリケーションに入力した進捗状況は自動でセーブされます。Webブラウザを再起動してもそのままです
