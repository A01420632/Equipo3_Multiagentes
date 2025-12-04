"""
Multi-Agent Traffic Simulation - City Model
Authors: Mauricio Monroy, Diego De la Vega

Purpose: Implements the main city model for the traffic simulation system.
This module creates a grid-based city environment populated with roads, traffic lights,
obstacles, and destinations. It manages car spawning, pathfinding using A* algorithm,
and simulation step progression while collecting performance metrics.

Date: December 2025
"""

from random import shuffle
from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid
from .agent import Car, Traffic_Light, Destination, Obstacle, Road
import json
import os
import mesa

class CityModel(Model):
    """
    Main model class for the traffic simulation.
    
    Manages the grid-based city environment, agent spawning, pathfinding,
    and simulation progression. Uses A* pathfinding with direction-aware
    movement costs to simulate realistic traffic flow.
    """

    def __init__(self, N, seed=42, spawnSteps=10):
        """
        Initialize the city model.
        
        Args:
            N: Target number of agents (not actively used in current implementation)
            seed: Random seed for reproducibility
            spawnSteps: Number of steps between car spawning cycles
        """
        super().__init__(seed=seed)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Load map symbol dictionary
        dict_path = os.path.join(base_dir, "city_files", "mapDictionary.json")
        with open(dict_path, 'r') as f:
            dataDictionary = json.load(f)

        # Initialize agent collections
        self.num_agents = N
        self.traffic_lights = []
        self.destinations = []
        self.roads = []
        self.spawnSteps = spawnSteps
        self.carsSpawnedThisStep = 0

        # Simulation metrics tracking
        self.carCounter = 0
        self.totCarsSpawned = 0
        self.totCarsArrived = 0
        self.totStepsTaken = 0
        self.totSemaforosFound = 0
        self.carsEnTrafico = 0
        self.embotellamientos = 0
        
        # Per-step metrics
        self.cars_arrived_this_step = 0
        self.traffic_jams_this_step = 0
        self.prev_embotellamientos = 0
        
        self.agent_id_counter = 0

        # Configure data collection for analysis
        self.datacollector = mesa.DataCollector(
            model_reporters={
                "Active Cars": lambda m: self.countActiveCars(m),
                "Total Cars Arrived": lambda m: m.totCarsArrived,
                "Cars Arrived This Step": lambda m: m.cars_arrived_this_step,
                "Traffic Jams This Step": lambda m: m.traffic_jams_this_step,
                "Total Steps Taken": lambda m: m.totStepsTaken,
                "Total Semaphores Found": lambda m: m.totSemaforosFound,
                "Traffic Jams": lambda m: m.embotellamientos,
                "Average Steps Per Car": lambda m: m.totStepsTaken / m.totCarsArrived if m.totCarsArrived > 0 else 0,
            },
            agent_reporters={
                "State": "state",
                "Steps Taken": "steps_taken",
            }
        )

        # Load and parse the city map file
        map_path = os.path.join(base_dir, "city_files", "2025_base.txt")
        with open(map_path) as baseFile:
            lines = baseFile.readlines()
            lines = [line.strip() for line in lines]
            self.width = len(lines[0])
            self.height = len(lines)

            # Create grid with Moore neighborhood (8 adjacent cells)
            self.grid = OrthogonalMooreGrid(
                [self.width, self.height], capacity=100, torus=False
            )
            
            # Parse map and create agents based on symbols
            for r, row in enumerate(lines):
                for c, col in enumerate(row):
                    # Convert row coordinate (top-to-bottom becomes bottom-to-top)
                    cell_pos = (c, self.height - r - 1)
                    
                    # Boundary check
                    if c >= self.width or (self.height - r - 1) >= self.height:
                        continue
                    
                    cell = self.grid[cell_pos]
                    
                    # Create appropriate agent based on map symbol
                    if col in ["v", "^", ">", "<"]:
                        # Directional road
                        agent = Road(self, cell, self.getUniqueId(), dataDictionary[col])
                        self.roads.append(agent)
                    elif col in ["S", "s"]:
                        # Traffic light (S=slow cycle, s=fast cycle)
                        agent = Traffic_Light(
                            self,
                            cell,
                            self.getUniqueId(),
                            False if col == "S" else True,
                            int(dataDictionary[col]),
                        )
                        self.traffic_lights.append(agent)
                    elif col == "#":
                        # Obstacle (building)
                        agent = Obstacle(self, cell, self.getUniqueId())
                    elif col == "D":
                        # Destination point
                        agent = Destination(self, cell, self.getUniqueId())
                        self.destinations.append(agent) 
        
        self.running = True
    
    def getUniqueId(self):
        """
        Generate a sequential unique identifier for agents.
        
        Returns:
            int: Unique agent ID
        """
        uid = self.agent_id_counter
        self.agent_id_counter += 1
        return uid

    def heuristic(self, pos1, pos2):
        """
        Calculate Manhattan distance heuristic for A* pathfinding.
        
        Args:
            pos1: Starting position (x, y)
            pos2: Target position (x, y)
            
        Returns:
            int: Manhattan distance between positions
        """
        return abs(pos1[0] - pos2[0]) + abs(pos1[1] - pos2[1])

    def isValidRoad(self, pos):
        """
        Check if a position contains a valid road element.
        
        A valid road is any cell containing a Road, Traffic_Light, or Destination
        agent, and no Obstacle agents.
        
        Args:
            pos: Position to check (x, y)
            
        Returns:
            bool: True if position is a valid road
        """
        # Boundary check
        if not (0 <= pos[0] < self.width and 0 <= pos[1] < self.height):
            return False
        
        cell = self.grid[pos]
        agentsInCell = list(cell.agents)
        
        # Obstacles block roads
        if any(isinstance(agent, Obstacle) for agent in agentsInCell):
            return False
        
        # Must contain road infrastructure
        return any(isinstance(agent, (Road, Traffic_Light, Destination)) 
                for agent in agentsInCell)

    def getRoadDirection(self, pos):
        """
        Determine the traffic flow direction at a given position.
        
        Checks for Road agents first, then infers direction from nearby roads
        for traffic lights and destinations. Always returns a specific direction,
        never "All".
        
        Args:
            pos: Position to check (x, y)
            
        Returns:
            str: Direction string ("Right", "Left", "Up", "Down") or None
        """
        if not (0 <= pos[0] < self.width and 0 <= pos[1] < self.height):
            return None
        
        cell = self.grid[pos]
        agentsInCell = list(cell.agents)
        
        # Direct road direction check
        for agent in agentsInCell:
            if isinstance(agent, Road):
                return agent.direction
        
        # Infer direction for traffic lights and destinations from adjacent roads
        if any(isinstance(agent, (Traffic_Light, Destination)) for agent in agentsInCell):
            directions = []
            # Check all 4 adjacent cells
            for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
                checkPos = (pos[0] + dx, pos[1] + dy)
                if (0 <= checkPos[0] < self.width and 
                    0 <= checkPos[1] < self.height):
                    checkCell = self.grid[checkPos]
                    for agent in checkCell.agents:
                        if isinstance(agent, Road):
                            directions.append(agent.direction)
            
            if directions:
                # Return most common direction among neighbors
                return max(set(directions), key=directions.count)
            
            # Default fallback
            return "Right"
        
        return "Right"

    def isMoveAllowedByRoad(self, currentPos, nextPos):
        """
        Verify if a movement respects the road's directional flow.
        
        Allows forward and diagonal-forward movements but blocks moving
        directly backwards against traffic flow.
        
        Args:
            currentPos: Current position (x, y)
            nextPos: Target position (x, y)
            
        Returns:
            bool: True if movement is allowed
        """
        currentDirection = self.getRoadDirection(currentPos)
        
        if not currentDirection:
            return True
        
        # Calculate movement vector
        dx = nextPos[0] - currentPos[0]
        dy = nextPos[1] - currentPos[1]
        
        # Check against traffic flow direction
        if currentDirection == "Right":
            return dx >= 0
        elif currentDirection == "Left":
            return dx <= 0
        elif currentDirection == "Up":
            return dy >= 0
        elif currentDirection == "Down":
            return dy <= 0
        
        return True

    def getAllowedMoves(self, pos, direction):
        """
        Get list of allowed movements from a position based on road direction.
        
        Returns straight moves and diagonal moves (for lane changes) with
        appropriate movement costs. Diagonal moves cost more (1.4 vs 1.0)
        to represent the longer distance.
        
        Args:
            pos: Current position (x, y)
            direction: Current road direction
            
        Returns:
            list: List of tuples (dx, dy, cost) representing possible moves
        """
        moves = []
        
        if direction == "Right":
            moves = [
                (1, 0, 1.0),    # Straight forward
                (1, 1, 1.4),    # Diagonal up-right (lane change)
                (1, -1, 1.4),   # Diagonal down-right (lane change)
            ]
        elif direction == "Left":
            moves = [
                (-1, 0, 1.0),   # Straight forward
                (-1, 1, 1.4),   # Diagonal up-left (lane change)
                (-1, -1, 1.4),  # Diagonal down-left (lane change)
            ]
        elif direction == "Up":
            moves = [
                (0, 1, 1.0),    # Straight forward
                (1, 1, 1.4),    # Diagonal right-up (lane change)
                (-1, 1, 1.4),   # Diagonal left-up (lane change)
            ]
        elif direction == "Down":
            moves = [
                (0, -1, 1.0),   # Straight forward
                (1, -1, 1.4),   # Diagonal right-down (lane change)
                (-1, -1, 1.4),  # Diagonal left-down (lane change)
            ]
        else:
            # Default to cardinal directions
            moves = [
                (0, 1, 1.0), (0, -1, 1.0), 
                (1, 0, 1.0), (-1, 0, 1.0)
            ]
        
        return moves

    def getCellWeight(self, pos, avoidCars=True):
        """
        Calculate additional pathfinding cost for a cell based on its contents.
        
        Adds penalties for traffic lights (time-based) and other cars to
        encourage pathfinding around congested areas.
        
        Args:
            pos: Position to evaluate (x, y)
            avoidCars: Whether to add penalty for cars in the cell
            
        Returns:
            float: Additional weight/cost for this cell
        """
        cell = self.grid[pos]
        agentsInCell = list(cell.agents)
        
        weight = 0
        
        for agent in agentsInCell:
            if isinstance(agent, Traffic_Light):
                # Weight based on light cycle time
                weight += agent.timeToChange * 0.2
            elif isinstance(agent, Destination):
                # No penalty for destination
                weight += 0
            elif isinstance(agent, Car) and avoidCars:
                # High penalty for occupied cells (unless at destination)
                hasDestination = any(isinstance(a, Destination) for a in agentsInCell)
                if not hasDestination:
                    weight += 80
        
        return weight

    def findPath(self, start, end, avoidCars=True):
        """
        Find optimal path from start to end using A* algorithm.
        
        Considers road directions, traffic conditions, and movement costs.
        Penalizes against-flow movements but doesn't block them entirely
        to allow flexibility in pathfinding.
        
        Args:
            start: Starting position (x, y)
            end: Target position (x, y)
            avoidCars: Whether to add penalties for cells with cars
            
        Returns:
            list: List of positions (x, y) forming the path, or empty list if no path found
        """
        if start == end:
            return [end]
        
        # Initialize A* data structures
        openSet = [(0, start)]
        cameFrom = {}
        gScore = {start: 0}
        fScore = {start: self.heuristic(start, end)}
        visited = set()
        
        iterations = 0
        maxIterations = self.width * self.height * 25
        
        while openSet and iterations < maxIterations:
            iterations += 1
            
            # Find node with lowest f_score (naive implementation)
            minIdx = 0
            for i in range(len(openSet)):
                if openSet[i][0] < openSet[minIdx][0]:
                    minIdx = i
            
            currentF, current = openSet.pop(minIdx)
            
            # Goal reached - reconstruct path
            if current == end:
                path = []
                while current in cameFrom:
                    path.append(current)
                    current = cameFrom[current]
                path.reverse()
                return path
            
            visited.add(current)
            
            # Get current road direction for movement rules
            currentDirection = self.getRoadDirection(current)
            if currentDirection is None:
                currentDirection = "Right"
            
            # Get allowed moves based on direction
            allowedMoves = self.getAllowedMoves(current, currentDirection)
            
            # Evaluate each possible move
            for dx, dy, moveCost in allowedMoves:
                neighbor = (current[0] + dx, current[1] + dy)
                
                # Skip if already visited or invalid
                if neighbor in visited or not self.isValidRoad(neighbor):
                    continue
                
                # Calculate base movement cost
                cellWeight = self.getCellWeight(neighbor, avoidCars=avoidCars)
                
                # Add penalty for moving against traffic flow
                penalty = 0
                neighborDirection = self.getRoadDirection(neighbor)
                if neighborDirection:
                    if (neighborDirection == "Right" and dx < 0) or \
                        (neighborDirection == "Left" and dx > 0) or \
                        (neighborDirection == "Up" and dy < 0) or \
                        (neighborDirection == "Down" and dy > 0):
                        penalty = 150
                
                # Calculate total cost
                tentativeG = gScore[current] + moveCost + cellWeight + penalty
                
                # Update path if this is better
                if neighbor not in gScore or tentativeG < gScore[neighbor]:
                    cameFrom[neighbor] = current
                    gScore[neighbor] = tentativeG
                    newF = tentativeG + self.heuristic(neighbor, end)
                    fScore[neighbor] = newF
                    openSet.append((newF, neighbor))
        
        return []

    def spawnCars(self): 
        """
        Spawn new cars at the four corners of the map.
        
        Attempts to spawn one car per corner at available road cells.
        Each car is assigned a random destination from available destinations.
        """
        cornerSize = 1
        
        # Define the four corner regions
        corners = [
            [(x, y) for x in range(cornerSize) for y in range(self.height - cornerSize, self.height)],
            [(x, y) for x in range(self.width - cornerSize, self.width) for y in range(self.height - cornerSize, self.height)],
            [(x, y) for x in range(cornerSize) for y in range(cornerSize)],
            [(x, y) for x in range(self.width - cornerSize, self.width) for y in range(cornerSize)]
        ]
        
        # Try to spawn one car per corner
        for corner_index, cornerCoords in enumerate(corners):
            emptyRoads = []
            for coord in cornerCoords:
                try:
                    # Boundary check
                    if coord[0] >= self.width or coord[1] >= self.height or coord[0] < 0 or coord[1] < 0:
                        continue
                        
                    cell = self.grid[coord]
                    # Check if cell has a road and no car
                    hasRoad = any(isinstance(obj, Road) for obj in cell.agents)
                    hasCar = any(isinstance(obj, Car) for obj in cell.agents)
                    if hasRoad and not hasCar:
                        emptyRoads.append(cell)
                except Exception as e:
                    print(f"Error checking cell {coord}: {e}")
                    continue
            
            # Spawn car if valid location found
            if emptyRoads and self.destinations:
                spawnCell = self.random.choice(emptyRoads)
                randomDestinationAgent = self.random.choice(self.destinations)
                
                car = Car(self, spawnCell, self.getUniqueId(), dest=randomDestinationAgent)
                self.totCarsSpawned += 1
                self.carsSpawnedThisStep += 1

    def step(self):
        """
        Advance the simulation by one step.
        
        Handles car spawning on spawn cycles, executes all agent steps,
        collects metrics, and checks termination condition (when no cars
        can be spawned).
        """
        # Reset per-step metrics
        self.cars_arrived_this_step = 0
        self.traffic_jams_this_step = 0
        
        # Spawn cars on designated steps
        if (self.steps == 1) or (self.steps % self.spawnSteps == 0):
            self.carsSpawnedThisStep = 0
            self.spawnCars()
            # Check termination condition: cannot spawn even 1 car
            if self.steps != 0 and self.carsSpawnedThisStep < 1:
                print(f"   GAME OVER at step {self.steps}")
                print(f"   Could not spawn even 1 car")
                print(f"   Total spawned: {self.totCarsSpawned}")
                print(f"   Total arrived: {self.totCarsArrived}")
                print(f"   Cars in transit: {self.countActiveCars(self)}")
                self.running = False
                return
        
        # Track cars before step for arrival calculation
        carsBefore = self.countActiveCars(self)
        embotellamientosBefore = self.embotellamientos
        
        # Execute all agent steps in random