from randomAgents.agent import Car, Traffic_Light, Obstacle, Destination, Road
from randomAgents.model import CityModel
from mesa.visualization import (
    Slider,
    SolaraViz,
    SpaceRenderer,
    make_plot_component,
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
        portrayal.update(("marker", "D"), ("size", 25), ("zorder", 1))
    elif isinstance(agent, Road):
        portrayal.update(("color", "lightgray"))
        portrayal.update(("marker", "s"), ("size", 125), ("zorder", 1))

    return portrayal


def post_process_lines(ax):
    """Ajustar leyenda de gráficos"""
    ax.legend(loc="center left", bbox_to_anchor=(1, 0.9))


model_params = {
    "N": Slider("Number of cars", 10, 1, 50, 1),
    "seed": Slider("Random Seed", 42, 1, 100, 1),
    "spawnSteps": Slider("Steps between spawns", 10, 1, 50, 1),
}

model = CityModel(N=10, seed=42, spawnSteps=10)

space_renderer = SpaceRenderer(
    model,
    backend="matplotlib",
)
space_renderer.draw_agents(random_portrayal)

# Estos datos cambian momento a momento
active_cars_chart = make_plot_component(
    {
        "Active Cars": "blue",
    },
    post_process=post_process_lines,
)

# Miden "qué pasó en este step específico"
events_per_step_chart = make_plot_component(
    {
        "Cars Arrived This Step": "green",
        "Traffic Jams This Step": "red",
    },
    post_process=post_process_lines,
)

# Estos datos solo crecen o se estabilizan, nunca bajan
cumulative_metrics_chart = make_plot_component(
    {
        "Total Cars Arrived": "darkgreen",
        "Traffic Jams": "darkred",
        "Average Steps Per Car": "purple",
    },
    post_process=post_process_lines,
)

# Crear la visualización con todos los componentes
page = SolaraViz(
    model,
    space_renderer,
    components=[
        active_cars_chart,
        events_per_step_chart,
        cumulative_metrics_chart
    ],
    model_params=model_params,
    name="City Traffic Simulation",
)