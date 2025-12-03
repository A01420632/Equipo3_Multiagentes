# TC2008B. Sistemas Multiagentes y Gráficas Computacionales
# Python flask server to interact with webGL.
# Octavio Navarro. 2024

from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from randomAgents.model import CityModel
from randomAgents.agent import Car, Traffic_Light, Obstacle, Destination, Road

# Size of the board:
number_agents = 10
width = 36
height = 35
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
    cityModel = CityModel(number_agents,42,10)  # <------------------------- seed ?

    # Return a message to saying that the model was created successfully
    return jsonify({"message": f"Parameters recieved, model initiated.\nSize: {width}x{height}"})


# This route will be used to get the positions of the agents
@app.route('/getCars', methods=['GET'])
@cross_origin()
def getCars():
    global cityModel

    if request.method == 'GET':
        try:
            agentCells = cityModel.grid.all_cells.select(
                lambda cell: any(isinstance(obj, Car) for obj in cell.agents)
            ).cells

            agents = [
                (cell.coordinate, agent)
                for cell in agentCells
                for agent in cell.agents
                if isinstance(agent, Car)
            ]

            agentPositions = [
                {
                    "id": str(a.unique_id), 
                    "x": coordinate[0], 
                    "y": 1, 
                    "z": coordinate[1],
                    "dirActual": a.dirActual or "Right",
                    "nextDir": a.nextDir or a.dirActual or "Right"
                }
                for (coordinate, a) in agents
            ]

            return jsonify({'positions': agentPositions})
        except Exception as e:
            print(e)
            return jsonify({"message": "Error with the agent positions"}), 500

@app.route('/getLights', methods=['GET'])
@cross_origin()
def getLights():
    global cityModel

    if request.method == 'GET':
        try:
            agentCells = cityModel.grid.all_cells.select(
                lambda cell: any(isinstance(obj, Traffic_Light) for obj in cell.agents)
            ).cells

            agents = [
                (cell.coordinate, agent)
                for cell in agentCells
                for agent in cell.agents
                if isinstance(agent, Traffic_Light)
            ]

            agentPositions = [
                {
                    "id": str(a.unique_id), 
                    "x": coordinate[0], 
                    "y": 1, 
                    "z": coordinate[1],
                    "state": a.state
                }
                for (coordinate, a) in agents
            ]

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
            obstacleCells = cityModel.grid.all_cells.select(
                lambda cell: any(isinstance(obj, Obstacle) for obj in cell.agents)
            )

            agents = [
                (cell.coordinate, agent)
                for cell in obstacleCells
                for agent in cell.agents
                if isinstance(agent, Obstacle)
            ]

            obstaclePositions = []
            for (coordinate, a) in agents:
                x, z = coordinate
                rotation = getHouseRotation(cityModel, x, z)
                is_tree_value = getattr(a, 'is_tree', False)
                
                obstaclePositions.append({
                    "id": str(a.unique_id), 
                    "x": x, 
                    "y": 1, 
                    "z": z,
                    "rotation": rotation,
                    "is_tree": is_tree_value
                })

            return jsonify({'positions': obstaclePositions})
        except Exception as e:
            print(e)
            return jsonify({"message": "Error with obstacle positions"}), 500

def getHouseRotation(model, house_x, house_z):
    """
    Determina la rotación de una casa para que mire hacia la calle más cercana.
    Prioridad: Norte/Sur > Este/Oeste (para esquinas)
    Retorna el ángulo en grados (0, 90, 180, 270).
    """
    # Verificar las 4 direcciones cardinales
    # ORDEN DE PRIORIDAD: Sur, Norte, Este, Oeste
    # Formato: (dx, dz, ángulo_en_grados, nombre_dirección)
    directions = [
        (0, -1, 0, "Sur"),      # Calle abajo → casa mira Sur (0°)
        (0, 1, 180, "Norte"),   # Calle arriba → casa mira Norte (180°)
        (1, 0, 270, "Este"),    # Calle derecha → casa mira Este (270° invertido)
        (-1, 0, 90, "Oeste"),   # Calle izquierda → casa mira Oeste (90° invertido)
    ]
    
    for dx, dz, angle, direction in directions:
        check_x = house_x + dx
        check_z = house_z + dz
        
        # Verificar límites
        if 0 <= check_x < model.grid.width and 0 <= check_z < model.grid.height:
            cell = model.grid[(check_x, check_z)]
            
            # Si encontramos una calle REAL (no decorativa) en esta dirección, la casa debe mirar hacia allá
            if any(isinstance(obj, Road) and not getattr(obj, 'is_decorative_road', False) for obj in cell.agents):
                return angle
    
    # Si no hay calles alrededor, retornar 0° por defecto
    return 0

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

            destinationPositions = []
            for (coordinate, a) in agents:
                x, z = coordinate
                rotation = getHouseRotation(cityModel, x, z)
                # Agregar 180° para compensar orientación del modelo Barrack
                rotation = (rotation + 180) % 360
                destinationPositions.append({
                    "id": str(a.unique_id),
                    "x": x,
                    "y": 1,
                    "z": z,
                    "rotation": rotation
                })

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
