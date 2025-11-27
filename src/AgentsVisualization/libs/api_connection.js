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
    width: 28,
    height: 28
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
                    //console.log(`Car ${agents[i].id} removed (reached destination)`);
                    agents.splice(i, 1);
                }
            }

            for (const agent of result.positions) {
                const current_agent = agents.find((object3d) => object3d.id == agent.id);

                if(current_agent != undefined){
                    current_agent.oldPosArray = [...current_agent.posArray];
                    current_agent.position = {x: agent.x, y: agent.y, z: agent.z};
                } else {
                    const newCar = new Object3D(agent.id, [agent.x, agent.y, agent.z]);
                    newCar.oldPosArray = [...newCar.posArray];
                    agents.push(newCar);
                    //console.log(`New car added: ID ${agent.id} at (${agent.x}, ${agent.y}, ${agent.z})`);
                }
            }
        }

    } catch (error) {
        console.log(error);
    }
}

/*
 * Retrieves the current positions of all traffic lights from the agent server.
 */
async function getLights() {
    try {
        let response = await fetch(agent_server_uri + "getLights");

        if (response.ok) {
            let result = await response.json();

            if (obstacles.length == 0) {
                for (const light of result.positions) {
                    const newLight = new Object3D(light.id, [light.x, light.y, light.z]);
                    trafficLights.push(newLight);
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

export { agents, obstacles, roads, destinations, initAgentsModel, update, getCars, getLights, getDestination, getObstacles, getRoads };
