/*
 * Base program for a 3D scene that connects to an API to get the movement
 * of agents.
 * The scene shows colored cubes
 *
 * Gilberto Echeverria
 * 2025-11-08
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

// Functions and arrays for the communication with the API
import {
  agents, obstacles, trafficLights, roads, destinations, initAgentsModel,
  update, getCars, getLights, getDestination, getRoads, getObstacles
} from '../libs/api_connection.js';

// Importar shaders de Phong
import vsGLSL from '../assets/shaders/vs_phong_301.glsl?raw';
import fsGLSL from '../assets/shaders/fs_phong_301.glsl?raw';

// Importar shaders de color (renombrados)
import vsColorGLSL from '../assets/shaders/vs_color.glsl?raw';
import fsColorGLSL from '../assets/shaders/fs_color.glsl?raw';

// Importar shaders de skybox
import vsSkyboxGLSL from '../assets/shaders/vs_skybox.glsl?raw';
import fsSkyboxGLSL from '../assets/shaders/fs_skybox.glsl?raw';

const scene = new Scene3D();

// Global variables
let phongProgramInfo = undefined;
let colorProgramInfo = undefined;
let skyboxProgramInfo = undefined;
let skyboxBufferInfo = undefined;
let skyboxVAO = undefined;
let skyboxTexture = undefined;
let gl = undefined;
const duration = 1000; // ms
let elapsed = 0;
let then = 0;

let isUpdating = false;
let pendingUpdate = false;

// Global variables for OBJ models
let carObjData = null;
let buildingObjData = null;
let trafficLightObjData = null;
let roadObjData = null;

// Variables para animación del caballo
let horseAnimationFrames = []; // Array con los 4 frames de animación
let horseIdleObjData = null;   // Frame IDLE
let horseMaterials = null;     // Materiales compartidos

// Global variables for MTL materials
let carMaterials = null;
let buildingMaterials = null;
let trafficLightMaterials = null;
let trafficLightMaterialsG = null;
let roadMaterials = null;

let angulobase = Math.PI;//-Math.PI / 2;
const DIRECTION_ANGLES = {
  "Right": -Math.PI / 2 + angulobase, // -90° (apunta hacia +X)
  "Left": Math.PI / 2 + angulobase, // 90° (apunta hacia -X)
  "Up": Math.PI + angulobase, // 180° (apunta hacia +Z) 
  "Down": 0 + angulobase // 0° (apunta hacia -Z)
};

// Helpers para interpotlacion
function lerp(a, b, t) { 
  return a + (b - a) * t; 
}
function clamp(x, min, max) { return Math.max(min, Math.min(max, x)); } // restringe movimiento a rango permitido


// Function to load OBJ files with optional MTL
async function loadObjFile(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    console.log(`Successfully loaded OBJ from ${url}`);
    
    // Try to load corresponding MTL file
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

async function main() {
  // Setup the canvas area
  const canvas = document.querySelector('canvas');
  gl = canvas.getContext('webgl2');
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  phongProgramInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);
  // Prepare the program with the shaders
  colorProgramInfo = twgl.createProgramInfo(gl, [vsColorGLSL, fsColorGLSL]);
  skyboxProgramInfo = twgl.createProgramInfo(gl, [vsSkyboxGLSL, fsSkyboxGLSL]);

  // Setup skybox
  setupSkybox();

  // Load OBJ models from assets folder
  console.log('Loading OBJ models...');
  
  // Cargar frames de animación del caballo
  const horse1Data = await loadObjFile('../assets/models/Horse1.obj');
  const horse2Data = await loadObjFile('../assets/models/Horse2.obj');
  const horse3Data = await loadObjFile('../assets/models/Horse3.obj');
  const horse4Data = await loadObjFile('../assets/models/Horse4.obj');
  const horseIdleData = await loadObjFile('../assets/models/HorseIdle.obj');
  
  // Guardar los frames de animación
  horseAnimationFrames = [
    horse1Data ? horse1Data.objData : null,
    horse2Data ? horse2Data.objData : null,
    horse3Data ? horse3Data.objData : null,
    horse4Data ? horse4Data.objData : null
  ];
  
  horseIdleObjData = horseIdleData ? horseIdleData.objData : null;
  horseMaterials = horse1Data ? horse1Data.materials : null;
  
  const buildingData = await loadObjFile('../assets/models/House.obj');
  const trafficLightData = await loadObjFile('../assets/models/Lantern.obj'); //Semaforo -> Tambien cambiar escala
  const trafficLightDataGreen = await loadObjFile('../assets/models/LanternOn.obj'); //SemaforoVerde
  const roadData = await loadObjFile('../assets/models/Road.obj');
  
  // Extract OBJ data and materials
  buildingObjData = buildingData ? buildingData.objData : null;
  trafficLightObjData = trafficLightData ? trafficLightData.objData : null;
  roadObjData = roadData ? roadData.objData : null;
  
  buildingMaterials = buildingData ? buildingData.materials : null;
  trafficLightMaterials = trafficLightData ? trafficLightData.materials : null;
  trafficLightMaterialsG = trafficLightDataGreen ? trafficLightDataGreen.materials : null;
  roadMaterials = roadData ? roadData.materials : null;
  
  console.log('OBJ models and materials loaded');

  // Initialize the agents model
  await initAgentsModel();

  // Get the agents and obstacles
  await getCars();
  await getLights();
  await getDestination();
  await getObstacles();
  await getRoads();


  // Initialize the scene
  setupScene();

  // Position the objects in the scene
  setupObjects(scene, gl, phongProgramInfo);

  // Prepare the user interface
  setupUI();

  // Fisrt call to the drawing loop
  drawScene();
}



function setupScene() {
  let camera = new Camera3D(0,
    10,             // Distance to target
    4,              // Azimut
    0.8,              // Elevation
    [0, 0, 10],
    [0, 0, 0]);
  // These values are empirical.
  // Maybe find a better way to determine them
  camera.panOffset = [0, 8, 0];
  scene.setCamera(camera);
  scene.camera.setupControls();

  let light = new Light3D(0, 
    [3, 3, 5], // Position
    [0.3, 0.3, 0.3, 1.0],// Ambient
    [1.0, 1.0, 1.0, 1.0],  // Diffuse
    [1.0, 1.0, 1.0, 1.0]); // Specular
  scene.addLight(light);
}

function directionToAngle(direction) {
  return DIRECTION_ANGLES[direction] || 0;
}

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

function getRandomCarColor() {
  const colors = [
    [1.0, 0.0, 0.0, 1.0],  // Rojo
    [0.0, 0.0, 1.0],  // Azul
    [1.0, 1.0, 0.0],  // Amarillo
    [0.0, 1.0, 0.0],  // Verde
    [1.0, 0.5, 0.0],  // Naranja
    [0.5, 0.0, 0.5],  // Púrpura
    [0.0, 1.0, 1.0],  // Cian
    [1.0, 1.0, 1.0],  // Blanco
    [0.2, 0.2, 0.2],  // Negro
    [0.7, 0.7, 0.7],  // Gris
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function setupObjects(scene, gl, programInfo) {
  // Create VAOs for the different shapes
  const baseCube = new Object3D(-1);
  baseCube.prepareVAO(gl, programInfo);

  // Create horse animation frames
  const baseHorseFrames = [];
  for (let i = 0; i < horseAnimationFrames.length; i++) {
    const horseFrame = new Object3D(-100 - i, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
    if (horseAnimationFrames[i]) {
      horseFrame.prepareVAO(gl, programInfo, horseAnimationFrames[i], horseMaterials);
      console.log(`Horse animation frame ${i + 1} loaded successfully`);
    } else {
      horseFrame.prepareVAO(gl, programInfo);
    }
    baseHorseFrames.push(horseFrame);
  }
  
  // Create horse IDLE frame
  const baseHorseIdle = new Object3D(-110, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], false);
  if (horseIdleObjData) {
    baseHorseIdle.prepareVAO(gl, programInfo, horseIdleObjData, horseMaterials);
    console.log('Horse IDLE model loaded successfully');
  } else {
    baseHorseIdle.prepareVAO(gl, programInfo);
  }

  // Create building model from OBJ (invertir caras)
  const baseBuilding = new Object3D(-3, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], true);
  if (buildingObjData) {
    baseBuilding.prepareVAO(gl, programInfo, buildingObjData, buildingMaterials);
    console.log('Building model loaded successfully');
  } else {
    baseBuilding.prepareVAO(gl, programInfo);
    console.log('Using default cube for buildings');
  }

  // Create traffic light model from OBJ (rojo)
  const baseTrafficLight = new Object3D(-4);
  if (trafficLightObjData) {
    baseTrafficLight.prepareVAO(gl, programInfo, trafficLightObjData, trafficLightMaterials);
    console.log('Traffic light (red) model loaded successfully');
  } else {
    baseTrafficLight.prepareVAO(gl, programInfo);
    console.log('Using default cube for traffic lights');
  }

  // Create traffic light model (verde)
  const baseTrafficLightGreen = new Object3D(-6);
  if (trafficLightObjData) {
    baseTrafficLightGreen.prepareVAO(gl, programInfo, trafficLightObjData, trafficLightMaterialsG);
    console.log('Traffic light (green) model loaded successfully');
  } else {
    baseTrafficLightGreen.prepareVAO(gl, programInfo);
    console.log('Using default cube for green traffic lights');
  }

  // Create road model from OBJ
  const baseRoad = new Object3D(-5, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], true);
  if (roadObjData) {
    baseRoad.prepareVAO(gl, programInfo, roadObjData, roadMaterials);
    console.log('Road model loaded successfully');
  } else {
    baseRoad.prepareVAO(gl, programInfo);
    console.log('Using default cube for roads');
  }

  // Store the base models for later use
  scene.baseCube = baseCube;
  scene.baseHorseFrames = baseHorseFrames;
  scene.baseHorseIdle = baseHorseIdle;
  scene.baseBuilding = baseBuilding;
  scene.baseTrafficLight = baseTrafficLight;
  scene.baseTrafficLightGreen = baseTrafficLightGreen;
  scene.baseRoad = baseRoad;

  // Setup horses with IDLE model
  for (const agent of agents) {
    // Inicializar con frame IDLE
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
    
    // Variables para animación
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
    agent.scale = { x: 0.2, y: 0.4, z: 0.2 }; //{ x: 0.03, y: 0.05, z: 0.03 }
    agent.color = [0.7, 0.7, 0.7, 1.0];
    agent.position.y += 0.3; // Elevar edificios sobre las calles
    scene.addObject(agent);
  }

  // Setup traffic lights with traffic light model (default: verde)
  for (const light of trafficLights) {
    light.arrays = baseTrafficLightGreen.arrays;
    light.bufferInfo = baseTrafficLightGreen.bufferInfo;
    light.vao = baseTrafficLightGreen.vao;
    light.scale = { x: 0.2, y: 0.2, z: 0.2 }; //Semaforos: { x: 0.1, y: 0.1, z: 0.1 };
    
    const isGreen = light.state === true || light.state === "True" || light.state === "true";
    light.color = isGreen ? [0.0, 1.0, 0.0, 1.0] : [1.0, 0.0, 0.0, 1.0];
    light.state = light.state || true; // Default verde
    light.position.y += 0.3; // Elevar semáforos sobre las calles
    
    scene.addObject(light);
  }

  // Setup roads with road model
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
        road.color = [0.5, 0.5, 0.5, 0.5]; // Gris oscuro fallback
      }
    } else {
      road.color = [0.5, 0.5, 0.5, 0.5]; // Gris oscuro fallback
    }
    
    scene.addObject(road);
  }
  
  // Agregar calles debajo de edificios
  let roadIdCounter = -1000;
  for (const building of obstacles) {
    const buildingRoad = new Object3D(roadIdCounter--);
    buildingRoad.arrays = baseRoad.arrays;
    buildingRoad.bufferInfo = baseRoad.bufferInfo;
    buildingRoad.vao = baseRoad.vao;
    buildingRoad.position.x = building.position.x;
    buildingRoad.position.y = building.position.y - 0.3; // Posición original antes de elevar el edificio
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
  
  // Agregar calles debajo de semáforos
  for (const light of trafficLights) {
    const lightRoad = new Object3D(roadIdCounter--);
    lightRoad.arrays = baseRoad.arrays;
    lightRoad.bufferInfo = baseRoad.bufferInfo;
    lightRoad.vao = baseRoad.vao;
    lightRoad.position.x = light.position.x;
    lightRoad.position.y = light.position.y - 0.3; // Posición original antes de elevar el semáforo
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
  
  // Elevar destinos sobre las calles
  for (const dest of destinations) {
    dest.position.y += 0.3;
  }
}

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

function updateSceneObjects() {
  const currentAgentIds = new Set(agents.map(agent => agent.id));
  const obstacleIds = new Set(obstacles.map(obs => obs.id));
  const trafficLightIds = new Set(trafficLights.map(light => light.id));
  const roadIds = new Set(roads.map(road => road.id));
  
  scene.objects = scene.objects.filter(obj => {
    if (obstacleIds.has(obj.id)) return true;
    if (trafficLightIds.has(obj.id)) return true;
    if (roadIds.has(obj.id)) return true;
    if (obj.id < 0) return true;
    return currentAgentIds.has(obj.id);
  });
  
  // Actualizar VAO de semáforos según su estado
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
  
  // Actualizar caballos
  for (const agent of agents) {
    const existingObj = scene.objects.find(obj => obj.id === agent.id);
    
    if (existingObj) {
      // Calcular posición interpolada actual
      let currentInterpolatedPos = existingObj.posArray;
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
      }

      // Actualizar posición
      const oldPos = [...currentInterpolatedPos];
      const newPos = [agent.position.x, agent.position.y + 0.3, agent.position.z]; // Elevar nueva posición
      
      existingObj.oldPosArray = currentInterpolatedPos;
      existingObj.nextPosArray = newPos;
      existingObj.interpolateStart = Date.now();
      existingObj.position.x = agent.position.x;
      existingObj.position.y = agent.position.y;
      existingObj.position.z = agent.position.z;
      
      // Determinar si está en movimiento
      const isMoving = Math.abs(oldPos[0] - newPos[0]) > 0.01 || Math.abs(oldPos[2] - newPos[2]) > 0.01;
      
      // Actualizar VAO según si está en movimiento o idle
      if (isMoving && !existingObj.isMoving) {
        // Cambió de idle a movimiento
        existingObj.isMoving = true;
        existingObj.animationStartTime = Date.now();
      } else if (!isMoving && existingObj.isMoving) {
        // Cambió de movimiento a idle
        existingObj.isMoving = false;
        existingObj.arrays = scene.baseHorseIdle.arrays;
        existingObj.bufferInfo = scene.baseHorseIdle.bufferInfo;
        existingObj.vao = scene.baseHorseIdle.vao;
      }
      
      // Si está en movimiento, actualizar frame de animación
      if (existingObj.isMoving) {
        const animSpeed = 120; // ms por frame (ajusta para velocidad de animación)
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

      const nextDirection = agent.nextDir || agent.dirActual || "Down";
      if (existingObj.currentDirection !== nextDirection) {
        const newAngle = directionToAngle(nextDirection);
        const currentAngle = existingObj.rotY !== undefined ? existingObj.rotY : newAngle;
        
        // Normalizar ángulos antes de calcular diferencia
        const normalizeAngle = (angle) => {
          while (angle > Math.PI) angle -= 2 * Math.PI;
          while (angle < -Math.PI) angle += 2 * Math.PI;
          return angle;
        };
        
        const normalizedCurrent = normalizeAngle(currentAngle);
        const normalizedNew = normalizeAngle(newAngle);
        
        // Calcular diferencia tomando el camino más corto
        let diff = normalizedNew - normalizedCurrent;
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        
        // Establecer rotación tomando en cuenta el camino más corto
        existingObj.oldRotY = normalizedCurrent;
        existingObj.rotY = normalizedCurrent + diff;
        existingObj.currentDirection = nextDirection;
        existingObj.rotateStart = Date.now();
      }
    } else {
      agent.arrays = scene.baseHorseIdle.arrays;
      agent.bufferInfo = scene.baseHorseIdle.bufferInfo;
      agent.vao = scene.baseHorseIdle.vao;
      agent.scale = { x: 0.15, y: 0.15, z: 0.15 };
      
      agent.color = getRandomCarColor();
      
      const initialDirection = agent.nextDir || agent.dirActual || "Down";
      agent.currentDirection = initialDirection;
      const initialAngle = directionToAngle(initialDirection);
      
      agent.oldRotY = initialAngle;
      agent.rotY = initialAngle;
      agent.oldPosArray = [...agent.posArray];
      agent.oldPosArray[1] += 0.3;
      
      agent.currentFrame = 0;
      agent.isMoving = false;
      agent.animationStartTime = Date.now();
      
      scene.addObject(agent);
    }
  }
}

function drawObject(gl, programInfo, object, viewProjectionMatrix, globalFract) {
  // Calcular fract local
  let localFract = globalFract;
  if (object.interpolateStart) {
    const elapsedLocal = Date.now() - object.interpolateStart;
    localFract = clamp(elapsedLocal / duration, 0, 1);
  }

  // Interpolar posición
  let v3_tra;
  if (object.oldPosArray && object.nextPosArray && localFract < 1.0) {
    v3_tra = [
      lerp(object.oldPosArray[0], object.nextPosArray[0], localFract),
      lerp(object.oldPosArray[1], object.nextPosArray[1], localFract),
      lerp(object.oldPosArray[2], object.nextPosArray[2], localFract)
    ];
  } else if (object.nextPosArray && localFract >= 1.0) {
    v3_tra = [...object.nextPosArray];
    delete object.oldPosArray;
    delete object.nextPosArray;
    delete object.interpolateStart;
  } else {
    v3_tra = object.posArray;
  }

  const rotDuration = duration * 0.7;
  let rotY = object.rotRad?.y || 0;
  
  if (object.oldRotY !== undefined && object.rotY !== undefined) {
    let rotElapsed = object.rotateStart ? (Date.now() - object.rotateStart) : 0;
    let rotFract = clamp(rotElapsed / rotDuration, 0, 1);
    
    rotY = lerp(object.oldRotY, object.rotY, rotFract);
    
    if (rotFract >= 1.0) {
      object.oldRotY = undefined;
      object.rotateStart = undefined;
    }
  } else if (object.rotY !== undefined) {
    rotY = object.rotY;
  }

  let v3_sca = object.scaArray;

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

  const wvpMat = M4.multiply(viewProjectionMatrix, transforms);
  const normalMat = M4.transpose(M4.inverse(object.matrix));

  let objectUniforms = {
    u_world: transforms,
    u_worldInverseTransform: normalMat,
    u_worldViewProjection: wvpMat,
    u_shininess: object.shininess || 200.0,
  }
  twgl.setUniforms(programInfo, objectUniforms);
  
  gl.bindVertexArray(object.vao);
  twgl.drawBufferInfo(gl, object.bufferInfo);
}

// Function to do the actual display of the objects
async function drawScene() {
  let now = Date.now();
  let deltaTime = now - then;
  elapsed += deltaTime;
  const fract = Math.min(1.0, elapsed / duration);
  then = now;

  // Clear the canvas
  gl.clearColor(0.53, 0.81, 0.92, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // tell webgl to cull faces
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  scene.camera.checkKeys();
  const viewProjectionMatrix = setupViewProjection(gl);

  // Draw skybox first
  drawSkybox(gl, viewProjectionMatrix);

  // Switch to phong program for objects
  gl.useProgram(phongProgramInfo.program);

  let globalUniforms = {
    u_viewWorldPosition: scene.camera.posArray,
    u_lightWorldPosition: scene.lights[0].posArray,
    u_ambientLight: scene.lights[0].ambient,
    u_diffuseLight: scene.lights[0].diffuse,
    u_specularLight: scene.lights[0].specular,
  }
  twgl.setUniforms(phongProgramInfo, globalUniforms);

  // Draw the objects
  for (let object of scene.objects) {
    drawObject(gl, phongProgramInfo, object, viewProjectionMatrix, fract);
  }

  // ESTO ES PARA EL DOUBLE BUFFER
  if (elapsed >= duration * 0.5 && !isUpdating && !pendingUpdate) {
    pendingUpdate = true;
    updateInBackground();
  }

  // Resetear cuando se completa el ciclo
  if (elapsed >= duration && !isUpdating) {
    elapsed = 0;
  }

  requestAnimationFrame(drawScene);
}

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

function setupViewProjection(gl) {
  // Field of view of 60 degrees vertically, in radians
  const fov = 60 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

  // Matrices for the world view
  const projectionMatrix = M4.perspective(fov, aspect, 1, 200);

  const cameraPosition = scene.camera.posArray;
  const target = scene.camera.targetArray;
  const up = [0, 1, 0];

  const cameraMatrix = M4.lookAt(cameraPosition, target, up);
  const viewMatrix = M4.inverse(cameraMatrix);
  const viewProjectionMatrix = M4.multiply(projectionMatrix, viewMatrix);

  return viewProjectionMatrix;
}

// Setup a ui.
function setupUI() {
  // Empty for now
}

// Setup skybox
function setupSkybox() {
  // Create a quad that covers the entire canvas
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
  
  // Load cubemap textures
  skyboxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
  
  const faceInfos = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: '../assets/maps/posx.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: '../assets/maps/negx.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: '../assets/maps/posy.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: '../assets/maps/negy.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: '../assets/maps/posz.jpg' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: '../assets/maps/negz.jpg' },
  ];
  
  faceInfos.forEach((faceInfo) => {
    const { target, url } = faceInfo;
    
    // Setup each face with a temporary 1x1 blue pixel
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, pixel);
    
    // Load the actual image
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

// Draw skybox
function drawSkybox(gl, viewProjectionMatrix) {
  gl.useProgram(skyboxProgramInfo.program);
  gl.bindVertexArray(skyboxVAO);
  
  // Disable depth writing (but keep depth test)
  gl.depthFunc(gl.LEQUAL);
  
  // Get view matrix without translation
  const cameraPosition = scene.camera.posArray;
  const target = scene.camera.targetArray;
  const up = [0, 1, 0];
  const cameraMatrix = M4.lookAt(cameraPosition, target, up);
  const viewMatrix = M4.inverse(cameraMatrix);
  
  // Remove translation from view matrix
  const viewDirectionMatrix = viewMatrix.slice();
  viewDirectionMatrix[12] = 0;
  viewDirectionMatrix[13] = 0;
  viewDirectionMatrix[14] = 0;
  
  // Get projection matrix
  const fov = 60 * Math.PI / 180;
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const projectionMatrix = M4.perspective(fov, aspect, 1, 200);
  
  const viewDirectionProjectionMatrix = M4.multiply(projectionMatrix, viewDirectionMatrix);
  const viewDirectionProjectionInverse = M4.inverse(viewDirectionProjectionMatrix);
  
  twgl.setUniforms(skyboxProgramInfo, {
    u_viewDirectionProjectionInverse: viewDirectionProjectionInverse,
    u_skybox: skyboxTexture,
  });
  
  twgl.drawBufferInfo(gl, skyboxBufferInfo);
  
  // Reset depth function
  gl.depthFunc(gl.LESS);
}

main();
