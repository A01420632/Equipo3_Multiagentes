from randomAgents.agent import Car, Traffic_Light, Obstacle, Destination, Road
from randomAgents.model import CityModel
from mesa.visualization import (
    CommandConsole,
    Slider,
    SolaraViz,
    SpaceRenderer,
)
from mesa.visualization.components import AgentPortrayalStyle


def random_portrayal(agent):
    if agent is None:
        return

    portrayal = AgentPortrayalStyle(
        size=50,
        marker="o",
        zorder=2,
    )

    if isinstance(agent, Car):
        portrayal.update(("color", "black"))
    elif isinstance(agent, Traffic_Light):
        portrayal.update(("color", "green" if agent.state else "red"))
        portrayal.update(("marker", "s"), ("size", 25), ("zorder", 1))
    elif isinstance(agent, Obstacle):
        portrayal.update(("color", "gray"))
        portrayal.update(("marker", "s"), ("size", 125), ("zorder", 1))
    elif isinstance(agent, Destination):
        portrayal.update(("color", "blue"))
        portrayal.update(("marker", "s"), ("size", 25), ("zorder", 1))
    elif isinstance(agent, Road):
        portrayal.update(("color", "lightgray"))
        portrayal.update(("marker", "s"), ("size", 125), ("zorder", 1))

    return portrayal

model_params = {
    "N": Slider("Number of cars", 10, 1, 50, 1),
    "seed": Slider("Random Seed", 42, 1, 100, 1),
    "spawnSteps": Slider("Steps between spawns", 10, 1, 50, 1),
}


# Crear modelo inicial (instancia, no función)
model = CityModel(N=10, seed=42, spawnSteps=10)
renderer = SpaceRenderer(
    model,
    backend="matplotlib",
)
renderer.draw_agents(random_portrayal)

page = SolaraViz(
    model,
    renderer,
    components=[CommandConsole],
    model_params=model_params,
    name="City Traffic Simulation",
)
