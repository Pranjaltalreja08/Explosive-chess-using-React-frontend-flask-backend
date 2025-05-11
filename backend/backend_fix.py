"""
This file contains fixes for the backend issues preventing the game from starting properly.
Apply these changes to your app.py and chess_engine.py files.
"""

# ===== FIXES FOR app.py =====

# 1. Fix the /new-game endpoint to return proper board format
"""
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
"""

# 2. Fix the /make-move endpoint to return proper board format
"""
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
        if board.exploded:
            explosion = True
        else:
            explosion = False
            
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
"""

# 3. Fix the /valid-moves endpoint
"""
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
            if move.from_square == from_square:
                # Convert chess.py square index to row/col
                to_col = chess.square_file(move.to_square)
                to_row = chess.square_rank(move.to_square)
                valid_moves.append({'row': to_row, 'col': to_col})
                
        return jsonify({'valid_moves': valid_moves}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
"""

# ===== FIXES FOR chess_engine.py =====

# 1. Fix the ExplosiveBoard class to properly track exploded pieces
"""
class ExplosiveBoard(chess.Board):
    def __init__(self, *args, **kwargs):
        super(ExplosiveBoard, self).__init__(*args, **kwargs)
        # Custom tracking of exploded squares after move for client info
        self.exploded = []
        # Track if a king was exploded
        self.king_exploded = False
        self.winner = None

    def push(self, move):
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
"""

# 2. Fix the route handlers to use the correct API endpoints
"""
# Make sure your Flask app has these routes defined:
# /new-game (POST)
# /make-move (POST)
# /valid-moves (POST)
# /game-status (GET)

# The frontend is expecting these exact routes, so make sure they match.
"""

# 3. Fix the board representation for the frontend
"""
# When sending the board to the frontend, make sure it's a 2D array where:
# - Each cell contains either a piece symbol (e.g., 'P', 'p', 'R', 'r') or null
# - The array is indexed as board[row][col] where row 0 is the top row (black's side)
# - Uppercase letters are white pieces, lowercase are black pieces
"""
