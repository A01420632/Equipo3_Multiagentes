//Diego de la Vega Saishio - A01420632
//Este archivo utiliza 3 funciones principales y una para hacer el input:
//loadObj: Genera una figura con lados, altura, radio de abajo y radio de arriba
    //Esta función solo se utiliza si ingreso como primer argumento: 1 (generar una figura), o si no doy argumentos (genera figura predeterminada)
//loadObjInternal: Esta función recibe un arreglo con todos los argumentos generados por loadMultipleObjects, para generarlos como una sola figura
//loadMultipleObjects: Esta función genera un arreglo con todas las figuras solicitadas por el usuario y se lo manda a loadObjInternal

//Instrucciones de uso:
// 1. Ejecutar archivo: node CG2.js
// 2. Ingresar argumentos: #figuras, lados, altura, radio de abajo, radio de arriba (Estos últimos 4 argumentos se deben de ingresar por la cantidad de figuras solicitadas)
// 3. Dar clic en ENTER

//NOTAS Importantes:cd
//1. Si se pone 1 figura nada más (5 argumentos), genera la figura en el archivo "building.obj"
//2. Si se generan más de una figura, el resultado se ve en el archivo "multiple_building.obj"
//3. Si el usuario no manda argumentos o no se brindan los argumentos necesarios, éstos se completan con los predeterminados: 8, 6.0, 1.0, 0.8

'use strict';

function loadObj(sides, height, lowRadius, highRadius) {
    const coordsF = [];
    coordsF.push("# OBJ file building.obj");

    if (sides >= 3 && sides <= 36) {
        const vertices = 360 / sides;
        const coordsX = [];
        const coordsZ = [];
        const coordsY = new Array(sides).fill(0);

        const incremento = vertices * Math.PI / 180;
        let ang = 0;
        for (let i = 0; i < sides; i++) {
            coordsX.push(lowRadius * Math.cos(ang));
            coordsZ.push(lowRadius * Math.sin(ang));
            ang += incremento;
        }

        const coordsUpX = [];
        const coordsUpZ = [];
        const coordsUpY = new Array(sides).fill(height);

        let ang2 = 0;
        for (let i = 0; i < sides; i++) {
            coordsUpX.push(highRadius * Math.cos(ang2));
            coordsUpZ.push(highRadius * Math.sin(ang2));
            ang2 += incremento;
        }

        const coordsLow = [];
        const coordsUp = [];
        for (let i = 0; i < sides; i++) {
            coordsLow.push("v " + coordsX[i] + " " + coordsY[i] + " " + coordsZ[i]);
            coordsUp.push("v " + coordsUpX[i] + " " + coordsUpY[i] + " " + coordsUpZ[i]);
        }

        coordsF.push("# " + sides + " vertices");
        coordsF.push("v 0 0 0");
        coordsF.push("v 0 " + height + " 0");
        coordsF.push(...coordsLow);
        coordsF.push(...coordsUp);

        coordsF.push("# " + (sides + 2) + " normales");
        coordsF.push("vn 0 -1 0");
        coordsF.push("vn 0 1 0");

        for (let i = 0; i < sides; i++) {
            const sig = (i + 1) % sides;

            const x1 = coordsX[i];
            const z1 = coordsX[i];
            const x2 = coordsX[sig];
            const z2 = coordsX[sig];

            const x3 = coordsUpX[i];
            const z3 = coordsUpZ[i];

            const v1x = x3 - x1;
            const v1y = height - 0;
            const v1z = z3 - z1;

            const v2x = x2 - x1;
            const v2y = 0;
            const v2z = z2 - z1;

            let Nx = v1y * v2z - v1z * v2y;
            let Ny = v1z * v2x - v1x * v2z;
            let Nz = v1x * v2y - v1y * v2x;

            const length = Math.sqrt(Nx * Nx + Ny * Ny + Nz * Nz);
            Nx /= length;
            Ny /= length;
            Nz /= length;

            coordsF.push("vn " + Nx.toFixed(4) + " " + Ny.toFixed(4) + " " + Nz.toFixed(4));
        }

        coordsF.push("# " + (4 * sides) + " caras");

        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            coordsF.push("f 1//1 " + (i + 3) + "//1 " + (next + 3) + "//1");
        }

        if (highRadius > 0) {
            for (let i = 0; i < sides; i++) {
                const next = (i + 1) % sides;
                coordsF.push("f 2//2 " + (next + 3 + sides) + "//2 " + (i + 3 + sides) + "//2");
            }
        }

        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            const base1 = i + 3;
            const base2 = next + 3;
            const top1 = i + 3 + sides;
            const top2 = next + 3 + sides;

            coordsF.push("f " + base1 + "//" + (i + 3) + " " + base2 + "//" + (i + 3) + " " + top2 + "//" + (i + 3));
            coordsF.push("f " + base1 + "//" + (i + 3) + " " + top2 + "//" + (i + 3) + " " + top1 + "//" + (i + 3));
        }
    } else {
        console.log("Sides must be between 3 and 36");
    }

    const fs = require('fs');
    const objContent = coordsF.join('\n');
    fs.writeFileSync('building.obj', objContent, 'utf8');
}

function loadObjInternal(sides, height, lowRadius, highRadius, currentHeight, vertexOffset, normalOffset, coordsF, isFirst, isLast, figureNumber) {
    coordsF.push("# Figura " + figureNumber + " con " + sides + " lados");

    const vertices = 360 / sides;
    const coordsX = [];
    const coordsZ = [];

    const incremento = vertices * Math.PI / 180;
    let ang = 0;
    for (let i = 0; i < sides; i++) {
        coordsX.push(lowRadius * Math.cos(ang));
        coordsZ.push(lowRadius * Math.sin(ang));
        ang += incremento;
    }

    const coordsUpX = [];
    const coordsUpZ = [];

    let ang2 = 0;
    for (let i = 0; i < sides; i++) {
        coordsUpX.push(highRadius * Math.cos(ang2));
        coordsUpZ.push(highRadius * Math.sin(ang2));
        ang2 += incremento;
    }

    coordsF.push("v 0 " + currentHeight + " 0");
    coordsF.push("v 0 " + (currentHeight + height) + " 0");
    
    if (highRadius === 0) {
        for (let i = 0; i < sides; i++) {
            coordsF.push("v " + coordsX[i] + " " + currentHeight + " " + coordsZ[i]);
        }
    } else {
        for (let i = 0; i < sides; i++) {
            coordsF.push("v " + coordsX[i] + " " + currentHeight + " " + coordsZ[i]);
            coordsF.push("v " + coordsUpX[i] + " " + (currentHeight + height) + " " + coordsUpZ[i]);
        }
    }

    coordsF.push("vn 0 -1 0");
    coordsF.push("vn 0 1 0");
    
    for (let i = 0; i < sides; i++) {
        const sig = (i + 1) % sides;

        const x1 = coordsX[i];
        const z1 = coordsZ[i];
        const x2 = coordsX[sig];
        const z2 = coordsZ[sig];

        const x3 = coordsUpX[i];
        const z3 = coordsUpZ[i];

        const v1x = x3 - x1;
        const v1y = height;
        const v1z = z3 - z1;

        const v2x = x2 - x1;
        const v2y = 0;
        const v2z = z2 - z1;

        let Nx = v1y * v2z - v1z * v2y;
        let Ny = v1z * v2x - v1x * v2z;
        let Nz = v1x * v2y - v1y * v2x;

        const length = Math.sqrt(Nx * Nx + Ny * Ny + Nz * Nz);
        Nx /= length;
        Ny /= length;
        Nz /= length;

        coordsF.push("vn " + Nx.toFixed(4) + " " + Ny.toFixed(4) + " " + Nz.toFixed(4));
    }

    if (isFirst) {
        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            const v1 = vertexOffset + 1;
            if (highRadius === 0) {
                const v2 = vertexOffset + 3 + i;
                const v3 = vertexOffset + 3 + next;
                const n = normalOffset + 1;
                coordsF.push("f " + v1 + "//" + n + " " + v2 + "//" + n + " " + v3 + "//" + n);
            } else {
                const v2 = vertexOffset + 3 + i * 2;
                const v3 = vertexOffset + 3 + next * 2;
                const n = normalOffset + 1;
                coordsF.push("f " + v1 + "//" + n + " " + v2 + "//" + n + " " + v3 + "//" + n);
            }
        }
    }

    if (isLast && highRadius > 0) {
        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            const v1 = vertexOffset + 2;
            const v2 = vertexOffset + 4 + next * 2;
            const v3 = vertexOffset + 4 + i * 2;
            const n = normalOffset + 2;
            coordsF.push("f " + v1 + "//" + n + " " + v2 + "//" + n + " " + v3 + "//" + n);
        }
    }

    for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        
        if (highRadius === 0) {
            const base1 = vertexOffset + 3 + i;
            const base2 = vertexOffset + 3 + next;
            const top = vertexOffset + 2;
            const n = normalOffset + 3 + i;
            
            coordsF.push("f " + base1 + "//" + n + " " + base2 + "//" + n + " " + top + "//" + n);
        } else {
            const base1 = vertexOffset + 3 + i * 2;
            const base2 = vertexOffset + 3 + next * 2;
            const top1 = vertexOffset + 4 + i * 2;
            const top2 = vertexOffset + 4 + next * 2;
            const n = normalOffset + 3 + i;

            coordsF.push("f " + base1 + "//" + n + " " + base2 + "//" + n + " " + top2 + "//" + n);
            coordsF.push("f " + base1 + "//" + n + " " + top2 + "//" + n + " " + top1 + "//" + n);
        }
    }
}

function loadMultipleObjs(figures) {
    const coordsF = [];
    coordsF.push("# OBJ file multiple_building.obj");

    let currentHeight = 0;
    let vertexOffset = 0;
    let normalOffset = 0;

    for (let i = 0; i < figures.length; i++) {
        const { sides, height, lowRadius, highRadius } = figures[i];
        const isFirst = (i === 0);
        const isLast = (i === figures.length - 1);

        const tempCoordsF = [];
        loadObjInternal(sides, height, lowRadius, highRadius, currentHeight, vertexOffset, normalOffset, tempCoordsF, isFirst, isLast, i + 1);

        coordsF.push(...tempCoordsF);

        if (highRadius === 0) {
            vertexOffset += sides + 2;
            normalOffset += sides + 2;
        } else {
            vertexOffset += sides * 2 + 2;
            normalOffset += sides + 2;
        }
        currentHeight += height;
    }

    const fs = require('fs');
    const objContent = coordsF.join('\n');
    fs.writeFileSync('multiple_building.obj', objContent, 'utf8');
}


function getFiguresFromArgs() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log("Valores predeterminados: sides=8, height=6.0, lowRadius=1.0, highRadius=0.8");
        return [{ sides: 8, height: 6.0, lowRadius: 1.0, highRadius: 0.8 }];
    }
    
    const numFiguras = parseInt(args[0]);
    const figures = [];
    
    for (let i = 0; i < numFiguras; i++) {
        const offset = 1 + i * 4;
        const sides = parseInt(args[offset]) || 8;
        const height = parseFloat(args[offset + 1]) || 6.0;
        const lowRadius = parseFloat(args[offset + 2]) || 1.0;
        const highRadius = args[offset + 3] !== undefined ? parseFloat(args[offset + 3]) : 0.8;
        
        figures.push({ sides, height, lowRadius, highRadius });
    }
    
    return figures;
}

const figures = getFiguresFromArgs();

if (figures.length === 1) {
    const { sides, height, lowRadius, highRadius } = figures[0];
    loadObj(sides, height, lowRadius, highRadius);
    console.log("Resultado en archivo building.obj");
} else {
    loadMultipleObjs(figures);
    console.log("Resultado en archivo multiple_building.obj");
}
