import { useEffect, useState, useRef } from "react";
import { useGame } from "../context/GameContext"; // Assumes this context handles AI mode correctly
import { useSettings } from "../context/SettingsContext";
import ChessBoard from "../components/ChessBoard";
import PlayerIndicator from "../components/PlayerIndicator";
import GameTimer from "../components/Gametimer";
import GameControls from "../components/GameControls";
import GameInfo from "../components/GameInfo";
import MoveHistory from "../components/MoveHistory";
import CapturedPieces from "../components/CapturedPieces";
import GameOverModal from "../components/GameOverModal";
import DifficultySelector from "../components/DifficultySelector";
import DebugPanel from "../components/DebugPanel";

const AIGamePage = () => {
  const {
    startNewGame,
    gameStatus,
    setGameMode,
    board,
    currentPlayer,
    selectedPiece,
    validMoves,
    moveHistory,
    capturedPieces,
    message,
    loading,
    selectPiece,
    makeMove,
    undoMove,
  } = useGame();

  const { showMoveHistory, showCapturedPieces, theme, soundEnabled, playSound } = useSettings();

  const [difficulty, setDifficulty] = useState("medium");
  const [showDifficultySelector, setShowDifficultySelector] = useState(true);
  const [gameTime, setGameTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const timerRef = useRef(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [lastExplosion, setLastExplosion] = useState(null);

  // Set game mode to AI and start new game after difficulty selection
  useEffect(() => {
    setGameMode("ai");

    if (!showDifficultySelector) {
      const timer = setTimeout(() => {
        startNewGame();
        setGameTime(0);
        setIsTimerActive(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showDifficultySelector]);

  const handleDifficultySelect = (level) => {
    setDifficulty(level);
    setShowDifficultySelector(false);
  };

  // Timer control
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setGameTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive]);

  // Pause timer and play sound on game over
  useEffect(() => {
    if (gameStatus.gameOver) {
      setIsTimerActive(false);
      if (soundEnabled) playSound("gameOver");
    }
  }, [gameStatus, soundEnabled, playSound]);

  // Track explosion for animation and sound
  useEffect(() => {
    if (gameStatus.explosion) {
      setLastExplosion({
        position: gameStatus.explosionPosition,
        timestamp: Date.now(),
      });
      if (soundEnabled) playSound("explosion");
    }
  }, [gameStatus.explosion, soundEnabled, playSound]);

  const handleSquareClick = (row, col) => {
    if (loading || gameStatus.gameOver) return;

    if (selectedPiece) {
      if (validMoves.some((move) => move.row === row && move.col === col)) {
        makeMove(selectedPiece.row, selectedPiece.col, row, col);
      } else if (board[row][col] && board[row][col].color === currentPlayer) {
        selectPiece(row, col);
      } else {
        selectPiece(null);
      }
    } else if (board[row][col] && board[row][col].color === currentPlayer) {
      selectPiece(row, col);
    }
  };

  const handleExitGame = () => {
    if (gameStatus.gameOver) {
      window.location.href = "/";
    } else {
      setShowExitConfirm(true);
    }
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    window.location.href = "/";
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  const handleRestartGame = () => {
    if (gameStatus.gameOver) {
      restartGame();
    } else {
      setShowRestartConfirm(true);
    }
  };

  const confirmRestart = () => {
    setShowRestartConfirm(false);
    restartGame();
  };

  const cancelRestart = () => {
    setShowRestartConfirm(false);
  };

  const restartGame = async () => {
    await startNewGame();
    setGameTime(0);
    setIsTimerActive(true);
  };

  return (
    <div className={`game-page ${theme}`}>
      <div className="game-header">
        <h1>Explosive Chess - AI Game</h1>
        <div className="game-status-container">
          <PlayerIndicator currentPlayer={currentPlayer} isCheck={gameStatus.isCheck} isCheckmate={gameStatus.isCheckmate} />
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
          onExit={() => (window.location.href = "/")}
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

      {showDifficultySelector && (
        <DifficultySelector currentDifficulty={difficulty} onSelect={handleDifficultySelect} />
      )}

      <DebugPanel show={true} />
    </div>
  );
};

export default AIGamePage;

