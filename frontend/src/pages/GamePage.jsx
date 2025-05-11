"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useGame } from "../context/GameContext"
import { useSettings } from "../context/SettingsContext"
import ChessBoard from "../components/ChessBoard"
import GameInfo from "../components/GameInfo"
import GameControls from "../components/GameControls"
import GameOverModal from "../components/GameOverModal"
import PlayerIndicator from "../components/PlayerIndicator"
import GameTimer from "../components/Gametimer"
import MoveHistory from "../components/MoveHistory"
import CapturedPieces from "../components/CapturedPieces"
// Import the DebugPanel at the top of the file
import DebugPanel from "../components/DebugPanel"

const GamePage = () => {
  const {
    board,
    currentPlayer,
    selectedPiece,
    validMoves,
    moveHistory,
    capturedPieces,
    gameStatus,
    message,
    loading,
    startNewGame,
    selectPiece,
    makeMove,
    undoMove,
  } = useGame()

  const { showMoveHistory, showCapturedPieces, theme, soundEnabled, playSound } = useSettings()

  const [gameTime, setGameTime] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(true)
  const timerRef = useRef(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const [lastExplosion, setLastExplosion] = useState(null)
  const navigate = useNavigate()

  // Start timer when game starts
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setGameTime((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTimerActive])

  // Initialize game
  useEffect(() => {
    // Start a new game when the component mounts
    startNewGame()
  }, [])

  // Check if game is over
  useEffect(() => {
    if (gameStatus.gameOver) {
      // Pause timer
      setIsTimerActive(false)

      if (soundEnabled) playSound("gameOver")
    }
  }, [gameStatus, soundEnabled, playSound])

  // Track explosions for animation
  useEffect(() => {
    if (gameStatus.explosion) {
      setLastExplosion({
        position: gameStatus.explosionPosition,
        timestamp: Date.now(),
      })

      if (soundEnabled) playSound("explosion")
    }
  }, [gameStatus.explosion, soundEnabled, playSound])

  const handleSquareClick = (row, col) => {
    if (loading || gameStatus.gameOver) return

    // If a piece is already selected, try to move it
    if (selectedPiece) {
      if (validMoves.some((move) => move.row === row && move.col === col)) {
        makeMove(selectedPiece.row, selectedPiece.col, row, col)
      } else {
        // If clicked on another own piece, select that piece instead
        if (board[row][col] && board[row][col].color === currentPlayer) {
          selectPiece(row, col)
        } else {
          // Deselect if clicked elsewhere
          selectPiece(null)
        }
      }
    } else if (board[row][col] && board[row][col].color === currentPlayer) {
      // Select the piece if it belongs to current player
      selectPiece(row, col)
    }
  }

  const handleExitGame = () => {
    if (gameStatus.gameOver) {
      navigate("/")
    } else {
      setShowExitConfirm(true)
    }
  }

  const confirmExit = () => {
    setShowExitConfirm(false)
    navigate("/")
  }

  const cancelExit = () => {
    setShowExitConfirm(false)
  }

  const handleRestartGame = () => {
    if (gameStatus.gameOver) {
      restartGame()
    } else {
      setShowRestartConfirm(true)
    }
  }

  const confirmRestart = () => {
    setShowRestartConfirm(false)
    restartGame()
  }

  const cancelRestart = () => {
    setShowRestartConfirm(false)
  }

  const restartGame = async () => {
    await startNewGame()
    setGameTime(0)
    setIsTimerActive(true)
  }

  return (
    <div className={`game-page ${theme}`}>
      <div className="game-header">
        <h1>Explosive Chess - Local Game</h1>
        <div className="game-status-container">
          <PlayerIndicator
            currentPlayer={currentPlayer}
            isCheck={gameStatus.isCheck}
            isCheckmate={gameStatus.isCheckmate}
          />
          <GameTimer time={gameTime} isActive={isTimerActive} />
        </div>
      </div>

      <div className="game-container">
        <div className="game-main">
          <div className="board-section">
            <ChessBoard
              board={board}
              selectedPiece={selectedPiece}
              validMoves={validMoves}
              onSquareClick={handleSquareClick}
              lastExplosion={lastExplosion}
            />
          </div>

          <div className="game-sidebar">
            <GameInfo message={message} />

            {showCapturedPieces && <CapturedPieces capturedPieces={capturedPieces} />}

            {showMoveHistory && <MoveHistory moveHistory={moveHistory} />}

            <GameControls
              onExitGame={handleExitGame}
              onRestartGame={handleRestartGame}
              onUndoMove={undoMove}
              isGameOver={gameStatus.gameOver}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {gameStatus.gameOver && (
        <GameOverModal
          result={gameStatus.result}
          winner={gameStatus.winner}
          reason={gameStatus.reason}
          gameTime={gameTime}
          explosionCount={moveHistory.filter((move) => move.causedExplosion).length}
          onNewGame={restartGame}
          onExit={() => navigate("/")}
        />
      )}

      {showExitConfirm && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <h3>Exit Game?</h3>
            <p>Are you sure you want to exit? Your progress will be lost.</p>
            <div className="confirmation-actions">
              <button className="secondary-button" onClick={cancelExit}>
                Cancel
              </button>
              <button className="danger-button" onClick={confirmExit}>
                Exit Game
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestartConfirm && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <h3>Restart Game?</h3>
            <p>Are you sure you want to restart? Your progress will be lost.</p>
            <div className="confirmation-actions">
              <button className="secondary-button" onClick={cancelRestart}>
                Cancel
              </button>
              <button className="primary-button" onClick={confirmRestart}>
                Restart Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <DebugPanel show={true} />
    </div>
  )
}

export default GamePage
