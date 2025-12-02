from mesa.discrete_space import CellAgent, FixedAgent
import heapq
from collections import deque

class Car(CellAgent):
    
    def __init__(self, model, cell, unique_id, dest=None):
        super().__init__(model)
        self.cell = cell
        self.unique_id = unique_id
        self.dest = dest
        self.steps_taken = 0
        self.state = "Moving"
        self.last_direction = None
        self.path = []
        self.pathIndex = 0
        self.dirActual = None
        self.nextDir = None
        
        # A* weights
        self.weightDist = 1.0
        self.weightCars = 5.0
        self.weightLights = 1.0
        
        # Metrics
        self.semaforosFound = 0
        self.embotellamientosEncontrados = 0
        self.tiempoEnEmbotellamiento = 0
        
        # P(x)'s
        self.paciencia = 5
        self.probabilidadRomperEmbotellamiento = 0.4
        self.redLightRecalcProb = 0.3
        self.trafficJamRecalcProb =0.4
        self.alternativeReduc = 0.5
        self.diagonalPenalty = 0.1
        self.laneChangeProb = 0.85
        
        # State tracking
        self.last_state = "Moving"
        self.has_recalculated_in_wait = False
        
        # Loop detection
        self.visited_positions = deque(maxlen=20)
        self.loop_detection_threshold = 3
        
        if self.dest:
            self.calcPathAEstrella()
    
    
    def heuristica(self, cell1, cell2):
        x1, y1 = cell1.coordinate
        x2, y2 = cell2.coordinate
        return abs(x2 - x1) + abs(y2 - y1)
    
    def isValidTurn(self, current_dir, next_dir):
        if not current_dir or not next_dir:
            return True
        opposites = {"Right": "Left", "Left": "Right", "Up": "Down", "Down": "Up"}
        return opposites.get(current_dir) != next_dir
    
    def getDirectionBetweenCells(self, from_cell, to_cell):
        x1, y1 = from_cell.coordinate
        x2, y2 = to_cell.coordinate
        if x2 > x1: return "Right"
        if x2 < x1: return "Left"
        if y2 > y1: return "Up"
        if y2 < y1: return "Down"
        return None
    
    def getCellInfo(self, cell):
        has_car = has_red = has_dest = has_tl = False
        road_dir = None
        
        for agent in cell.agents:
            if isinstance(agent, Car):
                has_car = True
            elif isinstance(agent, Traffic_Light):
                has_tl = True
                if not agent.state:
                    has_red = True
            elif isinstance(agent, Destination):
                has_dest = True
            elif isinstance(agent, Road):
                road_dir = agent.direction
        
        return has_car, has_red, has_dest, road_dir, has_tl
    
    def isMyDestination(self, cell):
        if not self.dest:
            return False
        dest_cell = self.dest.cell if hasattr(self.dest, 'cell') else self.dest
        return cell.coordinate == dest_cell.coordinate
    

    def getVecinos(self, cell):
        neighbors = []
        x, y = cell.coordinate
        _, _, _, direccion, _ = self.getCellInfo(cell)
        
        if not direccion:
            return neighbors
        
        movimientos = {
            "Right": [("Right", (x+1, y), False), ("Up", (x+1, y+1), True), ("Down", (x+1, y-1), True)],
            "Left": [("Left", (x-1, y), False), ("Down", (x-1, y-1), True), ("Up", (x-1, y+1), True)],
            "Up": [("Up", (x, y+1), False), ("Right", (x+1, y+1), True), ("Left", (x-1, y+1), True)],
            "Down": [("Down", (x, y-1), False), ("Left", (x-1, y-1), True), ("Right", (x+1, y-1), True)]
        }
        
        opposites = {"Right": "Left", "Left": "Right", "Up": "Down", "Down": "Up"}
        
        for move_dir, (nx, ny), is_diagonal in movimientos[direccion]:
            if not (0 <= nx < self.model.width and 0 <= ny < self.model.height):
                continue
            
            nextCell = self.model.grid[(nx, ny)]
            has_car, has_red, has_dest, next_road_dir, has_tl = self.getCellInfo(nextCell)
            
            if has_dest or has_tl:
                neighbors.append((nextCell, is_diagonal))
                continue
            
            if not next_road_dir or move_dir == opposites[direccion]:
                continue
            
            if not is_diagonal:
                if move_dir == next_road_dir:
                    neighbors.append((nextCell, is_diagonal))
            elif next_road_dir in (direccion, move_dir):
                neighbors.append((nextCell, is_diagonal))
        
        return neighbors
    
    def calcPathAEstrella(self, avoid_cells=None):
        if not self.dest:
            self.path = []
            self.pathIndex = 0
            self.nextDir = None
            return
        
        dest_cell = self.dest.cell if hasattr(self.dest, 'cell') else self.dest
        start = self.cell
        open_set = [(0, 0, start)]
        provenencia = {}
        gScore = {start: 0}
        fScore = {start: self.heuristica(start, dest_cell)}
        openSetHash = {start}
        cont = 1
        loop_penalty = 50.0 if avoid_cells else 0
        max_iterations = self.model.width * self.model.height * 2
        
        for _ in range(max_iterations):
            if not open_set:
                break
            
            _, _, actual = heapq.heappop(open_set)
            openSetHash.remove(actual)
            
            if actual.coordinate == dest_cell.coordinate:
                self.path = []
                while actual in provenencia:
                    self.path.append(actual)
                    actual = provenencia[actual]
                self.path.reverse()
                self.pathIndex = 0
                self.updateNextDirection()
                return
            
            for vecino, is_diagonal in self.getVecinos(actual):
                cost = self.weightDist
                
                if is_diagonal:
                    cost *= 1 + self.diagonalPenalty 
                has_car, _, _, _, has_tl = self.getCellInfo(vecino)
                
                car_penalty_multiplier = 1.0
                if self.state in ["WaitingTraffic", "WaitingRedLight"] and self.tiempoEnEmbotellamiento > 1:
                    car_penalty_multiplier = self.alternativeReduc
                
                if has_car:
                    cost += self.weightCars * car_penalty_multiplier
                if has_tl:
                    cost += self.weightLights
                if avoid_cells and vecino.coordinate in avoid_cells:
                    cost += loop_penalty
                
                tentative_g = gScore[actual] + cost
                
                if vecino not in gScore or tentative_g < gScore[vecino]:
                    provenencia[vecino] = actual
                    gScore[vecino] = tentative_g
                    fScore[vecino] = tentative_g + self.heuristica(vecino, dest_cell)
                    
                    if vecino not in openSetHash:
                        heapq.heappush(open_set, (fScore[vecino], cont, vecino))
                        cont += 1
                        openSetHash.add(vecino)
        
        self.path = []
        self.pathIndex = 0
        self.nextDir = None
    
    def updateNextDirection(self):
        if self.path and self.pathIndex < len(self.path):
            next_cell = self.path[self.pathIndex]
            self.nextDir = self.getDirectionBetweenCells(self.cell, next_cell)
        else:
            self.nextDir = None
    

    def shouldRecalculatePath(self):
        if not self.path or self.pathIndex >= len(self.path):
            return True
        
        current_is_waiting = self.state in ["WaitingTraffic", "WaitingRedLight"]
        was_moving = self.last_state == "Moving"
        
        if current_is_waiting and was_moving and not self.has_recalculated_in_wait:
            return True
        
        if self.state == "WaitingRedLight" and self.tiempoEnEmbotellamiento > 0:
            if self.model.random.random() < self.redlightRecalcProb:
                return True
        
        if self.state == "WaitingTraffic" and self.tiempoEnEmbotellamiento >= 2:
            if self.model.random.random() < self.trafficJamRecalcProb:
                return True
        
        return False
    
    def getNextCell(self):
        if self.dest and self.shouldRecalculatePath():
            self.calcPathAEstrella()
            if self.state in ["WaitingTraffic", "WaitingRedLight"]:
                self.has_recalculated_in_wait = True
        
        if self.path and self.pathIndex < len(self.path):
            next_cell = self.path[self.pathIndex]
            _, _, _, _, has_tl = self.getCellInfo(self.cell)
            
            if has_tl:
                move_dir = self.getDirectionBetweenCells(self.cell, next_cell)
                _, _, _, road_dir, _ = self.getCellInfo(self.cell)
                if not self.isValidTurn(self.last_direction, move_dir) or (road_dir and not self.isValidTurn(road_dir, move_dir)):
                    return None
            
            return next_cell
        
        _, _, _, road_dir, _ = self.getCellInfo(self.cell)
        road_dir = road_dir or self.last_direction
        if not road_dir:
            return None
        
        direction_map = {"Right": (1, 0), "Left": (-1, 0), "Up": (0, 1), "Down": (0, -1)}
        if road_dir not in direction_map:
            return None
        
        x, y = self.cell.coordinate
        dx, dy = direction_map[road_dir]
        if 0 <= x + dx < self.model.width and 0 <= y + dy < self.model.height:
            return self.model.grid[(x + dx, y + dy)]
        return None
    
    def tryLaneChange(self, blocked_cell):
        """Try to find an adjacent parallel lane when blocked via diagonal merge."""
        if self.model.random.random() > self.laneChangeProb:
            return None
        
        _, _, _, my_road_dir, _ = self.getCellInfo(self.cell)
        if not my_road_dir:
            return None
        
        x, y = self.cell.coordinate
        
        diagonal_options = []
        if my_road_dir == "Right":
            diagonal_options = [(x + 1, y + 1), (x + 1, y - 1)]  # Right-Up, Right-Down
        elif my_road_dir == "Left":
            diagonal_options = [(x - 1, y + 1), (x - 1, y - 1)]  # Left-Up, Left-Down
        elif my_road_dir == "Up":
            diagonal_options = [(x + 1, y + 1), (x - 1, y + 1)]  # Up-Right, Up-Left
        elif my_road_dir == "Down":
            diagonal_options = [(x + 1, y - 1), (x - 1, y - 1)]  # Down-Right, Down-Left
        
        self.model.random.shuffle(diagonal_options)
        
        valid_alternatives = []
        for dx, dy in diagonal_options:
            if not (0 <= dx < self.model.width and 0 <= dy < self.model.height):
                continue
            
            diag_cell = self.model.grid[(dx, dy)]
            has_car, has_red, _, road_dir, _ = self.getCellInfo(diag_cell)
            
            if road_dir == my_road_dir and not has_car and not has_red:
                ahead = self.getCellAhead(diag_cell, my_road_dir)
                if ahead:
                    ahead_has_car, ahead_has_red, _, ahead_road_dir, _ = self.getCellInfo(ahead)
                    if not ahead_has_car and not ahead_has_red and ahead_road_dir == my_road_dir:
                        valid_alternatives.append(diag_cell)
                else:
                    valid_alternatives.append(diag_cell)
        
        if valid_alternatives:
            chosen = self.model.random.choice(valid_alternatives)
            return chosen
        
        return None
    
    def getCellAhead(self, cell, direction):
        """Get the cell directly ahead in the given direction."""
        x, y = cell.coordinate
        direction_map = {"Right": (1, 0), "Left": (-1, 0), "Up": (0, 1), "Down": (0, -1)}
        if direction not in direction_map:
            return None
        dx, dy = direction_map[direction]
        nx, ny = x + dx, y + dy
        if 0 <= nx < self.model.width and 0 <= ny < self.model.height:
            return self.model.grid[(nx, ny)]
        return None
    
    def detectLoop(self):
        if len(self.visited_positions) < 10:
            return False
        current_pos = self.cell.coordinate
        return sum(1 for pos in self.visited_positions if pos == current_pos) >= self.loop_detection_threshold
    
    def handleLoop(self):
        loop_cells = set(self.visited_positions)
        self.visited_positions.clear()
        self.calcPathAEstrella(avoid_cells=loop_cells)
    
    def tryEscapeJam(self):
        available = []
        for cell, _ in self.getVecinos(self.cell):
            has_car, has_red, _, _, _ = self.getCellInfo(cell)
            if has_car or has_red:
                continue
            move_dir = self.getDirectionBetweenCells(self.cell, cell)
            _, _, _, my_road_dir, _ = self.getCellInfo(self.cell)
            if my_road_dir and not self.isValidTurn(my_road_dir, move_dir):
                continue
            available.append(cell)
        
        if available:
            random_cell = self.model.random.choice(available)
            new_dir = self.getDirectionBetweenCells(self.cell, random_cell)
            self.nextDir = self.dirActual = self.last_direction = new_dir
            self.cell = random_cell
            self.steps_taken += 1
            self.calcPathAEstrella()
            self.tiempoEnEmbotellamiento = 0
            self.state = "Moving"
            self.has_recalculated_in_wait = False
            return True
        return False
    
    
    def step(self):
        if self.state == "AtDestination":
            self.model.totCarsArrived += 1
            self.model.totStepsTaken += self.steps_taken
            self.model.totSemaforosFound += self.semaforosFound
            self.model.embotellamientos += self.embotellamientosEncontrados
            self.remove()
            return
        
        if self.isMyDestination(self.cell):
            self.state = "AtDestination"
            self.nextDir = None
            return
        
        if self.detectLoop():
            self.state = "InLoop"
            self.handleLoop()
            self.tiempoEnEmbotellamiento = 0
            return
        
        self.last_state = self.state
        nextCell = self.getNextCell()
        
        if not nextCell:
            self.tiempoEnEmbotellamiento += 1
            
            if self.state in ["WaitingTraffic", "WaitingRedLight"]:
                lane_change_attempt = self.tryLaneChange(None)
                if lane_change_attempt:
                    self.state = "Moving"
                    self.tiempoEnEmbotellamiento = 0
                    self.has_recalculated_in_wait = False
                    self.moveToCell(lane_change_attempt, False)
                    return
            
            if self.tiempoEnEmbotellamiento >= self.paciencia:
                self.state = "Jammed"
                self.embotellamientosEncontrados += 1
                if self.model.random.random() <= self.probabilidadRomperEmbotellamiento:
                    if self.tryEscapeJam():
                        return
            else:
                self.state = "WaitingTraffic"
                self.embotellamientosEncontrados += 1
            return
        
        has_car, has_red, has_dest, _, has_tl = self.getCellInfo(nextCell)
        
        if has_dest and self.isMyDestination(nextCell):
            self.state = "Moving"
            self.tiempoEnEmbotellamiento = 0
            if not has_car:
                self.moveToCell(nextCell, has_tl)
            else:
                self.state = "WaitingTraffic"
            return
        
        if has_red:
            if self.state in ["Moving", "WaitingRedLight"]:
                lane_change_attempt = self.tryLaneChange(nextCell)
                if lane_change_attempt:
                    alt_has_car, alt_has_red, _, _, alt_has_tl = self.getCellInfo(lane_change_attempt)
                    if not alt_has_red and not alt_has_car:
                        self.state = "Moving"
                        self.tiempoEnEmbotellamiento = 0
                        self.has_recalculated_in_wait = False
                        self.moveToCell(lane_change_attempt, alt_has_tl)
                        return
            
            self.state = "WaitingRedLight"
            self.tiempoEnEmbotellamiento = 0
            return
        
        if has_car:
            if self.state in ["Moving", "WaitingTraffic"]:
                lane_change_attempt = self.tryLaneChange(nextCell)
                if lane_change_attempt:
                    alt_has_car, alt_has_red, _, _, alt_has_tl = self.getCellInfo(lane_change_attempt)
                    if not alt_has_car and not alt_has_red:
                        self.state = "Moving"
                        self.tiempoEnEmbotellamiento = 0
                        self.has_recalculated_in_wait = False
                        self.moveToCell(lane_change_attempt, alt_has_tl)
                        return
            
            self.tiempoEnEmbotellamiento += 1
            if self.tiempoEnEmbotellamiento >= self.paciencia:
                self.state = "Jammed"
                self.embotellamientosEncontrados += 1
                if self.model.random.random() <= self.probabilidadRomperEmbotellamiento:
                    if self.tryEscapeJam():
                        return
            else:
                self.state = "WaitingTraffic"
                self.embotellamientosEncontrados += 1
            return
        
        self.state = "Moving"
        self.tiempoEnEmbotellamiento = 0
        self.has_recalculated_in_wait = False
        self.moveToCell(nextCell, has_tl)
    
    def moveToCell(self, nextCell, has_tl):
        move_dir = self.getDirectionBetweenCells(self.cell, nextCell)
        self.dirActual = self.last_direction = move_dir
        self.fromPos = tuple(self.cell.coordinate)
        self.toPos = tuple(nextCell.coordinate)
        self.pathIndex += 1
        
        if self.path and self.pathIndex < len(self.path):
            future_cell = self.path[self.pathIndex]
            self.nextDir = self.getDirectionBetweenCells(nextCell, future_cell)
        else:
            self.nextDir = None
        
        if has_tl:
            self.semaforosFound += 1
        
        self.cell = nextCell
        self.steps_taken += 1
        self.visited_positions.append(nextCell.coordinate)

class Traffic_Light(FixedAgent):
    def __init__(self, model, cell, unique_id, state=False, timeToChange=10):
        super().__init__(model)
        self.cell = cell
        self.unique_id = unique_id
        self.state = state
        self.timeToChange = timeToChange

    def step(self):
        if self.model.steps % self.timeToChange == 0:
            self.state = not self.state


class Destination(FixedAgent):
    def __init__(self, model, cell, unique_id):
        super().__init__(model)
        self.cell = cell
        self.unique_id = unique_id


class Obstacle(FixedAgent):
    def __init__(self, model, cell, unique_id):
        super().__init__(model)
        self.cell = cell
        self.unique_id = unique_id


class Road(FixedAgent):
    def __init__(self, model, cell, unique_id, direction="Left"):
        super().__init__(model)
        self.cell = cell
        self.unique_id = unique_id
        self.direction = direction