const CapturedPieces = ({ capturedPieces }) => {
  // Chess piece Unicode characters
  const PIECES = {
    p: "♟", // black pawn
    n: "♞", // black knight
    b: "♝", // black bishop
    r: "♜", // black rook
    q: "♛", // black queen
    k: "♚", // black king
    P: "♙", // white pawn
    N: "♘", // white knight
    B: "♗", // white bishop
    R: "♖", // white rook
    Q: "♕", // white queen
    K: "♔", // white king
  }

  return (
    <div className="captured-pieces">
      <h3>Captured Pieces</h3>

      <div className="captured-white">
        <h4>White Pieces</h4>
        <div className="pieces-container">
          {capturedPieces && capturedPieces.white && capturedPieces.white.length > 0 ? (
            capturedPieces.white.map((piece, index) => (
              <span key={index} className="captured-piece white-piece">
                {PIECES[piece]}
              </span>
            ))
          ) : (
            <div className="no-pieces">No captured white pieces</div>
          )}
        </div>
      </div>

      <div className="captured-black">
        <h4>Black Pieces</h4>
        <div className="pieces-container">
          {capturedPieces && capturedPieces.black && capturedPieces.black.length > 0 ? (
            capturedPieces.black.map((piece, index) => (
              <span key={index} className="captured-piece black-piece">
                {PIECES[piece]}
              </span>
            ))
          ) : (
            <div className="no-pieces">No captured black pieces</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CapturedPieces
