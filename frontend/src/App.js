import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import GamePage from "./pages/GamePage"
import AIGamePage from "./pages/AIGamePage"
import HowToPlayPage from "./pages/HowToPlayPage"
import ProfilePage from "./pages/ProfilePage"
import SettingsPage from "./pages/SettingsPage"
import GameModePage from "./pages/GameModePage"
import { GameProvider } from "./context/GameContext"
import { SettingsProvider } from "./context/SettingsContext"
import "./styles.css"

function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/ai-game" element={<AIGamePage />} />
              <Route path="/game-mode" element={<GameModePage />} />
              <Route path="/how-to-play" element={<HowToPlayPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </Router>
      </GameProvider>
    </SettingsProvider>
  )
}

export default App
