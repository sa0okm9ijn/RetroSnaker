var chessBoard;
var squareSet;
var mainSnakeColor = "#6495ED";//玩家蛇的颜色
var snake = [];//蛇的集合，所有的蛇都存放在这里，包括玩家控制的蛇。玩家控制的蛇是第0个元素
var mainSnake;//玩家控制的蛇
var things = [];//所有生成的物体存放在这个集合中
var maxThingSize = 20;//允许存在的物体数量，在核心代码中，物体只有食物一个种类。可以通过扩展类来进行扩展。
//方向枚举
var toward = { UP: { x: 0, y: -1 }, RIGHT: { x: 1, y: 0 }, DOWN: { x: 0, y: 1 }, LEFT: { x: -1, y: 0 } };
var frame = 40;//刷新频率，40代表1s中刷新40次
var timer;//游戏刷新频率的定时器

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

//贪吃蛇的模型类
//参数分别是蛇头的坐标，初始朝向，长度，背景颜色
function Snake(headX, headY, nowToward, length, bgColor) {
    this.snakeBody = [];//贪吃蛇存放身体的集合
    this.nowToward = nowToward;
    this.headMoveX = nowToward.x;
    this.headMoveY = nowToward.y;
    this.bgColor = bgColor;
    //修改移动方向,当玩家或AI修改方向，会先更新这个字段，当判定可以转向后统一进行转向。由于刷新频率的存在，这种方式可以有效防止快速连续点击造成的异常
    this.changeToward = null;
    //点击间隔计时器,当用户或AI进行一次转向之后,并不可以连续转向，所以此时这个字段会设置一个值,每次刷新减一，当减为零时可以再次转向
    this.changeNextStation = 0;
    this.init = function (headX, headY, length, bgColor) {
        for (var i = 0; i < length; i++) {
            this.grow(headX, headY, bgColor);
        }
    }
    //成长方法，初始化和吃食物会被调用
    this.grow = function (headX, headY, bgColor) {
        var ball;
        //蛇身长度为0，此时生成的是蛇头，所以坐标由用户设置
        if (this.snakeBody.length == 0) {
            ball = createBall(headX, headY, "&nbsp;", bgColor);
        } else if (this.snakeBody[this.snakeBody.length - 1].point.length == 0) {//蛇尾距离蛇头之间没有拐点
            var lastBody = this.snakeBody[this.snakeBody.length - 1];
            ball = createBall(lastBody.lx + -1 * this.nowToward.x * 20, lastBody.ly + -1 * this.nowToward.y * 20, "&nbsp;", bgColor);
        } else {//蛇尾部距离蛇头有拐点
            var lastBody = this.snakeBody[this.snakeBody.length - 1];
            var point = lastBody.point[0];
            ball = createBall(lastBody.lx + -1 * point.speedX * 20, lastBody.ly + -1 * point.speedY * 20, "&nbsp;", bgColor);
            ball.point = clone(lastBody.point);
        }
        this.snakeBody.push(ball);
    }

    this.turnUp = function () {
        this.nowToward = toward.UP;
        change(this, 0, -1);
    }
    this.turnDown = function () {
        this.nowToward = toward.DOWN;
        change(this, 0, 1);
    }
    this.turnLeft = function () {
        this.nowToward = toward.LEFT;
        change(this, -1, 0);
    }
    this.turnRight = function () {
        this.nowToward = toward.RIGHT;
        change(this, 1, 0);
    }
    this.over = function(){  //蛇挂掉，如果是玩家蛇 则游戏gameover
        if(mainSnake == this){
            clearInterval(timer);
            alert("游戏结束");
        }else{ //AI的蛇变为食物

        }

    }
    this.init(headX, headY, length, bgColor);
}
var thingFactory = {
    autoGenerateTimer: null,
    typeEnums: { //物体类型枚举,如果需要进行扩展,可用添加新的枚举类型
        food: {
            name: "food", value: 2, text: "+", bgColor: "#228B22", fgColor: "black",
            act: function (origin) {
                origin.grow(null, null, origin.bgColor);
            }

        }
    },
    randomGenerate: function () {//随机生成物体
        var x = parseInt(Math.random() * 480);
        var y = parseInt(Math.random() * 480);

        //保证食物生成在方格里面
        x = parseInt((x / 20)) * 20;
        y = parseInt((y / 20)) * 20;
        var temp = createBall(x, y, this.typeEnums.food.text, this.typeEnums.food.bgColor, this.typeEnums.food.fgColor);
        temp.act = this.typeEnums.food.act;
        things.push(temp);
        return temp;
    },
    autoGenerate: function () {//自动生成物体
        this.autoGenerateTimer = setInterval(() => {
            if (things.length < maxThingSize) {
                thingFactory.randomGenerate();
            }
        }, 1000);
    }
}
function createBall(x, y, text, bgColor, fgColor) {
    var ball = document.createElement("div");
    var shadow = document.createElement("div");
    var circle = document.createElement("div");
    var over = document.createElement("div");
    var textDiv = document.createElement("span");
    textDiv.innerHTML = text;

    circle.appendChild(over);
    circle.appendChild(textDiv);

    ball.appendChild(shadow);
    ball.appendChild(circle);

    over.classList.add("over_circle");
    circle.classList.add("circle");
    shadow.classList.add("shadow");

    ball.classList.add("ball");

    if (bgColor) {
        ball.bgColor = bgColor;
    } else {
        ball.bgColor = mainSnakeColor;
    }
    if (fgColor) {
        textDiv.style.color = fgColor;
    }

    over.style.background = ball.bgColor;

    ball.lx = x;
    ball.ly = y;
    ball.point = [];
    chessBoard.appendChild(ball);
    return ball;
}
//绘制位置
function repaint() {
    for (var i = 0; i < snake.length; i++) {
        for (var j = 0; j < snake[i].snakeBody.length; j++) {
            snake[i].snakeBody[j].style.left = snake[i].snakeBody[j].lx + "px";
            snake[i].snakeBody[j].style.top = snake[i].snakeBody[j].ly + "px";
            snake[i].snakeBody[j].style.display = "block";
        }
        //蛇头绘制字
        snake[i].snakeBody[0].getElementsByClassName("circle")[0].getElementsByTagName("span")[0].innerText = "囧";
    }
    for (var i = 0; i < things.length; i++) {
        things[i].style.left = things[i].lx + "px";
        things[i].style.top = things[i].ly + "px";
        things[i].style.display = "block";
    }
}
//初始化小方格
function initSquareSet() {
    squareSet = new Array(25);
    for (var i = 0; i < squareSet.length; i++) {
        squareSet[i] = new Array(25);
        for (var j = 0; j < squareSet[i].length; j++) {
            squareSet[i][j] = document.createElement("div");
            squareSet[i][j].classList.add("square");
            chessBoard.appendChild(squareSet[i][j]);
        }
    }
}
//给出两个在游戏场地的模型,可以计算出两个模型中心的距离
function getDistance(a, b) {
    var snakeCenterX = a.lx + 10;
    var snakeCenterY = a.ly + 10;
    var thingsCenterX = b.lx + 10;
    var thingsCenterY = b.ly + 10;
    var absX = Math.abs(snakeCenterX - thingsCenterX);
    var absY = Math.abs(snakeCenterY - thingsCenterY);
    var distance = Math.sqrt(Math.pow(absX, 2) + Math.pow(absY, 2), 2);//使用勾股定理计算出距离
    return distance;

}
//检查碰撞
function checkCrash() {
    for (var i = 0; i < snake.length; i++) {
        //检查蛇与边界的碰撞
        var x = snake[i].snakeBody[0].lx;
        var y = snake[i].snakeBody[0].ly;
        if(x<0 || x> 480||y<0 || y > 480){
            snake[i].over();
            snake[i].splice(i,1);
            continue;
        }
        //检查蛇与食物的碰撞
        for (var j = 0; j < things.length; j++) {
            var distance = getDistance(snake[i].snakeBody[0], things[j]);
            if (distance < 20) {
                things[j].act(snake[i]);
                chessBoard.removeChild(things[j]);
                things.splice(j, 1);
            }
        }
    }

}
//初始化蛇
function initSnake() {
    var main = new Snake(80, 0, toward.RIGHT, 5, mainSnakeColor);
    snake.push(main);
    mainSnake = main;
}
//移动
function Move() {
    for (var i = 0; i < snake.length; i++) {
        for (var j = 1; j < snake[i].snakeBody.length; j++) {//遍历循环蛇身上的每个节点
            if (snake[i].snakeBody[j].point.length > 0) {
                snake[i].snakeBody[j].lx += snake[i].snakeBody[j].point[0].speedX;
                snake[i].snakeBody[j].ly += snake[i].snakeBody[j].point[0].speedY;
                if (snake[i].snakeBody[j].lx == snake[i].snakeBody[j].point[0].x &&
                    snake[i].snakeBody[j].ly == snake[i].snakeBody[j].point[0].y) {
                    snake[i].snakeBody[j].point.shift();
                }
            } else {
                snake[i].snakeBody[j].lx += snake[i].headMoveX;
                snake[i].snakeBody[j].ly += snake[i].headMoveY;
            }
        }
        snake[i].snakeBody[0].lx += snake[i].headMoveX;
        snake[i].snakeBody[0].ly += snake[i].headMoveY;
    }
    repaint();
}
//转换方向
function change(snake, x, y) {
    var lastX = snake.snakeBody[0].lx;
    var lastY = snake.snakeBody[0].ly;
    var speedX = snake.headMoveX;
    var speedY = snake.headMoveY;
    //因为蛇头进行旋转了,但是蛇身必须要走完当前这段路才能进行转弯,所以要转弯的点记录下来
    for (var i = 1; i < snake.snakeBody.length; i++) {
        snake.snakeBody[i].point.push({ x: lastX, y: lastY, speedX: speedX, speedY: speedY });
    }
    snake.headMoveX = x;
    snake.headMoveY = y;
}
//检查方向转换
function tryChangeToward() {
    for (var i = 0; i < snake.length; i++) {
        //没有转向
        if (!snake[i].changeToward) {
            continue;
        }
        //同方向不可以转
        if (snake[i].changeToward == snake[i].nowToward) {
            continue;
        }
        //不能是相反的方向
        if (snake[i].changeToward.change.x + snake[i].nowToward.x == 0 ||
            snake[i].changeToward.change.y + snake[i].nowToward.y == 0) {
            continue;
        }
        //没有按照格子上下转弯
        if (snake[i].changeToward.change == toward.UP || snake[i].changeToward.change == toward.DOWN) {
            if (snake[i].snakeBody[0].lx % 20 != 0) {
                continue;
            }
        }
        //没有按照格子左右转弯
        if (snake[i].changeToward.change == toward.LEFT || snake[i].changeToward.change == toward.RIGHT) {
            if (snake[i].snakeBody[0].ly % 20 != 0) {
                continue;
            }
        }
        snake[i].nowToward = snake[i].changeToward.change;
        snake[i].changeToward.act.call(snake[i]);
        // if (snake[i].changeToward && snake[i].changeToward.change != snake[i].nowToward) {//不能是相同的方向
        //     if (snake[i].changeToward.change.x + snake[i].nowToward.x != 0 ||
        //         snake[i].changeToward.change.y + snake[i].nowToward.y != 0) {   //不能是相反的方向
        //         if (snake[i].changeToward.change == toward.UP || snake[i].changeToward.change == toward.DOWN) {
        //             if (snake[i].snakeBody[0].lx % 20 == 0) {
        //                 snake[i].nowToward = snake[i].changeToward.change;
        //                 snake[i].changeToward.act.call(snake[i]);
        //             }
        //         }
        //     }
        //     if (snake[i].changeToward.change == toward.LEFT || snake[i].changeToward.change == toward.RIGHT) {
        //         if (snake[i].snakeBody[0].ly % 20 == 0) {
        //             snake[i].nowToward = snake[i].changeToward.change;
        //             snake[i].changeToward.act.call(snake[i]);
        //         }
        //     }
        //     console.log(snake[i].snakeBody[0].lx+"---"+snake[i].snakeBody[0].ly);
        //     snake[i].nowToward = snake[i].changeToward.change;
        //     snake[i].changeToward.act.call(snake[i]);
    }
}
function start() {
    timer = setInterval(() => {
        tryChangeToward();//检查方向转换
        Move();//移动
        checkCrash();//检查碰撞
    }, 1000 / frame);

    thingFactory.autoGenerate();
    //监听键盘事件
    document.onkeydown = function (event) {
        var e = event || window.event || arguments.callee.caller.arguments[0];
        if (e.keyCode == 38) {
            mainSnake.changeToward = { change: toward.UP, act: mainSnake.turnUp };
        } else if (e.keyCode == 40) {
            mainSnake.changeToward = { change: toward.DOWN, act: mainSnake.turnDown };
        } else if (e.keyCode == 37) {
            mainSnake.changeToward = { change: toward.LEFT, act: mainSnake.turnLeft };
        } else if (e.keyCode == 39) {
            mainSnake.changeToward = { change: toward.RIGHT, act: mainSnake.turnRight };
        }
    }
}
window.onload = function () {
    chessBoard = document.getElementById("chess_board");
    //初始化方格
    initSquareSet();
    //初始化蛇
    initSnake();
    //绘制位置
    repaint();
}