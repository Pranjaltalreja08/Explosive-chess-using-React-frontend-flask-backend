// Helper class for chess move validation
class MoveValidator {
  static isValidMove(board, from, to, turn) {
    const fromCoords = this.squareToCoords(from)
    const toCoords = this.squareToCoords(to)

    if (!fromCoords || !toCoords) {
      return { valid: false, reason: "Invalid square coordinates" }
    }

    const piece = board[fromCoords.row][fromCoords.col]
    if (!piece) {
      return { valid: false, reason: "No piece at source square" }
    }

    const pieceColor = piece === piece.toUpperCase() ? "white" : "black"
    if ((turn === "white" && pieceColor !== "white") || (turn === "black" && pieceColor !== "black")) {
      return { valid: false, reason: "Not your piece to move" }
    }

    // Basic movement validation for each piece type
    const pieceType = piece.toLowerCase()

    switch (pieceType) {
      case "q": // Queen
        // Queen can move diagonally, horizontally, or vertically any number of squares
        const isDiagonal = Math.abs(toCoords.row - fromCoords.row) === Math.abs(toCoords.col - fromCoords.col)
        const isStraight = fromCoords.row === toCoords.row || fromCoords.col === toCoords.col

        if (!isDiagonal && !isStraight) {
          return { valid: false, reason: "Queens can only move diagonally, horizontally, or vertically" }
        }

        // Check if path is clear
        if (isDiagonal) {
          const rowStep = toCoords.row > fromCoords.row ? 1 : -1
          const colStep = toCoords.col > fromCoords.col ? 1 : -1

          let row = fromCoords.row + rowStep
          let col = fromCoords.col + colStep

          while (row !== toCoords.row && col !== toCoords.col) {
            if (board[row][col]) {
              return { valid: false, reason: "Queen's path is blocked" }
            }
            row += rowStep
            col += colStep
          }
        } else {
          // Straight move
          if (fromCoords.row === toCoords.row) {
            const step = toCoords.col > fromCoords.col ? 1 : -1
            for (let col = fromCoords.col + step; col !== toCoords.col; col += step) {
              if (board[fromCoords.row][col]) {
                return { valid: false, reason: "Queen's horizontal path is blocked" }
              }
            }
          } else {
            const step = toCoords.row > fromCoords.row ? 1 : -1
            for (let row = fromCoords.row + step; row !== toCoords.row; row += step) {
              if (board[row][fromCoords.col]) {
                return { valid: false, reason: "Queen's vertical path is blocked" }
              }
            }
          }
        }

        return { valid: true }

      // Add other piece validations as needed

      default:
        return { valid: true } // For simplicity, assume other pieces are valid
    }
  }

  static squareToCoords(square) {
    if (!square || square.length !== 2) return null

    const file = square.charCodeAt(0) - 97 // 'a' is 97 in ASCII
    const rank = 8 - Number.parseInt(square[1])

    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null

    return { row: rank, col: file }
  }
}

export default MoveValidator
