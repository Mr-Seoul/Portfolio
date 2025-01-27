<script>
    import {fly,fade} from "svelte/transition";
    import Tile from "./tile.svelte";
    import { onMount } from "svelte";

    let board = $state({
        //Pawn: P, Knight: N, Bishop: B, Rook: R, Queen: Q, King: K
        state: [],
        moves: [],
        side: 1,
        turn: 1
    } );

    let highlight = $state({
        state: []
    })
    
    function getHightlight(input) {
        return highlight.state[inputToIndex(input)];
    }

    function resetHightlight() {
        highlight.state = [];
        for (let i = 0; i < 64; i++) {
            highlight.state.push(false);
        }
    }

    function mapHighlight(arr) {
        resetHightlight();
        for (let i = 0; i < arr.length; i++) {
            highlight.state[XYToIndex(arr[i])] = true;
        }
    }

    let boardFlipped = $state(true);
    let pageLoaded = $state(false);

    let boardObject;

    function getTile(input) {
        return board.state[inputToIndex(input)];
    }

    function setTile(input,value) {
        board.state[inputToIndex(input)] = value;
    }

    function getSide() {
        return board.side;
    }

    function changeSide() {
        board.side = board.side == 1 ? 2 : 1;
    }

    function incrementTurn() {
        if (board.side == 1) {
                board.turn += 1;
        }
    }

    function movePiece (XYTo, XYFrom) {
            board.moves.push(XYToChess(selectedPosition,tilePosition));
            
            //if en passent also remove piece above:
            //Check if moved piece is pawn, moved 1 diagonally and target square is empty. Then remove piece above target
            let dir = getColour(XYFrom) == 1 ? -1 : 1;
            if (getTile(XYFrom).toLowerCase() == "p" && getTile(XYTo).toLowerCase() == "" && Math.abs(XYTo.x - XYFrom.x) == 1 && Math.abs(XYTo.y - XYFrom.y)) {
                setTile({x:XYTo.x,y:XYTo.y + dir}, "");
            }
            setTile(XYTo,getTile(XYFrom));
            setTile(XYFrom,"");

            changeSide();
            incrementTurn();
    }

    function inputToIndex(input) {
        let index = -1;
        if (typeof(input) === "number" || typeof(input) === "string") {
            index = input;
        } else if (typeof(input) === "object") {
            index = XYToIndex(input);
        }
        return index;
    }

    function inputToXY(input) {
        let XY = {x:-1,y:-1};
        if (typeof(input) === "number" || typeof(input) === "string") {
            XY = indexToXY(input);
        } else if (typeof(input) === "object") {
            XY = input;
        }
        return XY;
    }

    function getColour(input) {
            let index = inputToIndex(input);

            if (index < 0 || index > 63) {
                return -1;
            }
            if (board.state[index] === "") {
                return 0;
            } else if (board.state[index] === board.state[index].toUpperCase()) {
                return 1;
            } else if (board.state[index] === board.state[index].toLowerCase()) {
                return 2;
            }
        }

    function indexToXY(index) {
        return {x: index%8, y:Math.floor(index/8)}
    }

    function XYToIndex(XY) {
        return XY.x +XY.y*8
    }

    function XYToChess(XYFrom, XYTo) {
        function XYToFile(XY) {
            let result = "";
            switch(XY.x) {
                case 0:
                    result = "h";
                    break;
                case 1:
                    result = "g";
                    break;
                case 2:
                    result = "f";
                    break;
                case 3:
                    result = "e";
                    break;
                case 4:
                    result = "d";
                    break;
                case 5:
                    result = "c";
                    break;
                case 6:
                    result = "b";
                    break;
                case 7:
                    result = "a";
                    break;
            }
            return result;
        }
        let pieceLetter = getTile(XYFrom).toLowerCase() == "p" ? "" : getTile(XYFrom).toUpperCase();
        let toFile = XYToFile(XYTo);
        let fromFile = getTile(XYFrom).toLowerCase() == "p" && toFile != XYToFile(XYFrom) ? XYToFile(XYFrom) : "";
        let captureLetter = getTile(XYTo) == "" ? "" : "x";
        //En passent logic
        if (getTile(XYFrom).toLowerCase() == "p") {
            let Col = getColour(XYFrom);
            let dir = Col == 1 ? -1 : 1;
            if (getTile({x:XYTo.x,y:XYTo.y + dir}).toLowerCase() == "p" && getTile({x: XYTo.x, y: XYTo.y + dir}) != getTile(XYFrom)) {
                captureLetter = "x";
            }
        }
        return pieceLetter + fromFile + captureLetter + toFile + (XYTo.y+1);
    }
    
    function ChessToXY(Chess) {
        let XY = {x:-1,y:-1}
        switch(Chess[Chess.length-2]) {
            case "a":
                XY.x = 7;
                break;
            case "b":
                XY.x = 6;
                break;
            case "c":
                XY.x =  5;
                break;
            case "d":
                XY.x =  4;
                break;
            case "e":
                XY.x = 3;
                break;
            case "f":
                XY.x =  2;
                break;
            case "g":
                XY.x =  1;
                break;
            case "h":
                XY.x =  0;
                break;
        }
        XY.y = Number(Chess[Chess.length-1] -1);
        return XY;
    }

    function resetBoard() {
        board.state = [];
        board.state.push("R","N","B", "K", "Q", "B", "N", "R",
                     "P","P","P", "P", "P", "P", "P", "P",
                     "","","", "", "", "", "", "",
                     "","","", "", "", "", "", "",
                     "","","", "", "", "", "", "",
                     "","","", "", "", "", "", "",
                     "p","p","p", "p", "p", "p", "p", "p",
                     "r","n","b", "k", "q", "b", "n", "r");
        board.moves = [];
    }

    function getLegalMoves(input) {
        let index = inputToIndex(input);

        if (! inBoard(index)) { 
            return [];  //Return empty array if square is off the board
        }
        if (board.state[index] == "") {
            return []; //Return empty array if the square is empty
        }
        let legalMoves = [];
        let X = index%8;
        let Y = Math.floor(index/8);
        let pos = {x:X,y:Y};
        let Col = getColour(index);

        function differentColour(input1,input2) {
            let obj1 = inputToXY(input1);
            let obj2 = inputToXY(input2);
            return (getColour(obj1)) != getColour(obj2);
        }

        function inBoard(input) {
            let obj1 = inputToXY(input);

            return (obj1.x > -1 && obj1.y > -1 && obj1.x < 8 && obj1.y < 8);
        }

        function isOpponent(input) {
            let obj1 = inputToXY(input);
            return getColour(obj1) == (Col == 1 ? 2 : 1);
        }

        function addLegalMove(input) {
            let obj1 = inputToXY(input);
            if (inBoard(obj1) && isEmptyorOpponent(obj1)) {legalMoves.push(obj1);}
        }

        function firstMove() {
            if (Col == 1) {
                return pos.y == 1 ? true : false; //White
            } else if (Col == 2) {
                return pos.y == 6 ? true : false; //Black
            }
        }

        function enPassent(input) {
            let obj1 = inputToXY(input);

            let lastMove = board.moves.length != 0 ? ChessToXY(board.moves[board.moves.length-1]) : {x:-1,y:-1};
            //Check if target square is refering to the last move
            if (obj1.x != lastMove.x || obj1.y != lastMove.y + (Col == 1? 1: -1)) {
                return false;
            }
            //See if this is the firstTime the target pawn has moved
            for (let i = Col == 1? 0 : 1; i < board.moves.length; i += 2) {
                if (board.moves[i] == XYToChess({x:lastMove.x, y:lastMove.y},obj1)) {
                    return false;
                }
            }
            if (Col == 1) {
                if (pos.y == 4 && obj1.y - 1 == pos.y && Math.abs(lastMove.x-pos.x) == 1) {
                    return true; //White
                } 
            } else if (Col == 2) {
                if (pos.y == 3 && obj1.y + 1 == pos.y && Math.abs(lastMove.x-pos.x) == 1) {
                    return true; //Black
                } 
            }
            return false;
        }

        function isEmpty(input) {
            let obj1 = inputToXY(input);

            return (getTile(obj1) == "");
        }

        function isEmptyorOpponent(input) {
            let obj1 = inputToXY(input);
            return (isEmpty(obj1) || differentColour(pos,obj1));
        }

        function checkDirection(input1, dir) {
            let startSquare = inputToXY(input1);
            let currentSquare = {x:startSquare.x,y:startSquare.y};
            currentSquare.x += dir.x;
            currentSquare.y += dir.y;
            while (inBoard(currentSquare) && isEmpty(currentSquare)) {
                addLegalMove({x:currentSquare.x,y:currentSquare.y});
                currentSquare.x += dir.x;
                currentSquare.y += dir.y;
            }
            if (inBoard(currentSquare) && isOpponent(currentSquare)) {
                addLegalMove({x:currentSquare.x,y:currentSquare.y});
            }
        }

        switch(getTile(index).toLowerCase()) {
            //Pawns
            case "p":
                let direction = (Col == 1? 1 : -1);
                if (isEmpty({x:X+1,y:Y+direction*2}) && enPassent({x:X+1,y:Y+direction})) {
                    addLegalMove({x:X+1,y:Y+direction});
                }
                if (isEmpty({x:X-1,y:Y+direction*2}) && enPassent({x:X-1,y:Y+direction})) {
                    addLegalMove({x:X-1,y:Y+direction});
                }
                if (isEmpty({x:X,y:Y+direction*2}) && firstMove()) {
                    addLegalMove({x:X,y:Y+direction*2});
                }
                if (isEmpty({x:X,y:Y+direction})) {
                    addLegalMove({x:X,y:Y+direction});
                }
                if (X>0) {
                    if (! isEmpty({x:X-1,y:Y+direction*1})) {
                        addLegalMove({x:X-1,y:Y+direction*1});
                    }
                }
                if (X<7) {
                    if (! isEmpty({x:X+1,y:Y+direction*1})) {
                        addLegalMove({x:X+1,y:Y+direction*1});
                    }
                }
                break;
            
            //Knights
            case "n": 
                let moveSwayN = [-1,1];
                for (let i = 0; i < 2; i++) {
                    for (let j = 0; j < 2; j++) {
                        addLegalMove({x:X+moveSwayN[i]*1,y:Y+moveSwayN[j]*2});
                        addLegalMove({x:X+moveSwayN[i]*2,y:Y+moveSwayN[j]*1});
                    }
                }
                break;
        
            //Bishops
            case "b":
                checkDirection({x:X,y:Y},{x:1,y:1});
                checkDirection({x:X,y:Y},{x:1,y:-1});
                checkDirection({x:X,y:Y},{x:-1,y:1});
                checkDirection({x:X,y:Y},{x:-1,y:-1});
                break;
            
            //Rook code
            case "r":
                checkDirection({x:X,y:Y},{x:1,y:0});
                checkDirection({x:X,y:Y},{x:-1,y:0});
                checkDirection({x:X,y:Y},{x:0,y:1});
                checkDirection({x:X,y:Y},{x:0,y:-1});
                break;

            //Queen code
            case "q":
                let moveSwayQ = [-1,0,1];
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        checkDirection({x:X,y:Y},{x:moveSwayQ[i],y:moveSwayQ[j]});
                    }
                }
                break;

            //King code
            case "k":
                let moveSwayK = [-1,0,1];
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        addLegalMove({x:X+moveSwayK[i],y:Y+moveSwayK[j]});
                    }
                }
                break;
        }
        return legalMoves;
    }

    onMount(() => {
        pageLoaded = true;
        resetBoard();
    });

    let absoluteMousePosition = $state({x: 0, y: 0});
    let mousePosition = $state({x: 0, y: 0});
    let boardPosition = $state({x:0, y:0});
    let tilePosition = $state({x:0, y:0});
    let selectedPosition = $state({x:-1,y:-1});

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
        if ( 0 <= tilePosition.x && 0<=tilePosition.y && tilePosition.x <= 7 && tilePosition.y <= 7  && getColour(tilePosition) == board.side){
            if (JSON.stringify(selectedPosition) == JSON.stringify({x:-1,y:-1}) || getColour(selectedPosition) == getColour(tilePosition)) {
                selectedPosition = tilePosition;
                mapHighlight(getLegalMoves(selectedPosition));
            }
        }
    }

    function onmouseup() {
        if (tilePosition != selectedPosition && getColour(selectedPosition) != getColour(tilePosition) && getLegalMoves(selectedPosition).some(obj => obj.x == tilePosition.x && obj.y == tilePosition.y) && getColour(selectedPosition) == getSide()) {
            movePiece(tilePosition,selectedPosition);
            selectedPosition = {x:-1,y:-1};
            resetHightlight();
        } else if (getTile(tilePosition) == "") {
            selectedPosition = {x:-1,y:-1};
            resetHightlight();
        }
    }

    function onmouseleave() {
        selectedPosition = {x:-1, y:-1};
    }
</script>

<div style="display:grid;grid-template-columns: auto auto; gap:20px;">
    <div {onmousedown} {onmouseup} {onmousemove} {onmouseleave} bind:this={boardObject} in:fly= {{x:-50,duration:2000,opacity:0}} id="board">
        {#each board.state as row, index}
            {@const reverseIndex = board.state.length - index - 1}
            {#if boardFlipped} <Tile highlighted={getHightlight(reverseIndex)} index={reverseIndex} delay={(reverseIndex%8 + Math.floor(reverseIndex/8))*50} piece={board.state[reverseIndex]}></Tile>{/if}
            {#if ! boardFlipped} <Tile highlighted={getHightlight(index)} index={index} delay={(index%8 + Math.floor(index/8))*50} piece={board.state[index]}></Tile>{/if}
        {/each}
        <div style="display:flex; width:480px">
            <p in:fly= {{x:100, duration:2000, opacity:0}}>Turn: {board.turn} | {board.side == 1? "White" : "Black"} to move</p>
            <button in:fly={{x:-25, duration:2000, opacity:0}} onclick={() => {boardFlipped = ! boardFlipped}}>Flip Board</button>
        </div>
    </div>
    <div style="background: lightgray; border-radius:20px; justify-self:center; width:200px;">
        <h2 style="text-align: center;">Moves</h2>
        {#each {length: 10} as _,index}
            {#if board.moves.length > 2*index  + 1}
                <p style="background: darkgray;box-shadow: 0px 3px 1px rgb(0,0,0,0.25);">{ index + 1 }. {board.moves[index*2]} {board.moves[index*2+1]} </p>
            {:else if board.moves.length >= 2*index + 1}
                <p in:fade= {{duration:50}} style="background: darkgray;box-shadow: 0px 3px 1px rgb(0,0,0,0.25);">{ index + 1 }. {board.moves[index*2]} </p>
            {/if}
        {/each}
    </div>
</div>

<style>
    p {
        background: lightgray;
        padding: 5px;
        border-radius: 5px; 
        box-shadow: 5px 5px 2px rgb(0,0,0,0.25);
    }

    button {
        align-self: center;
        background: lightgray;
        border-color: lightgray;
        height: 32px;
        margin-left: auto; 
        padding: 5px; 
        box-shadow: 5px 5px 2px rgb(0,0,0,0.25);
    }
</style>