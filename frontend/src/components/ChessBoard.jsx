"use client"

import { useEffect, useState } from "react"
import { useGame } from "../context/GameContext"

const ChessBoard = () => {
  const {
    board,
    selectedPiece,
    validMoves,
    handleSquareClick,
    gameStatus,
    loading,
    PIECES,
    currentPlayer,
    showPromotionModal,
    setShowPromotionModal,
  } = useGame()

  const [explodingSquares, setExplodingSquares] = useState([])

  // Handle explosion animation
  useEffect(() => {
    if (gameStatus.explosion && gameStatus.explosionPosition) {
      const { row, col } = gameStatus.explosionPosition

      // Create array of squares affected by explosion (3x3 grid centered on explosion)
      const explosionSquares = []
      for (let r = Math.max(0, row - 1); r <= Math.min(7, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
          explosionSquares.push({ row: r, col: c })
        }
      }

      setExplodingSquares(explosionSquares)

      // Clear explosion after animation
      setTimeout(() => {
        setExplodingSquares([])
      }, 1000)
    }
  }, [gameStatus.explosion, gameStatus.explosionPosition])

  const isSquareSelected = (row, col) => {
    return selectedPiece && selectedPiece.row === row && selectedPiece.col === col
  }

  const isValidMove = (row, col) => {
    return validMoves.some((move) => move.row === row && move.col === col)
  }

  const isExploding = (row, col) => {
    return explodingSquares.some((square) => square.row === row && square.col === col)
  }

  const renderSquare = (row, col) => {
    const isWhiteSquare = (row + col) % 2 === 0
    const piece = board[row][col]
    const selected = isSquareSelected(row, col)
    const validMove = isValidMove(row, col)
    const exploding = isExploding(row, col)

    const squareClasses = [
      "square",
      isWhiteSquare ? "white-square" : "black-square",
      selected ? "selected-square" : "",
      exploding ? "exploded-square" : "",
    ]
      .filter(Boolean)
      .join(" ")

    const pieceClasses = ["piece", exploding ? "exploding" : ""].filter(Boolean).join(" ")

    return (
      <div key={`${row}-${col}`} className={squareClasses} onClick={() => handleSquareClick(row, col)}>
        {/* Square labels (a-h, 1-8) */}
        {col === 0 && <span className="square-label rank-label">{8 - row}</span>}
        {row === 7 && <span className="square-label file-label">{String.fromCharCode(97 + col)}</span>}

        {/* Chess piece */}
        {piece && <div className={pieceClasses}>{PIECES[piece]}</div>}

        {/* Valid move indicator */}
        {validMove && !piece && <div className="valid-move-indicator"></div>}

        {/* Explosion effect */}
        {exploding && <div className="explosion-effect"></div>}
      </div>
    )
  }

  return (
    <div className="board-container">
      <div className="board-frame">
        <div className="board">
          {Array(8)
            .fill()
            .map((_, row) => (
              <div key={row} className="board-row">
                {Array(8)
                  .fill()
                  .map((_, col) => renderSquare(row, col))}
              </div>
            ))}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}


    </div>
  )
}

export default ChessBoard
