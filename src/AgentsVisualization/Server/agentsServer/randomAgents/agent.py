"""
Multi-Agent Traffic Simulation - Agent Classes
Authors: Mauricio Monroy, Diego De la Vega

Purpose: Defines the agent classes for the traffic simulation system.
This module implements Car agents with intelligent pathfinding and movement,
Traffic_Light agents that control intersection flow, Destination points where
cars navigate to, Obstacle agents representing buildings, and Road agents that
define traffic flow directions.

Date: December 2025
"""

from mesa.discrete_space import CellAgent, FixedAgent
import random

class Car(CellAgent):
    """
    Represents a car agent in the traffic simulation.
    
    Cars navigate through the city using A* pathfinding, respect traffic rules,
    avoid collisions, and adapt to traffic conditions. They can change lanes,
    wait at red lights, and recalculate routes when blocked.
    
    Attributes:
        unique_id: Unique identifier for the car
        cell: Current grid cell position
        dest: Destination agent to navigate to
        path: List of coordinates representing the planned path
        pathIndex: Current position in the path
        state: Current state (calculating, moving, waiting, unjamming, arrived)
        dirActual: Current facing direction (Right, Left, Up, Down)
        steps_taken: Number of steps taken so far
        stuckCounter: Counter for detecting stuck situations
    """
    
    def __init__(self, model, cell, unique_id, dest=None):
        """
        Initializes a new Car agent.
        
        Args:
            model: Reference to the CityModel
            cell: Starting cell position
            unique_id: Unique identifier
            dest: Destination agent (randomly selected if None)
        """
        super().__init__(model)
        self.unique_id = unique_id
        self.cell = cell
        self.dest = dest or self.selectRandomDestination()
        
        # Pathfinding attributes
        self.path = []
        self.pathIndex = 0
        
        # Movement state machine
        self.state = "calculating"
        self.dirActual = self.getInitialDirection()
        self.nextDir = self.dirActual
        
        # Performance metrics and counters
        self.steps_taken = 0
        self.stuckCounter = 0
        self.waitCounter = 0
        self.patience = 2
        self.recalculateThreshold = 5
        self.lastPosition = None
        
        # Unjamming behavior
        self.unjammingAttempts = 0
        self.maxUnjammingAttempts = 2
        
        if self.dest:
            self.calculatePath()
    
    def selectRandomDestination(self):
        """Selects a random destination from available destinations."""
        if self.model.destinations:
            return random.choice(self.model.destinations)
        return None
    
    def getInitialDirection(self):
        """Determines initial facing direction based on road at spawn position."""
        if not self.cell:
            return "Right"
        
        road_direction = self.model.getRoadDirection(self.cell.coordinate)
        if road_direction and road_direction != "All":
            return road_direction
        
        return "Right"
    
    def calculatePath(self):
        """
        Calculates optimal path to destination using A* algorithm.
        Attempts to avoid cars if possible, falls back to ignoring cars if no path found.
        """
        if not self.dest or not self.cell:
            self.state = "waiting"
            return
        
        start = self.cell.coordinate
        end = self.dest.cell.coordinate
        
        # First try avoiding other cars
        self.path = self.model.findPath(start, end, avoidCars=True)
        self.pathIndex = 0
        
        if self.path:
            self.state = "moving"
            self.stuckCounter = 0
        else:
            # Retry without avoiding cars if no path found
            self.path = self.model.findPath(start, end, avoidCars=False)
            if self.path:
                self.state = "moving"
                self.stuckCounter = 0
            else:
                self.state = "waiting"
                self.stuckCounter += 1
    
    def getMovementDirection(self, currentPos, nextPos):
        """
        Determines the direction of a proposed movement.
        
        Args:
            currentPos: Current position tuple (x, y)
            nextPos: Target position tuple (x, y)
            
        Returns:
            Direction string: "Right", "Left", "Up", or "Down"
        """
        dx = nextPos[0] - currentPos[0]
        dy = nextPos[1] - currentPos[1]
        
        # Straight moves
        if dx != 0 and dy == 0:
            return "Right" if dx > 0 else "Left"
        elif dy != 0 and dx == 0:
            return "Up" if dy > 0 else "Down"
        
        # Diagonal moves - determine primary direction
        if abs(dx) > abs(dy):
            return "Right" if dx > 0 else "Left"
        else:
            return "Up" if dy > 0 else "Down"
    
    def canMoveTo(self, nextPos, considerDirection=None):
        """
        Validates if car can move to target position.
        
        Checks for:
        - Position bounds
        - Obstacles
        - Other cars
        - Red traffic lights
        - Road direction compliance
        - No lateral movement
        
        Args:
            nextPos: Target position tuple (x, y)
            considerDirection: Direction to validate against (uses dirActual if None)
            
        Returns:
            bool: True if move is valid
        """
        if not (0 <= nextPos[0] < self.model.width and 
                0 <= nextPos[1] < self.model.height):
            return False
        
        if not self.cell:
            return False
        
        currentPos = self.cell.coordinate
        nextCell = self.model.grid[nextPos]
        agentsInCell = list(nextCell.agents)
        
        # Allow arrival at destination
        if any(isinstance(agent, Destination) for agent in agentsInCell):
            if any(isinstance(agent, Obstacle) for agent in agentsInCell):
                return False
            return True
        
        # Check for obstacles
        if any(isinstance(agent, Obstacle) for agent in agentsInCell):
            return False
        
        # Check for red traffic lights
        for agent in agentsInCell:
            if isinstance(agent, Traffic_Light) and not agent.state:
                self.model.totSemaforosFound += 1
                return False
        
        # Check for other cars
        if any(isinstance(agent, Car) and agent != self for agent in agentsInCell):
            return False
        
        # Verify no lateral movement
        dx = nextPos[0] - currentPos[0]
        dy = nextPos[1] - currentPos[1]
        
        checkDirection = considerDirection if considerDirection else self.dirActual
        
        # Enforce forward movement only based on direction
        if checkDirection == "Right":
            if dx <= 0:
                return False
        elif checkDirection == "Left":
            if dx >= 0:
                return False
        elif checkDirection == "Up":
            if dy <= 0:
                return False
        elif checkDirection == "Down":
            if dy >= 0:
                return False
        
        # Verify road direction allows this movement
        if not self.model.isMoveAllowedByRoad(currentPos, nextPos):
            return False
        
        return True
    
    def getValidForwardMoves(self, useDirection=None):
        """
        Gets list of valid forward or diagonal-forward moves.
        
        No lateral movement is allowed - car can only move forward or
        diagonally forward while maintaining its heading direction.
        
        Args:
            useDirection: Direction to use instead of dirActual
            
        Returns:
            List of tuples (newDirection, newPosition, isDiagonal)
        """
        if not self.cell:
            return []
        
        x, y = self.cell.coordinate
        direction = useDirection if useDirection else self.dirActual
        
        # Define movement patterns (forward and diagonal-forward only)
        movimientos = {
            "Right": [
                ("Right", (x+1, y), False),
                ("Right", (x+1, y+1), True),
                ("Right", (x+1, y-1), True)
            ],
            "Left": [
                ("Left", (x-1, y), False),
                ("Left", (x-1, y+1), True),
                ("Left", (x-1, y-1), True)
            ],
            "Up": [
                ("Up", (x, y+1), False),
                ("Up", (x+1, y+1), True),
                ("Up", (x-1, y+1), True)
            ],
            "Down": [
                ("Down", (x, y-1), False),
                ("Down", (x+1, y-1), True),
                ("Down", (x-1, y-1), True)
            ]
        }
        
        possibleMoves = movimientos.get(direction, [])
        validMoves = []
        
        for newDir, newPos, isDiagonal in possibleMoves:
            if (0 <= newPos[0] < self.model.width and 
                0 <= newPos[1] < self.model.height and
                self.model.isValidRoad(newPos)):
                validMoves.append((newDir, newPos, isDiagonal))
        
        return validMoves
    
    def findAlternativeMove(self, fromDirection=None):
        """
        Finds best alternative move when path is blocked.
        
        Prioritizes straight forward movement, then diagonal-forward moves.
        Used for lane changing and obstacle avoidance.
        
        Args:
            fromDirection: Direction to consider for alternatives
            
        Returns:
            Tuple (newDirection, newPosition) or None if no alternatives
        """
        if not self.cell or not self.dest:
            return None
        
        checkDir = fromDirection if fromDirection else self.dirActual
        validMoves = self.getValidForwardMoves(useDirection=checkDir)
        destPos = self.dest.cell.coordinate
        
        straightMoves = []
        diagonalMoves = []
        
        for newDir, newPos, isDiagonal in validMoves:
            if self.canMoveTo(newPos, considerDirection=checkDir):
                dist = self.model.heuristic(newPos, destPos)
                if isDiagonal:
                    diagonalMoves.append((newDir, newPos, dist))
                else:
                    straightMoves.append((newDir, newPos, dist))
        
        # Prefer straight forward
        if straightMoves:
            straightMoves.sort(key=lambda x: x[2])
            return (straightMoves[0][0], straightMoves[0][1])
        
        # Then diagonal-forward
        if diagonalMoves:
            diagonalMoves.sort(key=lambda x: x[2])
            return (diagonalMoves[0][0], diagonalMoves[0][1])
        
        return None
    
    def updateDirection(self, nextPos, newDirection=None):
        """
        Updates car's facing direction based on movement.
        
        Args:
            nextPos: Position moved to
            newDirection: Explicit direction to set (if provided)
        """
        if not self.cell:
            return
        
        if newDirection:
            self.dirActual = newDirection
            self.nextDir = newDirection
            return
        
        currentPos = self.cell.coordinate
        dx = nextPos[0] - currentPos[0]
        dy = nextPos[1] - currentPos[1]
        
        if dx != 0 and dy == 0:
            self.dirActual = "Right" if dx > 0 else "Left"
        elif dy != 0 and dx == 0:
            self.dirActual = "Up" if dy > 0 else "Down"
        else:
            pass
        
        if self.path and self.pathIndex < len(self.path):
            nextPathPos = self.path[self.pathIndex]
            nextDx = nextPathPos[0] - nextPos[0]
            nextDy = nextPathPos[1] - nextPos[1]
            
            if nextDx != 0 and nextDy == 0:
                self.nextDir = "Right" if nextDx > 0 else "Left"
            elif nextDy != 0 and nextDx == 0:
                self.nextDir = "Up" if nextDy > 0 else "Down"
            else:
                # Maintain direction for diagonal
                self.nextDir = self.dirActual
        else:
            self.nextDir = self.dirActual
    
    def step(self):
        """
        Main decision-making function called each simulation step.
        
        Implements state machine with states:
        - calculating: Computing path to destination
        - moving: Driving towards destination
        - waiting: At a stop (e.g., red light, blocked)
        - unjamming: Attempting to escape a traffic jam
        - arrived: Reached the destination
        """
        if self.state == "arrived":
            return
        
        # Check if already at destination
        if self.cell:
            agentsInCurrentCell = list(self.cell.agents)
            if any(isinstance(agent, Destination) for agent in agentsInCurrentCell):
                self.state = "arrived"
                self.model.totCarsArrived += 1
                self.model.cars_arrived_this_step += 1
                self.remove()
                return
        
        # State: calculating path
        if self.state == "calculating":
            self.calculatePath()
            return
        
        # State: moving along path
        if self.state == "moving":
            if not self.path or self.pathIndex >= len(self.path):
                if self.cell and self.dest:
                    currentPos = self.cell.coordinate
                    destPos = self.dest.cell.coordinate
                    if currentPos != destPos:
                        self.state = "calculating"
                        self.calculatePath()
                return
            
            nextPos = self.path[self.pathIndex]
            
            # Determine what direction this move represents
            moveDirection = self.getMovementDirection(self.cell.coordinate, nextPos)
            
            # Check if next position in path is available using the move direction
            if self.canMoveTo(nextPos, considerDirection=moveDirection):
                # Move successfully along path
                nextCell = self.model.grid[nextPos]
                self.cell = nextCell
                self.pathIndex += 1
                self.steps_taken += 1
                self.model.totStepsTaken += 1
                self.stuckCounter = 0
                self.waitCounter = 0
                self.lastPosition = nextPos
                self.updateDirection(nextPos) 
                # Check if arrived
                agentsInCell = list(self.cell.agents)
                if any(isinstance(agent, Destination) for agent in agentsInCell):
                    self.state = "arrived"
                    self.model.totCarsArrived += 1
                    self.model.cars_arrived_this_step += 1
                    self.remove()
                return
            else:
                # Path blocked - immediately try alternative or recalculate
                self.stuckCounter += 1
                self.waitCounter += 1
                
                # 10% chance to recalculate route (escape traffic jam)
                if random.random() < 0.1:
                    self.calculatePath()
                    self.stuckCounter = 0
                    self.waitCounter = 0
                    self.state = "moving"
                    return
                
                # Try alternative forward/diagonal move (lane change)
                alternative = self.findAlternativeMove()
                
                if alternative:
                    newDirection, newPos = alternative
                    nextCell = self.model.grid[newPos]
                    self.cell = nextCell
                    self.steps_taken += 1
                    self.model.totStepsTaken += 1
                    self.updateDirection(newPos, newDirection)  
                    self.stuckCounter = 0
                    self.waitCounter = 0
                    self.state = "moving"
                    return
                
                # No alternative found, enter waiting state
                if self.stuckCounter >= self.recalculateThreshold:
                    self.state = "unjamming"
                    self.unjammingAttempts = 0
                else:
                    self.state = "waiting"
                return
        
        # State: waiting (blocked)
        if self.state == "waiting":
            self.waitCounter += 1
            
            # ALWAYS check if path is now clear (highest priority)
            if self.path and self.pathIndex < len(self.path):
                nextPos = self.path[self.pathIndex]
                moveDirection = self.getMovementDirection(self.cell.coordinate, nextPos)
                
                if self.canMoveTo(nextPos, considerDirection=moveDirection):
                    # Path is clear, move immediately
                    nextCell = self.model.grid[nextPos]
                    self.cell = nextCell
                    self.pathIndex += 1
                    self.steps_taken += 1
                    self.model.totStepsTaken += 1
                    self.stuckCounter = 0
                    self.waitCounter = 0
                    self.updateDirection(nextPos)  
                    self.state = "moving"
                    
                    # Check if arrived
                    agentsInCell = list(self.cell.agents)
                    if any(isinstance(agent, Destination) for agent in agentsInCell):
                        self.state = "arrived"
                        self.model.totCarsArrived += 1
                        self.model.cars_arrived_this_step += 1
                        self.remove()
                    return
            
            # If still blocked, immediately try alternative move
            alternative = self.findAlternativeMove()
            
            if alternative:
                newDirection, newPos = alternative
                nextCell = self.model.grid[newPos]
                self.cell = nextCell
                self.steps_taken += 1
                self.model.totStepsTaken += 1
                self.updateDirection(newPos, newDirection)  
                self.stuckCounter = 0
                self.waitCounter = 0
                self.state = "moving"
                return
            
            # Enter unjamming state if stuck too long
            if self.stuckCounter >= self.recalculateThreshold or self.waitCounter >= self.patience:
                self.state = "unjamming"
                self.unjammingAttempts = 0
                return
        
        # State: unjamming (trying to escape traffic jam)
        if self.state == "unjamming":
            self.unjammingAttempts += 1
            
            # First, always check if original path is now clear
            if self.path and self.pathIndex < len(self.path):
                nextPos = self.path[self.pathIndex]
                moveDirection = self.getMovementDirection(self.cell.coordinate, nextPos)
                
                if self.canMoveTo(nextPos, considerDirection=moveDirection):
                    nextCell = self.model.grid[nextPos]
                    self.cell = nextCell
                    self.pathIndex += 1
                    self.steps_taken += 1
                    self.model.totStepsTaken += 1
                    self.stuckCounter = 0
                    self.waitCounter = 0
                    self.unjammingAttempts = 0
                    self.updateDirection(nextPos)  
                    self.state = "moving"
                    return
            # Try to find any valid forward move
            alternative = self.findAlternativeMove()
            
            if alternative:
                newDirection, newPos = alternative
                nextCell = self.model.grid[newPos]
                self.cell = nextCell
                self.steps_taken += 1
                self.model.totStepsTaken += 1
                self.updateDirection(newPos, newDirection)  
                self.stuckCounter = 0
                self.waitCounter = 0
                self.unjammingAttempts = 0
                self.state = "moving"
                return
            
            if self.unjammingAttempts > self.maxUnjammingAttempts:
                # Recalculate path aggressively
                if self.dest and self.cell:
                    start = self.cell.coordinate
                    end = self.dest.cell.coordinate
                    self.path = self.model.findPath(start, end, avoidCars=False)
                    self.pathIndex = 0
                
                self.stuckCounter = 0
                self.waitCounter = 0
                self.model.embotellamientos += 1
                self.model.traffic_jams_this_step += 1
                self.state = "moving"
                return
            return


class Traffic_Light(FixedAgent):
    """Traffic light that changes state periodically"""
    def __init__(self, model, cell, unique_id, state=False, timeToChange=10):
        super().__init__(model)
        self.unique_id = unique_id
        self.cell = cell
        self.state = state
        self.timeToChange = timeToChange

    def step(self):
        """Changes state (green/red) based on timeToChange"""
        if self.model.steps % self.timeToChange == 0:
            self.state = not self.state


class Destination(FixedAgent):
    """Destination agent where cars should go"""
    def __init__(self, model, cell, unique_id):
        super().__init__(model)
        self.unique_id = unique_id
        self.cell = cell


class Obstacle(FixedAgent):
    """Obstacle agent for buildings and barriers"""
    def __init__(self, model, cell, unique_id, is_tree=False):
        super().__init__(model)
        self.unique_id = unique_id
        self.is_tree = is_tree
        self.cell = cell


class Road(FixedAgent):
    """Road agent that determines movement direction"""
    def __init__(self, model, cell, unique_id, direction="Left", is_decorative_road=False):
        super().__init__(model)
        self.unique_id = unique_id
        self.cell = cell
        self.direction = direction
        self.is_decorative_road = is_decorative_road