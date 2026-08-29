
/**
 * 五子棋游戏核心逻辑
 * 包含棋盘绘制、胜负判断、简易AI算法
 */
class GomokuGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 13; // 13x13 棋盘
        this.gridSize = 40;  // 格子大小
        this.padding = 20;   // 边距
        
        // 游戏状态
        // 0: 空, 1: 黑棋(玩家), 2: 白棋(AI)
        this.board = []; 
        this.history = []; // 用于悔棋
        this.isGameOver = false;
        this.currentPlayer = 1; // 1为黑棋(玩家)先手
        
        this.init();
    }

    init() {
        // 初始化棋盘数组
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.history = [];
        this.isGameOver = false;
        this.currentPlayer = 1;
        this.updateStatus("游戏进行中 - 请落子");
        this.drawBoard();
        
        // 绑定点击事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }

    restart() {
        this.init();
    }

    undo() {
        if (this.isGameOver || this.history.length === 0) return;
        
        // 悔棋通常悔两步（玩家一步，AI一步），除非只下了一步
        let stepsToUndo = 2;
        if (this.history.length === 1) stepsToUndo = 1;

        for (let i = 0; i < stepsToUndo; i++) {
            if (this.history.length > 0) {
                const lastMove = this.history.pop();
                this.board[lastMove.y][lastMove.x] = 0;
            }
        }
        
        this.currentPlayer = 1; // 悔棋后轮到玩家
        this.isGameOver = false;
        this.updateStatus("已悔棋，请继续");
        this.drawBoard();
    }

    updateStatus(msg) {
        const statusEl = document.getElementById('statusDisplay');
        statusEl.textContent = msg;
        if (msg.includes("胜利")) {
            statusEl.className = "status-badge bg-blue-100 text-blue-800";
        } else if (msg.includes("失败")) {
            statusEl.className = "status-badge bg-red-100 text-red-800";
        } else {
            statusEl.className = "status-badge bg-green-100 text-green-800";
        }
    }

    drawBoard() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#555";
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.boardSize; i++) {
            // 横线
            this.ctx.moveTo(this.padding, this.padding + i * this.gridSize);
            this.ctx.lineTo(this.padding + (this.boardSize - 1) * this.gridSize, this.padding + i * this.gridSize);
            // 竖线
            this.ctx.moveTo(this.padding + i * this.gridSize, this.padding);
            this.ctx.lineTo(this.padding + i * this.gridSize, this.padding + (this.boardSize - 1) * this.gridSize);
        }
        this.ctx.stroke();

        // 绘制天元和星位 (13x13 通常在 3,3; 3,9; 9,3; 9,9; 6,6)
        const stars = [[3,3], [3,9], [9,3], [9,9], [6,6]];
        this.ctx.fillStyle = "#000";
        stars.forEach(pos => {
            this.ctx.beginPath();
            this.ctx.arc(
                this.padding + pos * this.gridSize, 
                this.padding + pos * this.gridSize, 
                3, 0, 2 * Math.PI
            );
            this.ctx.fill();
        });

        // 绘制棋子
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] !== 0) {
                    this.drawPiece(x, y, this.board[y][x]);
                }
            }
        }
        
        // 标记最后一步
        if (this.history.length > 0) {
            const last = this.history[this.history.length - 1];
            this.ctx.beginPath();
            this.ctx.strokeStyle = "#ff0000";
            this.ctx.lineWidth = 2;
            this.ctx.arc(
                this.padding + last.x * this.gridSize,
                this.padding + last.y * this.gridSize,
                this.gridSize / 2 - 2,
                0, 2 * Math.PI
            );
            this.ctx.stroke();
        }
    }

    drawPiece(x, y, role) {
        const centerX = this.padding + x * this.gridSize;
        const centerY = this.padding + y * this.gridSize;
        const radius = this.gridSize / 2 - 2;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        
        // 渐变效果让棋子更立体
        const gradient = this.ctx.createRadialGradient(
            centerX - 2, centerY - 2, radius / 3,
            centerX, centerY, radius
        );

        if (role === 1) { // 黑棋
            gradient.addColorStop(0, "#666");
            gradient.addColorStop(1, "#000");
        } else { // 白棋
            gradient.addColorStop(0, "#fff");
            gradient.addColorStop(1, "#ddd");
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // 阴影
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.stroke(); // 描边
        this.ctx.shadowColor = "transparent"; // 重置阴影
    }

    handleClick(e) {
        if (this.isGameOver || this.currentPlayer !== 1) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 计算最近的交叉点
        const col = Math.round((x - this.padding) / this.gridSize);
        const row = Math.round((y - this.padding) / this.gridSize);

        // 边界检查
        if (col < 0 || col >= this.boardSize || row < 0 || row >= this.boardSize) return;
        
        // 检查是否已有棋子
        if (this.board[row][col] !== 0) return;

        // 玩家落子
        this.placePiece(col, row, 1);
        
        if (!this.isGameOver) {
            // AI 落子
            setTimeout(() => this.aiMove(), 500);
        }
    }

    placePiece(x, y, role) {
        this.board[y][x] = role;
        this.history.push({x, y, role});
        this.drawBoard();

        if (this.checkWin(x, y, role)) {
            this.isGameOver = true;
            if (role === 1) {
                this.updateStatus("恭喜你！你赢了！");
            } else {
                this.updateStatus("很遗憾，电脑赢了。");
            }
            return;
        }

        // 切换角色
        this.currentPlayer = role === 1 ? 2 : 1;
    }

    // 简易AI：基于评分系统
    aiMove() {
        if (this.isGameOver) return;

        let bestScore = -Infinity;
        let bestMoves = [];

        // 遍历所有空位进行评分
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                if (this.board[y][x] === 0) {
                    // 评估该位置对AI的价值(进攻)和对玩家的威胁(防守)
                    const score = this.evaluatePoint(x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMoves = [{x, y}];
                    } else if (score === bestScore) {
                        bestMoves.push({x, y});
                    }
                }
            }
        }

        if (bestMoves.length > 0) {
            // 随机选择一个最高分的位置，增加一点变数
            const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            this.placePiece(move.x, move.y, 2);
        }
    }

    // 评估函数
    evaluatePoint(x, y) {
        // 简单启发式：进攻分数 + 防守分数
        // 这里为了代码简洁，使用一个简化的评分逻辑
        // 实际项目中可以使用更复杂的权值表
        
        let score = 0;
        
        // 模拟AI下在这里的得分 (进攻)
        score += this.getDirectionScore(x, y, 2); 
        // 模拟玩家下在这里的得分 (防守，权重通常更高，因为要堵截)
        score += this.getDirectionScore(x, y, 1) * 1.2; 

        // 中心位置加分
        const centerDist = Math.abs(x - 6) + Math.abs(y - 6);
        score += (12 - centerDist); 

        return score;
    }

    getDirectionScore(x, y, role) {
        let totalScore = 0;
        const directions = [
            [1, 0],  // 横向
            [0, 1],  // 纵向
            [1, 1],  // 右下斜
            [1, -1]  // 左下斜
        ];

        for (let [dx, dy] of directions) {
            let count = 1; // 当前假设落子
            let blockedEnds = 0;

            // 正向检查
            let i = 1;
            while (true) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) {
                    blockedEnds++;
                    break;
                }
                if (this.board[ny][nx] === role) {
                    count++;
                } else if (this.board[ny][nx] === 0) {
                    break;
                } else {
                    blockedEnds++;
                    break;
                }
                i++;
            }

            // 反向检查
            i = 1;
            while (true) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) {
                    blockedEnds++;
                    break;
                }
                if (this.board[ny][nx] === role) {
                    count++;
                } else if (this.board[ny][nx] === 0) {
                    break;
                } else {
                    blockedEnds++;
                    break;
                }
                i++;
            }

            // 根据连子数和被封堵情况评分
            if (count >= 5) totalScore += 100000;
            else if (count === 4) {
                if (blockedEnds === 0) totalScore += 10000; // 活四
                else if (blockedEnds === 1) totalScore += 1000; // 冲四
            } else if (count === 3) {
                if (blockedEnds === 0) totalScore += 1000; // 活三
                else if (blockedEnds === 1) totalScore += 100; // 眠三
            } else if (count === 2) {
                if (blockedEnds === 0) totalScore += 100; // 活二
            }
        }
        return totalScore;
    }

    checkWin(x, y, role) {
        const directions = [
            [1, 0],  // 横
            [0, 1],  // 竖
            [1, 1],  // 斜
            [1, -1]  // 反斜
        ];

        for (let [dx, dy] of directions) {
            let count = 1;
            
            // 正向
            let i = 1;
            while (true) {
                const nx = x + dx * i;
                const ny = y + dy * i;
                if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize || this.board[ny][nx] !== role) break;
                count++;
                i++;
            }
            
            // 反向
            i = 1;
            while (true) {
                const nx = x - dx * i;
                const ny = y - dy * i;
                if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize || this.board[ny][nx] !== role) break;
                count++;
                i++;
            }

            if (count >= 5) return true;
        }
        return false;
    }
}

// 启动游戏
const game = new GomokuGame('chessBoard');
