"""
Explosive Atomic Chess Flask Backend with AI

- Board state handled via python-chess extended for explosive captures.
- AI uses a simple Minimax with explosion-aware evaluation.
- API Endpoints:
  - /new_game [POST] - start new game
  - /game_state [GET] - get current game state
  - /make_move [POST] - player move (from,to,san,...)
  - /ai_move [POST] - trigger AI move for given color
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import chess
import chess.pgn
import copy
import random
import threading

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# We extend the python-chess board with explosion rules of Atomic Chess.
# Explosions eliminate captured piece and all surrounding pieces except pawns.

class ExplosiveBoard(chess.Board):
    def __init__(self, *args, **kwargs):
        super(ExplosiveBoard, self).__init__(*args, **kwargs)
        # Custom tracking of exploded squares after move for client info
        self.exploded_squares = []
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

        # Check for pawn promotion
        promotion = move.promotion
        
        # Push move normally first
        super().push(move)

        self.exploded_squares = []
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
            removed_squares = []
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
                        removed_squares.append(sq)

            # Store exploded squares (excluding captured) to notify UI
            self.exploded_squares = removed_squares

    def exploded(self):
        # Returns list of exploded squares (excluding capture square)
        return self.exploded_squares
        
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

# AI Implementation: Minimax with explosion-aware evaluation
MAX_DEPTH = 2  # Limited depth for demonstration

def explosion_aware_evaluation(board: ExplosiveBoard):
    """
    Evaluate board considering explosive mechanic:
    - Material value weighted normally.
    - Additional penalty if king is near danger (close to explosion squares).
    - Penalize board instability (difference in count of pieces that may explode).
    """
    if board.is_checkmate():
        # If current side to move is checkmated big negative
        if board.turn:
            return -9999
        else:
            return 9999
    if board.is_stalemate() or board.is_insufficient_material():
        return 0
        
    # Check for king explosion or missing kings
    white_king_exists = False
    black_king_exists = False
    
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece and piece.piece_type == chess.KING:
            if piece.color == chess.WHITE:
                white_king_exists = True
            else:
                black_king_exists = True
    
    # If a king is missing, return appropriate score
    if not white_king_exists:
        return -9999  # White loses
    if not black_king_exists:
        return 9999   # Black loses

    # Base material values
    material_values = {
        chess.PAWN: 100,
        chess.KNIGHT: 320,
        chess.BISHOP: 330,
        chess.ROOK: 500,
        chess.QUEEN: 900,
        chess.KING: 20000
    }

    # Count material for each side
    white_score = 0
    black_score = 0

    for sq in chess.SQUARES:
        piece = board.piece_at(sq)
        if piece is not None:
            value = material_values.get(piece.piece_type, 0)
            if piece.color == chess.WHITE:
                white_score += value
            else:
                black_score += value

    # Explosion consideration: penalize if kings near explosion zones
    # We approximate explosion zones by presence of opponent pieces near king squares
    white_king_sq = board.king(chess.WHITE)
    black_king_sq = board.king(chess.BLACK)

    # Distance penalty from opponent pieces (pieces close to king are dangerous due to explosion)
    def danger_penalty(king_sq, color):
        if king_sq is None:
            return 0
            
        penalty = 0
        kr = chess.square_rank(king_sq)
        kf = chess.square_file(king_sq)
        for sq in chess.SQUARES:
            piece = board.piece_at(sq)
            if piece is not None and piece.color != color:
                sr = chess.square_rank(sq)
                sf = chess.square_file(sq)
                dist = max(abs(sr - kr), abs(sf - kf))  # Chebyshev distance
                if dist <= 1:
                    penalty += 150  # Higher penalty for proximity
                elif dist == 2:
                    penalty += 60
        return penalty

    if white_king_sq:
        white_score -= danger_penalty(white_king_sq, chess.WHITE)
    if black_king_sq:
        black_score -= danger_penalty(black_king_sq, chess.BLACK)

    # Return evaluation from perspective of side to move
    eval_val = white_score - black_score
    return eval_val if board.turn else -eval_val


def minimax(board: ExplosiveBoard, depth, alpha, beta, maximizing):
    """Improved minimax with better error handling for explosions"""
    try:
        if depth == 0 or board.is_game_over():
            return explosion_aware_evaluation(board), None

        best_move = None

        # Get legal moves and filter out moves that would cause own king to explode
        legal_moves = [move for move in board.legal_moves if board.is_valid_move(move)]
        
        # If no legal moves, return appropriate score
        if not legal_moves:
            return -9999 if maximizing else 9999, None

        if maximizing:
            max_eval = -float('inf')
            for move in legal_moves:
                try:
                    b_copy = copy.deepcopy(board)
                    b_copy.push(move)
                    eval_score, _ = minimax(b_copy, depth-1, alpha, beta, False)
                    if eval_score > max_eval:
                        max_eval = eval_score
                        best_move = move
                    alpha = max(alpha, eval_score)
                    if beta <= alpha:
                        break
                except Exception as e:
                    # Skip moves that cause errors
                    continue
            
            # If all moves caused errors, return a default
            if best_move is None and legal_moves:
                best_move = legal_moves[0]
                max_eval = 0
                
            return max_eval, best_move
        else:
            min_eval = float('inf')
            for move in legal_moves:
                try:
                    b_copy = copy.deepcopy(board)
                    b_copy.push(move)
                    eval_score, _ = minimax(b_copy, depth-1, alpha, beta, True)
                    if eval_score < min_eval:
                        min_eval = eval_score
                        best_move = move
                    beta = min(beta, eval_score)
                    if beta <= alpha:
                        break
                except Exception as e:
                    # Skip moves that cause errors
                    continue
            
            # If all moves caused errors, return a default
            if best_move is None and legal_moves:
                best_move = legal_moves[0]
                min_eval = 0
                
            return min_eval, best_move
    except Exception as e:
        # Fallback for any unexpected errors
        legal_moves = list(board.legal_moves)
        if legal_moves:
            return 0, legal_moves[0]
        return 0, None


@app.route('/newgame', methods=['POST'])
def new_game():
    try:
        global board
        # Initialize new board with validation
        board = ExplosiveBoard()
        if not board:
            raise ValueError("Board initialization failed")
            
        # Verify board state is valid
        try:
            board.fen()
        except Exception as e:
            raise ValueError(f"Invalid initial board state: {str(e)}")
            
        return jsonify({
            'fen': board.fen(),
            'message': 'New game started',
            'exploded': [],
            'turn': 'white',
            'is_check': board.is_check(),
            'is_checkmate': board.is_checkmate(),
            'is_stalemate': board.is_stalemate(),
            'is_game_over': board.is_game_over(),
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


@app.route('/gamestate', methods=['GET'])
def game_state():
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
    if game_over:
        if not white_king_exists:
            result = "0-1"  # Black wins
        elif not black_king_exists:
            result = "1-0"  # White wins
        else:
            result = board.result()
    
    return jsonify({
        'fen': board.fen(),
        'turn': 'white' if board.turn else 'black',
        'is_check': board.is_check(),
        'is_checkmate': board.is_checkmate(),
        'is_stalemate': board.is_stalemate(),
        'is_game_over': game_over,
        'exploded': [chess.square_name(sq) for sq in board.exploded()],
        'white_king_exists': white_king_exists,
        'black_king_exists': black_king_exists,
        'result': result
    })

@app.route('/makemove', methods=['POST'])
def make_move():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data received'}), 400
            
        move_uci = data.get('move')
        if not move_uci:
            return jsonify({'error': 'Move not specified'}), 400

        try:
            # Handle promotion moves (e.g., "e7e8q")
            if len(move_uci) == 5:
                from_square = chess.parse_square(move_uci[0:2])
                to_square = chess.parse_square(move_uci[2:4])
                promotion_piece = move_uci[4].lower()
                
                # Map promotion piece to chess.py piece type
                promotion_map = {
                    'q': chess.QUEEN,
                    'r': chess.ROOK,
                    'b': chess.BISHOP,
                    'n': chess.KNIGHT
                }
                
                if promotion_piece not in promotion_map:
                    return jsonify({'error': 'Invalid promotion piece'}), 400
                    
                move = chess.Move(from_square, to_square, promotion=promotion_map[promotion_piece])
            else:
                move = chess.Move.from_uci(move_uci)
        except ValueError as e:
            return jsonify({'error': 'Invalid move format', 'details': str(e)}), 400
        
        # Check if the move is in the list of legal moves
        if move not in board.legal_moves:
            return jsonify({'error': 'Illegal move', 'details': 'This move is not allowed according to chess rules'}), 400
        
        # Use the validation method to check for explosions and check
        if not board.is_valid_move(move):
            # Determine the reason for the invalid move
            if board.is_capture(move):
                # Check if it would cause own king to explode
                king_square = board.king(board.turn)
                capture_square = move.to_square
                f = chess.square_file(capture_square)
                r = chess.square_rank(capture_square)
                kf = chess.square_file(king_square)
                kr = chess.square_rank(king_square)
                
                if abs(kf - f) <= 1 and abs(kr - r) <= 1:
                    return jsonify({'error': 'Illegal move', 'details': 'This move would cause your king to explode'}), 400
            
            # Check if it would leave king in check
            test_board = board.copy()
            test_board.push(move)
            if test_board.is_check():
                return jsonify({'error': 'Illegal move', 'details': 'This move would leave your king in check'}), 400
                
            return jsonify({'error': 'Illegal move', 'details': 'This move is not allowed in the current position'}), 400

        # Check if game is already over
        if board.is_game_over():
            return jsonify({'error': 'Game is already over', 'result': board.result()}), 400

        # Make the move
        board.push(move)
        
        # Check for missing kings after the move
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
        if game_over:
            if not white_king_exists:
                result = "0-1"  # Black wins
            elif not black_king_exists:
                result = "1-0"  # White wins
            else:
                result = board.result()
        
        return jsonify({
            'fen': board.fen(),
            'exploded': [chess.square_name(sq) for sq in board.exploded()],
            'is_check': board.is_check(),
            'is_checkmate': board.is_checkmate(),
            'is_stalemate': board.is_stalemate(),
            'is_game_over': game_over,
            'turn': 'white' if board.turn else 'black',
            'white_king_exists': white_king_exists,
            'black_king_exists': black_king_exists,
            'result': result
        })
        
    except Exception as e:
        return jsonify({'error': 'Server error', 'details': str(e)}), 500

@app.route('/aimove', methods=['POST'])
def ai_move():
    global board
    data = request.json or {}
    depth = min(data.get('depth', 2), 2)  # Limit depth to 2 to avoid long calculations
    
    # Check if game is already over
    if board.is_game_over():
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
        
        # Determine the winner if a king is missing
        result = None
        if not white_king_exists:
            result = "0-1"  # Black wins
        elif not black_king_exists:
            result = "1-0"  # White wins
        else:
            result = board.result()
            
        return jsonify({
            'error': 'Game is already over',
            'result': result,
            'white_king_exists': white_king_exists,
            'black_king_exists': black_king_exists
        }), 400

    try:
        maximizing = board.turn  # White maximizes
        eval_score, best_move = minimax(board, depth, -float('inf'), float('inf'), maximizing)

        if best_move is None:
            # Fallback to a random legal move if minimax fails
            legal_moves = list(board.legal_moves)
            if legal_moves:
                best_move = random.choice(legal_moves)
            else:
                return jsonify({'error': 'No moves available'}), 400

        # Check if this is a pawn promotion move
        is_promotion = False
        promotion_piece = None
        
        if best_move.promotion is not None:
            is_promotion = True
            # Map chess.py piece type to character
            promotion_map = {
                chess.QUEEN: 'q',
                chess.ROOK: 'r',
                chess.BISHOP: 'b',
                chess.KNIGHT: 'n'
            }
            promotion_piece = promotion_map.get(best_move.promotion, 'q')

        # Make the move
        board.push(best_move)
        
        # Check for missing kings after the move
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
        if game_over:
            if not white_king_exists:
                result = "0-1"  # Black wins
            elif not black_king_exists:
                result = "1-0"  # White wins
            else:
                result = board.result()

        # Format the move string with promotion if needed
        move_str = best_move.uci()
        if is_promotion:
            move_str = f"{chess.square_name(best_move.from_square)}{chess.square_name(best_move.to_square)}{promotion_piece}"

        return jsonify({
            'fen': board.fen(),
            'move': move_str,
            'exploded': [chess.square_name(sq) for sq in board.exploded()],
            'is_check': board.is_check(),
            'is_checkmate': board.is_checkmate(),
            'is_stalemate': board.is_stalemate(),
            'is_game_over': game_over,
            'turn': 'white' if board.turn else 'black',
            'evaluation': eval_score,
            'white_king_exists': white_king_exists,
            'black_king_exists': black_king_exists,
            'result': result
        })
    except Exception as e:
        # If AI move fails, return a helpful error
        return jsonify({
            'error': 'AI calculation error',
            'details': str(e)
        }), 500

# New endpoints from updates
from engine.chess_engine import ChessEngine

# Initialize chess engine
chess_engine = ChessEngine()

@app.route('/api/validate-move', methods=['POST'])
def validate_move():
    data = request.json
    from_pos = data.get('from')
    to_pos = data.get('to')
    board = data.get('board')
    
    # Validate the move using the chess engine
    result = chess_engine.validate_move(from_pos, to_pos, board)
    
    return jsonify(result)

@app.route('/api/get-ai-move', methods=['POST'])
def get_ai_move():
    data = request.json
    board = data.get('board')
    difficulty = data.get('difficulty', 'medium')
    
    # Get AI move using the chess engine
    move = chess_engine.get_ai_move(board, difficulty)
    
    return jsonify(move)

@app.route('/api/check-game-state', methods=['POST'])
def check_game_state():
    data = request.json
    board = data.get('board')
    current_player = data.get('currentPlayer')
    
    # Check game state using the chess engine
    state = chess_engine.check_game_state(board, current_player)
    
    return jsonify(state)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Chess API is running"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
