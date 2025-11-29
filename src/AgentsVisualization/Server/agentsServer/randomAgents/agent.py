from mesa.discrete_space import CellAgent, FixedAgent
import heapq
import random
from collections import deque

class Car(CellAgent):
    
    def __init__(self, model, cell, unique_id, dest = None):
        super().__init__(model)
        self.cell = cell
        self.steps_taken = 0
        self.state = "Moving"
        self.last_direction = None 
        self.dest = dest
        self.path = []
        self.pathIndex = 0
        self.dirActual = None
        self.nextDir = None

        self.weightDist = 1.0
        self.weightCars = 5.0
        self.weightLights = 1.0
        
        self.semaforosFound = 0
        self.embotellamientosEncontrados = 0
        self.tiempoEnEmbotellamiento = 0
        
        self.paciencia = 5
        self.probabilidadRomperEmbotellamiento = 0.4
        
        self.last_state = "Moving"
        self.has_recalculated_in_wait = False

        self.visited_positions = deque(maxlen=20)
        self.loop_detection_threshold = 3
        self.in_loop = False

        if self.dest:
            self.calcPathAEstrella()
    
    def heuristica(self, cell1, cell2):
        """Distancia Manhattan entre dos celdas"""
        x1, y1 = cell1.coordinate
        x2, y2 = cell2.coordinate
        return abs(x2 - x1) + abs(y2 - y1)
    
    def isValidTurn(self, current_dir, next_dir):
        """Verifica que no sea U-turn (reversa)"""
        if not current_dir or not next_dir:
            return True
        opposites = {"Right": "Left", "Left": "Right", "Up": "Down", "Down": "Up"}
        return opposites.get(current_dir) != next_dir
    
    def getDirectionBetweenCells(self, from_cell, to_cell):
        """Calcula la dirección entre dos celdas adyacentes"""
        x1, y1 = from_cell.coordinate
        x2, y2 = to_cell.coordinate
        if x2 > x1: return "Right"
        if x2 < x1: return "Left"
        if y2 > y1: return "Up"
        if y2 < y1: return "Down"
        return None
    
    def getCellInfo(self, cell):
        """
        Obtiene información de una celda.
        Retorna: (has_car, has_red_light, has_destination, road_direction, has_traffic_light)
        """
        has_car = False
        has_red_light = False
        has_destination = False
        has_traffic_light = False
        road_direction = None
        
        for agent in cell.agents:
            if isinstance(agent, Car):
                has_car = True
            elif isinstance(agent, Traffic_Light):
                has_traffic_light = True
                if not agent.state:
                    has_red_light = True
            elif isinstance(agent, Destination):
                has_destination = True
            elif isinstance(agent, Road):
                road_direction = agent.direction
        
        return has_car, has_red_light, has_destination, road_direction, has_traffic_light
    
    def isMyDestination(self, cell):
        """Verifica si una celda es el destino del carro"""
        if not self.dest:
            return False
        dest_cell = self.dest.cell if hasattr(self.dest, 'cell') else self.dest
        return cell.coordinate == dest_cell.coordinate

    def getVecinos(self, cell, for_pathfinding=False):
        """
        Obtiene vecinos válidos para movimiento.
        Solo permite: adelante recto, diagonal adelante-izquierda, diagonal adelante-derecha
        NO permite movimientos laterales puros ni reversa.
        """
        neighbors = []
        x, y = cell.coordinate
        _, _, _, direccion, _ = self.getCellInfo(cell)
        
        if not direccion: 
            return neighbors
        
        # Movimientos posibles según dirección actual
        movimientos = {
            "Right": [
                ("Right", (x+1, y), False),
                ("Up", (x+1, y+1), True),
                ("Down", (x+1, y-1), True)
            ],
            "Left": [
                ("Left", (x-1, y), False),
                ("Down", (x-1, y-1), True),
                ("Up", (x-1, y+1), True)
            ],
            "Up": [
                ("Up", (x, y+1), False),
                ("Right", (x+1, y+1), True),
                ("Left", (x-1, y+1), True)
            ],
            "Down": [
                ("Down", (x, y-1), False),
                ("Left", (x-1, y-1), True),
                ("Right", (x+1, y-1), True)
            ]
        }
        
        if direccion not in movimientos:
            return neighbors
        
        opposites = {"Right": "Left", "Left": "Right", "Up": "Down", "Down": "Up"}
        
        for dir_name, (nx, ny), is_diagonal in movimientos[direccion]:
            # Verificar límites del grid
            if not (0 <= nx < self.model.width and 0 <= ny < self.model.height):
                continue
            
            nextCell = self.model.grid[(nx, ny)]
            _, _, has_dest, next_road_dir, has_tl = self.getCellInfo(nextCell)
            
            # Destinos siempre son válidos
            if has_dest:
                if for_pathfinding:
                    neighbors.append((nextCell, is_diagonal))
                elif self.isMyDestination(nextCell):
                    neighbors.append((nextCell, is_diagonal))
                continue
            
            # Debe haber road o semáforo
            if not (has_tl or next_road_dir):
                continue
            
            # Semáforos permiten cualquier dirección
            if has_tl:
                neighbors.append((nextCell, is_diagonal))
                continue
            
            # Validar movimiento según tipo
            if next_road_dir:
                # Rechazar contrasentido
                if dir_name == opposites.get(next_road_dir):
                    continue
                
                if not is_diagonal:
                    # Recto: debe coincidir exactamente
                    if dir_name == next_road_dir:
                        neighbors.append((nextCell, is_diagonal))
                else:
                    # Diagonal: validar compatibilidad
                    if self.isValidDiagonalMovement(direccion, dir_name, next_road_dir):
                        neighbors.append((nextCell, is_diagonal))
        
        return neighbors

    def isValidDiagonalMovement(self, from_dir, move_dir, to_dir):
        """
        Valida movimientos diagonales (adelante + giro).
        La celda destino puede apuntar en la dirección del giro O continuar la dirección original.
        """
        diagonal_rules = {
            ("Down", "Left"): ["Left", "Down"],
            ("Down", "Right"): ["Right", "Down"],
            ("Up", "Left"): ["Left", "Up"],
            ("Up", "Right"): ["Right", "Up"],
            ("Left", "Up"): ["Up", "Left"],
            ("Left", "Down"): ["Down", "Left"],
            ("Right", "Up"): ["Up", "Right"],
            ("Right", "Down"): ["Down", "Right"],
        }
        
        key = (from_dir, move_dir)
        valid_destinations = diagonal_rules.get(key, [])
        return to_dir in valid_destinations

    def detectLoop(self):
        """
        Detecta si el carro está en un loop (roundabout).
        Retorna True si visita la misma celda 3+ veces en las últimas 20 posiciones.
        """
        if len(self.visited_positions) < 10:
            return False
        
        current_pos = self.cell.coordinate
        count = sum(1 for pos in self.visited_positions if pos == current_pos)
        return count >= self.loop_detection_threshold

    def isStuckVsLoop(self):
        """
        Distingue entre estar atascado y estar en un loop.
        Retorna: "loop", "stuck", o "moving"
        """
        if self.detectLoop():
            return "loop"
        if self.tiempoEnEmbotellamiento >= self.paciencia:
            return "stuck"
        return "moving"

    def handleLoop(self):
        """
        Maneja cuando el carro está en un loop.
        Fuerza recalculación del path para salir del roundabout.
        """
        self.in_loop = True
        loop_cells = set(self.visited_positions)
        self.visited_positions.clear()
        self.calcPathAEstrella(avoid_cells=loop_cells)
        self.in_loop = False

    def calcPathAEstrella(self, avoid_cells=None):
        """
        Calcula el path óptimo usando A*.
        """
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
            
            for vecino, is_diagonal in self.getVecinos(actual, for_pathfinding=True):
                cost = self.weightDist
                
                has_car, _, _, _, has_tl = self.getCellInfo(vecino)
                if has_car:
                    cost += self.weightCars
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
        """Pre-calcula la siguiente dirección para el frontend"""
        if self.path and self.pathIndex < len(self.path):
            next_cell = self.path[self.pathIndex]
            self.nextDir = self.getDirectionBetweenCells(self.cell, next_cell)
        else:
            self.nextDir = None

    def shouldRecalculatePath(self):
        """Determina si debe recalcular el path"""
        if not self.path or self.pathIndex >= len(self.path):
            return True
        
        current_is_waiting = self.state in ["WaitingTraffic", "WaitingRedLight"]
        was_moving = self.last_state == "Moving"
        
        if current_is_waiting and was_moving and not self.has_recalculated_in_wait:
            return True
        
        return False

    def getNextCell(self):
        """Obtiene la siguiente celda válida para moverse"""
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
                
                if self.last_direction and not self.isValidTurn(self.last_direction, move_dir):
                    return None
                if road_dir and not self.isValidTurn(road_dir, move_dir):
                    return None
            
            return next_cell
        
        # Fallback: seguir dirección del road
        _, _, _, road_dir, _ = self.getCellInfo(self.cell)
        if not road_dir:
            road_dir = self.last_direction
        
        if not road_dir:
            return None
        
        direction_map = {
            "Right": (1, 0), "Left": (-1, 0),
            "Up": (0, 1), "Down": (0, -1)
        }
        
        if road_dir not in direction_map:
            return None
        
        x, y = self.cell.coordinate
        dx, dy = direction_map[road_dir]
        
        if 0 <= x + dx < self.model.width and 0 <= y + dy < self.model.height:
            return self.model.grid[(x + dx, y + dy)]
        return None

    def step(self):
        """Máquina de estados principal del carro"""
        # Estado terminal
        if self.state == "AtDestination":
            old_cell = self.cell
            self.model.totCarsArrived += 1
            self.model.totStepsTaken += self.steps_taken
            self.model.totSemaforosFound += self.semaforosFound
            self.model.embotellamientos += self.embotellamientosEncontrados
            
            if self in old_cell.agents:
                old_cell.agents.remove(self)
            if self in self.model.agents:
                self.model.agents.remove(self)
            
            self.cell = None
            self.nextDir = None
            return
        
        # Verificar si llegó al destino
        if self.isMyDestination(self.cell):
            self.state = "AtDestination"
            self.nextDir = None
            return 
        
        # Detectar loops
        stuck_status = self.isStuckVsLoop()
        
        if stuck_status == "loop":
            self.state = "InLoop"
            self.handleLoop()
            self.tiempoEnEmbotellamiento = 0
            return
        
        self.last_state = self.state
        nextCell = self.getNextCell()
        
        # Sin movimiento posible
        if not nextCell:
            if self.state not in ["WaitingTraffic", "Jammed"]:
                self.tiempoEnEmbotellamiento = 0
            
            self.tiempoEnEmbotellamiento += 1
            
            if self.tiempoEnEmbotellamiento >= self.paciencia:
                self.state = "Jammed"
                self.embotellamientosEncontrados += 1
                
                if random.random() <= self.probabilidadRomperEmbotellamiento:
                    available = []
                    for cell, _ in self.getVecinos(self.cell, for_pathfinding=False):
                        has_car, has_red, _, _, _ = self.getCellInfo(cell)
                        if has_car or has_red:
                            continue
                        
                        move_dir = self.getDirectionBetweenCells(self.cell, cell)
                        _, _, _, my_road_dir, _ = self.getCellInfo(self.cell)
                        if my_road_dir and not self.isValidTurn(my_road_dir, move_dir):
                            continue
                        
                        available.append(cell)
                    
                    if available:
                        random_cell = random.choice(available)
                        newDir = self.getDirectionBetweenCells(self.cell, random_cell)
                        self.dirActual = newDir
                        self.last_direction = newDir
                        self.nextDir = newDir
                        self.cell = random_cell
                        self.steps_taken += 1
                        self.calcPathAEstrella()
                        self.tiempoEnEmbotellamiento = 0
                        self.state = "Moving"
                        self.has_recalculated_in_wait = False
                        return
            else:
                self.state = "WaitingTraffic"
                self.embotellamientosEncontrados += 1
            
            return
        
        has_car, has_red, has_dest, _, has_tl = self.getCellInfo(nextCell)
        
        # Intentar llegar al destino
        if has_dest and self.isMyDestination(nextCell):
            self.state = "Moving"
            self.tiempoEnEmbotellamiento = 0
            
            if not has_car:
                self.dirActual = self.getDirectionBetweenCells(self.cell, nextCell)
                self.last_direction = self.dirActual
                self.nextDir = None
                if has_tl:
                    self.semaforosFound += 1
                self.cell = nextCell
                self.steps_taken += 1
                self.pathIndex += 1
                self.visited_positions.append(nextCell.coordinate)
                self.updateNextDirection()
                self.has_recalculated_in_wait = False
            else:
                self.state = "WaitingTraffic"
            return
        
        # Semáforo en rojo
        if has_red:
            self.state = "WaitingRedLight"
            self.tiempoEnEmbotellamiento = 0
            return
        
        # Carro bloqueando
        if has_car:
            if self.state not in ["WaitingTraffic", "Jammed"]:
                self.tiempoEnEmbotellamiento = 0
            
            self.tiempoEnEmbotellamiento += 1
            
            if self.tiempoEnEmbotellamiento >= self.paciencia:
                self.state = "Jammed"
                self.embotellamientosEncontrados += 1
                
                if random.random() <= self.probabilidadRomperEmbotellamiento:
                    available = []
                    for cell, _ in self.getVecinos(self.cell, for_pathfinding=False):
                        c_has_car, c_has_red, _, _, _ = self.getCellInfo(cell)
                        if c_has_car or c_has_red:
                            continue
                        
                        move_dir = self.getDirectionBetweenCells(self.cell, cell)
                        _, _, _, my_road_dir, _ = self.getCellInfo(self.cell)
                        if my_road_dir and not self.isValidTurn(my_road_dir, move_dir):
                            continue
                        available.append(cell)
                    
                    if available:
                        random_cell = random.choice(available)
                        newDir = self.getDirectionBetweenCells(self.cell, random_cell)
                        self.dirActual = newDir
                        self.last_direction = newDir
                        self.nextDir = newDir
                        self.cell = random_cell
                        self.steps_taken += 1
                        self.calcPathAEstrella()
                        self.tiempoEnEmbotellamiento = 0
                        self.state = "Moving"
                        self.has_recalculated_in_wait = False
                        return
            else:
                self.state = "WaitingTraffic"
                self.embotellamientosEncontrados += 1
            return
        
        self.state = "Moving"
        self.tiempoEnEmbotellamiento = 0
        self.has_recalculated_in_wait = False
        
        newDir = self.getDirectionBetweenCells(self.cell, nextCell)
        self.dirActual = newDir
        self.last_direction = newDir
        
        if has_tl:
            self.semaforosFound += 1
        
        self.cell = nextCell
        self.steps_taken += 1
        self.pathIndex += 1
        self.visited_positions.append(nextCell.coordinate)
        self.updateNextDirection()


class Traffic_Light(FixedAgent):
    def __init__(self, model, cell, state = False, timeToChange = 10):
        super().__init__(model)
        self.cell = cell
        self.state = state
        self.timeToChange = timeToChange

    def step(self):
        if self.model.steps % self.timeToChange == 0:
            self.state = not self.state


class Destination(FixedAgent):
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell
    
    def step(self):
        pass


class Obstacle(FixedAgent):
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell
    
    def step(self):
        pass


class Road(FixedAgent):
    def __init__(self, model, cell, direction= "Left"):
        super().__init__(model)
        self.cell = cell
        self.direction = direction

    def step(self):
        pass