export const resetPiece = (piece) => {
    let src = "";
    switch(piece) {
                case " ":
                    src = "assets/DTUvsTheWorld/Empty.png";
                    break;
                case "P":
                    src = "assets/DTUvsTheWorld/WhitePawn.png";
                    break;
                case "N":
                    src = "assets/DTUvsTheWorld/WhiteKnight.png";
                    break;
                case "B":
                    src = "assets/DTUvsTheWorld/WhiteBishop.png";
                    break;
                case "R":
                    src = "assets/DTUvsTheWorld/WhiteRook.png";
                    break;
                case "Q":
                    src = "assets/DTUvsTheWorld/WhiteQueen.png";
                    break;
                case "K":
                    src = "assets/DTUvsTheWorld/WhiteKing.png";
                    break;
                case "p":
                    src = "assets/DTUvsTheWorld/BlackPawn.png";
                    break;
                case "n":
                    src = "assets/DTUvsTheWorld/BlackKnight.png";
                    break;
                case "b":
                    src = "assets/DTUvsTheWorld/BlackBishop.png";
                    break;
                case "r":
                    src = "assets/DTUvsTheWorld/BlackRook.png";
                    break;
                case "q":
                    src = "assets/DTUvsTheWorld/BlackQueen.png";
                    break;
                case "k":
                    src = "assets/DTUvsTheWorld/BlackKing.png";
                    break;
                default:
    }
    return src;
}