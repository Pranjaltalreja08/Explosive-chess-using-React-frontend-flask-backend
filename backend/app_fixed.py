"""
Explosive Atomic Chess Flask Backend with AI

- Board state handled via python-chess extended for explosive captures.
- API Endpoints:
  - /new-game [POST] - start new game
  - /make-move [POST] - player move (from_row, from_col, to_row, to_col)
  - /valid-moves [POST] - get valid moves for a piece (from_row, from_col)
  - /game-status [GET] - get current game state
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import chess
import copy
import random

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# We extend the python-chess board with explosion rules of Atomic Chess.
class ExplosiveBoard(chess.Board):
    def __init__(self, *args, **kwargs):
        super(ExplosiveBoard, self).__init__(*args, **kwargs)
        # Custom tracking of exploded squares after move for client info
        self.exploded = []
        # Track if a king was exploded
        self.king_exploded = False
        self.winner = None

    def push(self, move):
        """
        Override push to handle explosion after capture.
        Explosion rules:
        - When a piece is captured, explosion affects all squares surrounding the captured square, 
          excluding pawns.
        - Capture triggers explosion that eliminates all pieces in those squares except pawns.
        """
        if self.is_game_over():
            return super().push(move)

        # Store the current player's color before making the move
        current_player = self.turn
        
        capture_square = None
        if self.is_capture(move):
            capture_square = move.to_square
        else:
            capture_square = None

        # Push move normally first
        super().push(move)

        self.exploded = []
        self.king_exploded = False

        if capture_square is not None:
            # Compute explosion squares: the 8 squares surrounding the capture_square + the capture_square itself
            explosion_squares = [capture_square]
            f = chess.square_file(capture_square)
            r = chess.square_rank(capture_square)
            for df in [-1,0,1]:
                for dr in [-1,0,1]:
                    if df == 0 and dr == 0:
                        continue
                    ff = f + df
                    rr = r + dr
                    if 0 <= ff <= 7 and 0 <= rr <= 7:
                        sq = chess.square(ff, rr)
                        explosion_squares.append(sq)

            # The explosion eliminates all pieces on these squares except pawns.
            for sq in explosion_squares:
                piece = self.piece_at(sq)
                if piece is not None:
                    # Check if a king is being exploded
                    if piece.piece_type == chess.KING:
                        self.king_exploded = True
                        # The winner is the opposite of the king's color
                        self.winner = not piece.color
                    
                    if piece.piece_type != chess.PAWN:
                        self.remove_piece_at(sq)
                        self.exploded.append(sq)

    def is_valid_move(self, move):
        """Check if a move is valid considering explosion rules and check"""
        # First check if it's a legal move according to standard chess rules
        if move not in self.legal_moves:
            return False
            
        # Now check if it would cause our own king to explode
        # Make a copy of the board to simulate the move
        test_board = self.copy()
        
        # Get the king square for the current player
        king_square = test_board.king(self.turn)
        if king_square is None:  # No king (shouldn't happen in standard chess)
            return True
            
        # If it's a capture, check if the explosion would affect our king
        if self.is_capture(move):
            capture_square = move.to_square
            f = chess.square_file(capture_square)
            r = chess.square_rank(capture_square)
            
            # Check if king is adjacent to the capture square
            kf = chess.square_file(king_square)
            kr = chess.square_rank(king_square)
            
            # If king is within explosion radius (1 square), the move is invalid
            if abs(kf - f) <= 1 and abs(kr - r) <= 1:
                return False
        
        # Check if the move would leave the king in check
        try:
            test_board.push(move)
            # If the move puts or leaves our king in check, it's invalid
            if test_board.is_check():
                return False
        except:
            # If there's an error simulating the move, consider it invalid
            return False
                
        return True
        
    def is_game_over(self):
        """Override is_game_over to check for king explosion"""
        # If a king was exploded, the game is over
        if self.king_exploded:
            return True
            
        # Check if either king is missing
        white_king_exists = False
        black_king_exists = False
        
        for square in chess.SQUARES:
            piece = self.piece_at(square)
            if piece and piece.piece_type == chess.KING:
                if piece.color == chess.WHITE:
                    white_king_exists = True
                else:
                    black_king_exists = True
        
        # If either king is missing, the game is over
        if not white_king_exists or not black_king_exists:
            # Set the winner if not already set
            if not self.winner:
                if not white_king_exists:
                    self.winner = chess.BLACK
                else:
                    self.winner = chess.WHITE
            return True
            
        # Otherwise, use the standard chess rules
        return super().is_game_over()
        
    def result(self):
        """Override result to handle king explosion"""
        if self.king_exploded or self.winner is not None:
            if self.winner == chess.WHITE:
                return "1-0"
            elif self.winner == chess.BLACK:
                return "0-1"
        
        # Use standard chess result if no king was exploded
        return super().result()

# Global game board instance
board = ExplosiveBoard()

@app.route('/new-game', methods=['POST'])
def new_game():
    try:
        global board
        # Initialize new board with validation
        board = ExplosiveBoard()
        if not board:
            raise ValueError("Board initialization failed")
            
        # Create a 2D array representation of the board for the frontend
        board_array = []
        for row in range(8):
            board_row = []
            for col in range(8):
                square = chess.square(col, row)  # Convert to chess.py square index
                piece = board.piece_at(square)
                if piece:
                    # Return the piece symbol (e.g., 'P' for white pawn, 'p' for black pawn)
                    board_row.append(piece.symbol())
                else:
                    board_row.append(None)
            board_array.append(board_row)
            
        return jsonify({
            'board': board_array,
            'currentPlayer': 'white',
            'isCheck': board.is_check(),
            'isCheckmate': board.is_checkmate(),
            'isStalemate': board.is_stalemate(),
            'isGameOver': board.is_game_over(),
            'result': board.result() if board.is_game_over() else None
        })
    except ValueError as ve:
        return jsonify({
            'error': 'Failed to initialize new game',
            'details': str(ve)
        }), 400
    except Exception as e:
        return jsonify({
            'error': 'Internal server error during game initialization',
            'details': str(e)
        }), 500

@app.route('/make-move', methods=['POST'])
def make_move():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data received'}), 400
            
        from_row = data.get('from_row')
        from_col = data.get('from_col')
        to_row = data.get('to_row')
        to_col = data.get('to_col')
        
        if from_row is None or from_col is None or to_row is None or to_col is None:
            return jsonify({'error': 'Missing move coordinates'}), 400
            
        # Convert row/col to chess.py square indices
        from_square = chess.square(from_col, from_row)
        to_square = chess.square(to_col, to_row)
        
        # Create the move
        move = chess.Move(from_square, to_square)
        
        # Check if the move is legal
        if move not in board.legal_moves:
            return jsonify({'error': 'Illegal move'}), 400
            
        # Check if the move is valid considering explosions
        if not board.is_valid_move(move):
            return jsonify({'error': 'This move would cause your king to explode or leave it in check'}), 400
            
        # Make the move
        board.push(move)
        
        # Create a 2D array representation of the board for the frontend
        board_array = []
        for row in range(8):
            board_row = []
            for col in range(8):
                square = chess.square(col, row)
                piece = board.piece_at(square)
                if piece:
                    board_row.append(piece.symbol())
                else:
                    board_row.append(None)
            board_array.append(board_row)
            
        # Check if a piece was captured
        captured_piece = None
        explosion = len(board.exploded) > 0
            
        return jsonify({
            'board': board_array,
            'currentPlayer': 'white' if board.turn else 'black',
            'isCheck': board.is_check(),
            'isCheckmate': board.is_checkmate(),
            'isStalemate': board.is_stalemate(),
            'isGameOver': board.is_game_over(),
            'explosion': explosion,
            'capturedPiece': captured_piece,
            'result': board.result() if board.is_game_over() else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/valid-moves', methods=['POST'])
def valid_moves():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data received'}), 400
            
        from_row = data.get('from_row')
        from_col = data.get('from_col')
        
        if from_row is None or from_col is None:
            return jsonify({'error': 'Missing source coordinates'}), 400
            
        # Convert row/col to chess.py square index
        from_square = chess.square(from_col, from_row)
        
        # Check if there's a piece at the source square
        piece = board.piece_at(from_square)
        if not piece:
            return jsonify({'valid_moves': []}), 200
            
        # Get all legal moves for this piece
        valid_moves = []
        for move in board.legal_moves:
            if move.from_square == from_square and board.is_valid_move(move):
                # Convert chess.py square index to row/col
                to_col = chess.square_file(move.to_square)
                to_row = chess.square_rank(move.to_square)
                valid_moves.append({'row': to_row, 'col': to_col})
                
        return jsonify({'valid_moves': valid_moves}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/game-status', methods=['GET'])
def game_status():
    try:
        # Check for missing kings
        white_king_exists = False
        black_king_exists = False
        
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece and piece.piece_type == chess.KING:
                if piece.color == chess.WHITE:
                    white_king_exists = True
                else:
                    black_king_exists = True
        
        # If a king is missing, the game is over
        game_over = board.is_game_over() or not white_king_exists or not black_king_exists
        
        # Determine the winner if a king is missing
        result = None
        winner = None
        reason = None
        
        if game_over:
            if not white_king_exists:
                result = "0-1"  # Black wins
                winner = "black"
                reason = "explosion"
            elif not black_king_exists:
                result = "1-0"  # White wins
                winner = "white"
                reason = "explosion"
            elif board.is_checkmate():
                result = board.result()
                winner = "white" if board.turn == chess.BLACK else "black"
                reason = "checkmate"
            elif board.is_stalemate():
                result = board.result()
                winner = None
                reason = "stalemate"
            else:
                result = board.result()
                
        return jsonify({
            'game_over': game_over,
            'winner': winner,
            'reason': reason,
            'white_king_exists': white_king_exists,
            'black_king_exists': black_king_exists,
            'is_check': board.is_check(),
            'is_checkmate': board.is_checkmate(),
            'is_stalemate': board.is_stalemate(),
            'result': result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
