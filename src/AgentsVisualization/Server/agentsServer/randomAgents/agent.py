from mesa.discrete_space import CellAgent, FixedAgent

class Car(CellAgent):
    """
    Agent that moves randomly.
    Attributes:
        unique_id: Agent's ID
    """
    def __init__(self, model, cell, unique_id):
        """
        Creates a new random agent.
        Args:
            model: Model reference for the agent
            cell: Reference to its position within the grid
            unique_id: The agent's ID
        """
        super().__init__(model)
        self.cell = cell
        self.steps_taken = 0

    def move(self):
        """
        Determines if the agent can move in the direction that was chosen
        """
        # Get neighboring cells that have Roads
        possible_moves = self.cell.neighborhood.select(
            lambda cell: any(isinstance(obj, Road) for obj in cell.agents)
        )
        
        # Filter out cells that already have Cars
        next_moves = possible_moves.select(
            lambda cell: not any(isinstance(obj, Car) for obj in cell.agents)
        )
        
        print(f"Car {self.unique_id} at {self.cell.coordinate}: {len(possible_moves)} roads, {len(next_moves)} empty roads")
        
        if len(next_moves) > 0:
            old_pos = self.cell.coordinate
            self.cell = next_moves.select_random_cell()
            self.steps_taken += 1
            print(f"Car {self.unique_id} moved from {old_pos} to {self.cell.coordinate}")
        else:
            print(f"Car {self.unique_id} stuck at {self.cell.coordinate} - no available moves")
            
    def step(self):
        """
        Determines the new direction it will take, and then moves
        """
        self.move()

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
