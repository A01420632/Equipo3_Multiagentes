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

    def __init__(self, N, seed=42):

        super().__init__(seed=seed)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        dict_path = os.path.join(base_dir, "city_files", "mapDictionary.json")
        with open(dict_path, 'r') as f:
            dataDictionary = json.load(f)

        self.num_agents = N
        self.traffic_lights = []

        map_path = os.path.join(base_dir, "city_files", "2023_base.txt")
        with open(map_path) as baseFile:
            lines = baseFile.readlines()
            self.width = len(lines[0])
            self.height = len(lines)

            self.grid = OrthogonalMooreGrid(
                [self.width, self.height], capacity=100, torus=False
            )

            # Goes through each character in the map file and creates the corresponding agent.
            for r, row in enumerate(lines):
                for c, col in enumerate(row):

                    cell = self.grid[(c, self.height - r - 1)]

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
        
        empty_roads = self.grid.all_cells.select(
            lambda cell: any(isinstance(obj, Road) for obj in cell.agents) and 
                        not any(isinstance(obj, Car) for obj in cell.agents)
        ).cells

        for i in range(min(self.num_agents, len(empty_roads))):
            cell = self.random.choice(empty_roads)
            Car(self, cell, i)
            print(f"Car {i} initialized at cell: {cell.coordinate}")
            empty_roads.remove(cell)

        self.running = True

    def step(self):
        """Advance the model by one step."""
        self.agents.shuffle_do("step")
