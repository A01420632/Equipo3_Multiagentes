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
import { Camera3D } from '../libs/camera3d';
import { loadMtl } from '../libs/obj_loader';

// Functions and arrays for the communication with the API
import {
  agents, obstacles, trafficLights, initAgentsModel,
  update, getCars, getLights, getDestination, getRoads, getObstacles
} from '../libs/api_connection.js';

// Define the shader code, using GLSL 3.00
import vsGLSL from '../assets/shaders/vs_color.glsl?raw';
import fsGLSL from '../assets/shaders/fs_color.glsl?raw';

const scene = new Scene3D();

/*
// Variable for the scene settings
const settings = {
    // Speed in degrees
    rotationSpeed: {
        x: 0,
        y: 0,
        z: 0,
    },
};
*/


// Global variables
let colorProgramInfo = undefined;
let gl = undefined;
const duration = 1000; // ms
let elapsed = 0;
let then = 0;

// Global variables for OBJ models
let carObjData = null;
let buildingObjData = null;
let trafficLightObjData = null;

// Global variables for MTL materials
let carMaterials = null;
let buildingMaterials = null;
let trafficLightMaterials = null;

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

  // Prepare the program with the shaders
  colorProgramInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

  // Load OBJ models from assets folder
  console.log('Loading OBJ models...');
  const carData = await loadObjFile('../assets/models/car2.obj');
  const buildingData = await loadObjFile('../assets/models/EdificioSimple.obj');
  const trafficLightData = await loadObjFile('../assets/models/Semaforo.obj');
  
  // Extract OBJ data and materials
  carObjData = carData ? carData.objData : null;
  buildingObjData = buildingData ? buildingData.objData : null;
  trafficLightObjData = trafficLightData ? trafficLightData.objData : null;
  
  carMaterials = carData ? carData.materials : null;
  buildingMaterials = buildingData ? buildingData.materials : null;
  trafficLightMaterials = trafficLightData ? trafficLightData.materials : null;
  
  console.log('OBJ models and materials loaded');
  if (carMaterials) console.log('Car materials:', carMaterials);
  if (buildingMaterials) console.log('Building materials:', buildingMaterials);
  if (trafficLightMaterials) console.log('Traffic light materials:', trafficLightMaterials);

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
  setupObjects(scene, gl, colorProgramInfo);

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
}

function setupObjects(scene, gl, programInfo) {
  // Create VAOs for the different shapes
  const baseCube = new Object3D(-1);
  baseCube.prepareVAO(gl, programInfo);

  // Create car model from OBJ
  const baseCar = new Object3D(-2);
  if (carObjData) {
    baseCar.prepareVAO(gl, programInfo, carObjData, carMaterials);
    console.log('Car model loaded successfully');
  } else {
    baseCar.prepareVAO(gl, programInfo); // Fallback to cube
    console.log('Using default cube for cars');
  }

  // Create building model from OBJ
  const baseBuilding = new Object3D(-3);
  if (buildingObjData) {
    baseBuilding.prepareVAO(gl, programInfo, buildingObjData, buildingMaterials);
    console.log('Building model loaded successfully');
  } else {
    baseBuilding.prepareVAO(gl, programInfo); // Fallback to cube
    console.log('Using default cube for buildings');
  }

  // Create traffic light model from OBJ
  const baseTrafficLight = new Object3D(-4);
  if (trafficLightObjData) {
    baseTrafficLight.prepareVAO(gl, programInfo, trafficLightObjData, trafficLightMaterials);
    console.log('Traffic light model loaded successfully');
  } else {
    baseTrafficLight.prepareVAO(gl, programInfo); // Fallback to cube
    console.log('Using default cube for traffic lights');
  }

  // Store the base models for later use
  scene.baseCube = baseCube;
  scene.baseCar = baseCar;
  scene.baseBuilding = baseBuilding;
  scene.baseTrafficLight = baseTrafficLight;

  // Setup cars with car model
  for (const agent of agents) {
    agent.arrays = baseCar.arrays;
    agent.bufferInfo = baseCar.bufferInfo;
    agent.vao = baseCar.vao;
    agent.scale = { x: 0.2, y: 0.2, z: 0.2 };
    
    // Apply color from MTL if available
    if (carMaterials && Object.keys(carMaterials).length > 0) {
      const firstMaterial = Object.values(carMaterials)[0];
      if (firstMaterial && firstMaterial.Kd) {
        agent.color = [...firstMaterial.Kd, 1.0];
      } else {
        agent.color = [1.0, 0.0, 0.0, 1.0]; // Red fallback
      }
    } else {
      agent.color = [1.0, 0.0, 0.0, 1.0]; // Red fallback
    }
    
    scene.addObject(agent);
  }

  // Setup obstacles (buildings) with building model
  for (const agent of obstacles) {
    agent.arrays = baseBuilding.arrays;
    agent.bufferInfo = baseBuilding.bufferInfo;
    agent.vao = baseBuilding.vao;
    agent.scale = { x: 0.03, y: 0.05, z: 0.03 } //{ x: 0.01, y: 0.03, z: 0.01 }; // Ajusta estos valores según necesites
    agent.color = [0.7, 0.7, 0.7, 1.0];
    scene.addObject(agent);
  }

  // Setup traffic lights with traffic light model
  for (const light of trafficLights) {
    light.arrays = baseTrafficLight.arrays;
    light.bufferInfo = baseTrafficLight.bufferInfo;
    light.vao = baseTrafficLight.vao;
    light.scale = { x: 0.01, y: 0.01, z: 0.01 };
    
    // Apply color from MTL if available
    if (trafficLightMaterials && Object.keys(trafficLightMaterials).length > 0) {
      const firstMaterial = Object.values(trafficLightMaterials)[0];
      if (firstMaterial && firstMaterial.Kd) {
        light.color = [...firstMaterial.Kd, 1.0];
      } else {
        light.color = [0.0, 1.0, 0.0, 1.0]; // Verde fallback
      }
    } else {
      light.color = [0.0, 1.0, 0.0, 1.0]; // Verde fallback
    }
    
    scene.addObject(light);
  }
}

// Optimized function to update scene objects after fetching new positions
function updateSceneObjects() {
  const currentAgentIds = new Set(agents.map(agent => agent.id));
  const obstacleIds = new Set(obstacles.map(obs => obs.id));
  
  scene.objects = scene.objects.filter(obj => {
    if (obstacleIds.has(obj.id)) return true;
    if (obj.id === -1) return true;
    return currentAgentIds.has(obj.id);
  });
  for (const agent of agents) {
    const existingObj = scene.objects.find(obj => obj.id === agent.id);
    
    if (existingObj) {
      // Update position of existing object
      existingObj.posArray = agent.posArray;
    } else {
      // Add new object to scene with car model
      agent.arrays = scene.baseCar.arrays;
      agent.bufferInfo = scene.baseCar.bufferInfo;
      agent.vao = scene.baseCar.vao;
      agent.scale = { x: 0.3, y: 0.3, z: 0.3 };
      
      // Apply color from MTL if available
      if (carMaterials && Object.keys(carMaterials).length > 0) {
        const firstMaterial = Object.values(carMaterials)[0];
        if (firstMaterial && firstMaterial.Kd) {
          agent.color = [...firstMaterial.Kd, 1.0];
        } else {
          agent.color = [1.0, 0.0, 0.0, 1.0];
        }
      } else {
        agent.color = [1.0, 0.0, 0.0, 1.0];
      }
      
      scene.addObject(agent);
      //console.log(`Added car ${agent.id} at (${agent.posArray[0]}, ${agent.posArray[2]})`);
    }
  }
}

// Draw an object with its corresponding transformations
function drawObject(gl, programInfo, object, viewProjectionMatrix, fract) {
  let v3_tra = object.posArray;
  
  if (object.oldPosArray && fract < 1.0) {
    v3_tra = [
      object.oldPosArray[0] + (object.posArray[0] - object.oldPosArray[0]) * fract,
      object.oldPosArray[1] + (object.posArray[1] - object.oldPosArray[1]) * fract,
      object.oldPosArray[2] + (object.posArray[2] - object.oldPosArray[2]) * fract
    ];
  }
  
  let v3_sca = object.scaArray;

  // Create the individual transform matrices
  const scaMat = M4.scale(v3_sca);
  const rotXMat = M4.rotationX(object.rotRad.x);
  const rotYMat = M4.rotationY(object.rotRad.y);
  const rotZMat = M4.rotationZ(object.rotRad.z);
  const traMat = M4.translation(v3_tra);

  // Create the composite matrix with all transformations
  let transforms = M4.identity();
  transforms = M4.multiply(scaMat, transforms);
  transforms = M4.multiply(rotXMat, transforms);
  transforms = M4.multiply(rotYMat, transforms);
  transforms = M4.multiply(rotZMat, transforms);
  transforms = M4.multiply(traMat, transforms);

  object.matrix = transforms;

  // Apply the projection to the final matrix for the
  // World-View-Projection
  const wvpMat = M4.multiply(viewProjectionMatrix, transforms);

  // Model uniforms
  let objectUniforms = {
    u_transforms: wvpMat,
    u_color: object.color || [1.0, 1.0, 1.0, 1.0]
  }
  twgl.setUniforms(programInfo, objectUniforms);
  

  gl.bindVertexArray(object.vao);
  twgl.drawBufferInfo(gl, object.bufferInfo);
}

// Function to do the actual display of the objects
async function drawScene() {
  // Compute time elapsed since last frame
  let now = Date.now();
  let deltaTime = now - then;
  elapsed += deltaTime;
  let fract = Math.min(1.0, elapsed / duration);
  then = now;

  // Clear the canvas
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // tell webgl to cull faces
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  scene.camera.checkKeys();
  const viewProjectionMatrix = setupViewProjection(gl);

  // Draw the objects
  gl.useProgram(colorProgramInfo.program);
  for (let object of scene.objects) {
    drawObject(gl, colorProgramInfo, object, viewProjectionMatrix, fract);
  }

  // Request update in advance (double buffering)
  if (elapsed >= duration * 0.7 && !isUpdating && !pendingUpdate) { // Start fetching next frame data when 70% through current animation
    pendingUpdate = true;
    updateInBackground();
  }

  // Apply the buffered update when animation completes
  if (elapsed >= duration && !isUpdating) {
    elapsed = 0;
  }

  requestAnimationFrame(drawScene);
}

async function updateInBackground() {
  if (isUpdating) return;
  
  isUpdating = true;
  try {
    for (let obj of scene.objects) {
      if (obj.id > 0) { // Only for cars (positive IDs)
        obj.oldPosArray = [...obj.posArray];
      }
    }
    
    await update();
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
  /*
  const gui = new GUI();

  // Settings for the animation
  const animFolder = gui.addFolder('Animation:');
  animFolder.add( settings.rotationSpeed, 'x', 0, 360)
      .decimals(2)
  animFolder.add( settings.rotationSpeed, 'y', 0, 360)
      .decimals(2)
  animFolder.add( settings.rotationSpeed, 'z', 0, 360)
      .decimals(2)
  */
}

main();
