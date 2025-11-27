from mesa.discrete_space import CellAgent, FixedAgent
import heapq
import random

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
        self.dirActual  = None

        self.weightDist = 1.0
        self.weightCars = 3.0
        self.weightLights = 2.0
        
        self.semaforosFound = 0
        self.embotellamientosEncontrados = 0
        self.tiempoEnEmbotellamiento = 0
        
        self.paciencia = 3
        self.probabilidadRomperEmbotellamiento = 0.3
        self.steps_since_last_recalc = 0
        self.recalc_interval = 5

        if self.dest:
            self.calcPathAEstrella()
    
    def heuristica(self, cell1, cell2):
        """Distancia Manhattan"""
        x1, y1 = cell1.coordinate
        x2, y2 = cell2.coordinate
        return abs(x2 - x1) + abs(y2 - y1)
    
    def isValidTurn(self, current_dir, next_dir):
        """Verifica que no sea U-turn"""
        if not current_dir or not next_dir:
            return True
        opposites = {"Right": "Left", "Left": "Right", "Up": "Down", "Down": "Up"}
        return opposites.get(current_dir) != next_dir
    
    def getDirectionBetweenCells(self, from_cell, to_cell):
        """Calcula dirección entre dos celdas"""
        x1, y1 = from_cell.coordinate
        x2, y2 = to_cell.coordinate
        if x2 > x1: return "Right"
        if x2 < x1: return "Left"
        if y2 > y1: return "Up"
        if y2 < y1: return "Down"
        return None
    
    def getCellInfo(self, cell):
        """
        UNA SOLA pasada por los agentes de una celda.
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

    def getVecinos(self, cell):
        """
        Obtiene vecinos válidos con movimiento diagonal.
        Solo permite: adelante, adelante-izquierda diagonal, adelante-derecha diagonal
        """
        neighbors = []
        x, y = cell.coordinate
        _, _, _, direccion, _ = self.getCellInfo(cell)
        
        if not direccion: 
            return neighbors
        
        movimientos = {
            "Right": [
                ("Right", (x+1, y)),
                ("Up", (x+1, y+1)),
                ("Down", (x+1, y-1))
            ], 
            "Left": [
                ("Left", (x-1, y)),
                ("Down", (x-1, y-1)),
                ("Up", (x-1, y+1))
            ],
            "Up": [
                ("Up", (x, y+1)),
                ("Right", (x+1, y+1)),
                ("Left", (x-1, y+1))
            ],
            "Down": [
                ("Down", (x, y-1)),
                ("Left", (x-1, y-1)),
                ("Right", (x+1, y-1))
            ]
        }
        
        if direccion not in movimientos:
            return neighbors
        
        permitidos = movimientos[direccion]
        
        for dir_name, (nx, ny) in permitidos:
            # Bounds check
            if not (0 <= nx < self.model.width and 0 <= ny < self.model.height):
                continue
            
            try:
                nextCell = self.model.grid[(nx, ny)]
                _, _, has_dest, next_road_dir, has_tl = self.getCellInfo(nextCell)
                
                # Debe haber road, traffic light o destination
                if not (has_dest or has_tl or next_road_dir):
                    continue
                
                # Si es destino o semáforo, siempre permitir
                if has_tl or has_dest:
                    neighbors.append(nextCell)
                    continue
                
                # Validar que no sea contra-sentido
                if next_road_dir:
                    opposites = {
                        "Right": "Left", 
                        "Left": "Right", 
                        "Up": "Down", 
                        "Down": "Up"
                    }
                    # Si el movimiento es opuesto a la dirección de la calle, rechazar
                    if dir_name == opposites.get(next_road_dir):
                        continue
            
                neighbors.append(nextCell)
            except:
                pass
        
        return neighbors


    def calcPathAEstrella(self):
        """A* optimizado"""
        if not self.dest:
            self.path = []
            return
        
        dest_cell = self.dest.cell if hasattr(self.dest, 'cell') else self.dest
        start = self.cell
        
        open_set = [(0, 0, start)]
        provenencia = {}
        gScore = {start: 0}
        fScore = {start: self.heuristica(start, dest_cell)}
        openSetHash = {start}
        cont = 1
        
        for _ in range(10000):  # Maximo
            if not open_set:
                break
            
            _, _, actual = heapq.heappop(open_set)
            openSetHash.remove(actual)
            
            if actual.coordinate == dest_cell.coordinate:
                # Reconstruir path
                self.path = []
                while actual in provenencia:
                    self.path.append(actual)
                    actual = provenencia[actual]
                self.path.reverse()
                self.pathIndex = 0
                self.steps_since_last_recalc = 0
                return
            
            for vecino in self.getVecinos(actual):
                # Calcular costo
                cost = self.weightDist
                has_car, _, _, _, has_tl = self.getCellInfo(vecino)
                if has_car:
                    cost += self.weightCars
                if has_tl:
                    cost += self.weightLights
                
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
        self.steps_since_last_recalc = 0

    def shouldRecalculatePath(self):
        """Determina si recalcular A*"""
        return (
            self.steps_since_last_recalc >= self.recalc_interval or
            self.state in ["WaitingTraffic", "Jammed", "WaitingRedLight"] or
            not self.path or
            self.pathIndex >= len(self.path)
        )

    def getNextCell(self):
        """
        Obtiene la siguiente celda válida.
        Retorna: (nextCell, should_recalc) o (None, False)
        """
        if self.dest and self.shouldRecalculatePath():
            self.calcPathAEstrella()
        
        if self.path and self.pathIndex < len(self.path):
            next_cell = self.path[self.pathIndex]
            
            _, _, _, _, has_tl = self.getCellInfo(self.cell)
            if has_tl:
                move_dir = self.getDirectionBetweenCells(self.cell, next_cell)
                _, _, _, road_dir, _ = self.getCellInfo(self.cell)
                
                if self.last_direction and not self.isValidTurn(self.last_direction, move_dir):
                    return None, False
                if road_dir and not self.isValidTurn(road_dir, move_dir):
                    return None, False
            
            return next_cell, False
        
        _, _, _, road_dir, _ = self.getCellInfo(self.cell)
        if not road_dir:
            road_dir = self.last_direction
        
        if not road_dir:
            return None, False
        
        direction_map = {
            "Right": (1, 0), "Left": (-1, 0),
            "Up": (0, 1), "Down": (0, -1)
        }
        
        if road_dir not in direction_map:
            return None, False
        
        x, y = self.cell.coordinate
        dx, dy = direction_map[road_dir]
        try:
            return self.model.grid[(x + dx, y + dy)], False
        except:
            return None, False

    def step(self):
        """
        FSM completo en un solo método - sin llamadas recursivas.
        Orden: Check destino → Obtener next → Actualizar estado → Ejecutar acción
        """
        if self.state == "AtDestination":
            # Cleanup
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
            return
        
        _, _, at_dest, _, _ = self.getCellInfo(self.cell)
        if at_dest:
            self.state = "AtDestination"
            return 
        
        nextCell, _ = self.getNextCell()
        
        if not nextCell:
            if self.state not in ["WaitingTraffic", "Jammed"]:
                self.tiempoEnEmbotellamiento = 0
            
            self.tiempoEnEmbotellamiento += 1
            
            if self.tiempoEnEmbotellamiento >= self.paciencia:
                self.state = "Jammed"
                self.embotellamientosEncontrados += 1
                
                if random.random() <= self.probabilidadRomperEmbotellamiento:
                    available = []
                    for cell in self.getVecinos(self.cell):
                        has_car, has_red, _, current_dir, _ = self.getCellInfo(cell)
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
                        self.cell = random_cell
                        self.steps_taken += 1
                        self.calcPathAEstrella()
                        self.tiempoEnEmbotellamiento = 0
                        return
                
                self.steps_since_last_recalc += 1
            else:
                self.state = "WaitingTraffic"
                self.embotellamientosEncontrados += 1
                self.steps_since_last_recalc += 1
            
            return
        has_car, has_red, has_dest, _, has_tl = self.getCellInfo(nextCell)
        
        if has_dest:
            self.state = "Moving"
            self.tiempoEnEmbotellamiento = 0
            if not has_car:
                self.dirActual = self.getDirectionBetweenCells(self.cell, nextCell)
                self.last_direction = self.dirActual
                if has_tl:
                    self.semaforosFound += 1
                self.cell = nextCell
                self.steps_taken += 1
                self.pathIndex += 1
                self.steps_since_last_recalc += 1
            return
        
        if has_red:
            self.state = "WaitingRedLight"
            self.tiempoEnEmbotellamiento = 0
            self.steps_since_last_recalc += 1
            return
        
        if has_car:
            if self.state not in ["WaitingTraffic", "Jammed"]:
                self.tiempoEnEmbotellamiento = 0
            
            self.tiempoEnEmbotellamiento += 1
            
            if self.tiempoEnEmbotellamiento >= self.paciencia:
                self.state = "Jammed"
                self.embotellamientosEncontrados += 1
                
                if random.random() <= self.probabilidadRomperEmbotellamiento:
                    available = []
                    for cell in self.getVecinos(self.cell):
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
                        self.cell = random_cell
                        self.steps_taken += 1
                        self.calcPathAEstrella()
                        self.tiempoEnEmbotellamiento = 0
                        return
                
                self.steps_since_last_recalc += 1
            else:
                self.state = "WaitingTraffic"
                self.embotellamientosEncontrados += 1
                self.steps_since_last_recalc += 1
            return
        
        self.state = "Moving"
        self.tiempoEnEmbotellamiento = 0
        newDir = self.getDirectionBetweenCells(self.cell, nextCell)
        self.dirActual = newDir
        self.last_direction = newDir
        
        if has_tl:
            self.semaforosFound += 1
        
        self.cell = nextCell
        self.steps_taken += 1
        self.pathIndex += 1
        self.steps_since_last_recalc += 1


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