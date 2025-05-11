const GameInfo = ({ message }) => {
  return (
    <div className="game-info">
      <h3>Game Status</h3>
      <div className="message-box">{message || "Game in progress. Make your move."}</div>
    </div>
  )
}

export default GameInfo
