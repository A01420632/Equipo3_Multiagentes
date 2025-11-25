# TC2008B. Sistemas Multiagentes y Gráficas Computacionales
# Python flask server to interact with webGL.
# Octavio Navarro. 2024

from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from randomAgents.model import CityModel
from randomAgents.agent import Car, Traffic_Light, Obstacle, Destination, Road

# Size of the board:
number_agents = 10
width = 28
height = 28
cityModel = None
currentStep = 0

# This application will be used to interact with WebGL
app = Flask("Traffic example")
CORS(app, resources={r"/*": {"origins": "*"}})

# This route will be used to send the parameters of the simulation to the server.
# The servers expects a POST request with the parameters in a.json.
@app.route('/init', methods=['GET', 'POST'])
@cross_origin()
def initModel():
    global currentStep, cityModel, number_agents, width, height

    if request.method == 'POST':
        try:
            number_agents = int(request.json.get('NAgents'))
            width = int(request.json.get('width'))
            height = int(request.json.get('height'))
            currentStep = 0

        except Exception as e:
            print(e)
            return jsonify({"message": "Error initializing the model"}), 500

    print(f"Model parameters:{number_agents, width, height}")

    # Create the model using the parameters sent by the application
    cityModel = CityModel(number_agents,42)  # <------------------------- seed ?

    # Return a message to saying that the model was created successfully
    return jsonify({"message": f"Parameters recieved, model initiated.\nSize: {width}x{height}"})


# This route will be used to get the positions of the agents
@app.route('/getCars', methods=['GET'])
@cross_origin()
def getCars():
    global cityModel

    if request.method == 'GET':
        # Get the positions of the agents and return them to WebGL in JSON.json.t.
        # Note that the positions are sent as a list of dictionaries, where each dictionary has the id and position of an agent.
        # The y coordinate is set to 1, since the agents are in a 3D world. The z coordinate corresponds to the row (y coordinate) of the grid in mesa.
        try:
            agentCells = cityModel.grid.all_cells.select(
                lambda cell: any(isinstance(obj, Car) for obj in cell.agents)
            ).cells
            # print(f"CELLS: {agentCells}")

            agents = [
                (cell.coordinate, agent)
                for cell in agentCells
                for agent in cell.agents
                if isinstance(agent, Car)
            ]
            # print(f"AGENTS: {agents}")

            agentPositions = [
                {"id": str(a.unique_id), "x": coordinate[0], "y":1, "z":coordinate[1]}
                for (coordinate, a) in agents
            ]
            # print(f"AGENT POSITIONS: {agentPositions}")

            return jsonify({'positions': agentPositions})
        except Exception as e:
            print(e)
            return jsonify({"message": "Error with the agent positions"}), 500

@app.route('/getLights', methods=['GET'])
@cross_origin()
def getLights():
    global cityModel

    if request.method == 'GET':
        # Get the positions of the agents and return them to WebGL in JSON.json.t.
        # Note that the positions are sent as a list of dictionaries, where each dictionary has the id and position of an agent.
        # The y coordinate is set to 1, since the agents are in a 3D world. The z coordinate corresponds to the row (y coordinate) of the grid in mesa.
        try:
            agentCells = cityModel.grid.all_cells.select(
                lambda cell: any(isinstance(obj, Traffic_Light) for obj in cell.agents)
            ).cells
            # print(f"CELLS: {agentCells}")

            agents = [
                (cell.coordinate, agent)
                for cell in agentCells
                for agent in cell.agents
                if isinstance(agent, Traffic_Light)
            ]
            # print(f"AGENTS: {agents}")

            agentPositions = [
                {"id": str(a.unique_id), "x": coordinate[0], "y":1, "z":coordinate[1]}
                for (coordinate, a) in agents
            ]
            # print(f"AGENT POSITIONS: {agentPositions}")

            return jsonify({'positions': agentPositions})
        except Exception as e:
            print(e)
            return jsonify({"message": "Error with the agent positions"}), 500


# This route will be used to get the positions of the obstacles
@app.route('/getObstacles', methods=['GET'])
@cross_origin()
def getObstacles():
    global cityModel

    if request.method == 'GET':
        try:
            # Get the positions of the obstacles and return them to WebGL in JSON.json.t.
            # Same as before, the positions are sent as a list of dictionaries, where each dictionary has the id and position of an obstacle.

            obstacleCells = cityModel.grid.all_cells.select(
                lambda cell: any(isinstance(obj, Obstacle) for obj in cell.agents)
            )
            # print(f"CELLS: {agentCells}")

            agents = [
                (cell.coordinate, agent)
                for cell in obstacleCells
                for agent in cell.agents
                if isinstance(agent, Obstacle)
            ]
            # print(f"AGENTS: {agents}")

            obstaclePositions = [
                {"id": str(a.unique_id), "x": coordinate[0], "y":1, "z":coordinate[1]}
                for (coordinate, a) in agents
            ]
            # print(f"OBSTACLE POSITIONS: {obstaclePositions}")

            return jsonify({'positions': obstaclePositions})
        except Exception as e:
            print(e)
            return jsonify({"message": "Error with obstacle positions"}), 500

# This route will be used to get the positions of the destinations
@app.route('/getDestination', methods=['GET'])
@cross_origin()
def getDestinations():
    global cityModel

    if request.method == 'GET':
        try:
            destinationCells = cityModel.grid.all_cells.select(
                lambda cell: any(isinstance(obj, Destination) for obj in cell.agents)
            )

            agents = [
                (cell.coordinate, agent)
                for cell in destinationCells
                for agent in cell.agents
                if isinstance(agent, Destination)
            ]

            destinationPositions = [
                {"id": str(a.unique_id), "x": coordinate[0], "y":1, "z":coordinate[1]}
                for (coordinate, a) in agents
            ]

            return jsonify({'positions': destinationPositions})
        except Exception as e:
            print(e)
            return jsonify({"message": "Error with destination positions"}), 500

# This route will be used to get the positions of the roads
@app.route('/getRoads', methods=['GET'])
@cross_origin()
def getRoads():
    global cityModel

    if request.method == 'GET':
        try:
            roadCells = cityModel.grid.all_cells.select(
                lambda cell: any(isinstance(obj, Road) for obj in cell.agents)
            )

            agents = [
                (cell.coordinate, agent)
                for cell in roadCells
                for agent in cell.agents
                if isinstance(agent, Road)
            ]

            roadPositions = [
                {"id": str(a.unique_id), "x": coordinate[0], "y":1, "z":coordinate[1]}
                for (coordinate, a) in agents
            ]

            return jsonify({'positions': roadPositions})
        except Exception as e:
            print(e)
            return jsonify({"message": "Error with road positions"}), 500


@app.route('/update', methods=['GET'])
@cross_origin()
def updateModel():
    global currentStep, cityModel
    if request.method == 'GET':
        try:
            cityModel.step()
            currentStep += 1
            return jsonify({'message': f'Model updated to step {currentStep}.', 'currentStep':currentStep})
        except Exception as e:
            print(e)
            return jsonify({"message": "Error during step."}), 500


if __name__=='__main__':
    # Run the flask server in port 8585
    app.run(host="localhost", port=8585, debug=True)
