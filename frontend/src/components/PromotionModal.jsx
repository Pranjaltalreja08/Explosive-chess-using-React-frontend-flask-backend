"use client"
import { useGame } from "../context/GameContext"

const PromotionModal = ({ isOpen, onClose }) => {
  const { promotePawn, currentPlayer } = useGame()

  // Chess piece Unicode characters
  const PIECES = {
    q: "♛", // black queen
    r: "♜", // black rook
    b: "♝", // black bishop
    n: "♞", // black knight
    Q: "♕", // white queen
    R: "♖", // white rook
    B: "♗", // white bishop
    N: "♘", // white knight
  }

  const PIECE_NAMES = {
    q: "Queen",
    r: "Rook",
    b: "Bishop",
    n: "Knight",
    Q: "Queen",
    R: "Rook",
    B: "Bishop",
    N: "Knight",
  }

  // Determine which pieces to show based on current player's color
  const pieces = currentPlayer === "white" ? ["Q", "R", "B", "N"] : ["q", "r", "b", "n"]

  if (isOpen === false) return null

  const handleSelect = (piece) => {
    promotePawn(piece)
    if (onClose) onClose()
  }

  return (
    <div className="promotion-modal-overlay">
      <div className="promotion-modal">
        <h3>Promote Pawn</h3>
        <p>Choose a piece to promote your pawn to:</p>
        <div className="promotion-options">
          {pieces.map((piece) => (
            <button
              key={piece}
              className="promotion-option"
              onClick={() => handleSelect(piece)}
              title={PIECE_NAMES[piece]}
            >
              <span className="promotion-piece">{PIECES[piece]}</span>
              <span className="promotion-name">{PIECE_NAMES[piece]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PromotionModal
