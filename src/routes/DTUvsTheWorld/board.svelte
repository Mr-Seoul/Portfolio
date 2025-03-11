<script>
    import {fly,fade} from "svelte/transition";
    import Tile from "./tile.svelte";
    import { onMount } from "svelte";
    import {resetPiece} from "$lib/DTUvsTheWorld";
    import {movePiece,MakeMove,getSide,inputToIndex,inputToXY,getColour, indexToXY,XYToIndex, XYToChess,ChessToXY,getTile,setTile,incrementTurn,changeSide,getLegalMoves, inCheck} from "$lib/Chess";

    let board = $state({
        //Pawn: P, Knight: N, Bishop: B, Rook: R, Queen: Q, King: K
        state: [],
        moves: [],
        side: 1, //1 = white, 2 = black
        turn: 1
    } );

    let highlight = $state({
        state: []
    })

    let absoluteMousePosition = $state({x: 0, y: 0});
    let mousePosition = $state({x: 0, y: 0});
    let boardPosition = $state({x:0, y:0});
    let tilePosition = $state({x:0, y:0});
    let selectedPosition = $state({x:-1,y:-1});
    let previousSelectedPosition = $state({x:-1,y:-1});
    let boardFlipped = $state(true);
    let pageLoaded = $state(false);

    let boardObject = $state();
    let gameResult = $state();
    let pawnPromoting = $state(false);
    let SavedSelectedposition = $state({x:-1,y:-1})
    let SavedTileposition = $state({x:-1,y:-1})

    let allLegalMoves = {};
    let calculatingLegalMoves = false;
    let w;
    
    function initHighlight() {
        for (let i = 0; i < 64; i++) {
            highlight.state.push(false);
        }
    }

    function getHightlight(input) {
        return highlight.state[inputToIndex(input)];
    }

    function resetHightlight() {
        for (let i = 0; i < 64; i++) {
            highlight.state[i] = false;
        }
    }

    function mapHighlight(arr) {
        resetHightlight();
        for (let i = 0; i < arr.length; i++) {
            highlight.state[XYToIndex(arr[i])] = true;
        }        
    }

    function MoveAndPromotePawn(XYFrom,XYTo,promotion,currentBoard) {
        XYFrom = inputToXY(XYFrom);
        XYTo = inputToXY(XYTo);
        promotion = (getSide(board) == 1 ? promotion.toUpperCase() : promotion.toLowerCase());

        MakeFinalMove(XYFrom,XYTo);
        setTile(XYTo,promotion,board,false);
        setAllLegalMoves(board);
        pawnPromoting = false;
        previousSelectedPosition = XYFrom;
        //Hacky Way to add the promotion type to notation.
        board.moves[board.moves.length -1] += promotion.toUpperCase();
    }

    function MakeFinalMove(XYFrom,XYTo,updateLegalMoves) {
        XYFrom = inputToXY(XYFrom);
        XYTo = inputToXY(XYTo);
        
        MakeMove(XYFrom,XYTo,board);
        if (updateLegalMoves) {
            setAllLegalMoves(board);
        }
        resetHightlight();

        previousSelectedPosition = selectedPosition;
        selectedPosition = {x:-1,y:-1};
    }
    
    function resetBoard(currentBoard) {
        currentBoard.state = [];
        currentBoard.state.push("R","N","B", "K", "Q", "B", "N", "R",
                     "P","P","P", "P", "P", "P", "P", "P",
                     "","","", "", "", "", "", "",
                     "","","", "", "", "", "", "",
                     "","","", "", "", "", "", "",
                     "","","", "", "", "", "", "",
                     "p","p","p", "p", "p", "p", "p", "p",
                     "r","n","b", "k", "q", "b", "n", "r");
        currentBoard.moves = [];
        currentBoard.side = 1;
        currentBoard.turn = 1;
        previousSelectedPosition = {x:-1,y:-1};
        selectedPosition = {x:-1,y:-1};
    }

    function setAllLegalMoves(currentBoard) {
        if (typeof(Worker) != "undefined") {
            //Webworker support, so calculate legalmoves via another script
            w.postMessage({"board": JSON.stringify(board)});
            calculatingLegalMoves = true;
        }   else {
            //No Webworker support, so calculate legalmoves on this thread
            allLegalMoves = {};
            for (let i = 0; i < 64; i++) {
                if (getSide(currentBoard) == getColour(i,currentBoard)) {
                    allLegalMoves[JSON.stringify(i)] = getLegalMoves(i,currentBoard,true);
                }
            }
        }
    }

    function getNumLegalMoves() {
        let num = 0;
        Object.values(allLegalMoves).forEach((element) => {num+=element.length});
        return num;
    }

    onMount(() => {
        try {
            w = new Worker(new URL("$lib/LegalMoves.js", import.meta.url), { type: "module" });
            w.onmessage = function(event){
                const {moves} = event.data;
                allLegalMoves = moves;
                calculatingLegalMoves = false;
            };
            resetBoard(board);
            initHighlight();
            setAllLegalMoves(board);
        } catch (error) {
            console.error("Error in onMount:", error);
        }
        pageLoaded = true;
    });

    function getBoardPosition() {
        if (boardObject) {
            const rect = boardObject.getBoundingClientRect();
            boardPosition.x = rect.left;
            boardPosition.y = rect.top;
        }
    }

	function onmousemove(e) {
        getBoardPosition();
        absoluteMousePosition = {x: e.clientX, y: e.clientY};
        mousePosition = {x: absoluteMousePosition.x-boardPosition.x - 10, y: absoluteMousePosition.y-boardPosition.y - 10};
        if (boardFlipped) {
            tilePosition = {x:7- Math.floor(mousePosition.x/60), y:7 - Math.floor(mousePosition.y/60)};
        } else {
            tilePosition = {x:Math.floor(mousePosition.x/60), y:Math.floor(mousePosition.y/60)};
        }
	}

    function onmousedown() {
        if (!gameResult && !pawnPromoting && !calculatingLegalMoves) {
            if ( 0 <= tilePosition.x && 0<=tilePosition.y && tilePosition.x <= 7 && tilePosition.y <= 7  && getColour(tilePosition,board) == board.side){
                if (JSON.stringify(selectedPosition) == JSON.stringify({x:-1,y:-1}) || getColour(selectedPosition,board) == getColour(tilePosition,board)) {
                    selectedPosition = tilePosition;
                    mapHighlight(allLegalMoves[JSON.stringify(XYToIndex(tilePosition))]);
                }
            }
        }
    }

    function onmouseup() {
        if (tilePosition != selectedPosition && getColour(selectedPosition,board) != getColour(tilePosition,board) && allLegalMoves[JSON.stringify(XYToIndex(selectedPosition))] && allLegalMoves[JSON.stringify(XYToIndex(selectedPosition))].some(obj => obj.x == tilePosition.x && obj.y == tilePosition.y) && getColour(selectedPosition,board) == getSide(board) && !calculatingLegalMoves) {
            if (Math.floor(XYToIndex(tilePosition)/8) == (getSide(board) ==  1 ? 7 : 0) && getTile(selectedPosition,board).toLowerCase() == 'p') {
                //Pawn Promotion Logic
                pawnPromoting = true;
                SavedSelectedposition = selectedPosition;
                SavedTileposition = tilePosition;
                
            } else {
                MakeFinalMove(selectedPosition,tilePosition,true);
            }

            if (getNumLegalMoves() == 0) {
                if (inCheck(board,getSide(board))) {
                    gameResult = getSide(board) == 1 ? 2 : 1;
                    board.moves.push(getSide(board) == 1 ? "0-1" : "1-0");
                } else {
                    gameResult = 0.5;
                    board.moves.push("0.5-0.5");
                }
                resetHightlight();
            }

        } else if (getTile(tilePosition,board) == "") {
            selectedPosition = {x:-1,y:-1};
            resetHightlight();
        }
    }

    function onmouseleave() {
        selectedPosition = {x:-1, y:-1};
    }

    function gameMessage() {
        if (gameResult == 1) {
            return "White Wins" 
        } else if (gameResult == 2) {
            return "Black Wins" 
        } if (gameResult == 0.5) {
            return "Draw" 
        } else {
            return "Error"
        }
    }
</script>

<div style="display:grid;grid-template-columns: auto auto; gap:20px;">
    {#if pageLoaded}
        <div role="button" tabindex="0" {onmousedown} {onmouseup} {onmousemove} {onmouseleave} bind:this={boardObject} in:fly= {{x:-50,duration:2000,opacity:0}} id="board">
            <div style="display:grid;grid-template-columns: 1fr; grid-template-rows: auto auto; width:480px;height:480px;">
                {#if pawnPromoting}
                    <div style="grid-column: 1 / -1;grid-row: 1 / -1;z-index: 2;align-items: center; justify-content: center;display:flex;">
                        <div style="display:grid;grid-template-columns: auto auto auto auto; grid-template-rows: 1fr;padding:10px;background-color:dimgray;border-radius:20px;box-shadow: 3px 3px 1px rgb(0,0,0,0.25); text-align: center">
                            <button style="padding: 0px; height: 70px;width: 70px;" onclick={() => {MoveAndPromotePawn(SavedSelectedposition,SavedTileposition,'q',board);}}><img alt="" id="Queen" src={resetPiece(getSide(board)==1 ? 'Q' : 'q')}></button>
                            <button style="padding: 0px; height: 70px;width: 70px;" onclick={() => {MoveAndPromotePawn(SavedSelectedposition,SavedTileposition,'n',board);}}><img alt="" id="Knight" src={resetPiece(getSide(board)==1 ? 'N' : 'n')}></button>
                            <button style="padding: 0px; height: 70px;width: 70px;" onclick={() => {MoveAndPromotePawn(SavedSelectedposition,SavedTileposition,'b',board);}}><img alt="" id="Bishop" src={resetPiece(getSide(board)==1 ? 'B' : 'b')}></button>
                            <button style="padding: 0px; height: 70px;width: 70px;" onclick={() => {MoveAndPromotePawn(SavedSelectedposition,SavedTileposition,'r',board);}}><img alt="" id="Rook" src={resetPiece(getSide(board)==1 ? 'R' : 'r')}></button>
                        </div>
                    </div>
                {/if}
                {#if gameResult}
                    <div style="grid-column: 1 / -1;grid-row: 1 / -1;z-index: 2;align-items: center; justify-content: center;display:flex;">
                        <div style="padding:10px;background-color:dimgray;border-radius:20px;box-shadow: 3px 3px 1px rgb(0,0,0,0.25); text-align: center">
                            <p>{gameMessage()}</p>
                            <button onclick={() => {resetBoard(board);gameResult = null;setAllLegalMoves(board);}}>Play Again</button>
                        </div>
                    </div>
                {/if}
                
                <div style="width: 480px; height: 480px;grid-column: 1 / -1;grid-row: 1 / -1;z-index: 1;">
                    <div style="display:grid;grid-template-columns: repeat(8, 1fr);grid-template-rows: repeat(8, 1fr)">
                        {#each board.state as row, index}
                            {@const reverseIndex = board.state.length - index - 1}
                            {#if boardFlipped} <Tile highlighted={getHightlight(reverseIndex)} prevTile={previousSelectedPosition} index={reverseIndex} delay={(reverseIndex%8 + Math.floor(reverseIndex/8))*50} piece={board.state[reverseIndex]}></Tile>{/if}
                            {#if !boardFlipped} <Tile highlighted={getHightlight(index)} index={index} delay={(index%8 + Math.floor(index/8))*50} piece={board.state[index]}></Tile>{/if}
                        {/each}
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 20px; width: 480px;text-align: right;justify-content: space-between;">
                <div><p style=" background: lightgray;padding: 5px;border-radius: 5px; box-shadow: 5px 5px 2px rgb(0,0,0,0.25);" in:fly= {{x:100, duration:2000, opacity:0,delay:2000}}>Turn: {board.turn} | {board.side == 1? "White" : "Black"} to move</p></div>
                <div style="display:flex;"><button in:fly={{x:-25, duration:2000, opacity:0,delay:2000}} onclick={() => {boardFlipped = ! boardFlipped}}>Flip Board</button>
                <button key={board.turn} style="background-color: {board.turn >= 40 ? 'lightgray' : 'dimgray'}" 
                    in:fly={{x:-25, duration:2000, opacity:0, delay:2000}} 
                    onclick={() => {if (board.turn >= 40) {board.moves.push("0.5-0.5"); gameResult = 0.5;}}}>
                Offer Draw</button></div>
            </div>
        </div>
        <div in:fade= {{duration:200}} style="background: lightgray; border-radius:20px; justify-self:center; width:200px;">
            <h2 style="text-align: center;">Moves</h2>
            <div style="overflow-y: scroll;height:63vh;">
                {#each board.moves as _,index}
                    {#if board.moves.length > 2*index  + 1}
                        <p style="background: darkgray;box-shadow: 0px 3px 1px rgb(0,0,0,0.25);">{ index + 1 }. {board.moves[index*2]} {board.moves[index*2+1]} </p>
                    {:else if board.moves.length >= 2*index + 1}
                        <p in:fade= {{duration:50}} style="background: darkgray;box-shadow: 0px 3px 1px rgb(0,0,0,0.25);">{ index + 1 }. {board.moves[index*2]} </p>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    button {
        align-self: center;
        background: lightgray;
        border-color: lightgray;
        height: 32px;
        padding: 5px; 
        box-shadow: 5px 5px 2px rgb(0,0,0,0.25);
    }
</style>