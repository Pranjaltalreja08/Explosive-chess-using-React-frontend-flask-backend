const GameTimer = ({ time, isActive }) => {
    // Format time as mm:ss
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }
  
    return (
      <div className={`game-timer ${isActive ? "active" : ""}`}>
        <div className="timer-icon">⏱️</div>
        <div className="timer-display">{formatTime(time)}</div>
      </div>
    )
  }
  
  export default GameTimer
  