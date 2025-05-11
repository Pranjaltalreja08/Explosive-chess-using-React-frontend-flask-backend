const MoveHistory = ({ moveHistory }) => {
  return (
    <div className="move-history-container">
      <h3>Move History</h3>
      <div className="move-history">
        {moveHistory && moveHistory.length > 0 ? (
          moveHistory.map((move, index) => (
            <div key={index} className="move-entry">
              <span className="move-number">{Math.floor(index / 2) + 1}.</span>
              <span className={`move-piece ${move.color}`}>{move.piece}</span>
              <span className="move-from">{move.from}</span>
              <span className="move-arrow">→</span>
              <span className="move-to">{move.to}</span>
              {move.promotion && <span className="move-promotion">={move.promotion}</span>}
              {move.causedExplosion && <span className="move-explosion">💥</span>}
              {move.isAI && <span className="move-ai">AI</span>}
            </div>
          ))
        ) : (
          <div className="no-moves">No moves yet</div>
        )}
      </div>
    </div>
  )
}

export default MoveHistory
