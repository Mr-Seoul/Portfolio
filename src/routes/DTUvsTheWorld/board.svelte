<script>
    import {fly,fade} from "svelte/transition";
    import Tile from "./tile.svelte";
    import { onMount } from "svelte";
    import {resetPiece} from "$lib/DTUvsTheWorld";

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

    let boardFlipped = $state(true);
    let pageLoaded = $state(false);

    let boardObject = $state();
    let gameResult = $state();
    let pawnPromoting = $state(false);
    let SavedSelectedposition = $state({x:-1,y:-1})
    let SavedTileposition = $state({x:-1,y:-1})

    function getTile(input,currentBoard) {
        return currentBoard.state[inputToIndex(input)];
    }

    function setTile(input,value,currentBoard) {
        currentBoard.state[inputToIndex(input)] = value;
    }

    function getSide(currentBoard) {
        return currentBoard.side;
    }

    function changeSide(currentBoard) {
        currentBoard.side = currentBoard.side == 1 ? 2 : 1;
    }

    function incrementTurn(currentBoard) {
        if (currentBoard.side == 1) {
                currentBoard.turn += 1;
        }
    }

    function movePiece(XYFrom, XYTo,currentBoard) {
        //if en passent also remove piece above:
        //Check if moved piece is pawn, moved 1 diagonally and target square is empty. Then remove piece above target
        let dir = getColour(XYFrom,currentBoard) == 1 ? -1 : 1;
        if (getTile(XYFrom,currentBoard).toLowerCase() == "p" && getTile(XYTo,currentBoard) == "" && Math.abs(XYTo.x - XYFrom.x) == 1 && Math.abs(XYTo.y - XYFrom.y)) {
            setTile({x:XYTo.x,y:XYTo.y + dir}, "",currentBoard);
        }
        setTile(XYTo,getTile(XYFrom,currentBoard),currentBoard);
        setTile(XYFrom,"",currentBoard);
    }

    function MakeMove(XYFrom, XYTo,currentBoard) {
        currentBoard.moves.push(XYToChess(XYFrom,XYTo,currentBoard));
        movePiece(XYFrom,XYTo,currentBoard);
        
        changeSide(currentBoard);
        incrementTurn(currentBoard);
    }

    function MoveAndPromotePawn(XYFrom,XYTo,promotion) {
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

    function getColour(input,currentBoard) {
            let index = inputToIndex(input);
            if (index < 0 || index > 63) {
                return -1;
            }
            if (currentBoard.state[index] === "") {
                return 0;
            } else if (currentBoard.state[index] === currentBoard.state[index].toUpperCase()) {
                return 1;
            } else if (currentBoard.state[index] === currentBoard.state[index].toLowerCase()) {
                return 2;
            }
        }

    function indexToXY(index) {
        return {x: index%8, y:Math.floor(index/8)}
    }

    function XYToIndex(XY) {
        return XY.x +XY.y*8
    }

    function XYToChess(input1, input2,currentBoard) {
        let XYFrom = inputToXY(input1);
        let XYTo = inputToXY(input2);
        if (XYFrom.x < 0 || XYFrom.x > 7 || XYFrom.y < 0 || XYFrom.y > 7) {
                return "";
            }
        if (XYTo.x < 0 || XYTo.x > 7 || XYTo.y < 0 || XYTo.y > 7) {
                return "";
            }
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
        let pieceLetter = getTile(XYFrom,currentBoard).toLowerCase() == "p" ? "" : getTile(XYFrom,currentBoard).toUpperCase();
        let toFile = XYToFile(XYTo);
        let fromFile = getTile(XYFrom,currentBoard).toLowerCase() == "p" && toFile != XYToFile(XYFrom) ? XYToFile(XYFrom) : "";
        let captureLetter = (getTile(XYTo,currentBoard) == "") ? "" : "x";
        //En passent logic
        if (getTile(XYFrom,currentBoard).toLowerCase() == "p") {
            let Col = getColour(XYFrom,currentBoard);
            let dir = Col == 1 ? -1 : 1;
            if (getTile({x:XYTo.x,y:XYTo.y + dir},currentBoard).toLowerCase() == "p" && getTile({x: XYTo.x, y: XYTo.y + dir},currentBoard) != getTile(XYFrom,currentBoard)) {
                captureLetter = "x";
            }
        }
        return pieceLetter + fromFile + captureLetter + toFile + (XYTo.y+1);
    }
    
    function ChessToXY(Chess) {
        let XY = {x:-1,y:-1}
        //Incase the Last move was a pawn promotion
        if (['1','2','3','4','5','6','7'].includes(Chess[Chess.length-1]))
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
        else {
            switch(Chess[Chess.length-3]) {
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
        }
        XY.y = Number(Chess[Chess.length-1] -1);
        return XY;
    }

    function inCheck(currentBoard, Col) {
        let Checked = false;
        const isKing = (element) => element == (Col==1? "K":"k");
        const kingPos = indexToXY(currentBoard.state.findIndex(isKing));
        for (let i = 0; i < 64; i++) {
            //Only check for opposing colours
            if (getColour(i,currentBoard) != Col) {
                //Check every move the opponent can make
                let curLegalMoves = getLegalMoves(i, currentBoard,false);
                //Check attacking the king is one of the possible moves
                curLegalMoves.forEach((element)=>{
                    if (element.x == kingPos.x && element.y == kingPos.y) {
                        Checked = true;
                    }
                });
            }
        }
        return Checked;
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

    let allLegalMoves = {};

    function setAllLegalMoves(currentBoard) {
        allLegalMoves = {};
        for (let i = 0; i < 64; i++) {
            if (getSide(currentBoard) == getColour(i,currentBoard)) {
                allLegalMoves[JSON.stringify(i)] = getLegalMoves(i,currentBoard,true);
            }
        }
    }

    function getNumLegalMoves() {
        let num = 0;
        Object.values(allLegalMoves).forEach((element) => {num+=element.length});
        return num;
    }

    function getLegalMoves(index,currentBoard,checkForCheck) {
        index = inputToIndex(index);

        if (! inBoard(index)) { 
            return [];  //Return empty array if square is off the board
        }
        if (currentBoard.state[index] == "") {
            return []; //Return empty array if the square is empty
        }
        let legalMoves = [];
        let X = index%8;
        let Y = Math.floor(index/8);
        let pos = {x:X,y:Y};
        let Col = getColour(index,currentBoard);

        function differentColour(obj1,obj2) {
            obj1 = inputToXY(obj1);
            obj2 = inputToXY(obj2);
            return (getColour(obj1,currentBoard)) != getColour(obj2,currentBoard);
        }

        function inBoard(obj1) {
            obj1 = inputToXY(obj1);

            return (obj1.x > -1 && obj1.y > -1 && obj1.x < 8 && obj1.y < 8);
        }

        function isOpponent(obj1) {
            obj1 = inputToXY(obj1);
            return getColour(obj1,currentBoard) == (Col == 1 ? 2 : 1);
        }

        function notInCheck(obj1) {
            
            if (!checkForCheck) {
                return true;
            }
            obj1 = inputToXY(obj1);
            let hypotheticalBoard = JSON.parse(JSON.stringify(currentBoard));         
            //Move own piece
            MakeMove(pos, obj1, hypotheticalBoard);   
            return !inCheck(hypotheticalBoard,Col);
        }

        function addLegalMove(obj1) {
            obj1 = inputToXY(obj1);
            if (inBoard(obj1) && isEmptyorOpponent(obj1,currentBoard) && notInCheck(obj1)) {
                
                legalMoves.push(obj1);
                
                if (!checkForCheck&&getTile(obj1,currentBoard).toLowerCase() == "k") {
                    return legalMoves
                };}
            
        }

        function firstMove() {
            if (Col == 1) {
                return pos.y == 1 ? true : false; //White
            } else if (Col == 2) {
                return pos.y == 6 ? true : false; //Black
            }
        }

        function enPassent(obj1) {
            obj1 = inputToXY(obj1);

            let lastMove = currentBoard.moves.length != 0 ? ChessToXY(currentBoard.moves[currentBoard.moves.length-1]) : {x:-1,y:-1};
            //Check if target square is refering to the last move
            if (obj1.x != lastMove.x || obj1.y != lastMove.y + (Col == 1? 1: -1)) {
                return false;
            }
            //See if this is the firstTime the target pawn has moved
            for (let i = Col == 1? 0 : 1; i < currentBoard.moves.length; i += 2) {
                if (currentBoard.moves[i] == XYToChess({x:lastMove.x, y:lastMove.y},obj1,currentBoard)) {
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

        function isEmpty(input1) {
            input1 = inputToXY(input1);
            
            return (getTile(input1,currentBoard) == "");
        }

        function isEmptyorOpponent(input1) {
            input1 = inputToXY(input1);
            
            return (isEmpty(input1) || differentColour(pos,input1));
            
        }

        function checkDirection(startSquare, dir) {
            startSquare = inputToXY(startSquare);
            dir = inputToXY(dir);
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

        function checkKingSquare(input1, dir, pieces) {
            input1 = inputToXY(input1);
            dir = inputToXY(dir);
            let currentSquare = {x:input1.x + dir.x, y:input1.y+dir.y}

            //Check if it is an opponent square
            if (inBoard(currentSquare) && !isOpponent(currentSquare) && !isEmpty(currentSquare) && pieces.includes(getTile(currentSquare,currentBoard))) {
                legalMoves.push(input1);
                return legalMoves;
            }
        }

        function checkKingDirection(startSquare, dir,pieces) {
            startSquare = inputToXY(startSquare);
            dir = inputToXY(dir);
            let currentSquare = {x:startSquare.x,y:startSquare.y};
            //Move off of king
            currentSquare.x += dir.x;
            currentSquare.y += dir.y;
            //Move to next square that isn't empty
            while (inBoard(currentSquare) && isEmpty(currentSquare)) {
                currentSquare.x += dir.x;
                currentSquare.y += dir.y;
            }
            //Check if it is an opponent square
            if (inBoard(currentSquare) && !isOpponent(currentSquare) && !isEmpty(currentSquare) && pieces.includes(getTile(currentSquare,currentBoard))) {
                legalMoves.push(input1);
                return legalMoves;
            }
        }
        if (checkForCheck) {
            switch(getTile(index,currentBoard).toLowerCase()) {
            //Pawns
            case "p":
                let direction = (Col == 1? 1 : -1);
                if (isEmpty({x:X+1,y:Y+direction*2}) && enPassent({x:X+1,y:Y+direction})) {
                    addLegalMove({x:X+1,y:Y+direction});
                }
                if (isEmpty({x:X-1,y:Y+direction*2}) && enPassent({x:X-1,y:Y+direction})) {
                    addLegalMove({x:X-1,y:Y+direction});
                }
                if (isEmpty({x:X,y:Y+direction*2},currentBoard) && firstMove()) {
                    addLegalMove({x:X,y:Y+direction*2});
                }
                if (isEmpty({x:X,y:Y+direction})) {
                    addLegalMove({x:X,y:Y+direction});
                }
                if (X>0) {
                    if (! isEmpty({x:X-1,y:Y+direction*1})) {
                        addLegalMove({x:X-1,y:Y+direction*1},currentBoard);
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
        } else {
            //Only checking for checks
            
            //Find king position (Changes side since this is after a move is made, hence the sides are switched)
            const isKing = (element) => element == (Col==1? "k":"K");
            const kingPos = indexToXY(currentBoard.state.findIndex(isKing));

            //Check straight directions
            checkKingDirection(kingPos,{x:1,y:0},[(Col==1 ? "Q":"q"),(Col==1 ? "R":"r")]);
            checkKingDirection(kingPos,{x:-1,y:0},[(Col==1 ? "Q":"q"),(Col==1 ? "R":"r")]);
            checkKingDirection(kingPos,{x:0,y:1},[(Col==1 ? "Q":"q"),(Col==1 ? "R":"r")]);
            checkKingDirection(kingPos,{x:0,y:-1},[(Col==1 ? "Q":"q"),(Col==1 ? "R":"r")]);

            //Check diagonals directions
            checkKingDirection(kingPos,{x:1,y:1},[(Col==1 ? "Q":"q"),(Col==1 ? "B":"b")]);
            checkKingDirection(kingPos,{x:1,y:-1},[(Col==1 ? "Q":"q"),(Col==1 ? "B":"b")]);
            checkKingDirection(kingPos,{x:-1,y:1},[(Col==1 ? "Q":"q"),(Col==1 ? "B":"b")]);
            checkKingDirection(kingPos,{x:-1,y:-1},[(Col==1 ? "Q":"q"),(Col==1 ? "B":"b")]);

            //Check for knights
            checkKingSquare(kingPos,{x:1,y:2},[(Col==1 ? "N":"n")]);
            checkKingSquare(kingPos,{x:-1,y:2},[(Col==1 ? "N":"n")]);
            checkKingSquare(kingPos,{x:1,y:-2},[(Col==1 ? "N":"n")]);
            checkKingSquare(kingPos,{x:-1,y:-2},[(Col==1 ? "N":"n")]);
            checkKingSquare(kingPos,{x:2,y:1},[(Col==1 ? "N":"n")]);
            checkKingSquare(kingPos,{x:2,y:-1},[(Col==1 ? "N":"n")]);
            checkKingSquare(kingPos,{x:-2,y:1},[(Col==1 ? "N":"n")]);
            checkKingSquare(kingPos,{x:-2,y:-1},[(Col==1 ? "N":"n")]);
            
            //Check for pawns
            checkKingSquare(kingPos,(Col == 1 ? {x:-1,y:-1} : {x:-1,y:1}),[(Col==1 ? "P":"p")]);
            checkKingSquare(kingPos,(Col == 1 ? {x:1,y:-1} : {x:1,y:1}),[(Col==1 ? "P":"p")]);
        }        

        return legalMoves;
    }

    onMount(() => {
        try {
            resetBoard(board);
            setAllLegalMoves(board);
            initHighlight();
        } catch (error) {
            console.error("Error in onMount:", error);
        }
        pageLoaded = true;
    });

    let absoluteMousePosition = $state({x: 0, y: 0});
    let mousePosition = $state({x: 0, y: 0});
    let boardPosition = $state({x:0, y:0});
    let tilePosition = $state({x:0, y:0});
    let selectedPosition = $state({x:-1,y:-1});
    let previousSelectedPosition = $state({x:-1,y:-1});

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
        if (!gameResult && !pawnPromoting) {
            if ( 0 <= tilePosition.x && 0<=tilePosition.y && tilePosition.x <= 7 && tilePosition.y <= 7  && getColour(tilePosition,board) == board.side){
                if (JSON.stringify(selectedPosition) == JSON.stringify({x:-1,y:-1}) || getColour(selectedPosition,board) == getColour(tilePosition,board)) {
                    selectedPosition = tilePosition;
                    mapHighlight(allLegalMoves[JSON.stringify(XYToIndex(tilePosition))]);
                }
            }
        }
    }

    function onmouseup() {
        if (tilePosition != selectedPosition && getColour(selectedPosition,board) != getColour(tilePosition,board) && allLegalMoves[JSON.stringify(XYToIndex(selectedPosition))] && allLegalMoves[JSON.stringify(XYToIndex(selectedPosition))].some(obj => obj.x == tilePosition.x && obj.y == tilePosition.y) && getColour(selectedPosition,board) == getSide(board)) {
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