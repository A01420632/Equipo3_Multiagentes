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
    const res = await fetch(agent_server_uri + "getCars", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const positions = Array.isArray(data.positions) ? data.positions : [];

    const serverIds = new Set(positions.map(p => String(p.id)));
    // Remove local agents not on server
    for (let i = agents.length - 1; i >= 0; i--) {
      if (!serverIds.has(String(agents[i].id))) agents.splice(i, 1);
    }

    const byId = new Map(agents.map(a => [String(a.id), a]));

    for (const p of positions) {
      const id = String(p.id);
      const x = Number.isFinite(p.x) ? p.x : 0;
      const y = Number.isFinite(p.y) ? p.y : 1;
      const z = Number.isFinite(p.z) ? p.z : 0;
      const dirActual = p.dirActual || "Down";
      const nextDir = p.nextDir || dirActual;

      let obj = byId.get(id);
      if (obj) {
        // Large jump? Reset interpolation to avoid rubber-banding
        const dx = Math.abs((obj.position?.x ?? x) - x);
        const dz = Math.abs((obj.position?.z ?? z) - z);
        const bigJump = dx + dz > 4;

        obj.position = { x, y, z };
        obj.posArray = [x, y, z];
        obj.dirActual = dirActual;
        obj.nextDir = nextDir;

        if (bigJump) {
          // Clear interpolation so renderer snaps cleanly
          delete obj.oldPosArray;
          delete obj.nextPosArray;
          delete obj.interpolateStart;
        }
      } else {
        agents.push({
          id,
          position: { x, y, z },
          posArray: [x, y, z],
          dirActual,
          nextDir,
          scale: { x: 0.15, y: 0.15, z: 0.15 },
        });
      }
    }
  } catch (e) {
    console.error("getCars error:", e);
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
