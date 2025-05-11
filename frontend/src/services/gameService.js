import axios from "axios"

const API_URL = "http://localhost:5000"

export const gameService = {
  // Start a new game
  newGame: async () => {
    try {
      const response = await axios.post(`${API_URL}/new-game`)
      if (!response.data || !response.data.board) {
        throw new Error("Invalid server response")
      }
      return { data: response.data }
    } catch (error) {
      console.error("Error starting new game:", error)
      if (error.message === "Invalid server response") {
        return { data: { error: "Server returned invalid game data. Please try again." } }
      }
      if (error.code === "ECONNREFUSED" || error.code === "ECONNABORTED") {
        return { data: { error: "Cannot connect to game server. Please check if the server is running." } }
      }
      return { data: { error: "Failed to start new game. Please try again." } }
    }
  },

  // Make a player move
  makeMove: async (fromRow, fromCol, toRow, toCol) => {
    try {
      const response = await axios.post(`${API_URL}/make-move`, {
        from_row: fromRow,
        from_col: fromCol,
        to_row: toRow,
        to_col: toCol,
      })
      if (!response.data || !response.data.board) {
        throw new Error("Invalid server response")
      }
      return {
        data: response.data,
        explosion: response.data.explosion || false,
      }
    } catch (error) {
      console.error("Error making move:", error)
      if (error.response && error.response.data && error.response.data.error) {
        return { data: { error: error.response.data.error } }
      }
      if (error.code === "ECONNREFUSED" || error.code === "ECONNABORTED") {
        return { data: { error: "Cannot connect to game server. Please check if the server is running." } }
      }
      return {
        data: { error: "Unable to connect to the game server. Please ensure the server is running on port 5000." },
      }
    }
  },

  // Get valid moves for a piece
  getValidMoves: async (fromRow, fromCol) => {
    try {
      const response = await axios.post(`${API_URL}/valid-moves`, {
        from_row: fromRow,
        from_col: fromCol,
      })
      if (!response.data || !response.data.valid_moves) {
        throw new Error("Invalid server response")
      }
      return { data: response.data.valid_moves }
    } catch (error) {
      console.error("Error getting valid moves:", error)
      return { data: { error: "Failed to get valid moves." } }
    }
  },

  // Check if game is over and get game status
  checkGameStatus: async () => {
    try {
      const response = await axios.get(`${API_URL}/game-status`)
      return {
        data: {
          gameOver: response.data.game_over || false,
          winner: response.data.winner,
          reason: response.data.reason,
        },
      }
    } catch (error) {
      console.error("Error checking game status:", error)
      return { data: { gameOver: false } }
    }
  },
}
