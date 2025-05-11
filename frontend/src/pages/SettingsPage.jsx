"use client"
import { useNavigate } from "react-router-dom"
import { useSettings } from "../context/SettingsContext"

const SettingsPage = () => {
  const navigate = useNavigate()
  const {
    soundEnabled,
    setSoundEnabled,
    musicEnabled,
    setMusicEnabled,
    animationsEnabled,
    setAnimationsEnabled,
    theme,
    setTheme,
    showCoordinates,
    setShowCoordinates,
    showMoveHistory,
    setShowMoveHistory,
    showCapturedPieces,
    setShowCapturedPieces,
    volume,
    setVolume,
    musicVolume,
    setMusicVolume,
    resetSettings,
    playSound,
  } = useSettings()

  const handleBack = () => {
    navigate(-1)
  }

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to default?")) {
      resetSettings()
    }
  }

  const handleSoundToggle = () => {
    const newValue = !soundEnabled
    setSoundEnabled(newValue)
    if (newValue) playSound("click")
  }

  const handleVolumeChange = (e) => {
    const newVolume = Number.parseInt(e.target.value)
    setVolume(newVolume)
    if (soundEnabled) playSound("click")
  }

  return (
    <div className={`settings-page ${theme}`}>
      <div className="page-header">
        <h1>Settings</h1>
        <p className="subtitle">Customize your game experience</p>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Appearance</h2>

          <div className="setting-item">
            <label>Theme</label>
            <div className="theme-selector">
              <button
                className={`theme-button ${theme === "classic" ? "active" : ""}`}
                onClick={() => setTheme("classic")}
              >
                <div className="theme-preview classic">
                  <div className="theme-square light"></div>
                  <div className="theme-square dark"></div>
                </div>
                <span>Classic</span>
              </button>

              <button
                className={`theme-button ${theme === "modern" ? "active" : ""}`}
                onClick={() => setTheme("modern")}
              >
                <div className="theme-preview modern">
                  <div className="theme-square light"></div>
                  <div className="theme-square dark"></div>
                </div>
                <span>Modern</span>
              </button>

              <button className={`theme-button ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")}>
                <div className="theme-preview dark-theme">
                  <div className="theme-square light"></div>
                  <div className="theme-square dark"></div>
                </div>
                <span>Dark</span>
              </button>

              <button className={`theme-button ${theme === "neon" ? "active" : ""}`} onClick={() => setTheme("neon")}>
                <div className="theme-preview neon-theme">
                  <div className="theme-square light"></div>
                  <div className="theme-square dark"></div>
                </div>
                <span>Neon</span>
              </button>
            </div>
          </div>

          <div className="setting-item">
            <label htmlFor="animations">Animations</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="animations"
                checked={animationsEnabled}
                onChange={() => setAnimationsEnabled(!animationsEnabled)}
              />
              <label htmlFor="animations"></label>
            </div>
          </div>

          <div className="setting-item">
            <label htmlFor="coordinates">Show Coordinates</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="coordinates"
                checked={showCoordinates}
                onChange={() => setShowCoordinates(!showCoordinates)}
              />
              <label htmlFor="coordinates"></label>
            </div>
          </div>

          <div className="setting-item">
            <label htmlFor="moveHistory">Show Move History</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="moveHistory"
                checked={showMoveHistory}
                onChange={() => setShowMoveHistory(!showMoveHistory)}
              />
              <label htmlFor="moveHistory"></label>
            </div>
          </div>

          <div className="setting-item">
            <label htmlFor="capturedPieces">Show Captured Pieces</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="capturedPieces"
                checked={showCapturedPieces}
                onChange={() => setShowCapturedPieces(!showCapturedPieces)}
              />
              <label htmlFor="capturedPieces"></label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Audio</h2>

          <div className="setting-item">
            <label htmlFor="sound">Sound Effects</label>
            <div className="toggle-switch">
              <input type="checkbox" id="sound" checked={soundEnabled} onChange={handleSoundToggle} />
              <label htmlFor="sound"></label>
            </div>
          </div>

          <div className="setting-item">
            <label htmlFor="music">Background Music</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="music"
                checked={musicEnabled}
                onChange={() => setMusicEnabled(!musicEnabled)}
              />
              <label htmlFor="music"></label>
            </div>
          </div>

          <div className="setting-item">
            <label htmlFor="volume">Sound Volume: {volume}%</label>
            <input
              type="range"
              id="volume"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!soundEnabled}
              className="slider"
            />
            <button className="test-sound-button" onClick={() => playSound("move")} disabled={!soundEnabled}>
              Test
            </button>
          </div>

          <div className="setting-item">
            <label htmlFor="musicVolume">Music Volume: {musicVolume}%</label>
            <input
              type="range"
              id="musicVolume"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number.parseInt(e.target.value))}
              disabled={!musicEnabled}
              className="slider"
            />
          </div>
        </div>

        <div className="settings-section">
          <h2>Gameplay</h2>

          <div className="setting-item">
            <label htmlFor="clientValidation">Show Valid Moves</label>
            <div className="toggle-switch">
              <input type="checkbox" id="clientValidation" checked={true} onChange={() => {}} />
              <label htmlFor="clientValidation"></label>
            </div>
          </div>

          <div className="setting-info">
            <p>Highlights valid moves when you select a piece. This helps prevent illegal moves.</p>
          </div>
        </div>

        <div className="settings-actions">
          <button className="secondary-button" onClick={handleBack}>
            Back
          </button>
          <button className="danger-button" onClick={handleReset}>
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
