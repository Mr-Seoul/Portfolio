<script>
    import {fly,fade} from "svelte/transition";
    import { onMount } from "svelte";
    import {resetPiece} from "$lib/DTUvsTheWorld";
    import { tick } from "svelte";
    import {getSide,inputToIndex,inputToXY,getColour,XYToIndex,getTile} from "$lib/Chess";
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
    let gettingresponse = false

    let boardObject = $state();
    let Tile = $state();
    let TilesLoaded = $state(false);
    let gameResult = $state();
    let pawnPromoting = $state(false);
    let SavedSelectedposition = $state({x:-1,y:-1})
    let SavedTileposition = $state({x:-1,y:-1})

    let allLegalMoves = {};
    let calculatingLegalMoves = false;
    let w;

    let APIadress = "http://localhost:8080/";
    
    function initHighlight() {
        for (let i = 0; i < 64; i++) {
            highlight.state.push(false);
        }
    }

    function getHightlight(input) {
        return highlight.state[inputToIndex(input)];
    }

    function resetHightlight() {
        highlight.state.fill(false);
    }

    async function mapHighlight(arr) {
        resetHightlight();
        for (let i = 0; i < arr.length; i++) {
            highlight.state[XYToIndex(arr[i])] = true;
        }    
        
        await tick(); 
    }

    function MakeFinalMove(XYFrom,XYTo, promotion) {
        XYFrom = inputToXY(XYFrom);
        XYTo = inputToXY(XYTo);
        promotion = (getSide(board) == 1 ? promotion.toUpperCase() : promotion.toLowerCase());
        //Edit here to integrate API. Just call the api and then get the board state if the move is successfull.

        let index = XYToIndex(XYFrom);
        let data = JSON.stringify({ key : {"index":index,"x":XYTo.x,"y":XYTo.y,"promotion":promotion}});
        fetch(APIadress+"makemove",{method: "POST",body: data,headers: {"Content-type": "application/json; charset=UTF-8"}}).then((res) => {
            //If successfull move
            if (res.status == 200) {
                updatemoveandboard();
            }
        }).catch((error) => {console.error("Error in making move:", error)});
        
        gettingresponse = true;
        previousSelectedPosition = XYFrom;
        selectedPosition = {x:-1,y:-1};

        //Promotion logic
        pawnPromoting = false;
    }
    
    function resetBoard() {
        fetch(APIadress+"reset",{method: "POST",headers: {"Content-type": "application/json; charset=UTF-8"}}).then((res) => {
            //If successfull move
            if (res.status == 200) {
                updatemoveandboard();
            }
        }).catch((error) => {console.error("Error in resetting board:", error)});
        previousSelectedPosition = {x:-1,y:-1};
        selectedPosition = {x:-1,y:-1};
    }

    async function updatemoveandboard() {
        fetch(APIadress+"board").then((res)=>{return res.json();})
        .then((data)=>{
            for (var key in data.state) {
                if (data.state[key] != board.state[Number(key)]) {
                    board.state[Number(key)] = data.state[key];
                }
            }
            board.moves = data.moves
            if (board.moves.length > 0) {
                if (board.moves[board.moves.length-1].notation == "1-0") {
                    gameResult = 1;
                } else if (board.moves[board.moves.length-1].notation == "0-1") {
                    gameResult = 2;
                } else if (board.moves[board.moves.length-1].notation == "0.5-0.5") {
                    gameResult = 0.5;
                }
            }
            
            board.side = data.side
            board.turn = data.turn;})
        .catch((error) => {
            console.error("Error in onMount:", error);
        });
        //Moves
        fetch(APIadress+"moves").then((res2) => {return res2.json();}).then((data)=> {
            allLegalMoves = data.moves;
            calculatingLegalMoves = false;
            
            resetHightlight(); 
            pageLoaded = true;
            gettingresponse = false
        }).catch((error) => {
        console.error("Error in onMount:", error);
        });
    }
    
    onMount(async () => {
        //Board
        initHighlight();
        updatemoveandboard();

        const TileModule = await import("./tile.svelte");
        Tile = TileModule.default;
        TilesLoaded = true;
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
                    if (!gettingresponse) {
                        mapHighlight(allLegalMoves[JSON.stringify(XYToIndex(tilePosition))]);
                    }
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
                MakeFinalMove(selectedPosition,tilePosition," ");
            }

        } else if (getTile(tilePosition,board) == " ") {
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

    function offerdraw() {
        fetch(APIadress+"draw",{method: "POST",headers: {"Content-type": "application/json; charset=UTF-8"}}).then((res) => {
            if (res.status==200) {
                updatemoveandboard();
            }
        });
    }
</script>

<div style="display:grid;grid-template-columns: auto auto; gap:20px;">
    {#if pageLoaded}
        <div role="button" tabindex="0" {onmousedown} {onmouseup} {onmousemove} {onmouseleave} bind:this={boardObject} in:fly= {{x:-50,duration:2000,opacity:0}} id="board">
            <div style="display:grid;grid-template-columns: 1fr; grid-template-rows: auto auto; width:480px;height:480px;">
                {#if pawnPromoting}
                    <div style="grid-column: 1 / -1;grid-row: 1 / -1;z-index: 2;align-items: center; justify-content: center;display:flex;">
                        <div style="display:grid;grid-template-columns: auto auto auto auto; grid-template-rows: 1fr;padding:10px;background-color:dimgray;border-radius:20px;box-shadow: 3px 3px 1px rgb(0,0,0,0.25); text-align: center">
                            <button style="padding: 0px; height: 70px;width: 70px;" onclick={() => {MakeFinalMove(SavedSelectedposition,SavedTileposition,"q");}}><img alt="" id="Queen" src={resetPiece(getSide(board)==1 ? 'Q' : 'q')}></button>
                            <button style="padding: 0px; height: 70px;width: 70px;" onclick={() => {MakeFinalMove(SavedSelectedposition,SavedTileposition,"n");}}><img alt="" id="Knight" src={resetPiece(getSide(board)==1 ? 'N' : 'n')}></button>
                            <button style="padding: 0px; height: 70px;width: 70px;" onclick={() => {MakeFinalMove(SavedSelectedposition,SavedTileposition,"b");}}><img alt="" id="Bishop" src={resetPiece(getSide(board)==1 ? 'B' : 'b')}></button>
                            <button style="padding: 0px; height: 70px;width: 70px;" onclick={() => {MakeFinalMove(SavedSelectedposition,SavedTileposition,"r");}}><img alt="" id="Rook" src={resetPiece(getSide(board)==1 ? 'R' : 'r')}></button>
                        </div>
                    </div>
                {/if}
                {#if gameResult}
                    <div style="grid-column: 1 / -1;grid-row: 1 / -1;z-index: 2;align-items: center; justify-content: center;display:flex;">
                        <div style="padding:10px;background-color:dimgray;border-radius:20px;box-shadow: 3px 3px 1px rgb(0,0,0,0.25); text-align: center">
                            <p>{gameMessage()}</p>
                            <button onclick={() => {resetBoard();gameResult = null;;}}>Play Again</button>
                        </div>
                    </div>
                {/if}
                
                <div style="width: 480px; height: 480px;grid-column: 1 / -1;grid-row: 1 / -1;z-index: 1;">
                    <div style="display:grid;grid-template-columns: repeat(8, 1fr);grid-template-rows: repeat(8, 1fr)">
                        {#if TilesLoaded}
                            {#each board.state as row, index}
                                {@const reverseIndex = board.state.length - index - 1}
                                {#if boardFlipped} <Tile highlighted={getHightlight(reverseIndex)} prevTile={previousSelectedPosition} index={reverseIndex} delay={(reverseIndex%8 + Math.floor(reverseIndex/8))*50} piece={board.state[reverseIndex]}></Tile>{/if}
                                {#if !boardFlipped} <Tile highlighted={getHightlight(index)} index={index} delay={(index%8 + Math.floor(index/8))*50} piece={board.state[index]}></Tile>{/if}
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 20px; width: 480px;text-align: right;justify-content: space-between;">
                <div><p style=" background: lightgray;padding: 5px;border-radius: 5px; box-shadow: 5px 5px 2px rgb(0,0,0,0.25);" in:fly= {{x:100, duration:2000, opacity:0,delay:2000}}>Turn: {board.turn} | {board.side == 1? "White" : "Black"} to move</p></div>
                <div style="display:flex;"><button in:fly={{x:-25, duration:2000, opacity:0,delay:2000}} onclick={() => {boardFlipped = ! boardFlipped}}>Flip Board</button>
                <button key={board.turn} style="background-color: {board.turn >= 20 ? 'lightgray' : 'dimgray'}" 
                    in:fly={{x:-25, duration:2000, opacity:0, delay:2000}} 
                    onclick={() => {if (board.turn >= 20) {offerdraw()}}}>
                    Offer Draw</button></div>
            </div>
        </div>
        <div in:fade= {{duration:200}} style="background: lightgray; border-radius:20px; justify-self:center; width:200px;">
            <h2 style="text-align: center;">Moves</h2>
            <div style="overflow-y: scroll;height:63vh;">
                {#each board.moves as _,index}
                    {#if board.moves.length > 2*index  + 1}
                        <p style="background: darkgray;box-shadow: 0px 3px 1px rgb(0,0,0,0.25);">{ index + 1 }. {board.moves[index*2].notation} {board.moves[index*2+1].notation} </p>
                    {:else if board.moves.length >= 2*index + 1}
                        <p in:fade= {{duration:50}} style="background: darkgray;box-shadow: 0px 3px 1px rgb(0,0,0,0.25);">{ index + 1 }. {board.moves[index*2].notation} </p>
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