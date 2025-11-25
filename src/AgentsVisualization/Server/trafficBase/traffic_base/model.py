from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid
from .agent import *
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

        # Get the directory where this file is located
        base_dir = os.path.dirname(os.path.abspath(__file__))

        # Load the map dictionary
        dict_path = os.path.join(base_dir, "../city_files/mapDictionary.json")
        with open(dict_path, 'r') as f:
            dataDictionary = json.load(f)

        self.num_agents = N
        self.traffic_lights = []

        # Load the map file
        map_path = os.path.join(base_dir, "../city_files/2022_base.txt")
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

        self.running = True

    def step(self):
        """Advance the model by one step."""
        self.agents.shuffle_do("step")
