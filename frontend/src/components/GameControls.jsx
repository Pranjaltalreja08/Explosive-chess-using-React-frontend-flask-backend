"use client"

const GameControls = ({ onExitGame, onRestartGame, onUndoMove, isGameOver, loading, isAIGame = false }) => {
  return (
    <div className="game-controls">
      <div className="controls-row">
        <button
          className="control-button undo-button"
          onClick={onUndoMove}
          disabled={loading || isGameOver}
          title="Undo Last Move"
        >
          <span className="control-icon">↩️</span>
          <span className="control-text">Undo</span>
        </button>

        <button
          className="control-button restart-button"
          onClick={onRestartGame}
          disabled={loading}
          title="Restart Game"
        >
          <span className="control-icon">🔄</span>
          <span className="control-text">Restart</span>
        </button>
      </div>

      <div className="controls-row">
        <button className="control-button exit-button" onClick={onExitGame} disabled={loading} title="Exit to Menu">
          <span className="control-icon">🚪</span>
          <span className="control-text">Exit</span>
        </button>
      </div>
    </div>
  )
}

export default GameControls
