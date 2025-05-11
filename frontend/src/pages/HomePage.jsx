"use client"
import { useNavigate } from "react-router-dom"
import { useSettings } from "../context/SettingsContext"
import "../styles.css"

const HomePage = () => {
  const navigate = useNavigate()
  const { theme } = useSettings()

  const handleNewGame = () => {
    navigate("/game-mode")
  }

  const handleAIGame = () => {
    navigate("/ai-game")
  }

  const handleHowToPlay = () => {
    navigate("/how-to-play")
  }

  const handleProfile = () => {
    navigate("/profile")
  }

  const handleSettings = () => {
    navigate("/settings")
  }

  const handleExit = () => {
    // In a real app, this might close the app
    // For web, we'll just show an alert
    if (window.confirm("Are you sure you want to exit?")) {
      window.close()
    }
  }

  return (
    <div className={`home-page ${theme}`}>
      <div className="home-content">
        <div className="logo-container">
          <h1 className="game-logo">Explosive Chess</h1>
          <div className="logo-pieces">
            <span className="logo-piece white">♔</span>
            <span className="logo-piece black">♚</span>
          </div>
          <p className="tagline">Chess with a bang!</p>
        </div>

        <div className="menu-container">
          <button className="menu-button primary" onClick={handleNewGame}>
            New Game
          </button>
          <button className="menu-button primary" onClick={handleAIGame}>
            Play vs AI
          </button>
          <button className="menu-button secondary" onClick={handleHowToPlay}>
            How to Play
          </button>
          <button className="menu-button secondary" onClick={handleProfile}>
            Profile
          </button>
          <button className="menu-button secondary" onClick={handleSettings}>
            Settings
          </button>
          <button className="menu-button danger" onClick={handleExit}>
            Exit
          </button>
        </div>

        <div className="home-footer">
          <p>Explosive Chess &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}

export default HomePage
