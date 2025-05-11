const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Initial chess board setup
const initialBoard = [
  // Black pieces
  [
    { type: 'r', color: 'black' }, { type: 'n', color: 'black' }, { type: 'b', color: 'black' }, { type: 'q', color: 'black' },
    { type: 'k', color: 'black' }, { type: 'b', color: 'black' }, { type: 'n', color: 'black' }, { type: 'r', color: 'black' }
  ],
  Array(8).fill().map(() => ({ type: 'p', color: 'black' })), // Black pawns
  Array(8).fill(null), // Empty row
  Array(8).fill(null), // Empty row
  Array(8).fill(null), // Empty row
  Array(8).fill(null), // Empty row
  Array(8).fill().map(() => ({ type: 'p', color: 'white' })), // White pawns
  [
    { type: 'r', color: 'white' }, { type: 'n', color: 'white' }, { type: 'b', color: 'white' }, { type: 'q', color: 'white' },
    { type: 'k', color: 'white' }, { type: 'b', color: 'white' }, { type: 'n', color: 'white' }, { type: 'r', color: 'white' }
  ] // White pieces
];

let currentBoard = JSON.parse(JSON.stringify(initialBoard));

// Start a new game
app.post('/new-game', (req, res) => {
  currentBoard = JSON.parse(JSON.stringify(initialBoard));
  res.json({
    board: currentBoard,
    currentPlayer: 'white',
    isCheck: false,
    isCheckmate: false
  });
});

// Get valid moves for a piece
app.post('/valid-moves', (req, res) => {
  const { from_row, from_col } = req.body;
  // Implement valid moves logic here
  res.json({
    valid_moves: []
  });
});

// Make a move
app.post('/make-move', (req, res) => {
  const { from_row, from_col, to_row, to_col } = req.body;
  // Implement move logic here
  res.json({
    board: currentBoard,
    currentPlayer: 'black', // Toggle player
    isCheck: false,
    isCheckmate: false,
    explosion: false
  });
});

// Get game status
app.get('/game-status', (req, res) => {
  res.json({
    game_over: false,
    winner: null,
    reason: null
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});