"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSettings } from "../context/SettingsContext"

const HowToPlayPage = () => {
  const navigate = useNavigate()
  const { theme } = useSettings()
  const [activeTab, setActiveTab] = useState("basics")

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className={`how-to-play-page ${theme}`}>
      <div className="page-header">
        <h1>How to Play</h1>
        <p className="subtitle">Learn the rules of Explosive Chess</p>
      </div>

      <div className="how-to-play-content">
        <div className="rules-tabs">
          <button
            className={`tab-button ${activeTab === "basics" ? "active" : ""}`}
            onClick={() => setActiveTab("basics")}
          >
            Basic Rules
          </button>
          <button
            className={`tab-button ${activeTab === "explosions" ? "active" : ""}`}
            onClick={() => setActiveTab("explosions")}
          >
            Explosion Mechanics
          </button>
          <button
            className={`tab-button ${activeTab === "pieces" ? "active" : ""}`}
            onClick={() => setActiveTab("pieces")}
          >
            Piece Movement
          </button>
          <button
            className={`tab-button ${activeTab === "strategy" ? "active" : ""}`}
            onClick={() => setActiveTab("strategy")}
          >
            Strategy Tips
          </button>
        </div>

        <div className="rules-content">
          {activeTab === "basics" && (
            <div className="rules-section">
              <h2>Basic Rules</h2>
              <p>
                Explosive Chess follows the standard rules of chess with one explosive twist: when a piece is captured,
                it creates an explosion that affects all surrounding squares!
              </p>

              <div className="rule-item">
                <h3>Standard Chess Rules</h3>
                <ul>
                  <li>White moves first, then players alternate turns</li>
                  <li>Each piece moves in specific patterns</li>
                  <li>The goal is to checkmate your opponent's king</li>
                  <li>A king in check must move out of check on the next move</li>
                  <li>Pawns can be promoted when they reach the opposite end of the board</li>
                </ul>
              </div>

              <div className="rules-diagram">
                <div className="diagram-title">Standard Chess Board Setup</div>
                <div className="diagram-image chess-setup"></div>
                <div className="diagram-caption">
                  The initial setup of the chess board follows standard chess rules.
                </div>
              </div>
            </div>
          )}

          {activeTab === "explosions" && (
            <div className="rules-section">
              <h2>Explosion Mechanics</h2>
              <p>
                The explosive mechanic is what makes this variant unique and exciting! Understanding how explosions work
                is key to mastering the game.
              </p>

              <div className="rule-item">
                <h3>How Explosions Work</h3>
                <ul>
                  <li>When a piece is captured, it explodes!</li>
                  <li>The explosion affects all 8 surrounding squares</li>
                  <li>All pieces in the explosion radius are removed from the board</li>
                  <li>Pawns are immune to explosions and will not be removed</li>
                  <li>If a king is caught in an explosion, that player immediately loses</li>
                  <li>Chain reactions are possible when multiple pieces explode</li>
                </ul>
              </div>

              <div className="rules-diagram">
                <div className="diagram-title">Explosion Radius</div>
                <div className="diagram-image explosion-radius"></div>
                <div className="diagram-caption">
                  When a piece is captured at the center square (marked X), all pieces in the surrounding 8 squares are
                  removed, except pawns.
                </div>
              </div>

              <div className="rules-diagram">
                <div className="diagram-title">Chain Reaction Example</div>
                <div className="diagram-image chain-reaction"></div>
                <div className="diagram-caption">
                  A chain reaction occurs when an explosion causes another piece to be removed, triggering another
                  explosion.
                </div>
              </div>
            </div>
          )}

          {activeTab === "pieces" && (
            <div className="rules-section">
              <h2>Piece Movement</h2>
              <p>Pieces move according to standard chess rules. Here's a quick reference for how each piece moves.</p>

              <div className="pieces-grid">
                <div className="piece-card">
                  <div className="piece-icon">♙</div>
                  <h3>Pawn</h3>
                  <p>Moves forward one square, captures diagonally. Can move two squares on first move.</p>
                  <p className="piece-special">Special: Immune to explosions!</p>
                  <div className="piece-movement pawn-movement"></div>
                </div>

                <div className="piece-card">
                  <div className="piece-icon">♘</div>
                  <h3>Knight</h3>
                  <p>Moves in an L-shape: two squares in one direction, then one square perpendicular.</p>
                  <div className="piece-movement knight-movement"></div>
                </div>

                <div className="piece-card">
                  <div className="piece-icon">♗</div>
                  <h3>Bishop</h3>
                  <p>Moves diagonally any number of squares.</p>
                  <div className="piece-movement bishop-movement"></div>
                </div>

                <div className="piece-card">
                  <div className="piece-icon">♖</div>
                  <h3>Rook</h3>
                  <p>Moves horizontally or vertically any number of squares.</p>
                  <div className="piece-movement rook-movement"></div>
                </div>

                <div className="piece-card">
                  <div className="piece-icon">♕</div>
                  <h3>Queen</h3>
                  <p>Moves horizontally, vertically, or diagonally any number of squares.</p>
                  <div className="piece-movement queen-movement"></div>
                </div>

                <div className="piece-card">
                  <div className="piece-icon">♔</div>
                  <h3>King</h3>
                  <p>Moves one square in any direction.</p>
                  <p className="piece-special">Special: If caught in an explosion, you lose the game!</p>
                  <div className="piece-movement king-movement"></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "strategy" && (
            <div className="rules-section">
              <h2>Strategy Tips</h2>
              <p>
                Explosive Chess requires different strategic thinking than standard chess. Here are some tips to help
                you master the explosive mechanics.
              </p>

              <div className="strategy-tips">
                <div className="strategy-tip">
                  <h3>1. Protect Your King</h3>
                  <p>
                    Keep your king away from clusters of pieces, both yours and your opponent's. A single capture near
                    your king can end the game instantly.
                  </p>
                </div>

                <div className="strategy-tip">
                  <h3>2. Use Pawns as Shields</h3>
                  <p>
                    Since pawns are immune to explosions, they make excellent shields for your valuable pieces and can
                    safely be placed near enemy pieces.
                  </p>
                </div>

                <div className="strategy-tip">
                  <h3>3. Create Explosive Traps</h3>
                  <p>
                    Position your pieces so that capturing one will trigger a chain reaction that damages your opponent
                    more than you.
                  </p>
                </div>

                <div className="strategy-tip">
                  <h3>4. Think About Explosion Consequences</h3>
                  <p>
                    Before making a capture, visualize the explosion and ensure it won't harm your key pieces or create
                    an advantage for your opponent.
                  </p>
                </div>

                <div className="strategy-tip">
                  <h3>5. Sacrifice for Strategic Advantage</h3>
                  <p>
                    Sometimes sacrificing a piece to trigger an explosion can clear multiple enemy pieces, creating a
                    material advantage.
                  </p>
                </div>

                <div className="strategy-tip">
                  <h3>6. Use Knights for Surprise Attacks</h3>
                  <p>
                    Knights can jump over pieces, making them excellent for unexpected captures that trigger explosions
                    in the heart of enemy territory.
                  </p>
                </div>
              </div>

              <div className="rules-diagram">
                <div className="diagram-title">Strategic Sacrifice Example</div>
                <div className="diagram-image strategic-sacrifice"></div>
                <div className="diagram-caption">
                  White sacrifices a bishop to capture a black knight, causing an explosion that removes black's queen
                  and rook.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="back-button-container">
          <button className="secondary-button" onClick={handleBack}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default HowToPlayPage
