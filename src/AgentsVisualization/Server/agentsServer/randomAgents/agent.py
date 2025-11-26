from mesa.discrete_space import CellAgent, FixedAgent

class Car(CellAgent):
    """
    Luego actualizar para que tenga cosas de FSM
    """
    
    
    def __init__(self, model, cell, unique_id):
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

    def getValidDirections(self, current_cell):
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
        
        direction_map = {
            "Right": (1, 0),
            "Left": (-1, 0),
            "Up": (0, 1),
            "Down": (0, -1)
        }
        
        if direction not in direction_map:
            return []
        dx, dy = direction_map[direction]
        next_pos = (x + dx, y + dy)
        try:
            next_cell = self.model.grid[next_pos]
            return [next_cell]
        except:
            return []

    def checkNextCell(self):
        valid_cells = self.getValidDirections(self.cell)
        if not valid_cells:
            return None, "WaitingTraffic"
        
        next_cell = valid_cells[0]
        has_valid_destination = any(
            isinstance(obj, (Road, Traffic_Light, Destination)) 
            for obj in next_cell.agents
        )
        
        if not has_valid_destination:
            return None, "WaitingTraffic"
        
        has_destination = any(isinstance(obj, Destination) for obj in next_cell.agents)
        if has_destination:
            return next_cell, "AtDestination"
        
        for agent in next_cell.agents:
            if isinstance(agent, Traffic_Light) and not agent.state:
                return None, "WaitingRedLight"
        
        for agent in next_cell.agents:
            if isinstance(agent, Car):
                if agent.state in ["WaitingRedLight", "WaitingTraffic"]:
                    return None, "WaitingTraffic"
        
        has_car = any(isinstance(obj, Car) for obj in next_cell.agents)
        if has_car:
            return None, "WaitingTraffic"
        
        return next_cell, "Moving"

    def transitionState(self, new_state):
        if self.state != new_state:
            print(f"Car {self.unique_id} at {self.cell.coordinate}: {self.state} -> {new_state}")
            self.state = new_state

    def update(self):
        """
        Main update function - core of the FSM
        Checks next cell and acts based on current state and conditions
        """
        next_cell, new_state = self.checkNextCell()
        
        if new_state == "AtDestination" and next_cell:
            print(f"Car {self.unique_id} reached destination at {next_cell.coordinate}")
            self.cell = next_cell
            self.model.agents.remove(self)
            return
        
        if new_state == "Moving" and next_cell:
            old_pos = self.cell.coordinate
            self.cell = next_cell
            self.steps_taken += 1
            self.transitionState("Moving")
            print(f"Car {self.unique_id} moved from {old_pos} to {self.cell.coordinate} heading {self.last_direction}")
        else:
            self.transitionState(new_state)

    def step(self):
        self.update()


class Traffic_Light(FixedAgent):
    """
    Traffic light. Where the traffic lights are in the grid.
    """
    def __init__(self, model, cell, state = False, timeToChange = 10):
        """
        Creates a new Traffic light.
        Args:
            model: Model reference for the agent
            cell: The initial position of the agent
            state: Whether the traffic light is green or red
            timeToChange: After how many step should the traffic light change color 
        """
        super().__init__(model)
        self.cell = cell
        self.state = state
        self.timeToChange = timeToChange

    def step(self):
        """ 
        To change the state (green or red) of the traffic light in case you consider the time to change of each traffic light.
        """
        if self.model.steps % self.timeToChange == 0:
            self.state = not self.state
            print(f"Traffic light at {self.cell.coordinate} changed to {'GREEN' if self.state else 'RED'}")


class Destination(FixedAgent):
    """
    Destination agent. Where each car should go.
    """
    def __init__(self, model, cell):
        """
        Creates a new destination agent
        Args:
            model: Model reference for the agent
            cell: The initial position of the agent
        """
        super().__init__(model)
        self.cell = cell
    def step(self):
        pass


class Obstacle(FixedAgent):
    """
    Obstacle agent. Just to add obstacles to the grid.
    """
    def __init__(self, model, cell):
        """
        Creates a new obstacle.
        
        Args:
            model: Model reference for the agent
            cell: The initial position of the agent
        """
        super().__init__(model)
        self.cell = cell
    def step(self):
        pass


class Road(FixedAgent):
    """
    Road agent. Determines where the cars can move, and in which direction.
    """
    def __init__(self, model, cell, direction= "Left"):
        """
        Creates a new road.
        Args:
            model: Model reference for the agent
            cell: The initial position of the agent
        """
        super().__init__(model)
        self.cell = cell
        self.direction = direction

    def step(self):
        pass
