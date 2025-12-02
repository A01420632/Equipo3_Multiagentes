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
  agents, obstacles, trafficLights, roads, initAgentsModel,
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

// Global variables for MTL materials
let carMaterials = null;
let buildingMaterials = null;
let trafficLightMaterials = null;
let trafficLightMaterialsG = null;
let roadMaterials = null;

let angulobase = -Math.PI / 2;
const DIRECTION_ANGLES = {
  "Right": -Math.PI / 2 + angulobase, // -90° (apunta hacia +X)
  "Left": Math.PI / 2 + angulobase, // 90° (apunta hacia -X)
  "Up": Math.PI + angulobase, // 180° (apunta hacia +Z) 
  "Down": 0 + angulobase // 0° (apunta hacia -Z)
};

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
  const carData = await loadObjFile('../assets/models/car2.obj');
  const buildingData = await loadObjFile('../assets/models/House.obj');
  const trafficLightData = await loadObjFile('../../assets/models/Semaforo.obj');
  const trafficLightDataGreen = await loadObjFile('../../assets/models/SemaforoVerde.obj');
  const roadData = await loadObjFile('../assets/models/Road.obj');
  
  // Extract OBJ data and materials
  carObjData = carData ? carData.objData : null;
  buildingObjData = buildingData ? buildingData.objData : null;
  trafficLightObjData = trafficLightData ? trafficLightData.objData : null;
  //trafficLightObjDataG = trafficLightDataG ? trafficLightDataG.objData : null;
  roadObjData = roadData ? roadData.objData : null;
  
  carMaterials = carData ? carData.materials : null;
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
    [0.0, 0.0, 1.0, 1.0],  // Azul
    [1.0, 1.0, 0.0, 1.0],  // Amarillo
    [0.0, 1.0, 0.0, 1.0],  // Verde
    [1.0, 0.5, 0.0, 1.0],  // Naranja
    [0.5, 0.0, 0.5, 1.0],  // Púrpura
    [0.0, 1.0, 1.0, 1.0],  // Cian
    [1.0, 1.0, 1.0, 1.0],  // Blanco
    [0.2, 0.2, 0.2, 1.0],  // Negro
    [0.7, 0.7, 0.7, 1.0],  // Gris
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function setupObjects(scene, gl, programInfo) {
  // Create VAOs for the different shapes
  const baseCube = new Object3D(-1);
  baseCube.prepareVAO(gl, programInfo);

  // Create car model from OBJ (invertir caras)
  const baseCar = new Object3D(-2, [0,0,0], [0,0,0], [1,1,1], [1,1,1,1], true);
  if (carObjData) {
    baseCar.prepareVAO(gl, programInfo, carObjData, carMaterials);
    console.log('Car model loaded successfully');
  } else {
    baseCar.prepareVAO(gl, programInfo);
    console.log('Using default cube for cars');
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
  const baseRoad = new Object3D(-5);
  if (roadObjData) {
    baseRoad.prepareVAO(gl, programInfo, roadObjData, roadMaterials);
    console.log('Road model loaded successfully');
  } else {
    baseRoad.prepareVAO(gl, programInfo);
    console.log('Using default cube for roads');
  }

  // Store the base models for later use
  scene.baseCube = baseCube;
  scene.baseCar = baseCar;
  scene.baseBuilding = baseBuilding;
  scene.baseTrafficLight = baseTrafficLight;
  scene.baseTrafficLightGreen = baseTrafficLightGreen;
  scene.baseRoad = baseRoad;

  // Setup cars with car model
  for (const agent of agents) {
    agent.arrays = baseCar.arrays;
    agent.bufferInfo = baseCar.bufferInfo;
    agent.vao = baseCar.vao;
    agent.scale = { x: 0.2, y: 0.2, z: 0.2 };
    
    agent.color = getRandomCarColor();
    
    const initialDirection = agent.dirActual || "Down";
    agent.currentDirection = initialDirection;
    const initialAngle = directionToAngle(initialDirection);
    
    agent.oldRotY = initialAngle;
    agent.rotY = initialAngle;
    agent.oldPosArray = [...agent.posArray];
    
    scene.addObject(agent);
  }

  // Setup obstacles (buildings) with building model
  for (const agent of obstacles) {
    agent.arrays = baseBuilding.arrays;
    agent.bufferInfo = baseBuilding.bufferInfo;
    agent.vao = baseBuilding.vao;
    agent.scale = { x: 0.2, y: 0.2, z: 0.2 }; //{ x: 0.03, y: 0.05, z: 0.03 }
    agent.color = [0.7, 0.7, 0.7, 1.0];
    scene.addObject(agent);
  }

  // Setup traffic lights with traffic light model (default: verde)
  for (const light of trafficLights) {
    light.arrays = baseTrafficLightGreen.arrays;
    light.bufferInfo = baseTrafficLightGreen.bufferInfo;
    light.vao = baseTrafficLightGreen.vao;
    light.scale = { x: 0.01, y: 0.01, z: 0.01 };
    
    const isGreen = light.state === true || light.state === "True" || light.state === "true";
    light.color = isGreen ? [0.0, 1.0, 0.0, 1.0] : [1.0, 0.0, 0.0, 1.0];
    light.state = light.state || true; // Default verde
    
    scene.addObject(light);
  }

  // Setup roads with road model
  for (const road of roads) {
    road.arrays = baseRoad.arrays;
    road.bufferInfo = baseRoad.bufferInfo;
    road.vao = baseRoad.vao;
    road.scale = { x: 1.0, y: 0.1, z: 1.0 };
    
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
        // Verde
        sceneLight.arrays = scene.baseTrafficLightGreen.arrays;
        sceneLight.bufferInfo = scene.baseTrafficLightGreen.bufferInfo;
        sceneLight.vao = scene.baseTrafficLightGreen.vao;
      } else {
        // Rojo
        sceneLight.arrays = scene.baseTrafficLight.arrays;
        sceneLight.bufferInfo = scene.baseTrafficLight.bufferInfo;
        sceneLight.vao = scene.baseTrafficLight.vao;
      }
      sceneLight.state = light.state;
    }
  }
  
  // Solo actualizar carros (agents), no los objetos estáticos
  for (const agent of agents) {
    const existingObj = scene.objects.find(obj => obj.id === agent.id);
    
    if (existingObj) {
      existingObj.oldPosArray = [...existingObj.posArray];
      existingObj.position = agent.position;
      
      const nextDirection = agent.nextDir || agent.dirActual || "Down";
      
      if (existingObj.currentDirection !== nextDirection) {
        const newAngle = directionToAngle(nextDirection);
        
        existingObj.oldRotY = existingObj.rotY;
        existingObj.rotY = newAngle;
        existingObj.currentDirection = nextDirection;
      }
      
    } else {
      agent.arrays = scene.baseCar.arrays;
      agent.bufferInfo = scene.baseCar.bufferInfo;
      agent.vao = scene.baseCar.vao;
      agent.scale = { x: 0.2, y: 0.2, z: 0.2 };
      
      agent.color = getRandomCarColor();
      
      const initialDirection = agent.nextDir || agent.dirActual || "Down";
      agent.currentDirection = initialDirection;
      const initialAngle = directionToAngle(initialDirection);
      
      agent.oldRotY = initialAngle;
      agent.rotY = initialAngle;
      agent.oldPosArray = [...agent.posArray];
      
      scene.addObject(agent);
    }
  }
}

function drawObject(gl, programInfo, object, viewProjectionMatrix, fract) {
  let v3_tra = object.posArray;
  
  if (object.oldPosArray && fract < 1.0) {
    const smoothFract = fract * fract * (3 - 2 * fract); // smoothstep
    v3_tra = [
      object.oldPosArray[0] + (object.posArray[0] - object.oldPosArray[0]) * smoothFract,
      object.oldPosArray[1] + (object.posArray[1] - object.oldPosArray[1]) * smoothFract,
      object.oldPosArray[2] + (object.posArray[2] - object.oldPosArray[2]) * smoothFract
    ];
  }
  
  let rotY = object.rotRad.y;
  
  if (object.oldRotY !== undefined && object.rotY !== undefined && fract < 1.0) {
    const smoothFract = fract * fract * (3 - 2 * fract); // smoothstep
    // Calcular diferencia usando camino más corto
    const diff = angleDifference(object.oldRotY, object.rotY);
    rotY = object.oldRotY + diff * smoothFract;
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

  // Apply the projection to the final matrix for the
  // World-View-Projection
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
