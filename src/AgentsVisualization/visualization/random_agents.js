/*
 * Traffic Simulation Visualization
 * Authors: Mauricio Monroy, Diego De la Vega
 * 
 * Purpose: 3D visualization of a multi-agent traffic simulation system.
 * This file handles the WebGL rendering of cars (horses), buildings, traffic lights,
 * roads, and destinations. It connects to a Python Flask API to retrieve agent
 * positions and states, then animates them in real-time using smooth interpolation
 * and rotation transitions.
 * 
 * Date: December 2025
 */

'use strict';

import * as twgl from 'twgl-base.js';
import GUI from 'lil-gui';
import { M4 } from '../libs/3d-lib';
import { Scene3D } from '../libs/scene3d';
import { Object3D } from '../libs/object3d';
import { Light3D } from '../libs/light3d';
import { Camera3D } from '../libs/camera3d';
import { loadMtl } from '../libs/obj_loader';

// Import functions for API communication
import {
  agents, obstacles, trafficLights, roads, destinations, initAgentsModel,
  update, getCars, getLights, getDestination, getRoads, getObstacles
} from '../libs/api_connection.js';

// Import Phong shading shaders
import vsGLSL from '../assets/shaders/vs_phong_301.glsl?raw';
import fsGLSL from '../assets/shaders/fs_phong_301.glsl?raw';

// Import color shaders
import vsColorGLSL from '../assets/shaders/vs_color.glsl?raw';
import fsColorGLSL from '../assets/shaders/fs_color.glsl?raw';

// Import skybox shaders
import vsSkyboxGLSL from '../assets/shaders/vs_skybox.glsl?raw';
import fsSkyboxGLSL from '../assets/shaders/fs_skybox.glsl?raw';

const scene = new Scene3D();

// Global variables for WebGL program management
let phongProgramInfo = undefined;
let colorProgramInfo = undefined;
let skyboxProgramInfo = undefined;
let skyboxBufferInfo = undefined;
let skyboxVAO = undefined;
let skyboxTexture = undefined;
let gl = undefined;

// Animation timing constants
const duration = 1000; // Duration of one animation cycle in milliseconds
let elapsed = 0;
let then = 0;

// Update synchronization flags
let isUpdating = false;
let pendingUpdate = false;

// Global variables for 3D model data
let carObjData = null;
let buildingObjData = null;
let trafficLightObjData = null;
let roadObjData = null;
let destinationObjData = null;

// Horse animation frame data
let horseAnimationFrames = []; // Array containing 4 animation frames
let horseIdleObjData = null;   // Idle frame when horse is not moving
let horseMaterials = null;     // Shared materials for all horse frames

// Material data for different objects
let carMaterials = null;
let buildingMaterials = null;
let trafficLightMaterials = null;
let trafficLightMaterialsG = null;
let roadMaterials = null;
let destinationMaterials = null;

// Direction angle mapping for car rotation
let angulobase = Math.PI;
const DIRECTION_ANGLES = {
  "Right": -Math.PI / 2 + angulobase,  // Points towards +X
  "Left": Math.PI / 2 + angulobase,    // Points towards -X
  "Up": Math.PI + angulobase,          // Points towards +Z
  "Down": 0 + angulobase               // Points towards -Z
};

/**
 * Linear interpolation helper function
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) { 
  return a + (b - a) * t; 
}

/**
 * Clamps a value within a specified range
 * @param {number} x - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
function clamp(x, min, max) { 
  return Math.max(min, Math.min(max, x)); 
}

/**
 * Loads an OBJ file and its associated MTL material file
 * @param {string} url - Path to the OBJ file
 * @returns {Object|null} Object containing objData and materials, or null if loading fails
 */
async function loadObjFile(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    console.log(`Successfully loaded OBJ from ${url}`);
    
    // Attempt to load corresponding MTL file
    const mtlUrl = url.replace('.obj', '.mtl');
    let materials = null;
    
    try {
      const mtlResponse = await fetch(mtlUrl);
      if (mtlResponse.ok) {
        const mtlText = await mtlResponse.text();
        materials = loadMtl(mtlText);
        console.log(`Successfully loaded MTL from ${mtlUrl}`, materials);
      }
    } catch (mtlError) {
      console.log(`No MTL file found for ${url}`);
    }
    
    return { objData: text, materials: materials };
  } catch (error) {
    console.error(`Error loading OBJ file from ${url}:`, error);
    return null;
  }
}

/**
 * Main initialization function
 * Sets up WebGL context, loads all 3D models, initializes the agent model,
 * and starts the rendering loop
 */
async function main() {
  // Setup WebGL canvas and context
  const canvas = document.querySelector('canvas');
  gl = canvas.getContext('webgl2');
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Create shader programs
  phongProgramInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);
  colorProgramInfo = twgl.createProgramInfo(gl, [vsColorGLSL, fsColorGLSL]);
  skyboxProgramInfo = twgl.createProgramInfo(gl, [vsSkyboxGLSL, fsSkyboxGLSL]);

  // Setup skybox environment
  setupSkybox();

  // Load all 3D models from assets folder
  console.log('Loading OBJ models...');
  
  // Load horse animation frames (4 frames for walking animation)
  const horse1Data = await loadObjFile('../assets/models/Horse1.obj');
  const horse2Data = await loadObjFile('../assets/models/Horse2.obj');
  const horse3Data = await loadObjFile('../assets/models/Horse3.obj');
  const horse4Data = await loadObjFile('../assets/models/Horse4.obj');
  const horseIdleData = await loadObjFile('../assets/models/HorseIdle.obj');
  
  // Store animation frames
  horseAnimationFrames = [
    horse1Data ? horse1Data.objData : null,
    horse2Data ? horse2Data.objData : null,
    horse3Data ? horse3Data.objData : null,
    horse4Data ? horse4Data.objData : null
  ];
  
  horseIdleObjData = horseIdleData ? horseIdleData.objData : null;
  horseMaterials = horse1Data ? horse1Data.materials : null;
  
  // Load environment models
  const buildingData = await loadObjFile('../assets/models/House.obj');
  const trafficLightData = await loadObjFile('../assets/models/Lantern.obj');
  const trafficLightDataGreen = await loadObjFile('../assets/models/LanternOn.obj');
  const roadData = await loadObjFile('../assets/models/Road.obj');
  const destinationData = await loadObjFile('../assets/models/Stable.obj');
  
  // Extract OBJ data and materials
  buildingObjData = buildingData ? buildingData.objData : null;
  trafficLightObjData = trafficLightData ? trafficLightData.objData : null;
  roadObjData = roadData ? roadData.objData : null;
  destinationObjData = destinationData ? destinationData.objData : null;
  
  buildingMaterials = buildingData ? buildingData.materials : null;
  trafficLightMaterials = trafficLightData ? trafficLightData.materials : null;
  trafficLightMaterialsG = trafficLightDataGreen ? trafficLightDataGreen.materials : null;
  roadMaterials = roadData ? roadData.materials : null;
  destinationMaterials = destinationData ? destinationData.materials : null;
  
  console.log('OBJ models and materials loaded');

  // Initialize the agents model via API
  await initAgentsModel();

  // Fetch initial agent data from server
  await getCars();
  await getLights();
  await getDestination();
  await getObstacles();
  await getRoads();

  // Initialize the 3D scene
  setupScene();

  // Position and configure objects in the scene
  setupObjects(scene, gl, phongProgramInfo);

  // Prepare user interface controls
  setupUI();

  // Start the rendering loop
  drawScene();
}

/**
 * Configures the 3D scene camera and lighting
 */
function setupScene() {
  // Create and position camera with orbital controls
  let camera = new Camera3D(0,
    10,             // Distance to target
    4,              // Azimuth angle
    0.8,            // Elevation angle
    [0, 0, 10],     // Initial position
    [0, 0, 0]);     // Look-at target
  
  camera.panOffset = [0, 8, 0];
  scene.setCamera(camera);
  scene.camera.setupControls();

  // Create main scene light
  let light = new Light3D(0, 
    [3, 3, 5],                  // Light position
    [0.3, 0.3, 0.3, 1.0],      // Ambient color
    [1.0, 1.0, 1.0, 1.0],      // Diffuse color
    [1.0, 1.0, 1.0, 1.0]);     // Specular color
  scene.addLight(light);
}

/**
 * Converts a direction string to its corresponding rotation angle
 * @param {string} direction - Direction string (Right, Left, Up, Down)
 * @returns {number} Rotation angle in radians
 */
function directionToAngle(direction) {
  return DIRECTION_ANGLES[direction] || 0;
}

/**
 * Calculates the shortest angular difference between two angles
 * @param {number} from - Starting angle in radians
 * @param {number} to - Target angle in radians
 * @returns {number} Shortest angle difference in radians
 */
function angleDifference(from, to) {
  const normalizeAngle = (angle) => {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  };
  
  from = normalizeAngle(from);
  to = normalizeAngle(to);
  
  let diff = to - from;
  
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  
  return diff;
}

/**
 * Generates a random color for car visualization
 * @returns {Array<number>} RGB color array [r, g, b, a]
 */
function getRandomCarColor() {
  const colors = [
    [1.0, 0.0, 0.0, 1.0],  // Red
    [0.0, 0.0, 1.0],       // Blue
    [1.0, 1.0, 0.0],       // Yellow
    [0.0, 1.0, 0.0],       // Green
    [1.0, 0.5, 0.0],       // Orange
    [0.5, 0.0, 0.5],       // Purple
    [0.0, 1.0, 1.0],       // Cyan
    [1.0, 1.0, 1.0],       // White
    [0.2, 0.2, 0.2],       // Black
    [0.7, 0.7, 0.7],       // Gray
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Creates and configures all scene objects (cars, buildings, roads, etc.)
 * Sets up VAOs (Vertex Array Objects) for efficient rendering
 * @param {Scene3D} scene - The 3D scene object
 * @param {WebGL2RenderingContext} gl - WebGL context
 * @param {Object} programInfo - Shader program information
 */
function setupObjects(scene, gl, programInfo) {
  // Create base cube for fallback rendering
  const baseCube = new Object3D(-1);
  baseCube.prepareVAO(gl, programInfo);

  // Create horse animation frames
  const baseHorseFrames = [];
  for (let i = 0; i < horseAnimationFrames.length; i++) {
    const horseFrame = new Object3D(-100 - i, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
    if (horseAnimationFrames[i]) {
      horseFrame.prepareVAO(gl, programInfo, horseAnimationFrames[i], horseMaterials);
    } else {
      horseFrame.prepareVAO(gl, programInfo);
    }
    baseHorseFrames.push(horseFrame);
  }
  
  // Create horse IDLE frame for stationary cars
  const baseHorseIdle = new Object3D(-110, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
  if (horseIdleObjData) {
    baseHorseIdle.prepareVAO(gl, programInfo, horseIdleObjData, horseMaterials);
  } else {
    baseHorseIdle.prepareVAO(gl, programInfo);
  }

  // Create building model (with inverted faces for proper rendering)
  const baseBuilding = new Object3D(-3, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], true);
  if (buildingObjData) {
    baseBuilding.prepareVAO(gl, programInfo, buildingObjData, buildingMaterials);
    console.log('Building model loaded successfully');
  } else {
    baseBuilding.prepareVAO(gl, programInfo);
    console.log('Using default cube for buildings');
  }

  // Create traffic light model (red state)
  const baseTrafficLight = new Object3D(-4);
  if (trafficLightObjData) {
    baseTrafficLight.prepareVAO(gl, programInfo, trafficLightObjData, trafficLightMaterials);
    console.log('Traffic light (red) model loaded successfully');
  } else {
    baseTrafficLight.prepareVAO(gl, programInfo);
    console.log('Using default cube for traffic lights');
  }

  // Create traffic light model (green state)
  const baseTrafficLightGreen = new Object3D(-6);
  if (trafficLightObjData) {
    baseTrafficLightGreen.prepareVAO(gl, programInfo, trafficLightObjData, trafficLightMaterialsG);
    console.log('Traffic light (green) model loaded successfully');
  } else {
    baseTrafficLightGreen.prepareVAO(gl, programInfo);
    console.log('Using default cube for green traffic lights');
  }

  // Create road model
  const baseRoad = new Object3D(-5, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], true);
  if (roadObjData) {
    baseRoad.prepareVAO(gl, programInfo, roadObjData, roadMaterials);
    console.log('Road model loaded successfully');
  } else {
    baseRoad.prepareVAO(gl, programInfo);
    console.log('Using default cube for roads');
  }
  
  // Create destination model
  const baseDestination = new Object3D(-7, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], true);
  if (destinationObjData) {
    baseDestination.prepareVAO(gl, programInfo, destinationObjData, destinationMaterials);
    console.log('Destination model loaded successfully');
  } else {
    baseDestination.prepareVAO(gl, programInfo);
    console.log('Using default cube for destinations');
  }

  // Store base models in scene for later reference
  scene.baseCube = baseCube;
  scene.baseHorseFrames = baseHorseFrames;
  scene.baseHorseIdle = baseHorseIdle;
  scene.baseBuilding = baseBuilding;
  scene.baseTrafficLight = baseTrafficLight;
  scene.baseTrafficLightGreen = baseTrafficLightGreen;
  scene.baseRoad = baseRoad;
  scene.baseDestination = baseDestination;

  // Initialize all car agents with IDLE model
  for (const agent of agents) {
    agent.arrays = baseHorseIdle.arrays;
    agent.bufferInfo = baseHorseIdle.bufferInfo;
    agent.vao = baseHorseIdle.vao;
    agent.scale = { x: 0.15, y: 0.15, z: 0.15 };
    
    agent.color = getRandomCarColor();
    
    const initialDirection = agent.dirActual || "Down";
    agent.currentDirection = initialDirection;
    const initialAngle = directionToAngle(initialDirection);
    
    agent.oldRotY = initialAngle;
    agent.rotY = initialAngle;
    agent.oldPosArray = [...agent.posArray];
    agent.oldPosArray[1] += 0.3;
    
    // Initialize animation state
    agent.currentFrame = 0;
    agent.isMoving = false;
    agent.animationStartTime = Date.now();
    
    scene.addObject(agent);
  }

  // Setup obstacles (buildings) with building model
  for (const agent of obstacles) {
    agent.arrays = baseBuilding.arrays;
    agent.bufferInfo = baseBuilding.bufferInfo;
    agent.vao = baseBuilding.vao;
    agent.scale = { x: 0.2, y: 0.4, z: 0.2 };
    agent.color = [0.7, 0.7, 0.7, 1.0];
    agent.position.y += 0.3; // Elevate buildings above streets
    scene.addObject(agent);
  }

  // Setup traffic lights (default: green state)
  for (const light of trafficLights) {
    light.arrays = baseTrafficLightGreen.arrays;
    light.bufferInfo = baseTrafficLightGreen.bufferInfo;
    light.vao = baseTrafficLightGreen.vao;
    light.scale = { x: 0.2, y: 0.2, z: 0.2 };
    
    const isGreen = light.state === true || light.state === "True" || light.state === "true";
    light.color = isGreen ? [0.0, 1.0, 0.0, 1.0] : [1.0, 0.0, 0.0, 1.0];
    light.state = light.state || true;
    light.position.y += 0.3; // Elevate traffic lights above streets
    
    scene.addObject(light);
  }

  // Setup roads
  for (const road of roads) {
    road.arrays = baseRoad.arrays;
    road.bufferInfo = baseRoad.bufferInfo;
    road.vao = baseRoad.vao;
    road.scale = { x: 0.6, y: 0.6, z: 0.6 };
    
    // Apply color from MTL if available
    if (roadMaterials && Object.keys(roadMaterials).length > 0) {
      const firstMaterial = Object.values(roadMaterials)[0];
      if (firstMaterial && firstMaterial.Kd) {
        road.color = [...firstMaterial.Kd, 1.0];
      } else {
        road.color = [0.5, 0.5, 0.5, 0.5];
      }
    } else {
      road.color = [0.5, 0.5, 0.5, 0.5];
    }
    
    scene.addObject(road);
  }
  
  // Setup destinations
  for (const dest of destinations) {
    dest.arrays = baseDestination.arrays;
    dest.bufferInfo = baseDestination.bufferInfo;
    dest.vao = baseDestination.vao;
    dest.scale = { x: 0.05, y: 0.1, z: 0.05 };
    
    // Apply color from MTL if available
    if (destinationMaterials && Object.keys(destinationMaterials).length > 0) {
      const firstMaterial = Object.values(destinationMaterials)[0];
      if (firstMaterial && firstMaterial.Kd) {
        dest.color = [...firstMaterial.Kd, 1.0];
      } else {
        dest.color = [0.5, 0.5, 0.5, 0.5];
      }
    } else {
      dest.color = [0.5, 0.5, 0.5, 0.5];
    }
    
    scene.addObject(dest);
  }
  
  // Add roads beneath buildings for complete street coverage
  let roadIdCounter = -1000;
  for (const building of obstacles) {
    const buildingRoad = new Object3D(roadIdCounter--);
    buildingRoad.arrays = baseRoad.arrays;
    buildingRoad.bufferInfo = baseRoad.bufferInfo;
    buildingRoad.vao = baseRoad.vao;
    buildingRoad.position.x = building.position.x;
    buildingRoad.position.y = building.position.y - 0.3;
    buildingRoad.position.z = building.position.z;
    buildingRoad.scale = { x: 0.6, y: 0.6, z: 0.6 };
    
    if (roadMaterials && Object.keys(roadMaterials).length > 0) {
      const firstMaterial = Object.values(roadMaterials)[0];
      buildingRoad.color = firstMaterial?.Kd ? [...firstMaterial.Kd, 1.0] : [0.5, 0.5, 0.5, 0.5];
    } else {
      buildingRoad.color = [0.5, 0.5, 0.5, 0.5];
    }
    
    scene.addObject(buildingRoad);
  }
  
  // Add roads beneath traffic lights
  for (const light of trafficLights) {
    const lightRoad = new Object3D(roadIdCounter--);
    lightRoad.arrays = baseRoad.arrays;
    lightRoad.bufferInfo = baseRoad.bufferInfo;
    lightRoad.vao = baseRoad.vao;
    lightRoad.position.x = light.position.x;
    lightRoad.position.y = light.position.y - 0.3;
    lightRoad.position.z = light.position.z;
    lightRoad.scale = { x: 0.6, y: 0.6, z: 0.6 };
    
    if (roadMaterials && Object.keys(roadMaterials).length > 0) {
      const firstMaterial = Object.values(roadMaterials)[0];
      lightRoad.color = firstMaterial?.Kd ? [...firstMaterial.Kd, 1.0] : [0.5, 0.5, 0.5, 0.5];
    } else {
      lightRoad.color = [0.5, 0.5, 0.5, 0.5];
    }
    
    scene.addObject(lightRoad);
  }
  
  // Add roads beneath destinations
  for (const dest of destinations) {
    const destRoad = new Object3D(roadIdCounter--);
    destRoad.arrays = baseRoad.arrays;
    destRoad.bufferInfo = baseRoad.bufferInfo;
    destRoad.vao = baseRoad.vao;
    destRoad.position.x = dest.position.x;
    destRoad.position.y = dest.position.y;
    destRoad.position.z = dest.position.z;
    destRoad.scale = { x: 0.6, y: 0.6, z: 0.6 };
    
    if (roadMaterials && Object.keys(roadMaterials).length > 0) {
      const firstMaterial = Object.values(roadMaterials)[0];
      destRoad.color = firstMaterial?.Kd ? [...firstMaterial.Kd, 1.0] : [0.5, 0.5, 0.5, 0.5];
    } else {
      destRoad.color = [0.5, 0.5, 0.5, 0.5];
    }
    
    scene.addObject(destRoad);
  }
  
  // Elevate destinations above streets
  for (const dest of destinations) {
    dest.position.y += 0.3;
  }
}

/**
 * Fetches updated traffic light states from the server and updates their colors
 */
async function updateTrafficLights() {
  try {
    let response = await fetch("http://localhost:8585/getLights");
    
    if (response.ok) {
      let result = await response.json();
      
      for (const lightData of result.positions) {
        const lightObj = scene.objects.find(obj => obj.id == lightData.id);
        
        if (lightObj) {
          const isGreen = lightData.state === true || lightData.state === "true" || lightData.state === 1;
          lightObj.color = isGreen ? [0.0, 1.0, 0.0, 1.0] : [1.0, 0.0, 0.0, 1.0];
          lightObj.state = isGreen;
        }
      }
    }
  } catch (error) {
    console.error("Error updating traffic lights:", error);
  }
}

/**
 * Updates scene objects based on new data from the server
 * Handles adding new cars, removing arrived cars, updating positions,
 * and managing animation states
 */
function updateSceneObjects() {
  // Get current agent IDs for filtering
  const currentAgentIds = new Set(agents.map(agent => agent.id));
  const obstacleIds = new Set(obstacles.map(obs => obs.id));
  const trafficLightIds = new Set(trafficLights.map(light => light.id));
  const roadIds = new Set(roads.map(road => road.id));
  
  // Remove cars that have arrived at their destination
  scene.objects = scene.objects.filter(obj => {
    if (obstacleIds.has(obj.id)) return true;
    if (trafficLightIds.has(obj.id)) return true;
    if (roadIds.has(obj.id)) return true;
    if (obj.id < 0) return true;
    return currentAgentIds.has(obj.id);
  });
  
  // Update traffic light VAOs based on their state
  for (const light of trafficLights) {
    const sceneLight = scene.objects.find(obj => obj.id === light.id);
    if (sceneLight) {
      if (light.state === true) {
        sceneLight.arrays = scene.baseTrafficLightGreen.arrays;
        sceneLight.bufferInfo = scene.baseTrafficLightGreen.bufferInfo;
        sceneLight.vao = scene.baseTrafficLightGreen.vao;
      } else {
        sceneLight.arrays = scene.baseTrafficLight.arrays;
        sceneLight.bufferInfo = scene.baseTrafficLight.bufferInfo;
        sceneLight.vao = scene.baseTrafficLight.vao;
      }
      sceneLight.state = light.state;
    }
  }
  
  // Update car positions and animations
  for (const agent of agents) {
    const existingObj = scene.objects.find(obj => obj.id === agent.id);
    
    if (existingObj) {
      // Calculate current interpolated position
      let currentInterpolatedPos;
      if (existingObj.oldPosArray && existingObj.nextPosArray && existingObj.interpolateStart) {
        const elapsedLocal = Date.now() - existingObj.interpolateStart;
        const t = clamp(elapsedLocal / duration, 0, 1);
        currentInterpolatedPos = [
          lerp(existingObj.oldPosArray[0], existingObj.nextPosArray[0], t),
          lerp(existingObj.oldPosArray[1], existingObj.nextPosArray[1], t),
          lerp(existingObj.oldPosArray[2], existingObj.nextPosArray[2], t)
        ];
      } else {
        currentInterpolatedPos = [...existingObj.posArray];
        currentInterpolatedPos[1] += 0.3;
      }

      // Set up new interpolation target
      const newPos = [agent.position.x, agent.position.y + 0.3, agent.position.z];
      
      existingObj.oldPosArray = currentInterpolatedPos; 
      existingObj.nextPosArray = newPos;
      existingObj.interpolateStart = Date.now();
      
      existingObj.position.x = agent.position.x;
      existingObj.position.y = agent.position.y;
      existingObj.position.z = agent.position.z;
      
      // Determine if car is moving
      const isMoving = Math.abs(currentInterpolatedPos[0] - newPos[0]) > 0.01 || 
                       Math.abs(currentInterpolatedPos[2] - newPos[2]) > 0.01;
      
      // Update animation state
      if (isMoving && !existingObj.isMoving) {
        existingObj.isMoving = true;
        existingObj.animationStartTime = Date.now();
      } else if (!isMoving && existingObj.isMoving) {
        existingObj.isMoving = false;
        existingObj.arrays = scene.baseHorseIdle.arrays;
        existingObj.bufferInfo = scene.baseHorseIdle.bufferInfo;
        existingObj.vao = scene.baseHorseIdle.vao;
      }
      
      // Update animation frame if moving
      if (existingObj.isMoving) {
        const animSpeed = 120; // Milliseconds per frame
        const elapsed = Date.now() - (existingObj.animationStartTime || Date.now());
        const frameIndex = Math.floor(elapsed / animSpeed) % 4;
        
        if (frameIndex !== existingObj.currentFrame) {
          existingObj.currentFrame = frameIndex;
          const horseFrame = scene.baseHorseFrames[frameIndex];
          existingObj.arrays = horseFrame.arrays;
          existingObj.bufferInfo = horseFrame.bufferInfo;
          existingObj.vao = horseFrame.vao;
        }
      }

      // Update rotation based on direction change
      const nextDirection = agent.dirActual || "Down";
      if (existingObj.currentDirection !== nextDirection) {
        const newAngle = directionToAngle(nextDirection);
        
        // Calculate current rotation angle
        let currentAngle;
        if (existingObj.oldRotY !== undefined && existingObj.rotateStart) {
          const rotElapsed = Date.now() - existingObj.rotateStart;
          const rotDuration = duration * 0.5;
          const rotFract = clamp(rotElapsed / rotDuration, 0, 1);
          
          if (rotFract < 1.0) {
            currentAngle = lerp(existingObj.oldRotY, existingObj.rotY, rotFract);
          } else {
            currentAngle = existingObj.rotY;
          }
        } else {
          currentAngle = existingObj.rotY !== undefined ? existingObj.rotY : existingObj.rotRad.y;
        }
        
        // Normalize angles to [-π, π]
        const normalizeAngle = (angle) => {
          while (angle > Math.PI) angle -= 2 * Math.PI;
          while (angle < -Math.PI) angle += 2 * Math.PI;
          return angle;
        };
        
        currentAngle = normalizeAngle(currentAngle);
        const normalizedNew = normalizeAngle(newAngle);
        
        // Calculate shortest rotation path
        let diff = normalizedNew - currentAngle;
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        
        // Start rotation if angle difference is significant
        if (Math.abs(diff) > 0.01) {
          existingObj.oldRotY = currentAngle;
          existingObj.rotY = currentAngle + diff;
          existingObj.currentDirection = nextDirection;
          existingObj.rotateStart = Date.now();
        }
      }
    } else {
      // New agent - initialize from scratch
      agent.arrays = scene.baseHorseIdle.arrays;
      agent.bufferInfo = scene.baseHorseIdle.bufferInfo;
      agent.vao = scene.baseHorseIdle.vao;
      agent.scale = { x: 0.15, y: 0.15, z: 0.15 };
      
      agent.color = getRandomCarColor();
      
      const initialDirection = agent.dirActual || "Down";
      agent.currentDirection = initialDirection;
      const initialAngle = directionToAngle(initialDirection);
      
      agent.rotRad = { x: 0, y: initialAngle, z: 0 };
      agent.oldRotY = initialAngle;
      agent.rotY = initialAngle;
      
      const initialPos = [agent.position.x, agent.position.y + 0.3, agent.position.z];
      agent.oldPosArray = initialPos;
      agent.nextPosArray = initialPos;
      agent.interpolateStart = Date.now();
      
      agent.currentFrame = 0;
      agent.isMoving = false;
      agent.animationStartTime = Date.now();
      
      scene.addObject(agent);
    }
  }
}

/**
 * Renders a single object with smooth interpolation and rotation
 * @param {WebGL2RenderingContext} gl - WebGL context
 * @param {Object} programInfo - Shader program information
 * @param {Object3D} object - The object to render
 * @param {Array<number>} viewProjectionMatrix - Combined view-projection matrix
 * @param {number} globalFract - Global interpolation factor
 */
function drawObject(gl, programInfo, object, viewProjectionMatrix, globalFract) {
  // Calculate local interpolation factor
  let localFract = globalFract;
  if (object.interpolateStart) {
    const elapsedLocal = Date.now() - object.interpolateStart;
    localFract = clamp(elapsedLocal / duration, 0, 1);
  }

  // Interpolate position
  let v3_tra;
  if (object.oldPosArray && object.nextPosArray && localFract < 1.0) {
    v3_tra = [
      lerp(object.oldPosArray[0], object.nextPosArray[0], localFract),
      lerp(object.oldPosArray[1], object.nextPosArray[1], localFract),
      lerp(object.oldPosArray[2], object.nextPosArray[2], localFract)
    ];
    
    // Add jumping animation if moving
    if (object.isMoving) {
      const jumpHeight = 0.1;
      const verticalOffset = Math.sin(Math.PI * localFract) * jumpHeight;
      v3_tra[1] += verticalOffset;
    }
  } else if (object.nextPosArray && localFract >= 1.0) {
    v3_tra = [...object.nextPosArray];
    delete object.oldPosArray;
    delete object.nextPosArray;
    delete object.interpolateStart;
  } else {
    v3_tra = object.posArray;
  }

  // Calculate rotation with smooth interpolation
  let rotY = object.rotRad?.y || 0;
  
  if (object.oldRotY !== undefined && object.rotY !== undefined && object.rotateStart) {
    const rotDuration = duration * 0.5;
    const rotElapsed = Date.now() - object.rotateStart;
    const rotFract = clamp(rotElapsed / rotDuration, 0, 1);
    
    // Apply easing function for smooth rotation
    const easedFract = rotFract < 0.5 
      ? 2 * rotFract * rotFract 
      : 1 - Math.pow(-2 * rotFract + 2, 2) / 2;
    
    rotY = lerp(object.oldRotY, object.rotY, easedFract);
    
    if (rotFract >= 1.0) {
      rotY = object.rotY;
      object.rotRad.y = object.rotY; 
      delete object.oldRotY;
      delete object.rotateStart;
    }
  } else if (object.rotY !== undefined) {
    rotY = object.rotY;
    object.rotRad.y = rotY; 
  }

  let v3_sca = object.scaArray;

  // Build transformation matrix
  const scaMat = M4.scale(v3_sca);
  const rotXMat = M4.rotationX(object.rotRad.x);
  const rotYMat = M4.rotationY(rotY);
  const rotZMat = M4.rotationZ(object.rotRad.z);
  const traMat = M4.translation(v3_tra);
  
  let transforms = M4.identity();
  transforms = M4.multiply(scaMat, transforms);
  transforms = M4.multiply(rotXMat, transforms);
  transforms = M4.multiply(rotYMat, transforms);
  transforms = M4.multiply(rotZMat, transforms);
  transforms = M4.multiply(traMat, transforms);

  object.matrix = transforms;

  // Calculate final transformation matrices
  const wvpMat = M4.multiply(viewProjectionMatrix, transforms);
  const normalMat = M4.transpose(M4.inverse(object.matrix));

  // Set shader uniforms
  let objectUniforms = {
    u_world: transforms,
    u_worldInverseTransform: normalMat,
    u_worldViewProjection: wvpMat,
    u_shininess: object.shininess || 200.0,
  }
  twgl.setUniforms(programInfo, objectUniforms);
  
  // Draw the object
  gl.bindVertexArray(object.vao);
  twgl.drawBufferInfo(gl, object.bufferInfo);
}

/**
 * Main rendering loop
 * Handles animation timing, camera updates, and triggers background updates
 */
async function drawScene() {
  // Calculate delta time
  let now = Date.now();
  let deltaTime = now - then;
  elapsed += deltaTime;
  const fract = Math.min(1.0, elapsed / duration);
  then = now;

  // Clear canvas
  gl.clearColor(0.53, 0.81, 0.92, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Enable face culling and depth testing
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // Update camera controls
  scene.camera.checkKeys();
  const viewProjectionMatrix = setupViewProjection(gl);

  // Draw skybox first
  drawSkybox(gl, viewProjectionMatrix);

  // Switch to Phong shader for objects
  gl.useProgram(phongProgramInfo.program);

  // Set global lighting uniforms
  let globalUniforms = {
    u_viewWorldPosition: scene.camera.posArray,
    u_lightWorldPosition: scene.lights[0].posArray,
    u_ambientLight: scene.lights[0].ambient,
    u_diffuseLight: scene.lights[0].diffuse,
    u_specularLight: scene.lights[0].specular,
  }
  twgl.setUniforms(phongProgramInfo, globalUniforms);

  // Draw all scene objects
  for (let object of scene.objects) {
    drawObject(gl, phongProgramInfo, object, viewProjectionMatrix, fract);
  }

  // Trigger background update at mid-cycle for double buffering effect
  if (elapsed >= duration * 0.5 && !isUpdating && !pendingUpdate) {
    pendingUpdate = true;
    updateInBackground();
  }

  // Reset elapsed time when cycle completes
  if (elapsed >= duration && !isUpdating) {
    elapsed = 0;
  }

  // Continue animation loop
  requestAnimationFrame(drawScene);
}

/**
 * Performs background updates without blocking rendering
 * Fetches new agent data and updates scene objects
 */
async function updateInBackground() {
  if (isUpdating) return;
  
  isUpdating = true;
  try {
    await update();
    await updateTrafficLights();
    updateSceneObjects();
    
    pendingUpdate = false;
  } catch (error) {
    console.error("Error during background update:", error);
  } finally {
    isUpdating = false;
  }
}

/**
 * Sets up the view and projection matrices for rendering
 * @param {WebGL2RenderingContext} gl - WebGL context
 * @returns {Array<number>} Combined view-projection matrix
 */
function setupViewProjection(gl) {
  // 60-degree vertical field of view
  const fov = 60 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  // Create projection matrix
  const projectionMatrix = M4.perspective(fov, aspect, 1, 200);

  // Create view matrix from camera
  const cameraPosition = scene.camera.posArray;
  const target = scene.camera.targetArray;
  const up = [0, 1, 0];

  const cameraMatrix = M4.lookAt(cameraPosition, target, up);
  const viewMatrix = M4.inverse(cameraMatrix);
  const viewProjectionMatrix = M4.multiply(projectionMatrix, viewMatrix);

  return viewProjectionMatrix;
}

/**
 * Sets up user interface controls
 * Currently empty - placeholder for future UI elements
 */
function setupUI() {
  // Empty for now
}

/**
 * Initializes the skybox environment
 * Loads cubemap textures for the six faces of the skybox
 */
function setupSkybox() {
  // Create fullscreen quad
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1,
  ]);
  
  skyboxBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    a_position: { numComponents: 2, data: positions },
  });
  
  skyboxVAO = twgl.createVAOFromBufferInfo(gl, skyboxProgramInfo, skyboxBufferInfo);
  
  // Create cubemap texture
  skyboxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
  
  // Define cubemap faces
  const faceInfos = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: '../assets/maps/posx.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: '../assets/maps/negx.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: '../assets/maps/posy.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: '../assets/maps/negy.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: '../assets/maps/posz.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: '../assets/maps/negz.jpg' },
  ];
  
  // Load each face
  faceInfos.forEach((faceInfo) => {
    const { target, url } = faceInfo;
    
    // Initialize with blue pixel as placeholder
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, pixel);
    
    // Load actual texture
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

/**
 * Renders the skybox
 * @param {WebGL2RenderingContext} gl - WebGL context
 * @param {Array<number>} viewProjectionMatrix - View-projection matrix
 */
function drawSkybox(gl, viewProjectionMatrix) {
  gl.useProgram(skyboxProgramInfo.program);
  gl.bindVertexArray(skyboxVAO);
  
  // Render skybox at maximum depth
  gl.depthFunc(gl.LEQUAL);
  
  // Get view matrix without translation component
  const cameraPosition = scene.camera.posArray;
  const target = scene.camera.targetArray;
  const up = [0, 1, 0];
  const cameraMatrix = M4.lookAt(cameraPosition, target, up);
  const viewMatrix = M4.inverse(cameraMatrix);
  
  // Remove translation
  const viewDirectionMatrix = viewMatrix.slice();
  viewDirectionMatrix[12] = 0;
  viewDirectionMatrix[13] = 0;
  viewDirectionMatrix[14] = 0;
  
  // Calculate matrices for skybox
  const fov = 60 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix = M4.perspective(fov, aspect, 1, 200);
  
  const viewDirectionProjectionMatrix = M4.multiply(projectionMatrix, viewDirectionMatrix);
  const viewDirectionProjectionInverse = M4.inverse(viewDirectionProjectionMatrix);
  
  // Set skybox shader uniforms
  twgl.setUniforms(skyboxProgramInfo, {
    u_viewDirectionProjectionInverse: viewDirectionProjectionInverse,
    u_skybox: skyboxTexture,
  });
  
  // Draw skybox
  twgl.drawBufferInfo(gl, skyboxBufferInfo);
  
  // Reset depth function
  gl.depthFunc(gl.LESS);
}

main();
