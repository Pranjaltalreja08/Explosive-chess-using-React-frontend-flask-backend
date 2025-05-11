"use client"
import { useSettings } from "../context/SettingsContext"

const DifficultySelector = ({ onSelect, currentDifficulty }) => {
  const { theme } = useSettings()

  return (
    <div className="difficulty-modal-overlay">
      <div className={`difficulty-modal ${theme}`}>
        <h2>Select AI Difficulty</h2>
        <p className="difficulty-subtitle">Choose how challenging you want your opponent to be</p>

        <div className="difficulty-options">
          <button
            className={`difficulty-option ${currentDifficulty === "easy" ? "active" : ""}`}
            onClick={() => onSelect("easy")}
          >
            <div className="difficulty-icon">😊</div>
            <div className="difficulty-details">
              <h3>Easy</h3>
              <p>Perfect for beginners or casual play. The AI makes basic moves and occasional mistakes.</p>
            </div>
          </button>

          <button
            className={`difficulty-option ${currentDifficulty === "medium" ? "active" : ""}`}
            onClick={() => onSelect("medium")}
          >
            <div className="difficulty-icon">🤔</div>
            <div className="difficulty-details">
              <h3>Medium</h3>
              <p>A balanced challenge. The AI plays strategically but isn't ruthless.</p>
            </div>
          </button>

          <button
            className={`difficulty-option ${currentDifficulty === "hard" ? "active" : ""}`}
            onClick={() => onSelect("hard")}
          >
            <div className="difficulty-icon">😈</div>
            <div className="difficulty-details">
              <h3>Hard</h3>
              <p>For experienced players. The AI plays aggressively and plans several moves ahead.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DifficultySelector
