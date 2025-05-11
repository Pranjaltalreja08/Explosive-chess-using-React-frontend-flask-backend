const DebugPanel = ({
  gameState,
  selectedSquare,
  apiUrl,
  lastError,
  lastRequest,
  connectionStatus,
  validMoves,
  clientSideValidation,
  moveHistory,
  capturedPieces,
}) => {
  return (
    <div className="debug-panel">
      <h3>Debug Information</h3>
      <div className="debug-content">
        <div className="debug-section">
          <h4>Connection</h4>
          <p>
            <strong>API URL:</strong> {apiUrl}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className={connectionStatus === "Connected" ? "connected" : "disconnected"}>{connectionStatus}</span>
          </p>
          <p>
            <strong>Client Validation:</strong>{" "}
            <span className={clientSideValidation ? "enabled" : "disabled"}>
              {clientSideValidation ? "Enabled" : "Disabled"}
            </span>
          </p>
        </div>

        <div className="debug-section">
          <h4>Game State</h4>
          <p>
            <strong>Current Turn:</strong> {gameState.turn}
          </p>
          <p>
            <strong>Selected Square:</strong> {selectedSquare || "None"}
          </p>
          <p>
            <strong>Valid Moves:</strong> {validMoves?.join(", ") || "None"}
          </p>
          <p>
            <strong>Game Status:</strong> {gameState.isCheck ? "Check " : ""}
            {gameState.isCheckmate ? "Checkmate " : ""}
            {gameState.isStalemate ? "Stalemate " : ""}
            {gameState.isGameOver ? "Game Over" : "In Progress"}
          </p>
          <p>
            <strong>Kings:</strong> White: {gameState.whiteKingExists ? "Alive" : "Dead"}, Black:{" "}
            {gameState.blackKingExists ? "Alive" : "Dead"}
          </p>
          <p>
            <strong>Result:</strong> {gameState.result || "None"}
          </p>
          <p>
            <strong>Exploded Squares:</strong> {gameState.exploded?.join(", ") || "None"}
          </p>
        </div>

        <div className="debug-section">
          <h4>Captured Pieces</h4>
          <p>
            <strong>White Pieces:</strong> {capturedPieces.white.length > 0 ? capturedPieces.white.join(", ") : "None"}
          </p>
          <p>
            <strong>Black Pieces:</strong> {capturedPieces.black.length > 0 ? capturedPieces.black.join(", ") : "None"}
          </p>
        </div>

        <div className="debug-section">
          <h4>Last Error</h4>
          <p className="error-message">{lastError || "None"}</p>
        </div>

        <div className="debug-section">
          <h4>Last Request</h4>
          {lastRequest ? (
            <>
              <p>
                <strong>Endpoint:</strong> {lastRequest.endpoint}
              </p>
              <p>
                <strong>Method:</strong> {lastRequest.method}
              </p>
              {lastRequest.pieceInfo && (
                <div>
                  <p>
                    <strong>Piece Info:</strong>
                  </p>
                  <ul>
                    <li>Piece: {lastRequest.pieceInfo.piece}</li>
                    <li>Type: {lastRequest.pieceInfo.type}</li>
                    <li>Color: {lastRequest.pieceInfo.color}</li>
                    <li>From: {lastRequest.pieceInfo.from}</li>
                    <li>To: {lastRequest.pieceInfo.to}</li>
                    {lastRequest.pieceInfo.promotion && <li>Promotion: {lastRequest.pieceInfo.promotion}</li>}
                  </ul>
                </div>
              )}
              <p>
                <strong>Data:</strong>
              </p>
              <pre>{JSON.stringify(lastRequest.data, null, 2)}</pre>
            </>
          ) : (
            <p>No requests made yet</p>
          )}
        </div>

        <div className="debug-section">
          <h4>Move History</h4>
          {moveHistory.length > 0 ? (
            <div className="move-history">
              {moveHistory.map((move, index) => (
                <div key={index} className="move-entry">
                  {move.isFailed ? (
                    <div className="failed-move">
                      <span className="move-number">{index + 1}.</span>
                      <span className="move-ai">(AI)</span>
                      <span className="error-message">Failed: {move.error}</span>
                    </div>
                  ) : (
                    <>
                      <span className="move-number">{index + 1}.</span>
                      <span className={`move-piece ${move.pieceColor}`}>{move.piece}</span>
                      <span className="move-from">{move.from}</span>
                      <span className="move-arrow">→</span>
                      <span className="move-to">{move.to}</span>
                      {move.promotion && <span className="move-promotion">={move.promotion}</span>}
                      {move.isAI && <span className="move-ai">(AI)</span>}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No moves made yet</p>
          )}
        </div>

        <div className="debug-section">
          <h4>Troubleshooting Tips</h4>
          <ul className="tips-list">
            <li>Make sure Flask backend is running on the correct port</li>
            <li>Check for CORS issues in browser console</li>
            <li>Verify that the move format is correct (e.g., "e2e4")</li>
            <li>Look for Python errors in the Flask console</li>
            <li>
              <strong>King capture detection:</strong> The game should now properly detect when a king is captured
            </li>
            <li>
              <strong>Check and checkmate:</strong> Kings cannot move into check, and the game ends on checkmate
            </li>
            <li>
              <strong>Game ending logic:</strong> The game should end immediately when a king is captured or exploded
            </li>
            <li>
              <strong>Move validation:</strong> Moves that would leave your king in check are not allowed
            </li>
            <li>
              <strong>Pawn promotion:</strong> When a pawn reaches the opposite end, you can promote it to any piece
            </li>
            <li>
              <strong>Captured pieces:</strong> The game now tracks and displays captured pieces
            </li>
            <li>
              <strong>AI failures after captures:</strong> Your backend's minimax algorithm likely has a bug in handling
              explosions
            </li>
            <li>Try toggling client-side validation to bypass frontend checks</li>
            <li>Use "Skip AI Turn" when the AI fails to respond</li>
            <li>Check your backend's explosion handling logic in the minimax evaluation function</li>
            <li>Consider reducing the AI search depth to 1 if depth 2 is causing crashes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default DebugPanel
