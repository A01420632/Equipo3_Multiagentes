from random import shuffle
from mesa import Model
from mesa.discrete_space import OrthogonalMooreGrid
from .agent import Car, Traffic_Light, Destination, Obstacle, Road
import json
import os
import mesa

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
        self.destinations = []
        self.spawnSteps = spawnSteps

        # Métricas
        self.carCounter = 0
        self.totCarsSpawned = 0
        self.totCarsArrived = 0
        self.totStepsTaken = 0
        self.totSemaforosFound = 0
        self.carsEnTrafico = 0
        self.embotellamientos = 0
        
        self.cars_arrived_this_step = 0
        self.traffic_jams_this_step = 0
        self.prev_embotellamientos = 0 

        self.datacollector = mesa.DataCollector(
            model_reporters={
                "Active Cars": lambda m: self.count_active_cars(m),
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

        map_path = os.path.join(base_dir, "city_files", "2023_base.txt")
        with open(map_path) as baseFile:
            lines = baseFile.readlines()
            lines = [line.strip() for line in lines]
            self.width = len(lines[0])
            self.height = len(lines)

            self.grid = OrthogonalMooreGrid(
                [self.width, self.height], capacity=100, torus=False
            )
            
            for r, row in enumerate(lines):
                for c, col in enumerate(row):
                    cell_pos = (c, self.height - r - 1)
                    
                    if c >= self.width or (self.height - r - 1) >= self.height:
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
                        self.destinations.append(agent) 
        
        self.running = True

    def spawnCars(self): 
        """Spawn a new car at a random corner of the map with a random destination"""
        corner_size = 1 
        
        corners = [
            [(x, y) for x in range(corner_size) for y in range(self.height - corner_size, self.height)],
            [(x, y) for x in range(self.width - corner_size, self.width) for y in range(self.height - corner_size, self.height)],
            [(x, y) for x in range(corner_size) for y in range(corner_size)],
            [(x, y) for x in range(self.width - corner_size, self.width) for y in range(corner_size)]
        ]
        
        for corner_index, corner_coords in enumerate(corners):
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
            
            if empty_roads and self.destinations:
                spawn_cell = self.random.choice(empty_roads)
                random_destination_agent = self.random.choice(self.destinations)
                destination_cell = random_destination_agent.cell  
                
                car = Car(self, spawn_cell, self.carCounter, dest=destination_cell)
                self.carCounter += 1
                self.totCarsSpawned += 1 
                
    def step(self):
        """Advance the model by one step."""
        self.cars_arrived_this_step = 0
        
        if self.steps == 0:
            self.spawnCars()
        # Spawn cada X steps
        elif self.steps % self.spawnSteps == 0:
            self.spawnCars()
        
        cars_before = self.count_active_cars(self)
        embotellamientos_before = self.embotellamientos
        
        self.agents.shuffle_do("step")
        
        cars_after = self.count_active_cars(self)
        self.cars_arrived_this_step = cars_before - cars_after
        
        self.traffic_jams_this_step = self.embotellamientos - embotellamientos_before
        
        self.datacollector.collect(self)

    @staticmethod
    def count_active_cars(model):
        """Cuenta carros activos en la simulación"""
        return len(model.agents.select(lambda x: isinstance(x, Car)))