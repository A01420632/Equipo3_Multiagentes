/*
 * Script to read a model stored in Wavefront OBJ format
 *
 * Gilberto Echeverria
 * 2025-07-29
 */


'use strict';

/*
 * Read the contents of an OBJ file received as a string
 * Return an object called arrays, with the arrays necessary to build a
 * Vertex Array Object (VAO) for WebGL.
 * @param {boolean} invertFaces - Si es true, invierte el orden de los vértices de las caras
 */
function loadObj(objString, materials = null, invertFaces = false) {

    // The array with the attributes that will be passed to WebGL
    let arrays = {
        a_position: {
            numComponents: 3,
            data: [ ]
        },
        a_color: {
            numComponents: 4,
            data: [ ]
        },
        a_normal: {
            numComponents: 3,
            data: [ ]
        },
        a_texCoord: {
            numComponents: 2,
            data: [ ]
        }
    };

    // Arrays temporales para almacenar los datos del OBJ
    const vertices = [];      // Almacena todos los vértices (v)
    const normals = [];       // Almacena todas las normales (vn)
    const texCoords = [];     // Almacena todas las coordenadas de textura (vt)
    
    // Track current material being used
    let currentMaterial = null;
    let currentMaterialColor = [1, 1, 1, 1]; // Default white
    
    // Dividir el string en líneas
    const lines = objString.split('\n');
    
    // Primera pasada: leer todos los vértices, normales y coordenadas de textura
    for (let line of lines) {
        line = line.trim();
        
        // Ignorar comentarios y líneas vacías
        if (line.startsWith('#') || line.length === 0) {
            continue;
        }
        
        const parts = line.split(/\s+/);
        const type = parts[0];
        
        // Leer vértices (v x y z)
        if (type === 'v') {
            vertices.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
            ]);
        }
        // Leer normales (vn x y z)
        else if (type === 'vn') {
            normals.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
            ]);
        }
        // Leer coordenadas de textura (vt u v)
        else if (type === 'vt') {
            texCoords.push([
                parseFloat(parts[1]),
                parseFloat(parts[2])
            ]);
        }
    }
    
    // Segunda pasada: procesar las caras (f) y materiales (usemtl)
    for (let line of lines) {
        line = line.trim();
        
        // Check for material usage
        if (line.startsWith('usemtl ')) {
            const materialName = line.substring(7).trim();
            if (materials && materials[materialName]) {
                currentMaterial = materials[materialName];
                if (currentMaterial.Kd) {
                    currentMaterialColor = [...currentMaterial.Kd, 1.0];
                }
            }
            continue;
        }
        
        if (!line.startsWith('f ')) {
            continue;
        }
        
        const parts = line.split(/\s+/);
        const faceVertices = [];
        
        // Procesar cada vértice de la cara (puede ser f v, f v/vt, f v/vt/vn, o f v//vn)
        for (let i = 1; i < parts.length; i++) {
            const vertexData = parts[i].split('/');
            const vertexIndex = parseInt(vertexData[0]) - 1;  // OBJ usa índices base-1
            const texCoordIndex = vertexData[1] ? parseInt(vertexData[1]) - 1 : -1;
            const normalIndex = vertexData[2] ? parseInt(vertexData[2]) - 1 : -1;
            
            faceVertices.push({
                v: vertexIndex,
                vt: texCoordIndex,
                vn: normalIndex
            });
        }
        
        // Triangular la cara (convertir polígonos en triángulos)
        // Si la cara tiene más de 3 vértices, crear múltiples triángulos
        for (let i = 1; i < faceVertices.length - 1; i++) {
            // Invertir el orden si invertFaces es true
            const triangleIndices = invertFaces ? [0, i, i+1] : [0, i+1, i];
            
            for (let idx of triangleIndices) {
                const faceVertex = faceVertices[idx];
                
                // Agregar posición
                if (faceVertex.v >= 0 && faceVertex.v < vertices.length) {
                    arrays.a_position.data.push(...vertices[faceVertex.v]);
                }
                
                // Agregar normal
                if (faceVertex.vn >= 0 && faceVertex.vn < normals.length) {
                    arrays.a_normal.data.push(...normals[faceVertex.vn]);
                } else {
                    // Si no hay normal, usar un valor por defecto
                    arrays.a_normal.data.push(0, 1, 0);
                }
                
                // Agregar coordenada de textura
                if (faceVertex.vt >= 0 && faceVertex.vt < texCoords.length) {
                    arrays.a_texCoord.data.push(...texCoords[faceVertex.vt]);
                } else {
                    // Si no hay coordenada de textura, usar valor por defecto
                    arrays.a_texCoord.data.push(0, 0);
                }
                
                // Agregar color del material actual
                arrays.a_color.data.push(...currentMaterialColor);
            }
        }
    }

    //console.log("ATTRIBUTES:")
    //console.log(arrays);

    //console.log("OBJ DATA:")
    //console.log(`Vertices: ${vertices.length}, Normals: ${normals.length}, TexCoords: ${texCoords.length}`);
    //console.log(`Triangles: ${arrays.a_position.data.length / 9}`);

    return arrays;
}

/*
 * Read the contents of an MTL file received as a string
 * Return an object containing all the materials described inside,
 * with their illumination attributes.
 */
let materials = {};
let materialInUse = undefined;

function loadMtl(mtlString) {
    const materials= {};
    let currentMtl = {};

    let partInfo;
    let lines = mtlString.split('\n');
    lines.forEach(line => {
        line= line.trim();

        if (line.startsWith('#') || line.length === 0) {
            return;
        }
        
        let parts = line.split(/\s+/);

        switch (parts[0]) {
            case 'newmtl':
                // Add a new entry into the object
                materials[parts[1]] = {};
                currentMtl = materials[parts[1]];
                break;
            case 'Ns':  // Specular coefficient ("Shininess")
                currentMtl['Ns'] = Number(parts[1]);
                break;
            case 'Kd':  // The specular color
                partInfo = parts.slice(1).filter(v => v != '').map(Number);
                currentMtl['Kd'] = partInfo;
                break;
            case 'Ks':  // Specular color
                partInfo = parts.slice(1).filter(v => v != '').map(Number);
                currentMtl['Ks'] = partInfo;
                break;
            case 'Ke':  // Emissive color
                partInfo = parts.slice(1).filter(v => v != '').map(Number);
                currentMtl['Ke'] = partInfo;
                break;
            case 'd':   // Transparency (dissolve)
                currentMtl['d'] = Number(parts[1]);
                break;
            case 'Tr':  // Transparency (alternative)
                currentMtl['Tr'] = Number(parts[1]);
                break;
            case 'illum': // Illumination model
                currentMtl['illum'] = Number(parts[1]);
                break;
            case 'map_Kd': // Diffuse texture map
                currentMtl['map_Kd'] = parts[1];
                break;
        }
    });

    return materials;
}

export { loadObj, loadMtl };
