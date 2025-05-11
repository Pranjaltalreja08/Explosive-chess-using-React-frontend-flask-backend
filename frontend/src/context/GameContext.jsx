"use client"

import { createContext, useState, useContext, useEffect } from "react"

// Create context
const GameContext = createContext()

export const useGame = () => useContext(GameContext)

export const GameProvider = ({ children }) => {
  // Default starting position for chess
  const defaultBoard = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ]

  // Game state
  const [board, setBoard] = useState(defaultBoard)
  const [currentPlayer, setCurrentPlayer] = useState("white")
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [gameStatus, setGameStatus] = useState({
    gameOver: false,
    winner: null,
    reason: null,
    isCheck: false,
    isCheckmate: false,
    explosion: false,
    explosionPosition: null,
  })
  const [message, setMessage] = useState("Welcome to Explosive Chess!")
  const [loading, setLoading] = useState(false)
  const [moveHistory, setMoveHistory] = useState([])
  const [capturedPieces, setCapturedPieces] = useState({
    white: [],
    black: [],
  })
  const [gameMode, setGameMode] = useState("local") // 'local' or 'ai'
  const [difficulty, setDifficulty] = useState("medium") // 'easy', 'medium', 'hard'
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [promotionMove, setPromotionMove] = useState(null)
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    explosionsCaused: 0,
    piecesPromoted: 0,
  })

  const [connectionStatus, setConnectionStatus] = useState("Not checked")
  const [lastError, setLastError] = useState(null)
  const [gameState, setGameState] = useState({
    turn: "white",
  })
  const [offlineMode, setOfflineMode] = useState(false)

  // Always use explosive chess rules
  const [isExplosiveMode] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

  // Chess piece Unicode characters
  const PIECES = {
    p: "♟",
    n: "♞",
    b: "♝",
    r: "♜",
    q: "♛",
    k: "♚",
    P: "♙",
    N: "♘",
    B: "♗",
    R: "♖",
    Q: "♕",
    K: "♔",
  }

  // Piece types for validation
  const PIECE_TYPES = {
    p: "pawn",
    n: "knight",
    b: "bishop",
    r: "rook",
    q: "queen",
    k: "king",
    P: "pawn",
    N: "knight",
    B: "bishop",
    R: "rook",
    Q: "queen",
    K: "king",
  }

  // Load game stats from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem("explosiveChessStats")
    if (savedStats) {
      setGameStats(JSON.parse(savedStats))
    }

    // Check connection on component mount
    checkConnection()
  }, [])

  // Save game stats to localStorage
  useEffect(() => {
    localStorage.setItem("explosiveChessStats", JSON.stringify(gameStats))
  }, [gameStats])

  // Start AI game when mode is set to AI
  useEffect(() => {
    if (gameMode === "ai" && currentPlayer === "black") {
      // Delay AI move to give UI time to update
      const timer = setTimeout(() => {
        makeAIMove()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [gameMode, currentPlayer])

  // Check connection to backend
  const checkConnection = async () => {
    try {
      setConnectionStatus("Checking...")
      // Try to connect to the backend
      const response = await fetch(`${API_BASE_URL}/gamestate`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      })

      if (response.ok) {
        setConnectionStatus("Connected")
        setOfflineMode(false)
        return true
      } else {
        setConnectionStatus(`Error: ${response.status}`)
        setOfflineMode(true)
        return false
      }
    } catch (error) {
      console.error("Connection check failed:", error)
      setConnectionStatus(`Failed: ${error.message}`)
      setOfflineMode(true)
      return false
    }
  }

  // Convert FEN string to board representation
  const parseFen = (fen) => {
    try {
      const fenParts = fen.split(" ")
      const fenBoard = fenParts[0]
      const rows = fenBoard.split("/")

      const newBoard = Array(8)
        .fill()
        .map(() => Array(8).fill(null))

      for (let i = 0; i < 8; i++) {
        let col = 0
        for (let j = 0; j < rows[i].length; j++) {
          const char = rows[i][j]
          if (isNaN(char)) {
            newBoard[i][col] = char
            col++
          } else {
            col += Number.parseInt(char)
          }
        }
      }

      return newBoard
    } catch (error) {
      console.error("Error parsing FEN:", error, fen)
      setLastError(`FEN parse error: ${error.message}`)
      return board // Return current board on error
    }
  }

  // Start a new game
  const startNewGame = async () => {
    try {
      setLoading(true)
      setMessage("Starting new game...")
      setMoveHistory([])
      setCapturedPieces({
        white: [],
        black: [],
      })
      setSelectedPiece(null)
      setValidMoves([])
      setGameStatus({
        gameOver: false,
        winner: null,
        reason: null,
        isCheck: false,
        isCheckmate: false,
        explosion: false,
        explosionPosition: null,
      })

      // Check connection first
      const isConnected = await checkConnection()

      if (!isConnected) {
        // Use offline mode with default board
        setBoard(defaultBoard)
        setCurrentPlayer("white")
        setMessage("Started new game in offline mode")
        return true
      }

      try {
        const response = await fetch(`${API_BASE_URL}/newgame`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const data = await response.json()

        if (data.fen) {
          setBoard(parseFen(data.fen))
        } else {
          // Fall back to default board
          setBoard(defaultBoard)
        }

        setCurrentPlayer(data.turn === "white" ? "white" : "black")
        setGameStatus({
          gameOver: data.is_game_over || false,
          winner: null,
          reason: null,
          isCheck: data.is_check || false,
          isCheckmate: data.is_checkmate || false,
          explosion: false,
          explosionPosition: null,
        })
        setMessage("New game started")
      } catch (error) {
        console.error("Error starting new game:", error)
        // Fall back to default board
        setBoard(defaultBoard)
        setCurrentPlayer("white")
        setMessage("Started new game with default board due to server error")
      }

      return true
    } catch (error) {
      console.error("New game error:", error)
      setMessage(`Error: ${error.message}`)

      // Fall back to default board
      setBoard(defaultBoard)
      setCurrentPlayer("white")
      setMessage("Started new game with default board due to error")
      return true
    } finally {
      setLoading(false)
    }
  }

  // Select a piece and get valid moves
  const selectPiece = async (row, col) => {
    if (loading || gameStatus.gameOver) return

    // Deselect if clicking the same piece or passing null
    if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
      setSelectedPiece(null)
      setValidMoves([])
      return
    }

    if (row === null || col === null) {
      setSelectedPiece(null)
      setValidMoves([])
      return
    }

    try {
      setLoading(true)

      // Get the piece at the selected position
      const piece = board[row][col]

      // If no piece, return
      if (!piece) {
        setMessage("No piece at this position")
        return
      }

      // Check if it's the current player's piece
      const pieceColor = piece === piece.toUpperCase() ? "white" : "black"
      if (pieceColor !== currentPlayer) {
        setMessage(`It's ${currentPlayer}'s turn`)
        return
      }

      // Check if we're in offline mode
      if (offlineMode) {
        // Simple offline validation - just check if there's a piece and it's the current player's
        setSelectedPiece({ row, col })

        // In offline mode, we'll calculate valid moves based on piece type
        const offlineValidMoves = calculateValidMoves(row, col, piece, board, currentPlayer)
        setValidMoves(offlineValidMoves)
        setMessage(
          `Selected ${piece} at ${String.fromCharCode(97 + col)}${8 - row}. ${offlineValidMoves.length} possible moves.`,
        )
        return
      }

      // Online mode - get valid moves from server
      try {
        const response = await fetch(`${API_BASE_URL}/valid-moves`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from_square: getSquareName(row, col),
          }),
        })

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const data = await response.json()

        if (data.valid_moves) {
          const validMovesList = data.valid_moves.map((move) => {
            const coords = squareToCoords(move)
            return { row: coords.row, col: coords.col }
          })

          setSelectedPiece({ row, col })
          setValidMoves(validMovesList)
          setMessage(
            `Selected ${piece} at ${String.fromCharCode(97 + col)}${8 - row}. ${validMovesList.length} possible moves.`,
          )
        } else {
          throw new Error("Invalid response format")
        }
      } catch (error) {
        console.error("Error getting valid moves:", error)

        // Fall back to offline calculation
        setSelectedPiece({ row, col })
        const offlineValidMoves = calculateValidMoves(row, col, piece, board, currentPlayer)
        setValidMoves(offlineValidMoves)
        setMessage(
          `Selected ${piece} at ${String.fromCharCode(97 + col)}${8 - row}. ${offlineValidMoves.length} possible moves.`,
        )
      }
    } catch (error) {
      console.error("Get valid moves error:", error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Calculate valid moves for a piece (offline mode)
  const calculateValidMoves = (row, col, piece, currentBoard, player) => {
    const validMoves = []
    const pieceType = piece.toLowerCase()
    const isPieceWhite = piece === piece.toUpperCase()

    // Helper to check if a position is valid and add it to validMoves
    const checkAndAddMove = (r, c) => {
      // Check if position is on the board
      if (r < 0 || r > 7 || c < 0 || c > 7) return false

      // Check if position has a piece of the same color
      const targetPiece = currentBoard[r][c]
      if (targetPiece) {
        const isTargetWhite = targetPiece === targetPiece.toUpperCase()
        if (isTargetWhite === isPieceWhite) return false
      }

      // For explosive chess, check if the move would cause the king to explode
      if (isExplosiveMode && targetPiece) {
        // This is a capture move, check if it would cause the king to explode
        const kingPos = findKing(currentBoard, isPieceWhite)
        if (kingPos) {
          // Check if king is within explosion radius (1 square)
          const kingRow = kingPos.row
          const kingCol = kingPos.col
          if (Math.abs(kingRow - r) <= 1 && Math.abs(kingCol - c) <= 1) {
            // This move would cause the king to explode, so it's invalid
            return false
          }
        }
      }

      validMoves.push({ row: r, col: c })
      return !targetPiece // Return true if the square is empty (to continue checking in that direction)
    }

    // Find the king of a specific color
    const findKing = (board, isWhite) => {
      const kingSymbol = isWhite ? "K" : "k"
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c] === kingSymbol) {
            return { row: r, col: c }
          }
        }
      }
      return null
    }

    switch (pieceType) {
      case "p": // Pawn
        const direction = isPieceWhite ? -1 : 1
        const startRow = isPieceWhite ? 6 : 1

        // Forward move
        if (row + direction >= 0 && row + direction < 8 && !currentBoard[row + direction][col]) {
          checkAndAddMove(row + direction, col)

          // Double move from starting position
          if (row === startRow && !currentBoard[row + 2 * direction]?.[col]) {
            checkAndAddMove(row + 2 * direction, col)
          }
        }

        // Captures
        if (row + direction >= 0 && row + direction < 8) {
          if (col - 1 >= 0 && currentBoard[row + direction][col - 1]) {
            checkAndAddMove(row + direction, col - 1)
          }
          if (col + 1 < 8 && currentBoard[row + direction][col + 1]) {
            checkAndAddMove(row + direction, col + 1)
          }
        }
        break

      case "n": // Knight
        const knightMoves = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ]
        knightMoves.forEach(([dr, dc]) => {
          checkAndAddMove(row + dr, col + dc)
        })
        break

      case "b": // Bishop
        // Diagonal moves
        for (let i = 1; i < 8; i++) {
          if (row + i < 8 && col + i < 8 && !checkAndAddMove(row + i, col + i)) break
        }
        for (let i = 1; i < 8; i++) {
          if (row + i < 8 && col - i >= 0 && !checkAndAddMove(row + i, col - i)) break
        }
        for (let i = 1; i < 8; i++) {
          if (row - i >= 0 && col + i < 8 && !checkAndAddMove(row - i, col + i)) break
        }
        for (let i = 1; i < 8; i++) {
          if (row - i >= 0 && col - i >= 0 && !checkAndAddMove(row - i, col - i)) break
        }
        break

      case "r": // Rook
        // Horizontal and vertical moves
        for (let i = 1; i < 8; i++) {
          if (row + i < 8 && !checkAndAddMove(row + i, col)) break
        }
        for (let i = 1; i < 8; i++) {
          if (row - i >= 0 && !checkAndAddMove(row - i, col)) break
        }
        for (let i = 1; i < 8; i++) {
          if (col + i < 8 && !checkAndAddMove(row, col + i)) break
        }
        for (let i = 1; i < 8; i++) {
          if (col - i >= 0 && !checkAndAddMove(row, col - i)) break
        }
        break

      case "q": // Queen (combines bishop and rook moves)
        // Diagonal moves
        for (let i = 1; i < 8; i++) {
          if (row + i < 8 && col + i < 8 && !checkAndAddMove(row + i, col + i)) break
        }
        for (let i = 1; i < 8; i++) {
          if (row + i < 8 && col - i >= 0 && !checkAndAddMove(row + i, col - i)) break
        }
        for (let i = 1; i < 8; i++) {
          if (row - i >= 0 && col + i < 8 && !checkAndAddMove(row - i, col + i)) break
        }
        for (let i = 1; i < 8; i++) {
          if (row - i >= 0 && col - i >= 0 && !checkAndAddMove(row - i, col - i)) break
        }

        // Horizontal and vertical moves
        for (let i = 1; i < 8; i++) {
          if (row + i < 8 && !checkAndAddMove(row + i, col)) break
        }
        for (let i = 1; i < 8; i++) {
          if (row - i >= 0 && !checkAndAddMove(row - i, col)) break
        }
        for (let i = 1; i < 8; i++) {
          if (col + i < 8 && !checkAndAddMove(row, col + i)) break
        }
        for (let i = 1; i < 8; i++) {
          if (col - i >= 0 && !checkAndAddMove(row, col - i)) break
        }
        break

      case "k": // King
        // All 8 surrounding squares
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue
            checkAndAddMove(row + dr, col + dc)
          }
        }
        break
    }

    return validMoves
  }

  // Make a move
  const makeMove = async (fromRow, fromCol, toRow, toCol) => {
    try {
      setLoading(true)

      const fromPiece = board[fromRow][fromCol]
      const fromSquare = getSquareName(fromRow, fromCol)
      const toSquare = getSquareName(toRow, toCol)

      setMessage(`Moving ${fromPiece} from ${fromSquare} to ${toSquare}...`)

      // Check if this is a pawn promotion move
      const isPawnPromotion = checkForPromotion(fromRow, fromCol, toRow, toCol)
      if (isPawnPromotion) {
        setPromotionMove({ fromRow, fromCol, toRow, toCol })
        setShowPromotionModal(true)
        setLoading(false)
        return true
      }

      // Check if we're in offline mode
      if (offlineMode) {
        // Simple offline move logic
        const newBoard = [...board.map((row) => [...row])]
        const targetPiece = newBoard[toRow][toCol]

        // Track captured piece
        if (targetPiece) {
          const capturedColor = targetPiece === targetPiece.toUpperCase() ? "white" : "black"
          setCapturedPieces((prev) => ({
            ...prev,
            [capturedColor]: [...prev[capturedColor], targetPiece],
          }))

          // Check for explosion (in a 3x3 grid around the capture)
          if (isExplosiveMode) {
            const explosionSquares = []
            for (let r = Math.max(0, toRow - 1); r <= Math.min(7, toRow + 1); r++) {
              for (let c = Math.max(0, toCol - 1); c <= Math.min(7, toCol + 1); c++) {
                if (newBoard[r][c] && newBoard[r][c].toLowerCase() !== "p") {
                  // Don't explode pawns in explosive chess
                  explosionSquares.push({ row: r, col: c })
                  newBoard[r][c] = null
                }
              }
            }

            if (explosionSquares.length > 0) {
              setGameStatus((prev) => ({
                ...prev,
                explosion: true,
                explosionPosition: { row: toRow, col: toCol },
              }))
            }
          }
        }

        // Move the piece
        newBoard[toRow][toCol] = newBoard[fromRow][fromCol]
        newBoard[fromRow][fromCol] = null

        // Add to move history
        const newHistoryEntry = {
          piece: fromPiece,
          color: fromPiece === fromPiece.toUpperCase() ? "white" : "black",
          from: fromSquare,
          to: toSquare,
          timestamp: new Date().toISOString(),
        }

        setMoveHistory((prev) => [...prev, newHistoryEntry])
        setBoard(newBoard)

        // Switch turns
        const nextPlayer = currentPlayer === "white" ? "black" : "white"
        setCurrentPlayer(nextPlayer)

        setMessage(`${fromPiece} moved from ${fromSquare} to ${toSquare}`)

        // If in AI mode and it's now black's turn, make an AI move
        if (gameMode === "ai" && nextPlayer === "black") {
          setTimeout(() => {
            makeAIMove()
          }, 1000)
        }

        return true
      }

      // Online mode - make move on server
      try {
        const response = await fetch(`${API_BASE_URL}/makemove`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            move: `${fromSquare}${toSquare}`,
          }),
        })

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const data = await response.json()

        if (data.fen) {
          setBoard(parseFen(data.fen))

          // Add move to history
          const newHistoryEntry = {
            piece: fromPiece,
            color: fromPiece === fromPiece.toUpperCase() ? "white" : "black",
            from: fromSquare,
            to: toSquare,
            causedExplosion: data.exploded && data.exploded.length > 0,
            timestamp: new Date().toISOString(),
          }

          setMoveHistory((prev) => [...prev, newHistoryEntry])

          // Set current player
          setCurrentPlayer(data.turn === "white" ? "white" : "black")

          // Check for explosion
          if (data.exploded && data.exploded.length > 0) {
            setGameStatus((prev) => ({
              ...prev,
              explosion: true,
              explosionPosition: { row: toRow, col: toCol },
              isCheck: data.is_check || false,
              isCheckmate: data.is_checkmate || false,
              gameOver: data.is_game_over || false,
              winner: data.result ? (data.result === "1-0" ? "white" : "black") : null,
            }))

            setMessage(`${fromPiece} moved from ${fromSquare} to ${toSquare}. Boom! Explosion at ${toSquare}!`)
          } else if (data.is_check && !data.is_checkmate) {
            setMessage(`${fromPiece} moved from ${fromSquare} to ${toSquare}. Check!`)
          } else if (data.is_checkmate) {
            setMessage(`${fromPiece} moved from ${fromSquare} to ${toSquare}. Checkmate!`)
          } else {
            setMessage(`${fromPiece} moved from ${fromSquare} to ${toSquare}.`)
          }

          // If in AI mode and it's now black's turn, make an AI move
          if (gameMode === "ai" && data.turn === "black") {
            setTimeout(() => {
              makeAIMove()
            }, 1000)
          }

          return true
        } else {
          throw new Error("Invalid response format")
        }
      } catch (error) {
        console.error("Error making move:", error)
        setMessage(`Error: ${error.message}`)
        return false
      }
    } catch (error) {
      console.error("Move error:", error)
      setMessage(`Error: ${error.message}`)
      return false
    } finally {
      setLoading(false)
      setSelectedPiece(null)
      setValidMoves([])
    }
  }

  // Handle pawn promotion
  const handlePromotion = (promotionPiece) => {
    if (!promotionMove) {
      setShowPromotionModal(false)
      return
    }

    const { fromRow, fromCol, toRow, toCol } = promotionMove

    try {
      setLoading(true)

      // Create a new board with the promotion
      const newBoard = [...board.map((row) => [...row])]

      // Remove the pawn from the source square
      const pawn = newBoard[fromRow][fromCol]
      newBoard[fromRow][fromCol] = null

      // Place the promoted piece on the target square
      newBoard[toRow][toCol] = promotionPiece

      // Update the board
      setBoard(newBoard)

      // Add to move history
      const fromSquare = getSquareName(fromRow, fromCol)
      const toSquare = getSquareName(toRow, toCol)

      const newHistoryEntry = {
        piece: pawn,
        color: pawn === pawn.toUpperCase() ? "white" : "black",
        from: fromSquare,
        to: toSquare,
        promotion: promotionPiece,
        timestamp: new Date().toISOString(),
      }

      setMoveHistory((prev) => [...prev, newHistoryEntry])

      // Switch turns
      const nextPlayer = currentPlayer === "white" ? "black" : "white"
      setCurrentPlayer(nextPlayer)

      setMessage(`Pawn promoted to ${PIECE_TYPES[promotionPiece]}`)

      // Update stats
      setGameStats((prev) => ({
        ...prev,
        piecesPromoted: prev.piecesPromoted + 1,
      }))

      // If in AI mode and it's now black's turn, make an AI move
      if (gameMode === "ai" && nextPlayer === "black") {
        setTimeout(() => {
          makeAIMove()
        }, 1000)
      }

      return true
    } catch (error) {
      console.error("Promotion error:", error)
      setMessage(`Error: ${error.message}`)
      return false
    } finally {
      setLoading(false)
      setShowPromotionModal(false)
      setPromotionMove(null)
      setSelectedPiece(null)
      setValidMoves([])
    }
  }

  // Make an AI move
  const makeAIMove = async () => {
    if (currentPlayer !== "black" || gameStatus.gameOver) {
      return
    }

    try {
      setLoading(true)
      setMessage("AI is thinking...")

      // If in offline mode, make a random move
      if (offlineMode) {
        // Find all black pieces
        const blackPieces = []
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = board[row][col]
            if (piece && piece === piece.toLowerCase()) {
              blackPieces.push({ row, col })
            }
          }
        }

        if (blackPieces.length === 0) {
          setMessage("AI has no pieces left!")
          return
        }

        // Try each black piece until we find one with valid moves
        let validMovesFound = false
        let attempts = 0
        const maxAttempts = blackPieces.length * 2

        while (!validMovesFound && attempts < maxAttempts) {
          attempts++

          // Pick a random black piece
          const randomPiece = blackPieces[Math.floor(Math.random() * blackPieces.length)]

          // Calculate valid moves for this piece
          const validMoves = calculateValidMoves(
            randomPiece.row,
            randomPiece.col,
            board[randomPiece.row][randomPiece.col],
            board,
            "black",
          )

          if (validMoves.length > 0) {
            // Pick a random valid move
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]

            // Make the move
            await makeMove(randomPiece.row, randomPiece.col, randomMove.row, randomMove.col)
            validMovesFound = true
          }
        }

        if (!validMovesFound) {
          setMessage("AI could not find a valid move. Game might be in checkmate or stalemate.")
        }

        return
      }

      // Online mode - get AI move from server
      try {
        const response = await fetch(`${API_BASE_URL}/aimove`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            depth: difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3,
          }),
        })

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const data = await response.json()

        if (data.fen && data.move) {
          // Update the board
          setBoard(parseFen(data.fen))

          // Add move to history
          const move = data.move
          const fromSquare = move.substring(0, 2)
          const toSquare = move.substring(2, 4)
          const fromCoords = squareToCoords(fromSquare)
          const toCoords = squareToCoords(toSquare)

          const newHistoryEntry = {
            piece: board[fromCoords.row][fromCoords.col],
            color: "black",
            from: fromSquare,
            to: toSquare,
            causedExplosion: data.exploded && data.exploded.length > 0,
            timestamp: new Date().toISOString(),
          }

          setMoveHistory((prev) => [...prev, newHistoryEntry])

          // Set current player
          setCurrentPlayer(data.turn === "white" ? "white" : "black")

          // Check for explosion
          if (data.exploded && data.exploded.length > 0) {
            setGameStatus((prev) => ({
              ...prev,
              explosion: true,
              explosionPosition: toCoords,
              isCheck: data.is_check || false,
              isCheckmate: data.is_checkmate || false,
              gameOver: data.is_game_over || false,
              winner: data.result ? (data.result === "1-0" ? "white" : "black") : null,
            }))

            setMessage(`AI moved from ${fromSquare} to ${toSquare}. Boom! Explosion!`)
          } else if (data.is_check && !data.is_checkmate) {
            setMessage(`AI moved from ${fromSquare} to ${toSquare}. Check!`)
          } else if (data.is_checkmate) {
            setMessage(`AI moved from ${fromSquare} to ${toSquare}. Checkmate!`)
          } else {
            setMessage(`AI moved from ${fromSquare} to ${toSquare}.`)
          }
        } else {
          throw new Error("Invalid response format or AI could not make a move")
        }
      } catch (error) {
        console.error("Error making AI move:", error)

        // Fall back to offline AI move
        makeRandomAIMove()
      }
    } catch (error) {
      console.error("AI move error:", error)
      setMessage(`AI error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Make a random AI move in offline mode
  const makeRandomAIMove = () => {
    // Find all black pieces
    const blackPieces = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col]
        if (piece && piece === piece.toLowerCase()) {
          blackPieces.push({ row, col })
        }
      }
    }

    if (blackPieces.length === 0) {
      setMessage("AI has no pieces left!")
      return
    }

    // Try each black piece until we find one with valid moves
    let validMovesFound = false
    let attempts = 0
    const maxAttempts = blackPieces.length * 2

    while (!validMovesFound && attempts < maxAttempts) {
      attempts++

      // Pick a random black piece
      const randomPiece = blackPieces[Math.floor(Math.random() * blackPieces.length)]

      // Calculate valid moves for this piece
      const validMoves = calculateValidMoves(
        randomPiece.row,
        randomPiece.col,
        board[randomPiece.row][randomPiece.col],
        board,
        "black",
      )

      if (validMoves.length > 0) {
        // Pick a random valid move
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]

        // Make the move
        makeMove(randomPiece.row, randomPiece.col, randomMove.row, randomMove.col)
        validMovesFound = true
      }
    }

    if (!validMovesFound) {
      setMessage("AI could not find a valid move. Game might be in checkmate or stalemate.")
    }
  }

  // Undo last move
  const undoMove = () => {
    // This would require backend support
    setMessage("Undo is not implemented yet.")
  }

  // Check game status
  const checkGameStatus = async () => {
    try {
      // If in offline mode, just return basic status
      if (offlineMode) {
        return { gameOver: false }
      }

      // Online mode - check game status from server
      try {
        const response = await fetch(`${API_BASE_URL}/gamestate`, {
          method: "GET",
        })

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const data = await response.json()

        if (data.is_game_over) {
          setGameStatus((prev) => ({
            ...prev,
            gameOver: true,
            winner: data.result === "1-0" ? "white" : data.result === "0-1" ? "black" : null,
            reason: data.is_checkmate ? "checkmate" : data.is_stalemate ? "stalemate" : "other",
            isCheck: data.is_check || false,
            isCheckmate: data.is_checkmate || false,
          }))

          if (data.is_checkmate) {
            setMessage(`Checkmate! ${data.result === "1-0" ? "White" : "Black"} wins!`)
          } else if (data.is_stalemate) {
            setMessage("Stalemate! The game is a draw.")
          } else {
            setMessage(
              `Game over! ${data.result === "1-0" ? "White" : data.result === "0-1" ? "Black" : "Nobody"} wins!`,
            )
          }
        }

        return data
      } catch (error) {
        console.error("Error checking game status:", error)
        return { gameOver: false }
      }
    } catch (error) {
      console.error("Check game status error:", error)
      return { gameOver: false }
    }
  }

  // Skip AI turn
  const skipAITurn = () => {
    setCurrentPlayer("white")
    setMessage("Skipped AI's turn. It's now your turn.")
  }

  // Check if a pawn move requires promotion
  const checkForPromotion = (fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol]
    if (!piece) return false

    // Check if it's a pawn
    if (piece.toLowerCase() !== "p") return false

    // Check if it's reaching the opposite end
    if (piece === "P" && toRow === 0) return true // White pawn reaching top
    if (piece === "p" && toRow === 7) return true // Black pawn reaching bottom

    return false
  }

  // Convert algebraic notation to board coordinates
  const squareToCoords = (square) => {
    if (!square || square.length !== 2) return null

    const file = square.charCodeAt(0) - 97 // 'a' is 97 in ASCII
    const rank = 8 - Number.parseInt(square[1])

    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null

    return { row: rank, col: file }
  }

  // Convert row/col to algebraic notation (e.g., "e4")
  const getSquareName = (row, col) => {
    const file = String.fromCharCode(97 + col) // 'a' to 'h'
    const rank = 8 - row // 1 to 8
    return `${file}${rank}`
  }

  // Handle square click
  const handleSquareClick = (row, col) => {
    if (gameStatus.gameOver || loading) {
      return
    }

    // Only allow moves when it's the current player's turn
    if (gameMode === "ai" && currentPlayer === "black") {
      setMessage("It's the AI's turn")
      return
    }

    // If a piece is already selected, try to move it
    if (selectedPiece) {
      // Check if the clicked square is a valid move
      const isValidMove = validMoves.some((move) => move.row === row && move.col === col)

      if (isValidMove) {
        makeMove(selectedPiece.row, selectedPiece.col, row, col)
      } else {
        // If it's not a valid move, check if it's another piece of the same color
        const piece = board[row][col]
        if (piece) {
          const pieceColor = piece === piece.toUpperCase() ? "white" : "black"
          if (pieceColor === currentPlayer) {
            // Select this piece instead
            selectPiece(row, col)
          } else {
            setMessage("Invalid move")
          }
        } else {
          setMessage("Invalid move")
        }
      }
    } else {
      // No piece selected yet, try to select one
      const piece = board[row][col]
      if (piece) {
        const pieceColor = piece === piece.toUpperCase() ? "white" : "black"
        if (pieceColor === currentPlayer) {
          selectPiece(row, col)
        } else {
          setMessage(`It's ${currentPlayer}'s turn`)
        }
      } else {
        setMessage("Select a piece to move")
      }
    }
  }

  // Update game result and stats
  const updateGameResult = (result) => {
    setGameStats((prev) => {
      const newStats = { ...prev }

      if (result === "win") {
        newStats.wins += 1
      } else if (result === "loss") {
        newStats.losses += 1
      } else if (result === "draw") {
        newStats.draws += 1
      }

      return newStats
    })
  }

  // Reset game stats
  const resetStats = () => {
    setGameStats({
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      explosionsCaused: 0,
      piecesPromoted: 0,
    })
  }

  return (
    <GameContext.Provider
      value={{
        board,
        setBoard,
        currentPlayer,
        setCurrentPlayer,
        selectedPiece,
        setSelectedPiece,
        validMoves,
        setValidMoves,
        gameStatus,
        setGameStatus,
        message,
        setMessage,
        loading,
        setLoading,
        moveHistory,
        setMoveHistory,
        capturedPieces,
        setCapturedPieces,
        gameMode,
        setGameMode,
        difficulty,
        setDifficulty,
        startNewGame,
        selectPiece,
        makeMove,
        undoMove,
        aiMove: makeAIMove,
        checkGameStatus,
        skipAITurn,
        handleSquareClick,
        getSquareName,
        squareToCoords,
        resetStats,
        API_BASE_URL,
        connectionStatus,
        lastError,
        gameState,
        offlineMode,
        PIECES,
        showPromotionModal,
        setShowPromotionModal,
        handlePromotion,
        isExplosiveMode,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}
