export function inputToIndex(input) {
    let index = -1;
    if (typeof(input) === "number" || typeof(input) === "string") {
        index = input;
    } else if (typeof(input) === "object") {
        index = XYToIndex(input);
    }
    return index;
}

export function inputToXY(input) {
    let XY = {x:-1,y:-1};
    if (typeof(input) === "number" || typeof(input) === "string") {
        XY = indexToXY(input);
    } else if (typeof(input) === "object") {
        XY = input;
    }
    return XY;
}

export function getColour(input,currentBoard) {
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

export function indexToXY(index) {
    return {x: index%8, y:Math.floor(index/8)}
}

export function XYToIndex(XY) {
    return XY.x +XY.y*8
}

//
export function checkDirforPiece(currentboard,startSquare,dir, piece) {
    let information = {count: 0, pieces: []};
    let currentSquare = {x:startSquare.x,y:startSquare.y};

    startSquare = inputToXY(startSquare);
    dir = inputToXY(dir);
    currentSquare.x += dir.x;
    currentSquare.y += dir.y;

    while (inBoard(currentSquare) && (isEmpty(currentboard,currentSquare))) {
        if (getTile(currentSquare,currentboard) == piece) {
            information.count += 1;
            information.pieces.push(currentSquare);
        }
        currentSquare.x += dir.x;
        currentSquare.y += dir.y;
    }

    if (inBoard(currentSquare)) {
        if (getTile(currentSquare,currentboard) == piece) {
            information.count += 1;
            information.pieces.push(currentSquare);
        }
    }
    return information;
}

export function checkSquareforPiece(currentboard,piece,targetSquare) {
    let information = {count: 0, pieces: []};

    if (inBoard(targetSquare)) {
        if (getTile(targetSquare,currentboard) == piece) {
            information.count += 1;
            information.pieces.push(targetSquare);
        }
    }
    return information;
}

function mergeByValueUnique(arr1, arr2) {
    const seen = new Set();
    const result = [];
  
    // Safely iterate over both arrays, even if they're empty
    for (const obj of (arr1 || []).concat(arr2 || [])) {
      const key = JSON.stringify(obj); // assumes flat object comparison
      if (!seen.has(key)) {
        seen.add(key);
        result.push(obj);
      }
    }
    return result;
}

export function updateChessMovesList(currentBoard, obj) {
    //Have all keys present, even if they are not relevant
    let SaveObj = {notation: "", XYFrom: {x:-1,y: -1},XYTo: {x:-1,y: -1},piece: "",capture: false, capturedpiece: "", promotionPiece: "",BKmove: false,BRQmove: false,BRKmove: false,WKmove: false, WRQmove: false,WRKmove: false};
    if (currentBoard.moves.length > 0) {
        let PrevMove = currentBoard.moves.length - 1
    
        SaveObj.BKmove = currentBoard.moves[PrevMove].BKmove
        SaveObj.BRQmove = currentBoard.moves[PrevMove].BRQmove
        SaveObj.BRKmove = currentBoard.moves[PrevMove].BRKmove
        SaveObj.WKmove = currentBoard.moves[PrevMove].WKmove
        SaveObj.WRQmove = currentBoard.moves[PrevMove].WRQmove
        SaveObj.WRKmove = currentBoard.moves[PrevMove].WRKmove
    }

    if (obj.hasOwnProperty('notation')) {
        SaveObj.notation = obj.notation;
        currentBoard.moves.push(SaveObj);
    }
    else {
        let XYFrom = obj.XYFrom
        let XYTo = obj.XYTo
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
        let curPiece = getTile(XYFrom,currentBoard)
        let pieceLetter = curPiece.toLowerCase() == "p" ? "" : curPiece.toUpperCase();
        let toFile = XYToFile(XYTo);
        let fromFile = curPiece.toLowerCase() == "p" && toFile != XYToFile(XYFrom) ? XYToFile(XYFrom) : "";
        let captureLetter = (getTile(XYTo,currentBoard) == "") ? "" : "x";
        let enemyCheckLetter = "";
        let disambiguationLetters = "";
        //En passent logic
        if (curPiece.toLowerCase() == "p") {
            let Col = getColour(XYFrom,currentBoard);
            let dir = Col == 1 ? -1 : 1;
            if (getTile({x:XYTo.x,y:XYTo.y + dir},currentBoard).toLowerCase() == "p" && getTile({x: XYTo.x, y: XYTo.y + dir},currentBoard) != getTile(XYFrom,currentBoard)) {
                captureLetter = "x";
            }
        }
        //Enemy in check Logic (for plus at end of notation)
        let hypotheticalBoard = JSON.parse(JSON.stringify(currentBoard));
        movePiece(XYFrom,XYTo,hypotheticalBoard);
        if (inCheck(hypotheticalBoard,getSide(hypotheticalBoard) == 1? 2 : 1)) {
            enemyCheckLetter = "+";
        }
        //Piece disambiguation (check if the target square can be reached by two pieces, except for pawns as they always have this (already implemented))

        let count = 0;
        let allPieces = [];

        if (curPiece.toLowerCase() == "r" || curPiece.toLowerCase() == "q") {
            let dirinformation = checkDirforPiece(currentBoard,XYTo,{x:1,y:0},curPiece,XYFrom);
            count += dirinformation.count;
            allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);

            dirinformation = checkDirforPiece(currentBoard,XYTo,{x:-1,y:0},curPiece,XYFrom);
            count += dirinformation.count;
            allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);

            dirinformation = checkDirforPiece(currentBoard,XYTo,{x:0,y:1},curPiece,XYFrom);
            count += dirinformation.count;
            allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);

            dirinformation = checkDirforPiece(currentBoard,XYTo,{x:0,y:-1},curPiece,XYFrom);
            count += dirinformation.count;
            allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);
        }
        if (curPiece.toLowerCase() == "b" || curPiece.toLowerCase() == "q") {
            let dirinformation = checkDirforPiece(currentBoard,XYTo,{x:1,y:1},curPiece,XYFrom);
            count += dirinformation.count;
            allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);

            dirinformation = checkDirforPiece(currentBoard,XYTo,{x:1,y:-1},curPiece,XYFrom);
            count += dirinformation.count;
            allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);
            
            dirinformation = checkDirforPiece(currentBoard,XYTo,{x:-1,y:1},curPiece,XYFrom);
            count += dirinformation.count;
            allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);

            dirinformation = checkDirforPiece(currentBoard,XYTo,{x:-1,y:-1},curPiece,XYFrom);
            count += dirinformation.count;
            allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);
        }
        if (curPiece.toLowerCase() == "n") {
            let moveSwayN = [-1,1];
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    let dirinformation = checkSquareforPiece(currentBoard,curPiece,{x:XYTo.x+moveSwayN[i]*1,y:XYTo.y+moveSwayN[j]*2});
                    count += dirinformation.count;
                    allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);

                    dirinformation = checkSquareforPiece(currentBoard,curPiece,{x:XYTo.x+moveSwayN[i]*2,y:XYTo.y+moveSwayN[j]*1});
                    count += dirinformation.count;
                    allPieces = mergeByValueUnique(allPieces,dirinformation.pieces);
                }
            } 
        }
        if (count > 1) {
            //Now check if all pieces have unique files and ranks. 
            // If the files are not unique and ranks are not unique, report the both. Otherwise only report the unique one
            allPieces = allPieces.filter(obj => !(obj.x == XYFrom.x && obj.y == XYFrom.y));
            let Xunique = !allPieces.some(obj => obj.x == XYFrom.x);
            let Yunique = !allPieces.some(obj => obj.y == XYFrom.y);
            console.log(XYFrom,allPieces,Xunique,Yunique)
            if (!Xunique && !Yunique) {
                disambiguationLetters += XYToFile(XYFrom) + (XYFrom.y + 1);
            }
            else {
                if (Xunique) {
                    disambiguationLetters += XYToFile(XYFrom);
                }
                else {
                    disambiguationLetters += (XYFrom.y + 1);
                }
            }
        }
        //King and rook movement data:
        if (curPiece == "k") {
            SaveObj.BKmove = true
        } else if (curPiece == "K") {
            SaveObj.WKmove = true
        } else if (curPiece == "r") {
            if (XYFrom.x == 7 && XYFrom.y == 7) {
                SaveObj.BRQmove = true
            } else if (XYFrom.x == 0 && XYFrom.y == 7) {
                SaveObj.BRKmove = true
            }
        } else if (curPiece == "R") {
            if (XYFrom.x == 7 && XYFrom.y == 0) {
                SaveObj.WRQmove = true
            } else if (XYFrom.x == 0 && XYFrom.y == 0) {
                SaveObj.WRKmove = true
            }
        }

        let notationstring = pieceLetter + disambiguationLetters + fromFile + captureLetter + toFile + (XYTo.y+1) + enemyCheckLetter
        
        //Castling Logic
        if (curPiece.toLowerCase() == "k") {
            if (Math.abs(XYFrom.x - XYTo.x) == 2) { //Check if castled
                console.log(XYTo,XYFrom)
                if (XYTo.x == 1) { //Kingside Castle
                    notationstring = "O-O"
                } else if (XYTo.x == 5) { //Queenside Castle
                    notationstring = "O-O-O"
                }
            }
        }
        
        SaveObj.XYFrom = obj.XYFrom;
        SaveObj.XYTo = obj.XYTo;
        SaveObj.capture = getTile(XYTo,currentBoard) != "";
        SaveObj.piece = curPiece;
        SaveObj.notation = notationstring;
        SaveObj.capturedpiece = getTile(XYTo,currentBoard);

        currentBoard.moves.push(SaveObj);
    }
}

export function getTile(input,currentBoard) {
    return currentBoard.state[inputToIndex(input)];
}

export function setTile(input,value,currentBoard) {
    currentBoard.state[inputToIndex(input)] = value;
}

export function getSide(currentBoard) {
    return currentBoard.side;
}

export function changeSide(currentBoard) {
    currentBoard.side = currentBoard.side == 1 ? 2 : 1;
}

export function incrementTurn(currentBoard) {
    if (currentBoard.side == 1) {
            currentBoard.turn += 1;
    }
}

export function movePiece(XYFrom, XYTo,currentBoard) {
    //if en passent also remove piece above:
    //Check if moved piece is pawn, moved 1 diagonally and target square is empty. Then remove piece above target
    let dir = getColour(XYFrom,currentBoard) == 1 ? -1 : 1;
    if (getTile(XYFrom,currentBoard).toLowerCase() == "p" && getTile(XYTo,currentBoard) == "" && Math.abs(XYTo.x - XYFrom.x) == 1 && Math.abs(XYTo.y - XYFrom.y)) {
        setTile({x:XYTo.x,y:XYTo.y + dir}, "",currentBoard);
    }
    //If castling, move the rook to the center square next to the king
    if (Math.abs(XYFrom.x - XYTo.x) == 2) {
        console.log(XYTo,XYFrom);
        if (XYTo.x == 1) { //Kingside Castle
            setTile({x:2,y:XYTo.y},getTile({x:0,y:XYTo.y},currentBoard),currentBoard)
            setTile({x:0,y:XYTo.y},"",currentBoard)
        } else if (XYTo.x == 5) { //Queenside Castle
            setTile({x:4,y:XYTo.y},getTile({x:7,y:XYTo.y},currentBoard),currentBoard)
            setTile({x:7,y:XYTo.y},"",currentBoard)
        }
    }
    setTile(XYTo,getTile(XYFrom,currentBoard),currentBoard);
    setTile(XYFrom,"",currentBoard);
}

export function MakeMove(XYFrom, XYTo,currentBoard) {
    updateChessMovesList(currentBoard,{XYFrom:XYFrom,XYTo:XYTo});
    movePiece(XYFrom,XYTo,currentBoard);
    
    changeSide(currentBoard);
    incrementTurn(currentBoard);
}

export function inBoard(obj1) {
    obj1 = inputToXY(obj1);

    return (obj1.x > -1 && obj1.y > -1 && obj1.x < 8 && obj1.y < 8);
}

export function isEmpty(currentBoard,input1) {
    input1 = inputToXY(input1);
    
    return (getTile(input1,currentBoard) == "");
}

export function getLegalMoves(index,currentBoard,checkForCheck) {
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

    function isOpponent(obj1) {
        obj1 = inputToXY(obj1);
        return getColour(obj1,currentBoard) == (Col == 1 ? 2 : 1);
    }

    function notInCheck(obj1,currentBoard) {
        
        if (!checkForCheck) {
            return true;
        }
        obj1 = inputToXY(obj1);
        let hypotheticalBoard = JSON.parse(JSON.stringify(currentBoard));         
        //Move own piece
        MakeMove(pos, obj1, hypotheticalBoard);   
        return !inCheck(hypotheticalBoard,Col);
    }

    function isEmptyorOpponent(input1) {
        input1 = inputToXY(input1);
        
        return (isEmpty(currentBoard,input1) || differentColour(pos,input1));
        
    }
    function addLegalMove(obj1) {
        obj1 = inputToXY(obj1);
        if (inBoard(obj1) && isEmptyorOpponent(obj1) && notInCheck(obj1,currentBoard)) {
            
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

        let lastMove = currentBoard.moves.length != 0 ? currentBoard.moves[currentBoard.moves.length-1] : {XYFrom: {x:-1,y:-1},XYTo: {x:-1,y:-1},piece:""};
        //Check if target square is refering to the last move
        if (obj1.x != lastMove.XYTo.x || obj1.y != lastMove.XYTo.y + (Col == 1? 1: -1)) {
            return false;
        }
        //See if this is the firstTime the target pawn has moved
        for (let i = Col == 1? 0 : 1; i < currentBoard.moves.length; i += 2) {
            if (currentBoard.moves[i].XYTo.x == lastMove.XYTo.x && currentBoard.moves[i].XYTo.y == lastMove.XYTo.y && currentBoard.moves[i].piece == lastMove.piece && currentBoard.moves[i].XYFrom.x == lastMove.XYFrom.x && currentBoard.moves[i].XYFrom.y == lastMove.XYFrom.y) {
                return false;
            }
        }
        if (Col == 1) {
            if (pos.y == 4 && obj1.y - 1 == pos.y && Math.abs(lastMove.XYTo.x-pos.x) == 1) {
                return true; //White
            } 
        } else if (Col == 2) {
            if (pos.y == 3 && obj1.y + 1 == pos.y && Math.abs(lastMove.XYTo.x-pos.x) == 1) {
                return true; //Black
            } 
        }
        return false;
    }

    function checkDirection(startSquare, dir) {
        startSquare = inputToXY(startSquare);
        dir = inputToXY(dir);
        let currentSquare = {x:startSquare.x,y:startSquare.y};
        currentSquare.x += dir.x;
        currentSquare.y += dir.y;
        while (inBoard(currentSquare) && isEmpty(currentBoard,currentSquare)) {
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
        if (inBoard(currentSquare) && !isOpponent(currentSquare) && !isEmpty(currentBoard,currentSquare) && pieces.includes(getTile(currentSquare,currentBoard))) {
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
        while (inBoard(currentSquare) && isEmpty(currentBoard,currentSquare)) {
            currentSquare.x += dir.x;
            currentSquare.y += dir.y;
        }
        //Check if it is an opponent square
        if (inBoard(currentSquare) && !isOpponent(currentSquare) && !isEmpty(currentBoard,currentSquare) && pieces.includes(getTile(currentSquare,currentBoard))) {
            legalMoves.push(startSquare);
            return legalMoves;
        }
    }
    if (checkForCheck) {
        switch(getTile(index,currentBoard).toLowerCase()) {
        //Pawns
        case "p":
            let direction = (Col == 1? 1 : -1);
            if (isEmpty(currentBoard,{x:X+1,y:Y+direction*2}) && enPassent({x:X+1,y:Y+direction})) {//The *2 is in order to make sure that the pawn moved 2 squares last turn
                addLegalMove({x:X+1,y:Y+direction});
            }
            if (isEmpty(currentBoard,{x:X-1,y:Y+direction*2}) && enPassent({x:X-1,y:Y+direction})) { //The *2 is in order to make sure that the pawn moved 2 squares last turn
                addLegalMove({x:X-1,y:Y+direction});
            }
            if (isEmpty(currentBoard,{x:X,y:Y+direction*2}) && isEmpty(currentBoard,{x:X,y:Y+direction}) && firstMove()) {
                addLegalMove({x:X,y:Y+direction*2});
            }
            if (isEmpty(currentBoard,{x:X,y:Y+direction})) {
                addLegalMove({x:X,y:Y+direction});
            }
            if (X>0) {
                if (! isEmpty(currentBoard,{x:X-1,y:Y+direction*1})) {
                    addLegalMove({x:X-1,y:Y+direction*1},currentBoard);
                }
            }
            if (X<7) {
                if (! isEmpty(currentBoard,{x:X+1,y:Y+direction*1})) {
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
            //Normal king moves
            let moveSwayK = [-1,0,1];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    addLegalMove({x:X+moveSwayK[i],y:Y+moveSwayK[j]});
                }
            }
            //Castling
            if (!inCheck(currentBoard, Col)) {
                // King-side castling
                if (getTile({ x: 0, y: Y }, currentBoard).toLowerCase() == "r") {
                    let clearPath = true;
                    for (let i = 1; i <= 2; i++) {
                        if (!isEmpty(currentBoard, { x: 3 - i, y: Y })) {
                            clearPath = false;
                            break;
                        }
                    }
                    if (clearPath) {
                        let hypotheticalBoard = JSON.parse(JSON.stringify(currentBoard));
                        MakeMove(pos, { x: 2, y: Y }, hypotheticalBoard); // simulate intermediate
                        if (!inCheck(hypotheticalBoard, Col)) {
                            hypotheticalBoard = JSON.parse(JSON.stringify(currentBoard));
                            MakeMove(pos, { x: 1, y: Y }, hypotheticalBoard); 
                            if (!inCheck(hypotheticalBoard, Col)) {
                                if (!currentBoard.moves[currentBoard.moves.length-1].WKmove && !currentBoard.moves[currentBoard.moves.length-1].WRKmove && Col == 1) {
                                    legalMoves.push({ x: 1, y: Y });
                                } else if (!currentBoard.moves[currentBoard.moves.length-1].BKmove && !currentBoard.moves[currentBoard.moves.length-1].BRKmove && Col == 2) {
                                    legalMoves.push({ x: 1, y: Y });
                                }
                            }
                        }
                    }
                }
            
                // Queen-side castling 
                if (getTile({ x: 7, y: Y }, currentBoard).toLowerCase() == "r") {
                    let clearPath = true;
                    for (let i = 1; i <= 3; i++) {
                        if (!isEmpty(currentBoard, { x: 3 + i, y: Y })) {
                            clearPath = false;
                            break;
                        }
                    }
                    if (clearPath) {
                        let hypotheticalBoard = JSON.parse(JSON.stringify(currentBoard));
                        MakeMove(pos, { x: 4, y: Y }, hypotheticalBoard); // simulate intermediate
                        if (!inCheck(hypotheticalBoard, Col)) {
                            hypotheticalBoard = JSON.parse(JSON.stringify(currentBoard));
                            MakeMove(pos, { x: 5, y: Y }, hypotheticalBoard); 
                            if (!inCheck(hypotheticalBoard, Col)) {
                                if (!currentBoard.moves[currentBoard.moves.length-1].WKmove && !currentBoard.moves[currentBoard.moves.length-1].WRQmove && Col == 1) {
                                    legalMoves.push({ x: 5, y: Y });
                                } else if (!currentBoard.moves[currentBoard.moves.length-1].BKmove && !currentBoard.moves[currentBoard.moves.length-1].BRQmove && Col == 2) {
                                    legalMoves.push({ x: 5, y: Y });
                                }
                            }
                        }
                    }
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

export function inCheck(currentBoard, Col) {
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