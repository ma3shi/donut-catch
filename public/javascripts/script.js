// DOMツリーに加えて画像やすべてのスクリプトが読み込まれた時点で発火
window.addEventListener("load", function () {
  //canvasの設定
  const canvas = document.getElementById("first-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  //マウス処理
  let canvasPosition = canvas.getBoundingClientRect(); //canvasの座標値（位置）を取得
  const mouse = {
    x: canvas.width / 2, //初期値
    y: canvas.height / 2, //初期値
    isClicked: false, //マウスダウンしたかどうか
  };

  //マウスイベント
  //clickだとmousedownよりタイミングが遅れるのでmousedown
  canvas.addEventListener("mousedown", function (event) {
    mouse.isClicked = true; //マウスダウンしたかどうか
    mouse.x = event.x - canvasPosition.left; //canvas内での位置を取得
    mouse.y = event.y - canvasPosition.top; //canvas内での位置を取得
  });

  //ゲーム
  class Game {
    constructor(ctx, width, height) {
      this.ctx = ctx;
      this.width = width; //canvasの高さ
      this.height = height; //canvasの幅
      this.ctx.font = "50px Georgia"; //フォント
      this.background = new Background(); //背景
      this.player = new Player(); //プレイヤー
      this.donuts = []; //ドーナッツ配列
      this.donutInterval = 1000; //ドーナッツを作成する間隔
      this.donutTimer = 0; //次のドーナッツ作成までの累積時間
      this.score = 0; //スコア
      this.inputScore = document.getElementById("score"); //送信用スコア
      this.isGameOver = false; //ゲームオーバー
      this.gameOverSound = document.createElement("audio"); //ゲームオーバー音
      this.gameOverSound.src = "../sounds/game_over.mp3"; //ゲームオーバー音
      this.modal = document.getElementById("modal"); //モーダルウインドウ
    }
    //アップデート
    update(deltaTime) {
      //isDeletable(削除可能か)がfalseのものだけにする。
      this.donuts = this.donuts.filter((donut) => !donut.isDeletable);
      // 次のドーナッツ作成までの累積時間 > ドーナッツを作成する間隔
      if (this.donutTimer > this.donutInterval) {
        this.donuts.push(new Donut(this, this.player)); //ドーナッツ作成
        this.donutTimer = 0; //次のドーナッツ作成までの累積時間をリセット
      } else {
        this.donutTimer += deltaTime; //次のドーナッツ作成までの累積時間にframe間のミリ秒を加える
      }
      this.background.update(); //背景更新
      this.player.update(); //プレイヤー更新
      this.donuts.forEach((donut) => donut.update()); //ドーナッツ更新
    }
    //描画
    draw() {
      this.background.draw(); //背景描画
      this.player.draw(); //プレイヤー描画
      this.donuts.forEach((donut) => donut.draw()); //ドーナッツ描画
      this.ctx.fillStyle = "white";
      this.ctx.fillText(`score: ${this.score}`, 10, 50); //スコア描画
    }
    //ゲームオーバー描画
    drawGameOver() {
      this.ctx.textAlign = "center";
      this.ctx.fillStyle = "red";
      this.ctx.fillText(`GAME OVER `, canvas.width / 2, canvas.height / 2 - 30);
      this.ctx.fillText(
        `your score is ${this.score}`,
        canvas.width / 2,
        canvas.height / 2 + 50
      );
    }
  }

  //背景
  class Background {
    constructor() {
      this.image = new Image();
      this.image.src = "../images/background.png";
      this.x = 0;
      this.y = 0;
      this.width = canvas.width;
      this.height = canvas.height;
      this.speed = 2;
    }
    //アップデート
    update() {
      if (this.x <= -this.width) this.x = 0; //背景の幅分,移動したら元の位置に戻る
      this.x = this.x - this.speed; //左に移動
    }
    //同じ背景を二枚繋げて表示
    draw() {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      ctx.drawImage(
        this.image,
        this.x + this.width,
        this.y,
        this.width,
        this.height
      );
    }
  }

  //プレイヤー
  class Player {
    constructor() {
      this.playerLeft = new Image();
      this.playerLeft.src = "../images/majo_left.png";
      this.playerRight = new Image();
      this.playerRight.src = "../images/majo_right.png";
      this.x = canvas.width / 2; // 位置,初期値：右端
      this.y = canvas.height; //位置、初期値：半分の高さ
      this.radius = 50; //半径
      this.angle = 0; //角度
      this.imgWidth = 749; //imgの幅
      this.imgHeight = 800; //imgの高さ
    }
    //アップデート
    update() {
      //初期値:this.x/2はcanvasの幅/2,mouse.xはcanvas.width / 2,なので初期のdxは0
      const distanceX = this.x - mouse.x;
      //初期値:this.yはcanvas.height,mouse.yはcanvas.height / 2なのでdy=canvasの高さ/2
      const distanceY = this.y - mouse.y;
      //dxがプラスになるのはmouseが左,playerが右,dyがプラスになるのはmouseが上,playerが下
      //thetaを計算する際にはplayerに対してmouseが
      // 1.左上　dx:+, dy:+, 2.右上　dx:-, dy:+, 3.左下　dx:+, dy:- ,4.右下　dx:-, dy:-
      //https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
      //上記の解説の図とマウス位置は左右逆になるので注意.シータ角は反時計回り。ctx.rotateはx軸の右側がスタートで時計回り。
      let theta = Math.atan2(distanceY, distanceX);
      this.angle = theta;
      //クリックした位置とplayerの位置が異なる場合。 dxがプラス,左に移動,dxマイナスは右移動。
      if (mouse.x != this.x) this.x -= distanceX / 15;
      if (mouse.y != this.y) this.y -= distanceY / 15;
    }
    //描画
    draw() {
      // if (mouse.isClicked) {
      //   ctx.lineWidth = 0.2;
      //   ctx.beginPath();
      //   ctx.moveTo(this.x, this.y);
      //   ctx.lineTo(mouse.x, mouse.y);
      //   ctx.stroke();
      // }
      // ctx.fillStyle = "red";
      // ctx.beginPath();
      // ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      // ctx.fill();
      // ctx.closePath();

      ctx.save(); //描画情報を保存
      ctx.translate(this.x, this.y); //移動
      ctx.rotate(this.angle); //回転方向は時計回り、単位はラジアン
      // mouseがplayerより左
      if (this.x >= mouse.x) {
        ctx.drawImage(
          this.playerLeft, //img
          0, //sx
          0, //sy
          this.imgWidth, //sw
          this.imgHeight, //sh
          0 - 60, //dx  ctx.translateで移動している。60は画像とarcの位置調整
          0 - 60, //dy 45は画像とarcの位置調整
          this.imgWidth / 7, //表示幅
          this.imgHeight / 7 //表示高さ
        );
        // mouseがplayerより右
        //左向きの画像だけだとマウスの位置がプレイヤーより右になった際に上下逆になってしまうので右側の際では上下逆のimgを使用する
      } else {
        ctx.drawImage(
          this.playerRight, //img
          0, //sx
          0, //sy
          this.imgWidth, //sw
          this.imgHeight, //sh
          0 - 60, //dx
          0 - 60, //dy
          this.imgWidth / 7, //dw
          this.imgHeight / 7 //dh
        );
      }
      ctx.restore(); //translate,rotateを元に戻す
    }
  }

  //ドーナッツ
  class Donut {
    constructor(game, player) {
      this.player = player;
      this.game = game;
      this.donutImg = new Image();
      this.donutImg.src = "../images/french_cruller.png";
      this.randomSiza = Math.random() * 0.6 + 0.4; //サイズ倍率　0.4から1.0
      this.radius = 40 * this.randomSiza; //半径
      this.x = canvas.width + this.radius; //右端に隠れる位置
      this.imgWidth = 400;
      this.imgHeight = 400;
      // Math.random() * (max - min) + min
      this.y =
        Math.random() * (canvas.height - this.radius - 50) + this.radius + 50;
      this.directionX = Math.random() * 5 + 1; //方向(x)
      this.directionY = Math.random() * 5 - 2.5; //方向(y) -2.5から2.5の間
      this.distance; //playerとの距離
      this.isCounted = false; //スコアをカウントしたかどうか
      this.isDeletable = false; //削除可能か
      this.catchSound = document.createElement("audio"); //キャッチ音
      this.catchSound.src = "../sounds/catch_sound.mp3"; //キャッチ音
    }
    //アップデート
    update() {
      //上下の端で逆方向へ
      if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
        this.directionY = this.directionY * -1;
      }
      //移動
      this.x -= this.directionX; //左へ
      this.y += this.directionY; //上下ランダム

      //削除
      const distanceX = this.x - this.player.x; //donutとplayerのx軸の差
      const distanceY = this.y - this.player.y; //donutとplayerのy軸の差
      //this.distanceは斜辺
      this.distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY); //donutとplayerの距離を計算
      //ドーナッツとプレイヤーの距離　< ドーナッツとプレイヤーの半径の合計
      if (this.distance < this.radius + this.player.radius) {
        //カウントがまだの場合
        if (!this.isCounted) {
          this.catchSound.play(); //音
          this.game.score++; //スコア
          this.isCounted = true; //カウントしたかをtrueへ
          this.isDeletable = true; //削除可能かをtrueへ
        }
      }
      //ドーナッツが左端に到達して隠れたらゲームオーバー
      if (this.x < 0 - this.radius) this.game.isGameOver = true;
    }
    //描画
    draw() {
      // ctx.fillStyle = "blue";
      // ctx.beginPath();
      // ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      // ctx.fill();
      // ctx.closePath();

      ctx.drawImage(
        this.donutImg,
        0,
        0,
        this.imgWidth,
        this.imgHeight,
        this.x - this.radius,
        this.y - this.radius,
        this.radius * 2.1,
        this.radius * 2.1
      );
    }
  }

  const game = new Game(ctx, canvas.width, canvas.height);
  let lastTime = 0; //直前の時間
  //Animation Loop
  //PCの能力でフレームのスピードが変わってしまうのでtimestamp
  //https://developer.mozilla.org/ja/docs/Web/API/Window/requestAnimationFrame
  function animation(timeStamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //画面クリア
    let deltaTime = timeStamp - lastTime; //frame間のミリ秒
    lastTime = timeStamp; //次のフレーム用にタイムスタンプを直前に時間として代入
    game.update(deltaTime);
    game.draw();
    if (!game.isGameOver) {
      requestAnimationFrame(animation);
    } else {
      game.drawGameOver(); //ゲームオーバー画面描写
      game.gameOverSound.play(); //ゲームオーバー音
      game.inputScore.value = game.score; //スコアをファーム内に代入
      game.modal.classList.remove("hidden"); //モーダルウィンドウ表示
    }
  }
  //引数に何も入れないと最初がundefinedでNaNになってしまう
  animation(0);
});
