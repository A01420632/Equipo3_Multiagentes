from mesa.discrete_space import CellAgent, FixedAgent
import heapq

class Car(CellAgent):
    
    def __init__(self, model, cell, unique_id, dest = None):
        """
        Creates a new car agent.
        Args:
            model: Model reference for the agent
            cell: Reference to its position within the grid
            unique_id: The agent's ID
        """
        super().__init__(model)
        self.cell = cell
        self.steps_taken = 0
        self.state = "Moving"
        self.last_direction = None 
        self.dest = dest
        self.path = []
        self.pathIndex = 0

        self.weightDist = 1.0
        self.weightCars = 3.0
        self.weightLights = 2.0
        
        # Supermetricas
        self.traffic_lights_encountered = 0
        self.times_waited_in_traffic = 0

        if self.dest:
            print(f"Car {self.unique_id} calculating path to destination at {self.dest.coordinate}")
            self.calcPathAEstrella()
    
    def heuristica(self,cell1,cell2):
        x1,y1 = cell1.coordinate
        x2,y2 = cell2.coordinate
        return (abs(x2-x1)+abs(y2-y1)) 
    
    def getCost(self,cell):
        cost = 0
        for agent in cell.agents: 
            if isinstance(agent,Car): 
                cost += self.weightCars
            if isinstance(agent, Traffic_Light):
                cost += self.weightLights
        return cost
    
    def getDirectionBetweenCells(self, from_cell, to_cell):
        x1, y1 = from_cell.coordinate
        x2, y2 = to_cell.coordinate
        if x2 > x1:
            return "Right"
        elif x2 < x1:
            return "Left"
        elif y2 > y1:
            return "Up"
        elif y2 < y1:
            return "Down"
        return None
    
    def isValidTurn(self, current_direction, next_direction):
        if not current_direction or not next_direction:
            return True
        opposites = {
            "Right": "Left",
            "Left": "Right",
            "Up": "Down",
            "Down": "Up"
        }
        
        if opposites.get(current_direction) == next_direction:
            return False
        
        return True
    
    def canEnterCell(self, from_cell, to_cell):
        move_direction = self.getDirectionBetweenCells(from_cell, to_cell)
        
        current_direction = None
        for agent in from_cell.agents:
            if isinstance(agent, Road):
                current_direction = agent.direction
                break
        
        if current_direction and not self.isValidTurn(current_direction, move_direction):
            return False
        
        next_road_direction = None
        has_traffic_light = False
        
        for agent in to_cell.agents:
            if isinstance(agent, Road):
                next_road_direction = agent.direction
            if isinstance(agent, Traffic_Light):
                has_traffic_light = True
        
        if has_traffic_light:
            return True
        
        if any(isinstance(agent, Destination) for agent in to_cell.agents):
            return True
        
        if next_road_direction:
            opposites = {
                "Right": "Left",
                "Left": "Right",
                "Up": "Down",
                "Down": "Up"
            }
            
            if move_direction == opposites.get(next_road_direction):
                return False
        
        return True

    def getVecinos(self, cell):
        """Get valid neighboring cells respecting traffic rules"""
        neighbors = []
        x, y = cell.coordinate
        
        current_direction = None
        has_traffic_light = False
        is_destination = False
        
        for agent in cell.agents:
            if isinstance(agent, Road):
                current_direction = agent.direction
            if isinstance(agent, Traffic_Light):
                has_traffic_light = True
            if isinstance(agent, Destination):
                is_destination = True
    
        direction_offsets = {
            "Right": (x+1, y),
            "Left": (x-1, y),
            "Up": (x, y+1),
            "Down": (x, y-1)
        }
        
        for direction_name, nextPos in direction_offsets.items():
            try:
                nextCell = self.model.grid[nextPos]
                has_road = any(isinstance(obj, (Road, Traffic_Light, Destination)) for obj in nextCell.agents)
                
                if not has_road:
                    continue
                if current_direction and not self.isValidTurn(current_direction, direction_name):
                    continue
                if self.canEnterCell(cell, nextCell):
                    neighbors.append(nextCell)                
            except:
                pass
        return neighbors

    def calcPathAEstrella(self):
        if not self.dest:
            print(f"Car {self.unique_id}: no dest")
            self.path = []
            return
        dest_cell = self.dest.cell if hasattr(self.dest, 'cell') else self.dest 
        
        print(f"Car {self.unique_id}: Calculating path from {self.cell.coordinate} to {dest_cell.coordinate}")
        start = self.cell
        cont = 0
        open_set = []
        heapq.heappush(open_set, (0, cont, start))
        cont += 1
        provenencia = {}
        gScore = {start: 0}
        fScore = {start: self.heuristica(start, dest_cell)}
        openSetHash = {start}
        
        iterations = 0
        max_iterations = 10000

        while open_set and iterations < max_iterations:
            iterations += 1
            actual = heapq.heappop(open_set)[2]
            openSetHash.remove(actual)
            if actual.coordinate == dest_cell.coordinate:
                self.path = []
                while actual in provenencia: 
                    self.path.append(actual)
                    actual = provenencia[actual]
                self.path.reverse()
                self.pathIndex = 0
                print(f"Car {self.unique_id} found path with {len(self.path)} steps (explored {iterations} nodes)")
                return
            
            vecinos = self.getVecinos(actual)
            """
            if iterations < 5:
                print(f"  Iteration {iterations}: at {actual.coordinate}, found {len(vecinos)} neighbors")
            """
            for vecino in vecinos:
                movimientoCosto = self.weightDist + self.getCost(vecino)
                scoreGTemp = gScore[actual] + movimientoCosto
                if vecino not in gScore or scoreGTemp < gScore[vecino]:
                    provenencia[vecino] = actual
                    gScore[vecino] = scoreGTemp
                    fScore[vecino] = scoreGTemp + self.heuristica(vecino, dest_cell)
                    if vecino not in openSetHash:
                        heapq.heappush(open_set, (fScore[vecino], cont, vecino))
                        cont += 1
                        openSetHash.add(vecino)
    
        print(f"Car {self.unique_id}: NO PATH FOUND after {iterations} iterations")
        print(f"Car {self.unique_id}: Start={self.cell.coordinate}, Dest={dest_cell.coordinate}")
        self.path = []

    def getValidDirections(self, current_cell):
        if self.path and self.pathIndex < len(self.path):
            next_in_path = self.path[self.pathIndex]    
            has_traffic_light = any(isinstance(agent, Traffic_Light) for agent in current_cell.agents)
            
            if has_traffic_light:
                road_direction = None
                for agent in current_cell.agents:
                    if isinstance(agent, Road):
                        road_direction = agent.direction
                        break 
                move_direction = self.getDirectionBetweenCells(current_cell, next_in_path)
                if self.last_direction:
                    if not self.isValidTurn(self.last_direction, move_direction):
                        print(f"Car {self.unique_id} blocked from sideways movement at traffic light")
                        return []
                if road_direction and move_direction:
                    if not self.isValidTurn(road_direction, move_direction):
                        return []
            
            print(f"Car {self.unique_id} following A* path: step {self.pathIndex}/{len(self.path)} to {next_in_path.coordinate}")
            return [next_in_path]
        
        if self.dest and (not self.path or self.pathIndex >= len(self.path)):
            print(f"Car {self.unique_id} recalculating path...")
            self.calcPathAEstrella()
            if self.path and self.pathIndex < len(self.path):
                next_in_path = self.path[self.pathIndex]
                has_traffic_light = any(isinstance(agent, Traffic_Light) for agent in current_cell.agents)
                if has_traffic_light and self.last_direction:
                    move_direction = self.getDirectionBetweenCells(current_cell, next_in_path)
                    if not self.isValidTurn(self.last_direction, move_direction):
                        print(f"Car {self.unique_id} blocked from sideways movement at traffic light (new path)")
                        return []
                
                return [next_in_path]
        
        print(f"Car {self.unique_id} using fallback road following")
        road = None
        for agent in current_cell.agents:
            if isinstance(agent, Road):
                road = agent
                self.last_direction = road.direction
                break
        if not road and self.last_direction:
            direction = self.last_direction
        elif road:
            direction = road.direction
        else:
            return []
        
        x, y = current_cell.coordinate
        
        directionMap = {
            "Right": (1, 0),
            "Left": (-1, 0),
            "Up": (0, 1),
            "Down": (0, -1)
        }
        
        if direction not in directionMap:
            return []
        dx, dy = directionMap[direction]
        nextPos = (x + dx, y + dy)
        try:
            next = self.model.grid[nextPos]
            return [next]
        except:
            return []

    def checkNextCell(self):
        valid_cells = self.getValidDirections(self.cell)
        if not valid_cells:
            print(f"Car {self.unique_id} at {self.cell.coordinate} has no valid directions")
            return None, "WaitingTraffic"
        
        nextCell = valid_cells[0]
        has_valid_destination = any(
            isinstance(obj, (Road, Traffic_Light, Destination)) 
            for obj in nextCell.agents
        )
        
        if not has_valid_destination:
            return None, "WaitingTraffic"
        
        has_destination = any(isinstance(obj, Destination) for obj in nextCell.agents)
        if has_destination:
            return nextCell, "AtDestination"
        
        for agent in nextCell.agents:
            if isinstance(agent, Traffic_Light):
                if not agent.state:  # Rojo
                    return None, "WaitingRedLight"
        
        for agent in nextCell.agents:
            if isinstance(agent, Car):
                if agent.state in ["WaitingRedLight", "WaitingTraffic"]:
                    return None, "WaitingTraffic"
        
        has_car = any(isinstance(obj, Car) for obj in nextCell.agents)
        if has_car:
            return None, "WaitingTraffic"
        
        return nextCell, "Moving"
    
    def transitionState(self, newState):
        if self.state != newState:
            print(f"Car {self.unique_id} at {self.cell.coordinate}: {self.state} -> {newState}")
            
            if newState in ["WaitingTraffic", "WaitingRedLight"]:
                self.times_waited_in_traffic += 1
            
            self.state = newState

    def update(self):
        nextCell, newState = self.checkNextCell()
        
        if newState == "AtDestination" and nextCell:
            print(f"Car {self.unique_id} reached destination at {nextCell.coordinate}")
            old_cell = self.cell
            
            self.model.total_cars_arrived += 1
            self.model.total_steps_to_destination += self.steps_taken
            self.model.total_traffic_lights_encountered += self.traffic_lights_encountered
            
            print(f"Car {self.unique_id} stats: Steps={self.steps_taken}, Traffic Lights={self.traffic_lights_encountered}, Waited={self.times_waited_in_traffic} times")
            
            self.cell = nextCell
            self.transitionState("AtDestination")
            
            if self in old_cell.agents:
                old_cell.agents.remove(self)
            if self in nextCell.agents:
                nextCell.agents.remove(self)
            
            if self in self.model.agents:
                self.model.agents.remove(self)
            
            
            self.cell = None
            
            print(f"Car {self.unique_id} removed from simulation")
            return
        
        if newState == "Moving" and nextCell:
            old_pos = self.cell.coordinate
            self.last_direction = self.getDirectionBetweenCells(self.cell, nextCell)
            
            has_traffic_light = any(isinstance(agent, Traffic_Light) for agent in nextCell.agents)
            if has_traffic_light:
                self.traffic_lights_encountered += 1
            
            self.cell = nextCell 
            self.steps_taken += 1
            self.pathIndex += 1
            self.transitionState("Moving")
            print(f"Car {self.unique_id} moved from {old_pos} to {self.cell.coordinate}")
        else:
            self.transitionState(newState)

    def step(self):
        self.update()


class Traffic_Light(FixedAgent):
    """
    Traffic light. Where the traffic lights are in the grid.
    """
    def __init__(self, model, cell, state = False, timeToChange = 10):
        super().__init__(model)
        self.cell = cell
        self.state = state
        self.timeToChange = timeToChange

    def step(self):
        if self.model.steps % self.timeToChange == 0:
            self.state = not self.state
            print(f"Traffic light at {self.cell.coordinate} changed to {'GREEN' if self.state else 'RED'}")


class Destination(FixedAgent):
    """
    Destination agent. Where each car should go.
    """
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell
    def step(self):
        pass


class Obstacle(FixedAgent):
    """
    Obstacle agent. Just to add obstacles to the grid.
    """
    def __init__(self, model, cell):
        super().__init__(model)
        self.cell = cell
    def step(self):
        pass


class Road(FixedAgent):
    """
    Road agent. Determines where the cars can move, and in which direction.
    """
    def __init__(self, model, cell, direction= "Left"):
        super().__init__(model)
        self.cell = cell
        self.direction = direction

    def step(self):
        pass
