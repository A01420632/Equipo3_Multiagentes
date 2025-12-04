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

// Importar shaders de luna
import vsMoonGLSL from '../assets/shaders/vs_moon.glsl?raw';
import fsMoonGLSL from '../assets/shaders/fs_moon.glsl?raw';

const scene = new Scene3D();

// Global variables for WebGL program management
let phongProgramInfo = undefined;
let colorProgramInfo = undefined;
let skyboxProgramInfo = undefined;
let moonProgramInfo = undefined;
let skyboxBufferInfo = undefined;
let skyboxVAO = undefined;
let skyboxTexture = undefined;
let moonTexture = undefined;
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
let treeObjData = null;
let moonObjData = null;

// Variables para animación del caballo
let horseAnimationFrames = []; // Array con los 4 frames de animación
let horseIdleObjData = null;   // Frame IDLE
let horseMaterialsBrown = null;  // Materiales café
let horseMaterialsWhite = null;  // Materiales blanco
let horseMaterialsBlack = null;  // Materiales negro

// Material data for different objects
let carMaterials = null;
let buildingMaterials = null;
let trafficLightMaterials = null;
let trafficLightMaterialsG = null;
let roadMaterials = null;
let destinationMaterials = null;
let treeMaterials = null;
let moonMaterials = null;

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
  moonProgramInfo = twgl.createProgramInfo(gl, [vsMoonGLSL, fsMoonGLSL]);

  // Setup skybox environment
  setupSkybox();

  // Load moon texture
  moonTexture = twgl.createTexture(gl, {
    src: '../assets/models/Moon.jpg',
    crossOrigin: '',
  });
   
  console.log('Loading OBJ models...');
  
  // Load horse animation frames (4 frames) and materials
  const loadHorseFrame = async (url) => {
    const response = await fetch(url);
    return response.ok ? await response.text() : null;
  };
  
  const loadHorseMtl = async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const mtlText = await response.text();
        return loadMtl(mtlText);
      }
    } catch (error) {
      console.error(`Error loading horse MTL from ${url}:`, error);
    }
    return null;
  };
  
  horseMaterialsBrown = await loadHorseMtl('../assets/models/Horse_Brown.mtl');
  horseMaterialsWhite = await loadHorseMtl('../assets/models/Horse_White.mtl');
  horseMaterialsBlack = await loadHorseMtl('../assets/models/Horse_Black.mtl');
  
  horseAnimationFrames = [
    await loadHorseFrame('../assets/models/Horse1.obj'),
    await loadHorseFrame('../assets/models/Horse2.obj'),
    await loadHorseFrame('../assets/models/Horse3.obj'),
    await loadHorseFrame('../assets/models/Horse4.obj')
  ];
  
  horseIdleObjData = await loadHorseFrame('../assets/models/HorseIdle.obj');
  
  const buildingData = await loadObjFile('../assets/models/House.obj');
  const trafficLightData = await loadObjFile('../assets/models/Lantern.obj');
  const trafficLightDataGreen = await loadObjFile('../assets/models/LanternOn.obj');
  const roadData = await loadObjFile('../assets/models/Road.obj');
  const destinationData = await loadObjFile('../assets/models/Barrack.obj');
  const treeData = await loadObjFile('../assets/models/Tree.obj');
  const moonData = await loadObjFile('../assets/models/Moon.obj');
  
  // Extract OBJ data and materials
  buildingObjData = buildingData ? buildingData.objData : null;
  trafficLightObjData = trafficLightData ? trafficLightData.objData : null;
  roadObjData = roadData ? roadData.objData : null;
  destinationObjData = destinationData ? destinationData.objData : null;
  treeObjData = treeData ? treeData.objData : null;
  moonObjData = moonData ? moonData.objData : null;
  
  buildingMaterials = buildingData ? buildingData.materials : null;
  trafficLightMaterials = trafficLightData ? trafficLightData.materials : null;
  trafficLightMaterialsG = trafficLightDataGreen ? trafficLightDataGreen.materials : null;
  roadMaterials = roadData ? roadData.materials : null;
  destinationMaterials = destinationData ? destinationData.materials : null;
  treeMaterials = treeData ? treeData.materials : null;
  moonMaterials = moonData ? moonData.materials : null;
  
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
    [18, 40, 17.5], // Position (Luna)
    [0.15, 0.15, 0.2, 1.0],// Ambient (luz lunar azulada tenue)
    [0.2, 0.2, 0.25, 1.0],  // Diffuse (muy bajo para ambiente nocturno)
    [0.1, 0.1, 0.15, 1.0]); // Specular (mínimo)
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

function getRandomHorseColor() {
  const colors = [
    [0.174647, 0.074214, 0.046665, 1.0],  // Café (color original del MTL)
    [0.95, 0.95, 0.95, 1.0],  // Blanco
    [0.1, 0.1, 0.1, 1.0],  // Negro
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

  // Create horse animation frames for each color
  const baseHorseFramesBrown = [];
  const baseHorseFramesWhite = [];
  const baseHorseFramesBlack = [];
  
  for (let i = 0; i < horseAnimationFrames.length; i++) {
    // Frames café
    const horseFrameBrown = new Object3D(-100 - i, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
    if (horseAnimationFrames[i]) {
      horseFrameBrown.prepareVAO(gl, programInfo, horseAnimationFrames[i], horseMaterialsBrown);
    } else {
      horseFrameBrown.prepareVAO(gl, programInfo);
    }
    baseHorseFramesBrown.push(horseFrameBrown);
    
    // Frames blanco
    const horseFrameWhite = new Object3D(-200 - i, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
    if (horseAnimationFrames[i]) {
      horseFrameWhite.prepareVAO(gl, programInfo, horseAnimationFrames[i], horseMaterialsWhite);
    } else {
      horseFrameWhite.prepareVAO(gl, programInfo);
    }
    baseHorseFramesWhite.push(horseFrameWhite);
    
    // Frames negro
    const horseFrameBlack = new Object3D(-300 - i, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
    if (horseAnimationFrames[i]) {
      horseFrameBlack.prepareVAO(gl, programInfo, horseAnimationFrames[i], horseMaterialsBlack);
    } else {
      horseFrameBlack.prepareVAO(gl, programInfo);
    }
    baseHorseFramesBlack.push(horseFrameBlack);
  }
  
  // Create horse IDLE frames
  const baseHorseIdleBrown = new Object3D(-110, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
  const baseHorseIdleWhite = new Object3D(-210, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
  const baseHorseIdleBlack = new Object3D(-310, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
  
  if (horseIdleObjData) {
    baseHorseIdleBrown.prepareVAO(gl, programInfo, horseIdleObjData, horseMaterialsBrown);
    baseHorseIdleWhite.prepareVAO(gl, programInfo, horseIdleObjData, horseMaterialsWhite);
    baseHorseIdleBlack.prepareVAO(gl, programInfo, horseIdleObjData, horseMaterialsBlack);
  } else {
    baseHorseIdleBrown.prepareVAO(gl, programInfo);
    baseHorseIdleWhite.prepareVAO(gl, programInfo);
    baseHorseIdleBlack.prepareVAO(gl, programInfo);
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

  // Create destination model from OBJ
  const baseDestination = new Object3D(-7, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], true);
  if (destinationObjData) {
    baseDestination.prepareVAO(gl, programInfo, destinationObjData, destinationMaterials);
    console.log('Destination model loaded successfully');
  } else {
    baseDestination.prepareVAO(gl, programInfo);
    console.log('Using default cube for destinations');
  }

   // Create tree model from OBJ
  const baseTree = new Object3D(-8, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], true);
  if (treeObjData) {
    baseTree.prepareVAO(gl, programInfo, treeObjData, treeMaterials);
    console.log('Tree model loaded successfully');
  } else {
    baseTree.prepareVAO(gl, programInfo);
    console.log('Using default cube for trees');
  }

  // Create moon model from OBJ (usar shader de luna con textura)
  const baseMoon = new Object3D(-9, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
  if (moonObjData) {
    baseMoon.prepareVAO(gl, moonProgramInfo, moonObjData, moonMaterials);
    console.log('Moon model loaded successfully');
  } else {
    baseMoon.prepareVAO(gl, moonProgramInfo);
    console.log('Using default cube for moon');
  }

  // Store base models in scene for later reference
  scene.baseCube = baseCube;
  scene.baseHorseFramesBrown = baseHorseFramesBrown;
  scene.baseHorseFramesWhite = baseHorseFramesWhite;
  scene.baseHorseFramesBlack = baseHorseFramesBlack;
  scene.baseHorseIdleBrown = baseHorseIdleBrown;
  scene.baseHorseIdleWhite = baseHorseIdleWhite;
  scene.baseHorseIdleBlack = baseHorseIdleBlack;
  scene.baseBuilding = baseBuilding;
  scene.baseTrafficLight = baseTrafficLight;
  scene.baseTrafficLightGreen = baseTrafficLightGreen;
  scene.baseRoad = baseRoad;
  scene.baseDestination = baseDestination;
  scene.baseTree = baseTree;
  scene.baseMoon = baseMoon;

  // Place moon at light position (fixed world position)
  const moon = new Object3D(-10000, [18, 40, 17.5], [0,0,0], [3,3,3], [0.9, 0.9, 0.95, 1.0], false);
  moon.arrays = baseMoon.arrays;
  moon.bufferInfo = baseMoon.bufferInfo;
  moon.vao = baseMoon.vao;
  moon.isFixedPosition = true; // Marcar como posición fija en el mundo
  scene.addObject(moon);

  // Initialize car agents with IDLE model
  for (const agent of agents) {
    // Asignar color aleatorio (0=café, 1=blanco, 2=negro)
    agent.horseColorType = Math.floor(Math.random() * 3);
    
    // Seleccionar el modelo IDLE según el color
    let idleModel;
    if (agent.horseColorType === 0) {
      idleModel = baseHorseIdleBrown;
    } else if (agent.horseColorType === 1) {
      idleModel = baseHorseIdleWhite;
    } else {
      idleModel = baseHorseIdleBlack;
    }
    
    // Inicializar con frame IDLE del color correspondiente
    agent.arrays = idleModel.arrays;
    agent.bufferInfo = idleModel.bufferInfo;
    agent.vao = idleModel.vao;
    agent.scale = { x: 0.15, y: 0.15, z: 0.15 };
    
    const initialDirection = agent.dirActual || "Down";
    agent.currentDirection = initialDirection;
    const initialAngle = directionToAngle(initialDirection);

    agent.rotRad = agent.rotRad || { x: 0, y: initialAngle, z: 0 };

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
    // Decidir si es árbol o edificio
    if (agent.is_tree) {
      agent.arrays = baseTree.arrays;
      agent.bufferInfo = baseTree.bufferInfo;
      agent.vao = baseTree.vao;
      agent.scale = { x: 0.2, y: 0.4, z: 0.2 };
      
      // Color verde para árboles
      if (treeMaterials && Object.keys(treeMaterials).length > 0) {
        const firstMaterial = Object.values(treeMaterials)[0];
        agent.color = firstMaterial?.Kd ? [...firstMaterial.Kd, 1.0] : [0.15, 0.50, 0.15, 1.0];
      } else {
        agent.color = [0.15, 0.50, 0.15, 1.0];
      }
    } else {
      agent.arrays = baseBuilding.arrays;
      agent.bufferInfo = baseBuilding.bufferInfo;
      agent.vao = baseBuilding.vao;
      
      // Escala aleatoria en Y para edificios de diferentes alturas
      const randomHeight = 0.2 + Math.random() * 0.2; // Entre 0.2 y 0.4
      agent.scale = { x: 0.2, y: randomHeight, z: 0.2 };
      agent.color = [0.7, 0.7, 0.7, 1.0];
      
      // Apply rotation to buildings only
      if (agent.serverRotation !== undefined) {
        agent.rotY = (agent.serverRotation * Math.PI) / 180;
      }
    }
    
    agent.position.y += 0.3; // Elevar sobre las calles
    scene.addObject(agent);
  }

  // Setup traffic lights with traffic light model (default: verde)
  let trafficLightIndex = 1; // Empezar desde 1, el 0 es la luz global
  for (const light of trafficLights) {
    light.arrays = baseTrafficLightGreen.arrays;
    light.bufferInfo = baseTrafficLightGreen.bufferInfo;
    light.vao = baseTrafficLightGreen.vao;
    light.scale = { x: 0.2, y: 0.2, z: 0.2 };
    
    const isGreen = light.state === true || light.state === "True" || light.state === "true";
    light.color = isGreen ? [0.0, 1.0, 0.0, 1.0] : [1.0, 0.0, 0.0, 1.0];
    light.state = light.state || true; // Default verde
    light.position.y += 0.3; // Elevar semáforos sobre las calles
    light.lightIndex = null; // Se asignará dinámicamente en updateTrafficLights
    
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
    dest.scale = { x: 0.01, y: 0.02, z: 0.01 };
    
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
    
    // Aplicar rotación si está disponible (convertir grados a radianes)
    if (dest.serverRotation !== undefined) {
      dest.rotY = (dest.serverRotation * Math.PI) / 180;
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
   
  // Agregar calles debajo de destinos
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
  
  // Lift destinations above streets
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
      
      // Primero, eliminar todas las luces de linternas (mantener solo la luz global en index 0)
      scene.lights = scene.lights.slice(0, 1);
      
      // Resetear todos los lightIndex
      for (const obj of scene.objects) {
        if (obj.lightIndex !== undefined) {
          obj.lightIndex = null;
        }
      }
      
      // Ahora crear luces solo para semáforos en verde
      let nextLightIndex = 1;
      for (const lightData of result.positions) {
        const lightObj = scene.objects.find(obj => obj.id == lightData.id);
        
        if (lightObj) {
          const isGreen = lightData.state === true || lightData.state === "true" || lightData.state === 1;
          
          lightObj.color = isGreen ? [0.0, 1.0, 0.0, 1.0] : [1.0, 0.0, 0.0, 1.0];
          lightObj.state = isGreen;
          
          // Solo crear luz si está en verde
          if (isGreen) {
            const lanternLight = new Light3D(
              nextLightIndex,
              [lightObj.position.x, lightObj.position.y + 0.8, lightObj.position.z],
              [0.0, 0.0, 0.0, 1.0],
              [0.8, 0.7, 0.3, 1.0],
              [0.6, 0.5, 0.2, 1.0]
            );
            scene.addLight(lanternLight);
            lightObj.lightIndex = nextLightIndex;
            nextLightIndex++;
          }
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
  const destinationIds = new Set(destinations.map(dest => dest.id));
  
  // Remove cars that have arrived at their destination
  scene.objects = scene.objects.filter(obj => {
    if (obstacleIds.has(obj.id)) return true;
    if (trafficLightIds.has(obj.id)) return true;
    if (roadIds.has(obj.id)) return true;
    if (destinationIds.has(obj.id)) return true;
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
      if (!existingObj.rotRad) {
        const fallbackAngle = existingObj.rotY ?? directionToAngle(existingObj.currentDirection || "Down");
        existingObj.rotRad = { x: 0, y: fallbackAngle, z: 0 };
      }

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
        // Usar el modelo IDLE del color correspondiente
        let idleModel;
        if (existingObj.horseColorType === 0) {
          idleModel = scene.baseHorseIdleBrown;
        } else if (existingObj.horseColorType === 1) {
          idleModel = scene.baseHorseIdleWhite;
        } else {
          idleModel = scene.baseHorseIdleBlack;
        }
        existingObj.arrays = idleModel.arrays;
        existingObj.bufferInfo = idleModel.bufferInfo;
        existingObj.vao = idleModel.vao;
      }
      
      // Update animation frame if moving
      if (existingObj.isMoving) {
        const animSpeed = 120; // Milliseconds per frame
        const elapsed = Date.now() - (existingObj.animationStartTime || Date.now());
        const frameIndex = Math.floor(elapsed / animSpeed) % 4;
        
        if (frameIndex !== existingObj.currentFrame) {
          existingObj.currentFrame = frameIndex;
          // Usar los frames del color correspondiente
          let horseFrames;
          if (existingObj.horseColorType === 0) {
            horseFrames = scene.baseHorseFramesBrown;
          } else if (existingObj.horseColorType === 1) {
            horseFrames = scene.baseHorseFramesWhite;
          } else {
            horseFrames = scene.baseHorseFramesBlack;
          }
          const horseFrame = horseFrames[frameIndex];
          existingObj.arrays = horseFrame.arrays;
          existingObj.bufferInfo = horseFrame.bufferInfo;
          existingObj.vao = horseFrame.vao;
        }
      }

      // Update rotation based on upcoming nextDir (not dirActual)
      const upcomingDirection = agent.nextDir || agent.dirActual || "Down";
      const targetAngle = directionToAngle(upcomingDirection);

      // Calculate current rotation angle (consider ongoing interpolation)
      let currentAngle;
      if (existingObj.oldRotY !== undefined && existingObj.rotateStart) {
        const rotElapsed = Date.now() - existingObj.rotateStart;
        const rotDuration = duration * 0.5;
        const rotFract = clamp(rotElapsed / rotDuration, 0, 1);
        currentAngle = rotFract < 1.0
          ? lerp(existingObj.oldRotY, existingObj.rotY, rotFract)
          : existingObj.rotY;
      } else {
        currentAngle = existingObj.rotY !== undefined ? existingObj.rotY : existingObj.rotRad.y;
      }

      // Normalize and shortest diff
      const normalizeAngle = (angle) => {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
      };
      currentAngle = normalizeAngle(currentAngle);
      const desired = normalizeAngle(targetAngle);
      let diff = desired - currentAngle;
      if (diff > Math.PI) diff -= 2 * Math.PI;
      if (diff < -Math.PI) diff += 2 * Math.PI;

      // Start rotation when nextDir changes or angle differs
      const upcomingChanged = existingObj.pendingDirection !== upcomingDirection;
      if (upcomingChanged || Math.abs(diff) > 0.01) {
        existingObj.pendingDirection = upcomingDirection;   // track upcoming
        existingObj.oldRotY = currentAngle;                 // from current
        existingObj.rotY = currentAngle + diff;             // to target
        existingObj.rotateStart = Date.now();               // start interp
      }
    } else {
      // New agent
      agent.horseColorType = Math.floor(Math.random() * 3);
      
      // Seleccionar modelo IDLE según color
      let idleModel;
      if (agent.horseColorType === 0) {
        idleModel = scene.baseHorseIdleBrown;
      } else if (agent.horseColorType === 1) {
        idleModel = scene.baseHorseIdleWhite;
      } else {
        idleModel = scene.baseHorseIdleBlack;
      }
      
      agent.arrays = idleModel.arrays;
      agent.bufferInfo = idleModel.bufferInfo;
      agent.vao = idleModel.vao;
      agent.scale = { x: 0.15, y: 0.15, z: 0.15 };
      
      const initialDirection = agent.nextDir || agent.dirActual || "Down";
      agent.currentDirection = initialDirection;
      const initialAngle = directionToAngle(initialDirection);

      agent.rotRad = agent.rotRad || { x: 0, y: initialAngle, z: 0 };
      agent.oldRotY = initialAngle;
      agent.rotY = initialAngle;
      agent.pendingDirection = initialDirection;
      
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
 * Render one object with interpolation and rotation
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

  // Ensure rotation container exists
  if (!object.rotRad) {
    object.rotRad = { x: 0, y: object.rotY ?? 0, z: 0 };
  }

  // Interpolate rotation toward target
  let rotY = object.rotRad.y || 0;
  if (object.oldRotY !== undefined && object.rotY !== undefined && object.rotateStart) {
    const rotDuration = duration * 0.5;
    const rotElapsed = Date.now() - object.rotateStart;
    const rotFract = clamp(rotElapsed / rotDuration, 0, 1);
    const easedFract = rotFract < 0.5
      ? 2 * rotFract * rotFract
      : 1 - Math.pow(-2 * rotFract + 2, 2) / 2;

    rotY = lerp(object.oldRotY, object.rotY, easedFract);

    // Finish rotation
    if (rotFract >= 1.0) {
      rotY = object.rotY;
      object.rotRad.y = rotY;
      if (object.pendingDirection) {
        object.currentDirection = object.pendingDirection; // commit after turn
        delete object.pendingDirection;
      }
      delete object.oldRotY;
      delete object.rotateStart;
    }
  } else if (object.rotY !== undefined) {
    rotY = object.rotY;
    object.rotRad.y = rotY;
  }

  // Ensure scale exists
  let v3_sca = object.scaArray;
  if (!v3_sca) {
    const sc = object.scale || { x: 1, y: 1, z: 1 };
    v3_sca = [sc.x, sc.y, sc.z];
    object.scaArray = v3_sca;
  }

  // Build transformation matrix
  const scaMat = M4.scale(v3_sca);
  const rotXMat = M4.rotationX(object.rotRad.x || 0);
  const rotYMat = M4.rotationY(rotY);
  const rotZMat = M4.rotationZ(object.rotRad.z || 0);
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
 * Main render loop
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

  // Draw the moon with special shader and texture
  const moon = scene.objects.find(obj => obj.id === -10000);
  if (moon) {
    gl.useProgram(moonProgramInfo.program);
    
    // Set light uniforms for moon (emissive)
    const moonLightUniforms = {
      u_viewWorldPosition: scene.camera.posArray,
      u_lightWorldPosition: scene.lights[0].posArray,
      u_ambientLight: scene.lights[0].ambient,
      u_diffuseLight: scene.lights[0].diffuse,
      u_specularLight: scene.lights[0].specular,
      u_texture: moonTexture,
      u_emissive: 0.6, // La luna emite luz propia (60% de brillo)
    };
    twgl.setUniforms(moonProgramInfo, moonLightUniforms);
    drawObject(gl, moonProgramInfo, moon, viewProjectionMatrix, fract);
  }
  
  // Switch back to phong program for other objects
  gl.useProgram(phongProgramInfo.program);
  
  // Draw the objects
  for (let object of scene.objects) {
    // Skip moon since we already drew it
    if (object.id === -10000) continue;
    // Encontrar la linterna encendida más cercana (si existe)
    let closestLantern = null;
    let closestDistance = Infinity;
    
    for (let i = 1; i < scene.lights.length; i++) { // Empezar desde 1 (saltar luz global)
      const light = scene.lights[i];
      const dx = light.posArray[0] - object.position.x;
      const dy = light.posArray[1] - object.position.y;
      const dz = light.posArray[2] - object.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Solo considerar luces activas (amarillas) y dentro del radio
      if (distance < closestDistance && distance < 5.0 && 
          light.diffuse[0] > 0) { // Verificar que la luz esté "encendida"
        closestDistance = distance;
        closestLantern = light;
      }
    }
    
    // Configurar uniforms para este objeto
    if (closestLantern) {
      // Hay una linterna cerca: usar su posición como fuente de luz principal
      const attenuation = Math.max(0, 1.0 - (closestDistance / 5.0)); // Fade out con distancia
      
      let lanternUniforms = {
        u_viewWorldPosition: scene.camera.posArray,
        u_lightWorldPosition: closestLantern.posArray, // Usar posición de la linterna
        u_ambientLight: scene.lights[0].ambient, // Ambiente lunar tenue
        u_diffuseLight: [
          scene.lights[0].diffuse[0] + closestLantern.diffuse[0] * attenuation * 3.5,
          scene.lights[0].diffuse[1] + closestLantern.diffuse[1] * attenuation * 3.5,
          scene.lights[0].diffuse[2] + closestLantern.diffuse[2] * attenuation * 3.0,
          1.0
        ],
        u_specularLight: [
          closestLantern.specular[0] * attenuation * 2.5,
          closestLantern.specular[1] * attenuation * 2.5,
          closestLantern.specular[2] * attenuation * 2.0,
          1.0
        ],
      };
      twgl.setUniforms(phongProgramInfo, lanternUniforms);
    } else {
      // No hay linterna cerca: usar solo luz global tenue (ambiente nocturno)
      let globalUniforms = {
        u_viewWorldPosition: scene.camera.posArray,
        u_lightWorldPosition: scene.lights[0].posArray,
        u_ambientLight: scene.lights[0].ambient,
        u_diffuseLight: scene.lights[0].diffuse,
        u_specularLight: scene.lights[0].specular,
      };
      twgl.setUniforms(phongProgramInfo, globalUniforms);
    }
    
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
