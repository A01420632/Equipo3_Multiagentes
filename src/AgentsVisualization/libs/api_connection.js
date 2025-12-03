/*
 * Functions to connect to an external API to get the coordinates of agents
 *
 * Gilberto Echeverria
 * 2025-11-08
 */

'use strict';

import { Object3D } from '../libs/object3d';

const agent_server_uri = "http://localhost:8585/";

const agents = [];
const obstacles = [];
const trafficLights = [];
const roads = [];
const destinations = [];

// Define the data object
const initData = {
    NAgents: 20,
    width: 36,
    height: 35
};

/*
 * Initializes the agents model by sending a POST request to the agent server.
 */
async function initAgentsModel() {
    try {
        let response = await fetch(agent_server_uri + "init", {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify(initData)
        });

        if (response.ok) {
            let result = await response.json();
            //console.log(result.message);
        }

    } catch (error) {
        console.log(error);
    }
}

/*
 * Retrieves the current positions of all agents from the agent server.
 */
async function getCars() {
    try {
        let response = await fetch(agent_server_uri + "getCars");

        if (response.ok) {
            let result = await response.json();
            const serverAgentIds = new Set(result.positions.map(agent => agent.id));
            
            for (let i = agents.length - 1; i >= 0; i--) {
                if (!serverAgentIds.has(agents[i].id)) {
                    agents.splice(i, 1);
                }
            }

            for (const agent of result.positions) {
                const current_agent = agents.find((object3d) => object3d.id == agent.id);

                if(current_agent != undefined){
                    // ✅ SOLO actualizar dirección, NO rotation
                    current_agent.dirActual = agent.dirActual;
                    current_agent.nextDir = agent.nextDir;
                    
                    // ✅ REMOVER esta línea que causa conflictos
                    // current_agent.rotation = { ... };
                    
                    current_agent.position = {x: agent.x, y: agent.y, z: agent.z};
                } else {
                    const newCar = new Object3D(agent.id, [agent.x, agent.y, agent.z]);
                    newCar.dirActual = agent.dirActual;
                    newCar.nextDir = agent.nextDir;
                    
                    // ✅ Para nuevo carro, inicializar rotación correctamente
                    const initialAngle = directionToAngle(agent.dirActual || "Down");
                    newCar.rotRad = { x: 0, y: initialAngle, z: 0 };
                    newCar.rotY = initialAngle;
                    newCar.oldRotY = initialAngle;
                    
                    newCar.oldPosArray = [...newCar.posArray];
                    
                    agents.push(newCar);
                }
            }
        }

    } catch (error) {
        console.log(error);
    }
}

function directionToAngle(direction) {
    const angulobase = Math.PI;
    const angles = {
        "Right": -Math.PI / 2 + angulobase,
        "Left": Math.PI / 2 + angulobase,
        "Up": Math.PI + angulobase,
        "Down": 0 + angulobase
    };
    return angles[direction] || (0 + angulobase);
}

/*
 * Retrieves the current positions of all traffic lights from the agent server.
 */
async function getLights() {
    try {
        let response = await fetch(agent_server_uri + "getLights");

        if (response.ok) {
            let result = await response.json();

            if (trafficLights.length == 0) {
                for (const light of result.positions) {
                    const newLight = new Object3D(light.id, [light.x, light.y, light.z]);
                    newLight.state = light.state;
                    trafficLights.push(newLight);
                }
            } else {
                // Actualizar estado de semáforos existentes
                for (const light of result.positions) {
                    const existingLight = trafficLights.find(l => l.id == light.id);
                    if (existingLight) {
                        existingLight.state = light.state;
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

/*
 * Retrieves the current positions of all obstacles from the agent server.
 */
async function getObstacles() {
    try {
        let response = await fetch(agent_server_uri + "getObstacles");

        if (response.ok) {
            let result = await response.json();

            for (const obstacle of result.positions) {
                const newObstacle = new Object3D(obstacle.id, [obstacle.x, obstacle.y, obstacle.z]);
                newObstacle.serverRotation = obstacle.rotation || 0;
                newObstacle.is_tree = obstacle.is_tree || false;
                obstacles.push(newObstacle);
            }
            
        }
    } catch (error) {
        console.log(error);
    }
}

/*
 * Retrieves the current positions of all destinations from the agent server.
 */
async function getDestination() {
    try {
        let response = await fetch(agent_server_uri + "getDestination");

        if (response.ok) {
            let result = await response.json();

            for (const destination of result.positions) {
                const newDestination = new Object3D(destination.id, [destination.x, destination.y, destination.z]);
                newDestination.serverRotation = destination.rotation || 0;
                destinations.push(newDestination);
            }
        }
    } catch (error) {
        console.log(error);
    }
}

/*
 * Retrieves the current positions of all roads from the agent server.
 */
async function getRoads() {
    try {
        let response = await fetch(agent_server_uri + "getRoads");

        if (response.ok) {
            let result = await response.json();

            for (const road of result.positions) {
                const newRoad = new Object3D(road.id, [road.x, road.y, road.z]);
                roads.push(newRoad);
            }
        }
    } catch (error) {
        console.log(error);
    }
}

/*
 * Updates the agent positions by sending a request to the agent server.
 */
async function update() {
    try {
        let response = await fetch(agent_server_uri + "update");

        if (response.ok) {
            await getCars();
            await getLights();
          //  console.log("Updated agents");
        }

    } catch (error) {
        console.log(error);
    }
}

export { agents, obstacles, trafficLights, roads, destinations, initAgentsModel, update, getCars, getLights, getDestination, getObstacles, getRoads };
