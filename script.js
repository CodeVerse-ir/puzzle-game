const puzzleElement = document.getElementById('puzzle');
const shuffleButton = document.getElementById('shuffle');
const solveBFSButton = document.getElementById('solveBFS');
const solveBDSButton = document.getElementById('solveBDS');
const myClock = document.getElementById('clock');
const myCounter = document.getElementById('counter');
const solveAStarButton = document.getElementById('solveAStar');


const size = 3;
const shuffle = 50;
let tiles = [];

// Clock
var min = 10;
var sec = 0;
var set;

// Counter
var userCount = 0;
var BFSCount = 0;
var BDSCount = 0;
var aStarCount = 0;

// timer 
var bfsTime = 0;
var bdsTime = 0;
var aStarTime = 0;

// Moves for BFS and BDS and A*
var bfsMoves;
var bdsMoves;
var aStarMoves;

function clock() {
    clearInterval(set); // Clear any previous timers before starting a new one
    set = setInterval(() => {
        if (userCount > Math.max(bfsMoves.length + 10, bdsMoves.length + 10, aStarMoves.length + 10)) {
            alert("باختی !!!");
            resetClockAndCounter();
            initializePuzzle();
            clearInterval(set);
        }
        if (sec === 0) {
            if (min === 0) {
                alert("باختی !!!");
                resetClockAndCounter();
                initializePuzzle();
                clearInterval(set);
            } else {
                min -= 1;
                sec = 59;
            }
        } else {
            sec -= 1;
        }
        updateClockDisplay();
    }, 1000);
}

function resetClockAndCounter() {
    min = 10;
    sec = 0;
    userCount = 0;
    BFSCount = 0;
    BDSCount = 0;
    updateClockDisplay();
    updateCounterDisplay();
}

function updateClockDisplay() {
    myClock.innerHTML = "ساعت : " + (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
}

function updateCounterDisplay() {
    myCounter.innerHTML = "تعداد : " + userCount;
}

function initializePuzzle() {
    tiles = [];
    for (let i = 0; i < size * size; i++) {
        tiles.push(i);
    }

    renderPuzzle();
}

function renderPuzzle() {
    puzzleElement.style.gridTemplateColumns = `repeat(${size}, 100px)`
    puzzleElement.innerHTML = '';
    tiles.forEach(number => {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        if (number === 0) {
            tile.classList.add('empty');
            tile.innerHTML = '';
        } else {
            tile.innerHTML = number;
            tile.addEventListener('click', () => moveTile(number));
        }
        puzzleElement.appendChild(tile);
    });
}

function shufflePuzzle() {
    const moves = ['up', 'down', 'left', 'right'];
    for (let i = 0; i < shuffle; i++) {
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        makeMove(randomMove);
    }
    clock();
    renderPuzzle();

    // timer
    // BFS 
    const bfsStart = performance.now();
    bfsMoves = bfsSolvePuzzle();
    const bfsEnd = performance.now();
    bfsTime = bfsEnd - bfsStart;

    // BDS 
    const bdsStart = performance.now();
    bdsMoves = bidirectionalSolvePuzzle();
    const bdsEnd = performance.now();
    bdsTime = bdsEnd - bdsStart;

    // A*   
    const aStarStart = performance.now();
    aStarMoves = aStarSolvePuzzle();
    const aStarEnd = performance.now();
    aStarTime = aStarEnd - aStarStart;

    console.log("BFS Moves:", bfsMoves.length);
    console.log("BFS زمان:", bfsTime.toFixed(2) + "ms");
    console.log("BDS Moves:", bdsMoves.length);
    console.log("BDS زمان:", bdsTime.toFixed(2) + "ms");
    console.log("A* Moves:", aStarMoves.length);
    console.log("A* زمان:", aStarTime.toFixed(2) + "ms");
}

function makeMove(direction) {
    const emptyIndex = tiles.indexOf(0);
    let tileIndex;
    switch (direction) {
        case 'up':
            tileIndex = emptyIndex - size;
            if (tileIndex < 0) return;
            break;
        case 'down':
            tileIndex = emptyIndex + size;
            if (tileIndex >= tiles.length) return;
            break;
        case 'left':
            tileIndex = emptyIndex - 1;
            if (emptyIndex % size === 0) return;
            break;
        case 'right':
            tileIndex = emptyIndex + 1;
            if ((emptyIndex + 1) % size === 0) return;
            break;
        default:
            return;
    }
    [tiles[emptyIndex], tiles[tileIndex]] = [tiles[tileIndex], tiles[emptyIndex]];
}

function moveTile(number) {
    const target = Array.from({ length: size * size }, (_, i) => i);
    const emptyIndex = tiles.indexOf(0);
    const tileIndex = tiles.indexOf(number);
    if (canMove(emptyIndex, tileIndex)) {
        [tiles[emptyIndex], tiles[tileIndex]] = [tiles[tileIndex], tiles[emptyIndex]];
        userCount++;
        updateCounterDisplay();
        renderPuzzle();
        if (tiles.toString() === target.toString()) {
            setTimeout(() => {
                alert("آفرین! پازل کامل شد!");
                resetClockAndCounter();
                clearInterval(set);
            }, 1000);
        }
    }
}

function canMove(emptyIndex, tileIndex) {
    const rowEmpty = Math.floor(emptyIndex / size);
    const colEmpty = emptyIndex % size;
    const rowTile = Math.floor(tileIndex / size);
    const colTile = tileIndex % size;
    const isAdjacent = (Math.abs(rowEmpty - rowTile) + Math.abs(colEmpty - colTile)) === 1;
    return isAdjacent;
}

// BFS
function bfsSolvePuzzle() {
    const target = Array.from({ length: size * size }, (_, i) => i);
    const queue = [{ tiles: [...tiles], moves: [] }];
    const seen = new Set();
    seen.add(tiles.toString());

    let bfsNodeCount = 1;

    while (queue.length > 0) {
        const { tiles: current, moves } = queue.shift();
        if (current.toString() === target.toString()) {
            console.log("تعداد نودهای دیده‌شده در BFS:", bfsNodeCount);
            return moves;
        }
        const emptyIndex = current.indexOf(0);
        const possibleMoves = getPossibleMoves(emptyIndex);
        for (const move of possibleMoves) {
            const newTiles = [...current];
            const tileIndex = emptyIndex + move.delta;
            [newTiles[emptyIndex], newTiles[tileIndex]] = [newTiles[tileIndex], newTiles[emptyIndex]];
            if (!seen.has(newTiles.toString())) {
                seen.add(newTiles.toString());
                bfsNodeCount++;
                queue.push({ tiles: newTiles, moves: [...moves, move.direction] });
            }
        }
    }
}

// Bidirectional search method
function bidirectionalSolvePuzzle() {
    const target = Array.from({ length: size * size }, (_, i) => i);
    const startQueue = [{ tiles: [...tiles], moves: [] }];
    const endQueue = [{ tiles: [...target], moves: [] }];

    const startSeen = new Map();
    const endSeen = new Map();

    startSeen.set(tiles.toString(), []);
    endSeen.set(target.toString(), []);

    let bdsNodeCount = 1;

    while (startQueue.length > 0 && endQueue.length > 0) {
        const startStep = startQueue.shift();
        const endStep = endQueue.shift();


        if (endSeen.has(startStep.tiles.toString())) {
            console.log("تعداد نودهای دیده‌شده در BDS:", bdsNodeCount);
            return mergePaths(startStep.moves, endSeen.get(startStep.tiles.toString()));
        }
        if (startSeen.has(endStep.tiles.toString())) {
            console.log("تعداد نودهای دیده‌شده در BDS:", bdsNodeCount);
            return mergePaths(startSeen.get(endStep.tiles.toString()), endStep.moves);
        }

        expandMoves(startQueue, startSeen, startStep, () => {
            bdsNodeCount++;
        });
        expandMoves(endQueue, endSeen, endStep, () => {
            bdsNodeCount++;
        });
    }
}

function mergePaths(startMoves, endMoves) {
    const endPath = endMoves.reverse().map(move => getOppositeDirection(move));
    return [...startMoves, ...endPath];
}

function expandMoves(queue, seen, step, onNewNodeSeen) {
    const emptyIndex = step.tiles.indexOf(0);
    const possibleMoves = getPossibleMoves(emptyIndex);
    for (const move of possibleMoves) {
        const newTiles = [...step.tiles];
        const tileIndex = emptyIndex + move.delta;
        [newTiles[emptyIndex], newTiles[tileIndex]] = [newTiles[tileIndex], newTiles[emptyIndex]];
        const newTilesString = newTiles.toString();
        if (!seen.has(newTilesString)) {
            seen.set(newTilesString, step.moves.concat(move.direction));
            onNewNodeSeen();
            queue.push({ tiles: newTiles, moves: [...step.moves, move.direction] });
        }
    }
}

function getPossibleMoves(emptyIndex) {
    const moves = [];
    if (emptyIndex >= size) {
        moves.push({ delta: -size, direction: 'up' });
    }
    if (emptyIndex < size * (size - 1)) {
        moves.push({ delta: size, direction: 'down' });
    }
    if (emptyIndex % size !== 0) {
        moves.push({ delta: -1, direction: 'left' });
    }
    if ((emptyIndex + 1) % size !== 0) {
        moves.push({ delta: 1, direction: 'right' });
    }
    return moves;
}

function getOppositeDirection(direction) {
    switch (direction) {
        case 'up': return 'down';
        case 'down': return 'up';
        case 'left': return 'right';
        case 'right': return 'left';
    }
}

// A*
function heuristic(tiles) {

    let distance = 0;
    for (let i = 0; i < tiles.length; i++) {
        if (tiles[i] !== 0) {
            const targetIndex = tiles[i];
            const currentRow = Math.floor(i / size);
            const currentCol = i % size;
            const targetRow = Math.floor(targetIndex / size);
            const targetCol = targetIndex % size;
            distance += Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
        }
    }
    return distance;
}

function aStarSolvePuzzle() {
    const target = Array.from({ length: size * size }, (_, i) => i);
    const startNode = {
        tiles: [...tiles],
        moves: [],
        cost: 0,
        priority: heuristic(tiles)
    };
    const queue = [startNode];
    const seen = new Map();
    seen.set(tiles.toString(), 0);

    let aStarNodeCount = 1;

    while (queue.length > 0) {
        queue.sort((a, b) => a.priority - b.priority);
        const current = queue.shift();

        if (current.tiles.toString() === target.toString()) {
            console.log("تعداد نودهای دیده‌شده در A*:", aStarNodeCount);
            return current.moves;
        }

        const emptyIndex = current.tiles.indexOf(0);
        const possibleMoves = getPossibleMoves(emptyIndex);
        for (const move of possibleMoves) {
            const newTiles = [...current.tiles];
            const tileIndex = emptyIndex + move.delta;
            [newTiles[emptyIndex], newTiles[tileIndex]] = [newTiles[tileIndex], newTiles[emptyIndex]];
            const newTilesString = newTiles.toString();
            const newCost = current.cost + 1;

            if (!seen.has(newTilesString) || newCost < seen.get(newTilesString)) {
                seen.set(newTilesString, newCost);
                aStarNodeCount++;
                const newPriority = newCost + heuristic(newTiles);
                queue.push({
                    tiles: newTiles,
                    moves: [...current.moves, move.direction],
                    cost: newCost,
                    priority: newPriority
                });
            }
        }
    }
}

function performMoves(moves, isBFS) {
    let index = 0;
    const interval = setInterval(() => {
        if (index < moves.length) {
            makeMove(moves[index]);
            renderPuzzle();
            if (isBFS === "bfs") {
                myCounter.innerHTML = "تعداد : " + (++BFSCount);
            } else if (isBFS === "bds") {
                myCounter.innerHTML = "تعداد : " + (++BDSCount);
            } else {
                myCounter.innerHTML = "تعداد : " + (++aStarCount);
            }
            index++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                alert(isBFS ? "آفرین! BFS پازل کامل شد!" : "آفرین! BDS پازل کامل شد!");
                resetClockAndCounter();
                clearInterval(set);
            }, 1000);
        }
    }, 500);
}


shuffleButton.addEventListener('click', shufflePuzzle);
solveBFSButton.addEventListener('click', () => performMoves(bfsMoves, "bfs"));
solveBDSButton.addEventListener('click', () => performMoves(bdsMoves, "bds"));
solveAStarButton.addEventListener('click', () => performMoves(aStarMoves, "aStar"));

initializePuzzle();