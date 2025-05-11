import chess
import random
import torch
import torch.nn as nn
import torch.nn.functional as F
import math
from collections import defaultdict
import time

class SimpleEvalNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(12, 64, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.fc1 = nn.Linear(256 * 8 * 8, 512)
        self.fc2 = nn.Linear(512, 1)
        
    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = F.relu(self.conv3(x))
        x = x.view(-1, 256 * 8 * 8)
        x = F.relu(self.fc1(x))
        return torch.tanh(self.fc2(x))  # Normalized output

piece_to_index = {
    'P': 0, 'N': 1, 'B': 2, 'R': 3, 'Q': 4, 'K': 5,
    'p': 6, 'n': 7, 'b': 8, 'r': 9, 'q': 10, 'k': 11
}

def board_to_tensor(board):
    tensor = torch.zeros(12, 8, 8)
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            idx = piece_to_index[piece.symbol()]
            row, col = chess.square_rank(square), chess.square_file(square)
            tensor[idx][7 - row][col] = 1  # Flipped for white's perspective
    return tensor

class ExplosiveChess:
    def __init__(self):
        self.board = chess.Board()
        self.eval_model = SimpleEvalNet()
        self.eval_model.eval()
        self.move_history = []
        
        # Enhanced piece values considering explosion risk
        self.piece_values = {
            chess.PAWN: 1,
            chess.KNIGHT: 3.2,
            chess.BISHOP: 3.3,
            chess.ROOK: 5,
            chess.QUEEN: 9.5,
            chess.KING: 200  # Much higher value to prioritize king safety
        }
        
        # Load pre-trained weights if available
        try:
            self.eval_model.load_state_dict(torch.load('model_weights.pth'))
        except:
            print("No pre-trained model found, using random weights")

    def is_explosive_capture(self, move):
        """Check if move triggers explosion (captures only)"""
        return self.board.is_capture(move)

    def apply_explosion(self, move):
        """Simulate explosion chain reaction with improved mechanics"""
        if not self.is_explosive_capture(move):
            return set()

        exploded = set()
        frontier = {move.to_square}
        
        # Get captured piece for special explosion rules
        captured_piece = self.board.piece_at(move.to_square)
        if not captured_piece:
            return set()
            
        # Compute initial explosion squares
        explosion_squares = [move.to_square]
        f = chess.square_file(move.to_square)
        r = chess.square_rank(move.to_square)
        for df in [-1,0,1]:
            for dr in [-1,0,1]:
                if df == 0 and dr == 0:
                    continue
                ff = f + df
                rr = r + dr
                if 0 <= ff <= 7 and 0 <= rr <= 7:
                    sq = chess.square(ff, rr)
                    explosion_squares.append(sq)
        
        # Process explosion squares with piece-specific rules
        for sq in explosion_squares:
            piece = self.board.piece_at(sq)
            if piece is not None:
                # Kings are affected by explosions
                if piece.piece_type == chess.KING:
                    exploded.add(sq)
                # Pawns are immune to explosions
                elif piece.piece_type != chess.PAWN:
                    exploded.add(sq)
                    
        # Remove exploded pieces
        for sq in exploded:
            self.board.remove_piece_at(sq)
            
        return exploded

    def _get_adjacent_squares(self, square):
        """Get all 8 surrounding squares"""
        rank, file = chess.square_rank(square), chess.square_file(square)
        squares = []
        for dr in [-1, 0, 1]:
            for df in [-1, 0, 1]:
                if dr == 0 and df == 0:
                    continue
                if 0 <= rank + dr < 8 and 0 <= file + df < 8:
                    squares.append(chess.square(file + df, rank + dr))
        return squares

    def push_move(self, move):
        """Make move and handle explosions"""
        self.board.push(move)
        exploded = self.apply_explosion(move)
        self.move_history.append({
            'move': move,
            'exploded_squares': exploded
        })

    def is_valid_move(self, move):
        """Check if a move is valid considering explosion rules"""
        # First check if it's a legal move according to standard chess rules
        if move not in self.board.legal_moves:
            return False
            
        # Now check if it would cause our own king to explode
        # Make a copy of the board to simulate the move
        test_board = self.board.copy()
        
        # Get the king square for the current player
        king_square = test_board.king(self.board.turn)
        if king_square is None:  # No king (shouldn't happen in standard chess)
            return True
            
        # If it's a capture, check if the explosion would affect our king
        if self.board.is_capture(move):
            capture_square = move.to_square
            f = chess.square_file(capture_square)
            r = chess.square_rank(capture_square)
            
            # Check if king is adjacent to the capture square
            kf = chess.square_file(king_square)
            kr = chess.square_rank(king_square)
            
            # If king is within explosion radius (1 square), the move is invalid
            if abs(kf - f) <= 1 and abs(kr - r) <= 1:
                return False
                
        return True

    def legal_moves(self):
        """Get all legal moves considering explosive chess rules"""
        base_moves = list(self.board.legal_moves)
        # Filter out moves that would put own king in danger from explosions
        legal_moves = []
        for move in base_moves:
            if self.is_valid_move(move):
                legal_moves.append(move)
        return legal_moves

    def is_game_over(self):
        return self.board.is_game_over()

    def result(self):
        return self.board.result()

    def get_fen(self):
        try:
            return self.board.fen()
        except:
            return None

    def reset(self):
        self.board.reset()
        self.move_history = []
        return self.get_fen()

    def play_random_move(self):
        move = random.choice(self.legal_moves())
        self.push_move(move)
        return move

    def play_minimax_move(self, depth=3):
        """Minimax with alpha-beta pruning"""
        def minimax(board, depth, alpha, beta, maximizing_player):
            try:
                if depth == 0 or board.is_game_over():
                    return self.evaluate_board(board, not maximizing_player)
                
                # Get legal moves and filter out moves that would cause own king to explode
                legal_moves = []
                for move in board.legal_moves:
                    # Check if move would cause own king to explode
                    king_square = board.king(board.turn)
                    if king_square is None:
                        legal_moves.append(move)
                        continue
                        
                    if board.is_capture(move):
                        capture_square = move.to_square
                        f = chess.square_file(capture_square)
                        r = chess.square_rank(capture_square)
                        
                        kf = chess.square_file(king_square)
                        kr = chess.square_rank(king_square)
                        
                        if abs(kf - f) <= 1 and abs(kr - r) <= 1:
                            continue
                    
                    legal_moves.append(move)
                
                if not legal_moves:
                    return -float('inf') if maximizing_player else float('inf')
                
                moves = sorted(legal_moves, 
                             key=lambda m: self._move_heuristic(board, m),
                             reverse=maximizing_player)
                
                best_score = -float('inf') if maximizing_player else float('inf')
                
                for move in moves:
                    try:
                        board.push(move)
                        # Simulate explosion
                        temp_exploded = self._simulate_explosion(board, move)
                        for sq in temp_exploded:
                            board.remove_piece_at(sq)
                        
                        score = minimax(board, depth-1, alpha, beta, not maximizing_player)
                        
                        # Undo explosion and move
                        board.pop()
                        
                        if maximizing_player:
                            best_score = max(score, best_score)
                            alpha = max(alpha, best_score)
                        else:
                            best_score = min(score, best_score)
                            beta = min(beta, best_score)
                        
                        if beta <= alpha:
                            break
                    except Exception as e:
                        # Skip moves that cause errors
                        board.pop()
                        continue
                
                return best_score
            except Exception as e:
                # Fallback for any unexpected errors
                return 0
            
        best_move = None
        best_score = -float('inf')
        alpha = -float('inf')
        beta = float('inf')
        
        legal_moves = self.legal_moves()
        if not legal_moves:
            return None
            
        moves = sorted(legal_moves, 
                      key=lambda m: self._move_heuristic(self.board, m),
                      reverse=True)
        
        for move in moves:
            try:
                self.board.push(move)
                exploded = self._simulate_explosion(self.board, move)
                for sq in exploded:
                    self.board.remove_piece_at(sq)
                
                score = minimax(self.board, depth-1, alpha, beta, False)
                
                # Undo explosion simulation
                self.board.pop()
                
                if score > best_score:
                    best_score = score
                    best_move = move
            except Exception as e:
                # Skip moves that cause errors
                self.board.pop()
                continue
        
        if best_move is None and legal_moves:
            best_move = legal_moves[0]
            
        if best_move:
            self.push_move(best_move)
            
        return best_move

    def _move_heuristic(self, board, move):
        """Quick evaluation to order moves"""
        try:
            if board.is_capture(move):
                captured = board.piece_at(move.to_square)
                if captured:
                    return self.piece_values.get(captured.piece_type, 0) * 10
            return 0
        except:
            return 0

    def _simulate_explosion(self, board, move):
        """Simulate explosion without modifying board"""
        if not board.is_capture(move):
            return set()
        
        exploded = set()
        frontier = {move.to_square}
        power = 2
        
        try:
            for _ in range(power):
                next_frontier = set()
                for sq in frontier:
                    if sq in exploded:
                        continue
                    
                    exploded.add(sq)
                    for neighbor in self._get_adjacent_squares(sq):
                        piece = board.piece_at(neighbor)
                        if piece and piece.piece_type != chess.KING:
                            next_frontier.add(neighbor)
                frontier = next_frontier
        except Exception as e:
            # Return partial explosion if error occurs
            pass
        
        return exploded

    def play_mcts_move(self, simulations=1000, time_limit=2.0):
        """Enhanced MCTS with explosion awareness"""
        class Node:
            def __init__(self, board, move=None, parent=None):
                self.board = board
                self.move = move
                self.parent = parent
                self.children = []
                self.visits = 0
                self.score = 0.0
                self.untried_moves = list(board.legal_moves)
                
            def ucb(self, exploration=1.4):
                if self.visits == 0:
                    return float('inf')
                return (self.score / self.visits) + exploration * math.sqrt(math.log(self.parent.visits) / self.visits)
                
            def best_child(self):
                return max(self.children, key=lambda c: c.ucb())
                
            def expand(self):
                move = self.untried_moves.pop()
                new_board = self.board.copy()
                new_board.push(move)
                # Simulate explosion
                exploded = self._simulate_explosion(new_board, move)
                for sq in exploded:
                    new_board.remove_piece_at(sq)
                child = Node(new_board, move=move, parent=self)
                self.children.append(child)
                return child

        try:
            root = Node(self.board.copy())
            end_time = time.time() + time_limit
            
            while time.time() < end_time and simulations > 0:
                node = root
                board = root.board.copy()
                
                # Selection
                while node.untried_moves == [] and node.children != []:
                    node = node.best_child()
                    board.push(node.move)
                    # Simulate explosion for selection
                    exploded = self._simulate_explosion(board, node.move)
                    for sq in exploded:
                        board.remove_piece_at(sq)
                
                # Expansion
                if node.untried_moves != []:
                    node = node.expand()
                    board = node.board.copy()
                    simulations -= 1
                
                # Simulation
                result = self._simulate_random_game(board)
                
                # Backpropagation
                while node is not None:
                    node.visits += 1
                    node.score += result
                    node = node.parent
            
            if not root.children:
                return self.play_random_move()
                
            # Select move with highest visit count
            best_move = max(root.children, key=lambda c: c.visits).move
            self.push_move(best_move)
            return best_move
        except Exception as e:
            # Fallback to random move if MCTS fails
            return self.play_random_move()

    def _simulate_random_game(self, board, max_moves=100):
        """Play random moves until game ends, return evaluation"""
        try:
            temp_board = board.copy()
            moves = 0
            
            while not temp_board.is_game_over() and moves < max_moves:
                legal_moves = list(temp_board.legal_moves)
                if not legal_moves:
                    break
                    
                move = random.choice(legal_moves)
                temp_board.push(move)
                # Simulate explosion
                exploded = self._simulate_explosion(temp_board, move)
                for sq in exploded:
                    temp_board.remove_piece_at(sq)
                moves += 1
            
            return self.evaluate_board(temp_board, temp_board.turn)
        except Exception as e:
            # Return neutral evaluation if simulation fails
            return 0

    def evaluate_board(self, board, perspective):
        """Enhanced evaluation with improved explosion risk assessment"""
        try:
            # Neural network evaluation
            tensor = board_to_tensor(board).unsqueeze(0)
            with torch.no_grad():
                score = self.eval_model(tensor).item()
            
            # Adjust for perspective
            return score if perspective == chess.WHITE else -score
        except:
            # Fallback to improved material and positional evaluation
            score = 0
            explosion_risk = defaultdict(float)
            king_safety = {chess.WHITE: 0, chess.BLACK: 0}
            piece_mobility = {chess.WHITE: 0, chess.BLACK: 0}
            
            # Calculate material and explosion risks
            for square in chess.SQUARES:
                piece = board.piece_at(square)
                if piece:
                    # Base material value
                    value = self.piece_values.get(piece.piece_type, 0)
                    score += value if piece.color == chess.WHITE else -value
                    
                    # Calculate explosion vulnerability and mobility
                    if piece.piece_type != chess.KING:
                        # Count safe squares the piece can move to
                        safe_moves = 0
                        for neighbor in self._get_adjacent_squares(square):
                            enemy = board.piece_at(neighbor)
                            if enemy and enemy.color != piece.color:
                                # Higher risk from valuable enemy pieces
                                risk_factor = self.piece_values.get(enemy.piece_type, 0) * 0.75
                                explosion_risk[square] += risk_factor
                            elif not enemy:
                                safe_moves += 1
                        
                        # Add mobility score
                        mobility = safe_moves * 0.1
                        if piece.color == chess.WHITE:
                            piece_mobility[chess.WHITE] += mobility
                        else:
                            piece_mobility[chess.BLACK] += mobility
            
            # Calculate king safety based on surrounding pieces and explosion risks
            for color in [chess.WHITE, chess.BLACK]:
                king_square = board.king(color)
                if king_square:
                    # Check surrounding squares
                    friendly_protectors = 0
                    enemy_attackers = 0
                    for neighbor in self._get_adjacent_squares(king_square):
                        piece = board.piece_at(neighbor)
                        if piece:
                            if piece.color == color:
                                friendly_protectors += 1
                            else:
                                enemy_attackers += 2  # Enemy pieces near king are dangerous
                    
                    # Calculate king safety score
                    safety = friendly_protectors - enemy_attackers
                    king_safety[color] = safety * 0.5
            
            # Combine all evaluation components
            for square, risk in explosion_risk.items():
                piece = board.piece_at(square)
                if piece:
                    if piece.color == chess.WHITE:
                        score -= risk
                    else:
                        score += risk
            
            # Add king safety and mobility
            score += king_safety[chess.WHITE] - king_safety[chess.BLACK]
            score += piece_mobility[chess.WHITE] - piece_mobility[chess.BLACK]
            
            # Normalize final score
            return score / 100  # Normalize to similar range as neural net

class ChessEngine:
    def __init__(self):
        self.piece_values = {
            'pawn': 1,
            'knight': 3,
            'bishop': 3,
            'rook': 5,
            'queen': 9,
            'king': 100
        }
    
    def validate_move(self, from_pos, to_pos, board):
        """
        Validate if a move is legal according to chess rules
        
        Args:
            from_pos (dict): Starting position with row and col
            to_pos (dict): Target position with row and col
            board (list): 2D array representing the chess board
            
        Returns:
            dict: Result of validation with isValid flag and additional info
        """
        # This is a simplified implementation
        # In a real chess engine, you would implement all chess rules here
        
        # For demo purposes, we'll just return valid for any move
        result = {
            "isValid": True,
            "explosion": False,
            "capturedPieces": []
        }
        
        # Check if there's a piece at the target position (capture)
        from_row, from_col = from_pos['row'], from_pos['col']
        to_row, to_col = to_pos['row'], to_pos['col']
        
        if board[to_row][to_col]:
            result["capturedPieces"].append({
                "row": to_row,
                "col": to_col,
                "piece": board[to_row][to_col]
            })
            
            # Check if the captured piece is a pawn (explosion in our variant)
            if board[to_row][to_col].get('type') == 'pawn':
                result["explosion"] = True
                
                # Add adjacent pieces to captured list (explosion effect)
                for dr in [-1, 0, 1]:
                    for dc in [-1, 0, 1]:
                        if dr == 0 and dc == 0:
                            continue  # Skip the center square
                            
                        adj_row, adj_col = to_row + dr, to_col + dc
                        
                        # Check if within board bounds
                        if 0 <= adj_row < 8 and 0 <= adj_col < 8:
                            # Check if there's a piece to capture
                            if board[adj_row][adj_col]:
                                result["capturedPieces"].append({
                                    "row": adj_row,
                                    "col": adj_col,
                                    "piece": board[adj_row][adj_col]
                                })
        
        return result
    
    def get_ai_move(self, board, difficulty):
        """
        Generate an AI move based on the current board state and difficulty
        
        Args:
            board (list): 2D array representing the chess board
            difficulty (str): AI difficulty level (easy, medium, hard, expert)
            
        Returns:
            dict: AI move with from and to positions
        """
        # This is a simplified implementation
        # In a real chess engine, you would implement minimax with alpha-beta pruning
        # and different search depths based on difficulty
        
        # For demo purposes, we'll just return a random valid move
        import random
        
        # Find all black pieces
        black_pieces = []
        for row in range(8):
            for col in range(8):
                if board[row][col] and board[row][col].get('color') == 'black':
                    black_pieces.append({"row": row, "col": col, "piece": board[row][col]})
        
        if not black_pieces:
            return {"error": "No black pieces found"}
        
        # Select a random piece
        piece_pos = random.choice(black_pieces)
        
        # Generate possible moves (simplified)
        possible_moves = []
        for row in range(8):
            for col in range(8):
                # Skip squares with black pieces
                if board[row][col] and board[row][col].get('color') == 'black':
                    continue
                
                possible_moves.append({"row": row, "col": col})
        
        if not possible_moves:
            return {"error": "No valid moves found"}
        
        # Select a random move
        move_to = random.choice(possible_moves)
        
        return {
            "from": {"row": piece_pos["row"], "col": piece_pos["col"]},
            "to": {"row": move_to["row"], "col": move_to["col"]}
        }
    
    def check_game_state(self, board, current_player):
        """
        Check if the game is over (checkmate, stalemate, etc.)
        
        Args:
            board (list): 2D array representing the chess board
            current_player (str): Current player's color (white or black)
            
        Returns:
            dict: Game state information
        """
        # This is a simplified implementation
        # In a real chess engine, you would check for checkmate, stalemate, etc.
        
        # Check if kings are present
        white_king_present = False
        black_king_present = False
        
        for row in range(8):
            for col in range(8):
                piece = board[row][col]
                if piece and piece.get('type') == 'king':
                    if piece.get('color') == 'white':
                        white_king_present = True
                    else:
                        black_king_present = True
        
        if not white_king_present:
            return {
                "gameOver": True,
                "winner": "black",
                "reason": "king capture"
            }
        
        if not black_king_present:
            return {
                "gameOver": True,
                "winner": "white",
                "reason": "king capture"
            }
        
        # For demo purposes, we'll just return game not over
        return {
            "gameOver": False
        }
