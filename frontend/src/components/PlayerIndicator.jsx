const PlayerIndicator = ({ currentPlayer, isCheck, isCheckmate, isAI = false, aiThinking = false }) => {
    return (
      <div className="player-indicators">
        <div className={`player-indicator ${currentPlayer === "white" ? "active" : ""}`}>
          <div className="player-avatar white">
            <span className="player-piece">♔</span>
          </div>
          <div className="player-info">
            <span className="player-name">Player 1</span>
            {currentPlayer === "white" && (
              <span className="player-status">{isCheckmate ? "Checkmate!" : isCheck ? "Check!" : "Your Turn"}</span>
            )}
          </div>
        </div>
  
        <div className="vs-indicator">VS</div>
  
        <div className={`player-indicator ${currentPlayer === "black" ? "active" : ""}`}>
          <div className="player-avatar black">
            {isAI ? <span className="player-piece ai">🤖</span> : <span className="player-piece">♚</span>}
          </div>
          <div className="player-info">
            <span className="player-name">{isAI ? "AI Opponent" : "Player 2"}</span>
            {currentPlayer === "black" && (
              <span className="player-status">
                {isCheckmate ? "Checkmate!" : isCheck ? "Check!" : isAI && aiThinking ? "Thinking..." : "Turn"}
              </span>
            )}
            {isAI && currentPlayer === "black" && aiThinking && (
              <div className="ai-thinking-indicator">
                <div className="thinking-dot"></div>
                <div className="thinking-dot"></div>
                <div className="thinking-dot"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  export default PlayerIndicator
  