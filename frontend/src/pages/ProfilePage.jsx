"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSettings } from "../context/SettingsContext"

const AVATARS = [
  "👑",
  "🤴",
  "👸",
  "🧙‍♂️",
  "🧙‍♀️",
  "🦸‍♂️",
  "🦸‍♀️",
  "🧝‍♂️",
  "🧝‍♀️",
  "🧚‍♂️",
  "🧚‍♀️",
  "🧞‍♂️",
  "🧞‍♀️",
  "🐉",
  "🦁",
  "🐺",
  "🦊",
  "🐱",
  "🐯",
  "🦄",
]

const ProfilePage = () => {
  const navigate = useNavigate()
  const { theme } = useSettings()

  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState(localStorage.getItem("username") || "Player")
  const [selectedAvatar, setSelectedAvatar] = useState(localStorage.getItem("avatar") || "👑")
  const [tempUsername, setTempUsername] = useState(username)
  const [tempAvatar, setTempAvatar] = useState(selectedAvatar)
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    explosionsCaused: 0,
    piecesPromoted: 0,
    aiWins: 0,
    aiLosses: 0,
    playerWins: 0,
    playerLosses: 0,
    kingsExploded: 0,
  })

  // Load game stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem("explosiveChessStats")
    if (savedStats) {
      setGameStats(JSON.parse(savedStats))
    }
  }, [])

  const handleBack = () => {
    navigate(-1)
  }

  const handleResetStats = () => {
    if (window.confirm("Are you sure you want to reset all your statistics? This cannot be undone.")) {
      const resetStats = {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        explosionsCaused: 0,
        piecesPromoted: 0,
        aiWins: 0,
        aiLosses: 0,
        playerWins: 0,
        playerLosses: 0,
        kingsExploded: 0,
      }

      setGameStats(resetStats)
      localStorage.setItem("explosiveChessStats", JSON.stringify(resetStats))
    }
  }

  const handleEditProfile = () => {
    setIsEditing(true)
    setTempUsername(username)
    setTempAvatar(selectedAvatar)
  }

  const handleSaveProfile = () => {
    setUsername(tempUsername)
    setSelectedAvatar(tempAvatar)
    localStorage.setItem("username", tempUsername)
    localStorage.setItem("avatar", tempAvatar)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // Calculate win rate
  const totalGames = gameStats.wins + gameStats.losses + gameStats.draws
  const winRate = totalGames > 0 ? Math.round((gameStats.wins / totalGames) * 100) : 0

  return (
    <div className={`profile-page ${theme}`}>
      <div className="page-header">
        <h1>Player Profile</h1>
        <p className="subtitle">Your game statistics and achievements</p>
      </div>

      <div className="profile-content">
        <div className="profile-section user-profile">
          {isEditing ? (
            <div className="edit-profile">
              <h2>Edit Profile</h2>

              <div className="edit-avatar">
                <label>Select Avatar</label>
                <div className="avatar-grid">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      className={`avatar-option ${avatar === tempAvatar ? "selected" : ""}`}
                      onClick={() => setTempAvatar(avatar)}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="edit-username">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  maxLength={20}
                  placeholder="Enter username"
                />
              </div>

              <div className="edit-actions">
                <button className="secondary-button" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button className="primary-button" onClick={handleSaveProfile}>
                  Save Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="user-info">
              <div className="user-avatar">
                <span className="avatar">{selectedAvatar}</span>
              </div>
              <div className="user-details">
                <h2 className="username">{username}</h2>
                <button className="edit-profile-button" onClick={handleEditProfile}>
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Game Statistics</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{gameStats.gamesPlayed}</div>
              <div className="stat-label">Games Played</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{gameStats.wins}</div>
              <div className="stat-label">Wins</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{gameStats.losses}</div>
              <div className="stat-label">Losses</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{gameStats.draws}</div>
              <div className="stat-label">Draws</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{winRate}%</div>
              <div className="stat-label">Win Rate</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{gameStats.explosionsCaused}</div>
              <div className="stat-label">Explosions</div>
            </div>
          </div>

          <div className="stats-details">
            <div className="stats-row">
              <div className="stats-label">AI Wins:</div>
              <div className="stats-value">{gameStats.aiWins || 0}</div>
            </div>
            <div className="stats-row">
              <div className="stats-label">AI Losses:</div>
              <div className="stats-value">{gameStats.aiLosses || 0}</div>
            </div>
            <div className="stats-row">
              <div className="stats-label">Player Wins:</div>
              <div className="stats-value">{gameStats.playerWins || 0}</div>
            </div>
            <div className="stats-row">
              <div className="stats-label">Player Losses:</div>
              <div className="stats-value">{gameStats.playerLosses || 0}</div>
            </div>
            <div className="stats-row">
              <div className="stats-label">Pieces Promoted:</div>
              <div className="stats-value">{gameStats.piecesPromoted}</div>
            </div>
            <div className="stats-row">
              <div className="stats-label">Kings Exploded:</div>
              <div className="stats-value">{gameStats.kingsExploded || 0}</div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Achievements</h2>

          <div className="achievements-grid">
            <div className={`achievement-card ${gameStats.gamesPlayed >= 1 ? "unlocked" : "locked"}`}>
              <div className="achievement-icon">🏁</div>
              <div className="achievement-info">
                <h3>First Steps</h3>
                <p>Play your first game</p>
              </div>
              {gameStats.gamesPlayed >= 1 && <div className="achievement-badge">✓</div>}
            </div>

            <div className={`achievement-card ${gameStats.wins >= 1 ? "unlocked" : "locked"}`}>
              <div className="achievement-icon">🏆</div>
              <div className="achievement-info">
                <h3>First Victory</h3>
                <p>Win your first game</p>
              </div>
              {gameStats.wins >= 1 && <div className="achievement-badge">✓</div>}
            </div>

            <div className={`achievement-card ${gameStats.explosionsCaused >= 10 ? "unlocked" : "locked"}`}>
              <div className="achievement-icon">💥</div>
              <div className="achievement-info">
                <h3>Demolition Expert</h3>
                <p>Cause 10 explosions</p>
              </div>
              {gameStats.explosionsCaused >= 10 && <div className="achievement-badge">✓</div>}
            </div>

            <div className={`achievement-card ${gameStats.piecesPromoted >= 5 ? "unlocked" : "locked"}`}>
              <div className="achievement-icon">👑</div>
              <div className="achievement-info">
                <h3>Royal Promoter</h3>
                <p>Promote 5 pawns</p>
              </div>
              {gameStats.piecesPromoted >= 5 && <div className="achievement-badge">✓</div>}
            </div>

            <div className={`achievement-card ${gameStats.wins >= 5 ? "unlocked" : "locked"}`}>
              <div className="achievement-icon">🌟</div>
              <div className="achievement-info">
                <h3>Rising Star</h3>
                <p>Win 5 games</p>
              </div>
              {gameStats.wins >= 5 && <div className="achievement-badge">✓</div>}
            </div>

            <div className={`achievement-card ${gameStats.kingsExploded >= 3 ? "unlocked" : "locked"}`}>
              <div className="achievement-icon">🔥</div>
              <div className="achievement-info">
                <h3>Royal Demolisher</h3>
                <p>Win by exploding 3 kings</p>
              </div>
              {gameStats.kingsExploded >= 3 && <div className="achievement-badge">✓</div>}
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="secondary-button" onClick={handleBack}>
            Back
          </button>
          <button className="danger-button" onClick={handleResetStats}>
            Reset Statistics
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
