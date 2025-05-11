"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import "./styles.css"
import "./App.css"

// Pages
import HomePage from "./pages/HomePage"
import GameModePage from "./pages/GameModePage"
import GamePage from "./pages/GamePage"
import SettingsPage from "./pages/SettingsPage"
import HowToPlayPage from "./pages/HowToPlayPage"
import ProfilePage from "./pages/ProfilePage"

// Context
import { GameProvider } from "./context/GameContext"
import { SettingsProvider } from "./context/SettingsContext"

function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game-mode" element={<GameModePage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/how-to-play" element={<HowToPlayPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </GameProvider>
    </SettingsProvider>
  )
}

export default App
