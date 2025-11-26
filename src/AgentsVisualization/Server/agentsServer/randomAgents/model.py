from random import shuffle
from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid
from .agent import Car, Traffic_Light, Destination, Obstacle, Road
import json
import os

class CityModel(Model):
    """
    Creates a model based on a city map.

    Args:
        N: Number of agents in the simulation
        seed: Random seed for the model
    """

    def __init__(self, N, seed=42, spawnSteps = 10):

        super().__init__(seed=seed)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        dict_path = os.path.join(base_dir, "city_files", "mapDictionary.json")
        with open(dict_path, 'r') as f:
            dataDictionary = json.load(f)

        self.num_agents = N
        self.traffic_lights = []
        self.spawnSteps = spawnSteps
        self.carCounter = 0

        map_path = os.path.join(base_dir, "city_files", "2023_base.txt")
        with open(map_path) as baseFile:
            lines = baseFile.readlines()
            lines = [line.strip() for line in lines]
            self.width = len(lines[0])
            self.height = len(lines)

            print(f"Map dimensions: {self.width} x {self.height}")

            self.grid = OrthogonalMooreGrid(
                [self.width, self.height], capacity=100, torus=False
            )
            
            for r, row in enumerate(lines):
                for c, col in enumerate(row):
                    cell_pos = (c, self.height - r - 1)
                    
                    if c >= self.width or (self.height - r - 1) >= self.height:
                        print(f"Warning: Invalid position {cell_pos}")
                        continue
                    
                    cell = self.grid[cell_pos]
                    
                    if col in ["v", "^", ">", "<"]:
                        agent = Road(self, cell, dataDictionary[col])
                    elif col in ["S", "s"]:
                        agent = Traffic_Light(
                            self,
                            cell,
                            False if col == "S" else True,
                            int(dataDictionary[col]),
                        )
                        self.traffic_lights.append(agent)
                    elif col == "#":
                        agent = Obstacle(self, cell)
                    elif col == "D":
                        agent = Destination(self, cell)
        
        print(f"Grid initialized with {len(self.agents)} agents")
        self.running = True

    def spawnCars(self): 
        """Spawn a new car at a random corner of the map"""
        corner_size = 2  
        
        corners = [
            # Top-left 
            [(x, y) for x in range(corner_size) for y in range(self.height - corner_size, self.height)],
            # Top-right
            [(x, y) for x in range(self.width - corner_size, self.width) for y in range(self.height - corner_size, self.height)],
            # Bottom-left
            [(x, y) for x in range(corner_size) for y in range(corner_size)],
            # Bottom-right
            [(x, y) for x in range(self.width - corner_size, self.width) for y in range(corner_size)]
        ]
        
        corner_index = self.random.randint(0, 3)
        corner_coords = corners[corner_index]
        corner_names = ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"]
        
        print(f"Attempting to spawn car in {corner_names[corner_index]} corner")
        
        empty_roads = []
        for coord in corner_coords:
            try:
                if coord[0] >= self.width or coord[1] >= self.height or coord[0] < 0 or coord[1] < 0:
                    continue
                cell = self.grid[coord]
                has_road = any(isinstance(obj, Road) for obj in cell.agents)
                has_car = any(isinstance(obj, Car) for obj in cell.agents)    
                if has_road and not has_car:
                    empty_roads.append(cell)
            except Exception as e:
                print(f"Error checking cell {coord}: {e}")
                continue
        
        if empty_roads:
            spawn_cell = self.random.choice(empty_roads)
            car = Car(self, spawn_cell, self.carCounter)
            self.carCounter += 1
            print(f"Car {car.unique_id} spawned at {corner_names[corner_index]} corner position: {spawn_cell.coordinate}")
        else:
            print(f"No available spawn points in {corner_names[corner_index]} corner")

    def step(self):
        """Advance the model by one step."""
        if self.steps % self.spawnSteps == 0:
            self.spawnCars()
        print(f"\n--- Step {self.steps} - Total agents: {len(self.agents)} ---")
        cars = [a for a in self.agents if isinstance(a, Car)]
        print(f"Active cars: {len(cars)}")
        
        self.agents.shuffle_do("step")