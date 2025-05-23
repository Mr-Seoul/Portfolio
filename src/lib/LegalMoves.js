import {getSide, getColour, getLegalMoves} from "$lib/Chess";

onmessage = function (event) {
    let allLegalMoves = {};
    let { board } = event.data;
    let currentBoard = JSON.parse(board);
    for (let i = 0; i < 64; i++) {
        if (getSide(currentBoard) == getColour(i,currentBoard)) {
            allLegalMoves[JSON.stringify(i)] = getLegalMoves(i,currentBoard,true);
        }
    }
    
    postMessage({moves:allLegalMoves});
};