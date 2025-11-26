// node_modules/twgl-base.js/dist/5.x/twgl.module.js
var BYTE$2 = 5120;
var UNSIGNED_BYTE$3 = 5121;
var SHORT$2 = 5122;
var UNSIGNED_SHORT$3 = 5123;
var INT$3 = 5124;
var UNSIGNED_INT$3 = 5125;
var FLOAT$3 = 5126;
var UNSIGNED_SHORT_4_4_4_4$1 = 32819;
var UNSIGNED_SHORT_5_5_5_1$1 = 32820;
var UNSIGNED_SHORT_5_6_5$1 = 33635;
var HALF_FLOAT$1 = 5131;
var UNSIGNED_INT_2_10_10_10_REV$1 = 33640;
var UNSIGNED_INT_10F_11F_11F_REV$1 = 35899;
var UNSIGNED_INT_5_9_9_9_REV$1 = 35902;
var FLOAT_32_UNSIGNED_INT_24_8_REV$1 = 36269;
var UNSIGNED_INT_24_8$1 = 34042;
var glTypeToTypedArray = {};
{
  const tt = glTypeToTypedArray;
  tt[BYTE$2] = Int8Array;
  tt[UNSIGNED_BYTE$3] = Uint8Array;
  tt[SHORT$2] = Int16Array;
  tt[UNSIGNED_SHORT$3] = Uint16Array;
  tt[INT$3] = Int32Array;
  tt[UNSIGNED_INT$3] = Uint32Array;
  tt[FLOAT$3] = Float32Array;
  tt[UNSIGNED_SHORT_4_4_4_4$1] = Uint16Array;
  tt[UNSIGNED_SHORT_5_5_5_1$1] = Uint16Array;
  tt[UNSIGNED_SHORT_5_6_5$1] = Uint16Array;
  tt[HALF_FLOAT$1] = Uint16Array;
  tt[UNSIGNED_INT_2_10_10_10_REV$1] = Uint32Array;
  tt[UNSIGNED_INT_10F_11F_11F_REV$1] = Uint32Array;
  tt[UNSIGNED_INT_5_9_9_9_REV$1] = Uint32Array;
  tt[FLOAT_32_UNSIGNED_INT_24_8_REV$1] = Uint32Array;
  tt[UNSIGNED_INT_24_8$1] = Uint32Array;
}
function getGLTypeForTypedArray(typedArray) {
  if (typedArray instanceof Int8Array) {
    return BYTE$2;
  }
  if (typedArray instanceof Uint8Array) {
    return UNSIGNED_BYTE$3;
  }
  if (typedArray instanceof Uint8ClampedArray) {
    return UNSIGNED_BYTE$3;
  }
  if (typedArray instanceof Int16Array) {
    return SHORT$2;
  }
  if (typedArray instanceof Uint16Array) {
    return UNSIGNED_SHORT$3;
  }
  if (typedArray instanceof Int32Array) {
    return INT$3;
  }
  if (typedArray instanceof Uint32Array) {
    return UNSIGNED_INT$3;
  }
  if (typedArray instanceof Float32Array) {
    return FLOAT$3;
  }
  throw new Error("unsupported typed array type");
}
function getGLTypeForTypedArrayType(typedArrayType) {
  if (typedArrayType === Int8Array) {
    return BYTE$2;
  }
  if (typedArrayType === Uint8Array) {
    return UNSIGNED_BYTE$3;
  }
  if (typedArrayType === Uint8ClampedArray) {
    return UNSIGNED_BYTE$3;
  }
  if (typedArrayType === Int16Array) {
    return SHORT$2;
  }
  if (typedArrayType === Uint16Array) {
    return UNSIGNED_SHORT$3;
  }
  if (typedArrayType === Int32Array) {
    return INT$3;
  }
  if (typedArrayType === Uint32Array) {
    return UNSIGNED_INT$3;
  }
  if (typedArrayType === Float32Array) {
    return FLOAT$3;
  }
  throw new Error("unsupported typed array type");
}
function getTypedArrayTypeForGLType(type) {
  const CTOR = glTypeToTypedArray[type];
  if (!CTOR) {
    throw new Error("unknown gl type");
  }
  return CTOR;
}
var isArrayBuffer$1 = typeof SharedArrayBuffer !== "undefined" ? function isArrayBufferOrSharedArrayBuffer(a) {
  return a && a.buffer && (a.buffer instanceof ArrayBuffer || a.buffer instanceof SharedArrayBuffer);
} : function isArrayBuffer(a) {
  return a && a.buffer && a.buffer instanceof ArrayBuffer;
};
var typedarrays = Object.freeze({
  __proto__: null,
  getGLTypeForTypedArray,
  getGLTypeForTypedArrayType,
  getTypedArrayTypeForGLType,
  isArrayBuffer: isArrayBuffer$1
});
function copyExistingProperties(src, dst) {
  Object.keys(dst).forEach(function(key) {
    if (dst.hasOwnProperty(key) && src.hasOwnProperty(key)) {
      dst[key] = src[key];
    }
  });
}
function error$1(...args) {
  console.error(...args);
}
function warn$1(...args) {
  console.warn(...args);
}
var isTypeWeakMaps = /* @__PURE__ */ new Map();
function isType(object, type) {
  if (!object || typeof object !== "object") {
    return false;
  }
  let weakMap = isTypeWeakMaps.get(type);
  if (!weakMap) {
    weakMap = /* @__PURE__ */ new WeakMap();
    isTypeWeakMaps.set(type, weakMap);
  }
  let isOfType = weakMap.get(object);
  if (isOfType === void 0) {
    const s = Object.prototype.toString.call(object);
    isOfType = s.substring(8, s.length - 1) === type;
    weakMap.set(object, isOfType);
  }
  return isOfType;
}
function isBuffer(gl, t) {
  return typeof WebGLBuffer !== "undefined" && isType(t, "WebGLBuffer");
}
function isRenderbuffer(gl, t) {
  return typeof WebGLRenderbuffer !== "undefined" && isType(t, "WebGLRenderbuffer");
}
function isTexture(gl, t) {
  return typeof WebGLTexture !== "undefined" && isType(t, "WebGLTexture");
}
function isSampler(gl, t) {
  return typeof WebGLSampler !== "undefined" && isType(t, "WebGLSampler");
}
var STATIC_DRAW = 35044;
var ARRAY_BUFFER$1 = 34962;
var ELEMENT_ARRAY_BUFFER$2 = 34963;
var BUFFER_SIZE = 34660;
var BYTE$1 = 5120;
var UNSIGNED_BYTE$2 = 5121;
var SHORT$1 = 5122;
var UNSIGNED_SHORT$2 = 5123;
var INT$2 = 5124;
var UNSIGNED_INT$2 = 5125;
var FLOAT$2 = 5126;
var defaults$2 = {
  attribPrefix: ""
};
function setAttributePrefix(prefix) {
  defaults$2.attribPrefix = prefix;
}
function setDefaults$2(newDefaults) {
  copyExistingProperties(newDefaults, defaults$2);
}
function setBufferFromTypedArray(gl, type, buffer, array, drawType) {
  gl.bindBuffer(type, buffer);
  gl.bufferData(type, array, drawType || STATIC_DRAW);
}
function createBufferFromTypedArray(gl, typedArray, type, drawType) {
  if (isBuffer(gl, typedArray)) {
    return typedArray;
  }
  type = type || ARRAY_BUFFER$1;
  const buffer = gl.createBuffer();
  setBufferFromTypedArray(gl, type, buffer, typedArray, drawType);
  return buffer;
}
function isIndices(name) {
  return name === "indices";
}
function getNormalizationForTypedArrayType(typedArrayType) {
  if (typedArrayType === Int8Array) {
    return true;
  }
  if (typedArrayType === Uint8Array) {
    return true;
  }
  return false;
}
function getArray(array) {
  return array.length ? array : array.data;
}
var texcoordRE = /coord|texture/i;
var colorRE = /color|colour/i;
function guessNumComponentsFromName(name, length2) {
  let numComponents;
  if (texcoordRE.test(name)) {
    numComponents = 2;
  } else if (colorRE.test(name)) {
    numComponents = 4;
  } else {
    numComponents = 3;
  }
  if (length2 % numComponents > 0) {
    throw new Error(`Can not guess numComponents for attribute '${name}'. Tried ${numComponents} but ${length2} values is not evenly divisible by ${numComponents}. You should specify it.`);
  }
  return numComponents;
}
function getNumComponents(array, arrayName, numValues) {
  return array.numComponents || array.size || guessNumComponentsFromName(arrayName, numValues || getArray(array).length);
}
function makeTypedArray(array, name) {
  if (isArrayBuffer$1(array)) {
    return array;
  }
  if (isArrayBuffer$1(array.data)) {
    return array.data;
  }
  if (Array.isArray(array)) {
    array = {
      data: array
    };
  }
  let Type = array.type ? typedArrayTypeFromGLTypeOrTypedArrayCtor(array.type) : void 0;
  if (!Type) {
    if (isIndices(name)) {
      Type = Uint16Array;
    } else {
      Type = Float32Array;
    }
  }
  return new Type(array.data);
}
function glTypeFromGLTypeOrTypedArrayType(glTypeOrTypedArrayCtor) {
  return typeof glTypeOrTypedArrayCtor === "number" ? glTypeOrTypedArrayCtor : glTypeOrTypedArrayCtor ? getGLTypeForTypedArrayType(glTypeOrTypedArrayCtor) : FLOAT$2;
}
function typedArrayTypeFromGLTypeOrTypedArrayCtor(glTypeOrTypedArrayCtor) {
  return typeof glTypeOrTypedArrayCtor === "number" ? getTypedArrayTypeForGLType(glTypeOrTypedArrayCtor) : glTypeOrTypedArrayCtor || Float32Array;
}
function attribBufferFromBuffer(gl, array) {
  return {
    buffer: array.buffer,
    numValues: 2 * 3 * 4,
    // safely divided by 2, 3, 4
    type: glTypeFromGLTypeOrTypedArrayType(array.type),
    arrayType: typedArrayTypeFromGLTypeOrTypedArrayCtor(array.type)
  };
}
function attribBufferFromSize(gl, array) {
  const numValues = array.data || array;
  const arrayType = typedArrayTypeFromGLTypeOrTypedArrayCtor(array.type);
  const numBytes = numValues * arrayType.BYTES_PER_ELEMENT;
  const buffer = gl.createBuffer();
  gl.bindBuffer(ARRAY_BUFFER$1, buffer);
  gl.bufferData(ARRAY_BUFFER$1, numBytes, array.drawType || STATIC_DRAW);
  return {
    buffer,
    numValues,
    type: getGLTypeForTypedArrayType(arrayType),
    arrayType
  };
}
function attribBufferFromArrayLike(gl, array, arrayName) {
  const typedArray = makeTypedArray(array, arrayName);
  return {
    arrayType: typedArray.constructor,
    buffer: createBufferFromTypedArray(gl, typedArray, void 0, array.drawType),
    type: getGLTypeForTypedArray(typedArray),
    numValues: 0
  };
}
function createAttribsFromArrays(gl, arrays) {
  const attribs = {};
  Object.keys(arrays).forEach(function(arrayName) {
    if (!isIndices(arrayName)) {
      const array = arrays[arrayName];
      const attribName = array.attrib || array.name || array.attribName || defaults$2.attribPrefix + arrayName;
      if (array.value) {
        if (!Array.isArray(array.value) && !isArrayBuffer$1(array.value)) {
          throw new Error("array.value is not array or typedarray");
        }
        attribs[attribName] = {
          value: array.value
        };
      } else {
        let fn;
        if (array.buffer && array.buffer instanceof WebGLBuffer) {
          fn = attribBufferFromBuffer;
        } else if (typeof array === "number" || typeof array.data === "number") {
          fn = attribBufferFromSize;
        } else {
          fn = attribBufferFromArrayLike;
        }
        const { buffer, type, numValues, arrayType } = fn(gl, array, arrayName);
        const normalization = array.normalize !== void 0 ? array.normalize : getNormalizationForTypedArrayType(arrayType);
        const numComponents = getNumComponents(array, arrayName, numValues);
        attribs[attribName] = {
          buffer,
          numComponents,
          type,
          normalize: normalization,
          stride: array.stride || 0,
          offset: array.offset || 0,
          divisor: array.divisor === void 0 ? void 0 : array.divisor,
          drawType: array.drawType
        };
      }
    }
  });
  gl.bindBuffer(ARRAY_BUFFER$1, null);
  return attribs;
}
function setAttribInfoBufferFromArray(gl, attribInfo, array, offset) {
  array = makeTypedArray(array);
  if (offset !== void 0) {
    gl.bindBuffer(ARRAY_BUFFER$1, attribInfo.buffer);
    gl.bufferSubData(ARRAY_BUFFER$1, offset, array);
  } else {
    setBufferFromTypedArray(gl, ARRAY_BUFFER$1, attribInfo.buffer, array, attribInfo.drawType);
  }
}
function getBytesPerValueForGLType(gl, type) {
  if (type === BYTE$1) return 1;
  if (type === UNSIGNED_BYTE$2) return 1;
  if (type === SHORT$1) return 2;
  if (type === UNSIGNED_SHORT$2) return 2;
  if (type === INT$2) return 4;
  if (type === UNSIGNED_INT$2) return 4;
  if (type === FLOAT$2) return 4;
  return 0;
}
var positionKeys = ["position", "positions", "a_position"];
function getNumElementsFromNonIndexedArrays(arrays) {
  let key;
  let ii;
  for (ii = 0; ii < positionKeys.length; ++ii) {
    key = positionKeys[ii];
    if (key in arrays) {
      break;
    }
  }
  if (ii === positionKeys.length) {
    key = Object.keys(arrays)[0];
  }
  const array = arrays[key];
  const length2 = getArray(array).length;
  if (length2 === void 0) {
    return 1;
  }
  const numComponents = getNumComponents(array, key);
  const numElements = length2 / numComponents;
  if (length2 % numComponents > 0) {
    throw new Error(`numComponents ${numComponents} not correct for length ${length2}`);
  }
  return numElements;
}
function getNumElementsFromAttributes(gl, attribs) {
  let key;
  let ii;
  for (ii = 0; ii < positionKeys.length; ++ii) {
    key = positionKeys[ii];
    if (key in attribs) {
      break;
    }
    key = defaults$2.attribPrefix + key;
    if (key in attribs) {
      break;
    }
  }
  if (ii === positionKeys.length) {
    key = Object.keys(attribs)[0];
  }
  const attrib = attribs[key];
  if (!attrib.buffer) {
    return 1;
  }
  gl.bindBuffer(ARRAY_BUFFER$1, attrib.buffer);
  const numBytes = gl.getBufferParameter(ARRAY_BUFFER$1, BUFFER_SIZE);
  gl.bindBuffer(ARRAY_BUFFER$1, null);
  const bytesPerValue = getBytesPerValueForGLType(gl, attrib.type);
  const totalElements = numBytes / bytesPerValue;
  const numComponents = attrib.numComponents || attrib.size;
  const numElements = totalElements / numComponents;
  if (numElements % 1 !== 0) {
    throw new Error(`numComponents ${numComponents} not correct for length ${length}`);
  }
  return numElements;
}
function createBufferInfoFromArrays(gl, arrays, srcBufferInfo) {
  const newAttribs = createAttribsFromArrays(gl, arrays);
  const bufferInfo = Object.assign({}, srcBufferInfo ? srcBufferInfo : {});
  bufferInfo.attribs = Object.assign({}, srcBufferInfo ? srcBufferInfo.attribs : {}, newAttribs);
  const indices = arrays.indices;
  if (indices) {
    const newIndices = makeTypedArray(indices, "indices");
    bufferInfo.indices = createBufferFromTypedArray(gl, newIndices, ELEMENT_ARRAY_BUFFER$2);
    bufferInfo.numElements = newIndices.length;
    bufferInfo.elementType = getGLTypeForTypedArray(newIndices);
  } else if (!bufferInfo.numElements) {
    bufferInfo.numElements = getNumElementsFromAttributes(gl, bufferInfo.attribs);
  }
  return bufferInfo;
}
function createBufferFromArray(gl, array, arrayName) {
  const type = arrayName === "indices" ? ELEMENT_ARRAY_BUFFER$2 : ARRAY_BUFFER$1;
  const typedArray = makeTypedArray(array, arrayName);
  return createBufferFromTypedArray(gl, typedArray, type);
}
function createBuffersFromArrays(gl, arrays) {
  const buffers = {};
  Object.keys(arrays).forEach(function(key) {
    buffers[key] = createBufferFromArray(gl, arrays[key], key);
  });
  if (arrays.indices) {
    buffers.numElements = arrays.indices.length;
    buffers.elementType = getGLTypeForTypedArray(makeTypedArray(arrays.indices));
  } else {
    buffers.numElements = getNumElementsFromNonIndexedArrays(arrays);
  }
  return buffers;
}
var attributes = Object.freeze({
  __proto__: null,
  createAttribsFromArrays,
  createBuffersFromArrays,
  createBufferFromArray,
  createBufferFromTypedArray,
  createBufferInfoFromArrays,
  setAttribInfoBufferFromArray,
  setAttributePrefix,
  setAttributeDefaults_: setDefaults$2,
  getNumComponents_: getNumComponents,
  getArray_: getArray
});
function isWebGL2(gl) {
  return !!gl.texStorage2D;
}
function isWebGL1(gl) {
  return !gl.texStorage2D;
}
var glEnumToString = /* @__PURE__ */ (function() {
  const haveEnumsForType = {};
  const enums = {};
  function addEnums(gl) {
    const type = gl.constructor.name;
    if (!haveEnumsForType[type]) {
      for (const key in gl) {
        if (typeof gl[key] === "number") {
          const existing = enums[gl[key]];
          enums[gl[key]] = existing ? `${existing} | ${key}` : key;
        }
      }
      haveEnumsForType[type] = true;
    }
  }
  return function glEnumToString2(gl, value) {
    addEnums(gl);
    return enums[value] || (typeof value === "number" ? `0x${value.toString(16)}` : value);
  };
})();
var utils = Object.freeze({
  __proto__: null,
  glEnumToString,
  isWebGL1,
  isWebGL2
});
var defaults$1 = {
  textureColor: new Uint8Array([128, 192, 255, 255]),
  textureOptions: {},
  crossOrigin: void 0
};
var isArrayBuffer2 = isArrayBuffer$1;
var getShared2DContext = /* @__PURE__ */ (function() {
  let s_ctx;
  return function getShared2DContext2() {
    s_ctx = s_ctx || (typeof document !== "undefined" && document.createElement ? document.createElement("canvas").getContext("2d") : null);
    return s_ctx;
  };
})();
var ALPHA = 6406;
var RGB = 6407;
var RGBA$1 = 6408;
var LUMINANCE = 6409;
var LUMINANCE_ALPHA = 6410;
var DEPTH_COMPONENT$1 = 6402;
var DEPTH_STENCIL$1 = 34041;
var CLAMP_TO_EDGE$1 = 33071;
var NEAREST = 9728;
var LINEAR$1 = 9729;
var TEXTURE_2D$2 = 3553;
var TEXTURE_CUBE_MAP$1 = 34067;
var TEXTURE_3D$1 = 32879;
var TEXTURE_2D_ARRAY$1 = 35866;
var TEXTURE_CUBE_MAP_POSITIVE_X = 34069;
var TEXTURE_CUBE_MAP_NEGATIVE_X = 34070;
var TEXTURE_CUBE_MAP_POSITIVE_Y = 34071;
var TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072;
var TEXTURE_CUBE_MAP_POSITIVE_Z = 34073;
var TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074;
var TEXTURE_MIN_FILTER = 10241;
var TEXTURE_MAG_FILTER = 10240;
var TEXTURE_WRAP_S = 10242;
var TEXTURE_WRAP_T = 10243;
var TEXTURE_WRAP_R = 32882;
var TEXTURE_MIN_LOD = 33082;
var TEXTURE_MAX_LOD = 33083;
var TEXTURE_BASE_LEVEL = 33084;
var TEXTURE_MAX_LEVEL = 33085;
var TEXTURE_COMPARE_MODE = 34892;
var TEXTURE_COMPARE_FUNC = 34893;
var UNPACK_ALIGNMENT = 3317;
var UNPACK_ROW_LENGTH = 3314;
var UNPACK_IMAGE_HEIGHT = 32878;
var UNPACK_SKIP_PIXELS = 3316;
var UNPACK_SKIP_ROWS = 3315;
var UNPACK_SKIP_IMAGES = 32877;
var UNPACK_COLORSPACE_CONVERSION_WEBGL = 37443;
var UNPACK_PREMULTIPLY_ALPHA_WEBGL = 37441;
var UNPACK_FLIP_Y_WEBGL = 37440;
var R8 = 33321;
var R8_SNORM = 36756;
var R16F = 33325;
var R32F = 33326;
var R8UI = 33330;
var R8I = 33329;
var RG16UI = 33338;
var RG16I = 33337;
var RG32UI = 33340;
var RG32I = 33339;
var RG8 = 33323;
var RG8_SNORM = 36757;
var RG16F = 33327;
var RG32F = 33328;
var RG8UI = 33336;
var RG8I = 33335;
var R16UI = 33332;
var R16I = 33331;
var R32UI = 33334;
var R32I = 33333;
var RGB8 = 32849;
var SRGB8 = 35905;
var RGB565$1 = 36194;
var RGB8_SNORM = 36758;
var R11F_G11F_B10F = 35898;
var RGB9_E5 = 35901;
var RGB16F = 34843;
var RGB32F = 34837;
var RGB8UI = 36221;
var RGB8I = 36239;
var RGB16UI = 36215;
var RGB16I = 36233;
var RGB32UI = 36209;
var RGB32I = 36227;
var RGBA8 = 32856;
var SRGB8_ALPHA8 = 35907;
var RGBA8_SNORM = 36759;
var RGB5_A1$1 = 32855;
var RGBA4$1 = 32854;
var RGB10_A2 = 32857;
var RGBA16F = 34842;
var RGBA32F = 34836;
var RGBA8UI = 36220;
var RGBA8I = 36238;
var RGB10_A2UI = 36975;
var RGBA16UI = 36214;
var RGBA16I = 36232;
var RGBA32I = 36226;
var RGBA32UI = 36208;
var DEPTH_COMPONENT16$1 = 33189;
var DEPTH_COMPONENT24$1 = 33190;
var DEPTH_COMPONENT32F$1 = 36012;
var DEPTH32F_STENCIL8$1 = 36013;
var DEPTH24_STENCIL8$1 = 35056;
var BYTE = 5120;
var UNSIGNED_BYTE$1 = 5121;
var SHORT = 5122;
var UNSIGNED_SHORT$1 = 5123;
var INT$1 = 5124;
var UNSIGNED_INT$1 = 5125;
var FLOAT$1 = 5126;
var UNSIGNED_SHORT_4_4_4_4 = 32819;
var UNSIGNED_SHORT_5_5_5_1 = 32820;
var UNSIGNED_SHORT_5_6_5 = 33635;
var HALF_FLOAT = 5131;
var HALF_FLOAT_OES = 36193;
var UNSIGNED_INT_2_10_10_10_REV = 33640;
var UNSIGNED_INT_10F_11F_11F_REV = 35899;
var UNSIGNED_INT_5_9_9_9_REV = 35902;
var FLOAT_32_UNSIGNED_INT_24_8_REV = 36269;
var UNSIGNED_INT_24_8 = 34042;
var RG = 33319;
var RG_INTEGER = 33320;
var RED = 6403;
var RED_INTEGER = 36244;
var RGB_INTEGER = 36248;
var RGBA_INTEGER = 36249;
var formatInfo = {};
{
  const f = formatInfo;
  f[ALPHA] = { numColorComponents: 1 };
  f[LUMINANCE] = { numColorComponents: 1 };
  f[LUMINANCE_ALPHA] = { numColorComponents: 2 };
  f[RGB] = { numColorComponents: 3 };
  f[RGBA$1] = { numColorComponents: 4 };
  f[RED] = { numColorComponents: 1 };
  f[RED_INTEGER] = { numColorComponents: 1 };
  f[RG] = { numColorComponents: 2 };
  f[RG_INTEGER] = { numColorComponents: 2 };
  f[RGB] = { numColorComponents: 3 };
  f[RGB_INTEGER] = { numColorComponents: 3 };
  f[RGBA$1] = { numColorComponents: 4 };
  f[RGBA_INTEGER] = { numColorComponents: 4 };
  f[DEPTH_COMPONENT$1] = { numColorComponents: 1 };
  f[DEPTH_STENCIL$1] = { numColorComponents: 2 };
}
var s_textureInternalFormatInfo;
function getTextureInternalFormatInfo(internalFormat) {
  if (!s_textureInternalFormatInfo) {
    const t = {};
    t[ALPHA] = { textureFormat: ALPHA, colorRenderable: true, textureFilterable: true, bytesPerElement: [1, 2, 2, 4], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1] };
    t[LUMINANCE] = { textureFormat: LUMINANCE, colorRenderable: true, textureFilterable: true, bytesPerElement: [1, 2, 2, 4], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1] };
    t[LUMINANCE_ALPHA] = { textureFormat: LUMINANCE_ALPHA, colorRenderable: true, textureFilterable: true, bytesPerElement: [2, 4, 4, 8], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1] };
    t[RGB] = { textureFormat: RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3, 6, 6, 12, 2], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1, UNSIGNED_SHORT_5_6_5] };
    t[RGBA$1] = { textureFormat: RGBA$1, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 8, 8, 16, 2, 2], type: [UNSIGNED_BYTE$1, HALF_FLOAT, HALF_FLOAT_OES, FLOAT$1, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_5_5_1] };
    t[DEPTH_COMPONENT$1] = { textureFormat: DEPTH_COMPONENT$1, colorRenderable: true, textureFilterable: false, bytesPerElement: [2, 4], type: [UNSIGNED_INT$1, UNSIGNED_SHORT$1] };
    t[R8] = { textureFormat: RED, colorRenderable: true, textureFilterable: true, bytesPerElement: [1], type: [UNSIGNED_BYTE$1] };
    t[R8_SNORM] = { textureFormat: RED, colorRenderable: false, textureFilterable: true, bytesPerElement: [1], type: [BYTE] };
    t[R16F] = { textureFormat: RED, colorRenderable: false, textureFilterable: true, bytesPerElement: [4, 2], type: [FLOAT$1, HALF_FLOAT] };
    t[R32F] = { textureFormat: RED, colorRenderable: false, textureFilterable: false, bytesPerElement: [4], type: [FLOAT$1] };
    t[R8UI] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [1], type: [UNSIGNED_BYTE$1] };
    t[R8I] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [1], type: [BYTE] };
    t[R16UI] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [2], type: [UNSIGNED_SHORT$1] };
    t[R16I] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [2], type: [SHORT] };
    t[R32UI] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_INT$1] };
    t[R32I] = { textureFormat: RED_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [INT$1] };
    t[RG8] = { textureFormat: RG, colorRenderable: true, textureFilterable: true, bytesPerElement: [2], type: [UNSIGNED_BYTE$1] };
    t[RG8_SNORM] = { textureFormat: RG, colorRenderable: false, textureFilterable: true, bytesPerElement: [2], type: [BYTE] };
    t[RG16F] = { textureFormat: RG, colorRenderable: false, textureFilterable: true, bytesPerElement: [8, 4], type: [FLOAT$1, HALF_FLOAT] };
    t[RG32F] = { textureFormat: RG, colorRenderable: false, textureFilterable: false, bytesPerElement: [8], type: [FLOAT$1] };
    t[RG8UI] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [2], type: [UNSIGNED_BYTE$1] };
    t[RG8I] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [2], type: [BYTE] };
    t[RG16UI] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_SHORT$1] };
    t[RG16I] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [SHORT] };
    t[RG32UI] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [8], type: [UNSIGNED_INT$1] };
    t[RG32I] = { textureFormat: RG_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [8], type: [INT$1] };
    t[RGB8] = { textureFormat: RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3], type: [UNSIGNED_BYTE$1] };
    t[SRGB8] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [3], type: [UNSIGNED_BYTE$1] };
    t[RGB565$1] = { textureFormat: RGB, colorRenderable: true, textureFilterable: true, bytesPerElement: [3, 2], type: [UNSIGNED_BYTE$1, UNSIGNED_SHORT_5_6_5] };
    t[RGB8_SNORM] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [3], type: [BYTE] };
    t[R11F_G11F_B10F] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [12, 6, 4], type: [FLOAT$1, HALF_FLOAT, UNSIGNED_INT_10F_11F_11F_REV] };
    t[RGB9_E5] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [12, 6, 4], type: [FLOAT$1, HALF_FLOAT, UNSIGNED_INT_5_9_9_9_REV] };
    t[RGB16F] = { textureFormat: RGB, colorRenderable: false, textureFilterable: true, bytesPerElement: [12, 6], type: [FLOAT$1, HALF_FLOAT] };
    t[RGB32F] = { textureFormat: RGB, colorRenderable: false, textureFilterable: false, bytesPerElement: [12], type: [FLOAT$1] };
    t[RGB8UI] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [3], type: [UNSIGNED_BYTE$1] };
    t[RGB8I] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [3], type: [BYTE] };
    t[RGB16UI] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [6], type: [UNSIGNED_SHORT$1] };
    t[RGB16I] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [6], type: [SHORT] };
    t[RGB32UI] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [12], type: [UNSIGNED_INT$1] };
    t[RGB32I] = { textureFormat: RGB_INTEGER, colorRenderable: false, textureFilterable: false, bytesPerElement: [12], type: [INT$1] };
    t[RGBA8] = { textureFormat: RGBA$1, colorRenderable: true, textureFilterable: true, bytesPerElement: [4], type: [UNSIGNED_BYTE$1] };
    t[SRGB8_ALPHA8] = { textureFormat: RGBA$1, colorRenderable: true, textureFilterable: true, bytesPerElement: [4], type: [UNSIGNED_BYTE$1] };
    t[RGBA8_SNORM] = { textureFormat: RGBA$1, colorRenderable: false, textureFilterable: true, bytesPerElement: [4], type: [BYTE] };
    t[RGB5_A1$1] = { textureFormat: RGBA$1, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 2, 4], type: [UNSIGNED_BYTE$1, UNSIGNED_SHORT_5_5_5_1, UNSIGNED_INT_2_10_10_10_REV] };
    t[RGBA4$1] = { textureFormat: RGBA$1, colorRenderable: true, textureFilterable: true, bytesPerElement: [4, 2], type: [UNSIGNED_BYTE$1, UNSIGNED_SHORT_4_4_4_4] };
    t[RGB10_A2] = { textureFormat: RGBA$1, colorRenderable: true, textureFilterable: true, bytesPerElement: [4], type: [UNSIGNED_INT_2_10_10_10_REV] };
    t[RGBA16F] = { textureFormat: RGBA$1, colorRenderable: false, textureFilterable: true, bytesPerElement: [16, 8], type: [FLOAT$1, HALF_FLOAT] };
    t[RGBA32F] = { textureFormat: RGBA$1, colorRenderable: false, textureFilterable: false, bytesPerElement: [16], type: [FLOAT$1] };
    t[RGBA8UI] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_BYTE$1] };
    t[RGBA8I] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [BYTE] };
    t[RGB10_A2UI] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_INT_2_10_10_10_REV] };
    t[RGBA16UI] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [8], type: [UNSIGNED_SHORT$1] };
    t[RGBA16I] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [8], type: [SHORT] };
    t[RGBA32I] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [16], type: [INT$1] };
    t[RGBA32UI] = { textureFormat: RGBA_INTEGER, colorRenderable: true, textureFilterable: false, bytesPerElement: [16], type: [UNSIGNED_INT$1] };
    t[DEPTH_COMPONENT16$1] = { textureFormat: DEPTH_COMPONENT$1, colorRenderable: true, textureFilterable: false, bytesPerElement: [2, 4], type: [UNSIGNED_SHORT$1, UNSIGNED_INT$1] };
    t[DEPTH_COMPONENT24$1] = { textureFormat: DEPTH_COMPONENT$1, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_INT$1] };
    t[DEPTH_COMPONENT32F$1] = { textureFormat: DEPTH_COMPONENT$1, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [FLOAT$1] };
    t[DEPTH24_STENCIL8$1] = { textureFormat: DEPTH_STENCIL$1, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [UNSIGNED_INT_24_8] };
    t[DEPTH32F_STENCIL8$1] = { textureFormat: DEPTH_STENCIL$1, colorRenderable: true, textureFilterable: false, bytesPerElement: [4], type: [FLOAT_32_UNSIGNED_INT_24_8_REV] };
    Object.keys(t).forEach(function(internalFormat2) {
      const info = t[internalFormat2];
      info.bytesPerElementMap = {};
      info.bytesPerElement.forEach(function(bytesPerElement, ndx) {
        const type = info.type[ndx];
        info.bytesPerElementMap[type] = bytesPerElement;
      });
    });
    s_textureInternalFormatInfo = t;
  }
  return s_textureInternalFormatInfo[internalFormat];
}
function getBytesPerElementForInternalFormat(internalFormat, type) {
  const info = getTextureInternalFormatInfo(internalFormat);
  if (!info) {
    throw "unknown internal format";
  }
  const bytesPerElement = info.bytesPerElementMap[type];
  if (bytesPerElement === void 0) {
    throw "unknown internal format";
  }
  return bytesPerElement;
}
function getFormatAndTypeForInternalFormat(internalFormat) {
  const info = getTextureInternalFormatInfo(internalFormat);
  if (!info) {
    throw "unknown internal format";
  }
  return {
    format: info.textureFormat,
    type: info.type[0]
  };
}
function isPowerOf2(value) {
  return (value & value - 1) === 0;
}
function canGenerateMipmap(gl, width, height, internalFormat) {
  if (!isWebGL2(gl)) {
    return isPowerOf2(width) && isPowerOf2(height);
  }
  const info = getTextureInternalFormatInfo(internalFormat);
  if (!info) {
    throw "unknown internal format";
  }
  return info.colorRenderable && info.textureFilterable;
}
function canFilter(internalFormat) {
  const info = getTextureInternalFormatInfo(internalFormat);
  if (!info) {
    throw "unknown internal format";
  }
  return info.textureFilterable;
}
function getNumComponentsForFormat(format) {
  const info = formatInfo[format];
  if (!info) {
    throw "unknown format: " + format;
  }
  return info.numColorComponents;
}
function getTextureTypeForArrayType(gl, src, defaultType) {
  if (isArrayBuffer2(src)) {
    return getGLTypeForTypedArray(src);
  }
  return defaultType || UNSIGNED_BYTE$1;
}
function guessDimensions(gl, target, width, height, numElements) {
  if (numElements % 1 !== 0) {
    throw "can't guess dimensions";
  }
  if (!width && !height) {
    const size = Math.sqrt(numElements / (target === TEXTURE_CUBE_MAP$1 ? 6 : 1));
    if (size % 1 === 0) {
      width = size;
      height = size;
    } else {
      width = numElements;
      height = 1;
    }
  } else if (!height) {
    height = numElements / width;
    if (height % 1) {
      throw "can't guess dimensions";
    }
  } else if (!width) {
    width = numElements / height;
    if (width % 1) {
      throw "can't guess dimensions";
    }
  }
  return {
    width,
    height
  };
}
function setDefaultTextureColor(color) {
  defaults$1.textureColor = new Uint8Array([color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255]);
}
function setDefaults$1(newDefaults) {
  copyExistingProperties(newDefaults, defaults$1);
  if (newDefaults.textureColor) {
    setDefaultTextureColor(newDefaults.textureColor);
  }
}
function setPackState(gl, options) {
  if (options.colorspaceConversion !== void 0) {
    gl.pixelStorei(UNPACK_COLORSPACE_CONVERSION_WEBGL, options.colorspaceConversion);
  }
  if (options.premultiplyAlpha !== void 0) {
    gl.pixelStorei(UNPACK_PREMULTIPLY_ALPHA_WEBGL, options.premultiplyAlpha);
  }
  if (options.flipY !== void 0) {
    gl.pixelStorei(UNPACK_FLIP_Y_WEBGL, options.flipY);
  }
}
function setSkipStateToDefault(gl) {
  gl.pixelStorei(UNPACK_ALIGNMENT, 4);
  if (isWebGL2(gl)) {
    gl.pixelStorei(UNPACK_ROW_LENGTH, 0);
    gl.pixelStorei(UNPACK_IMAGE_HEIGHT, 0);
    gl.pixelStorei(UNPACK_SKIP_PIXELS, 0);
    gl.pixelStorei(UNPACK_SKIP_ROWS, 0);
    gl.pixelStorei(UNPACK_SKIP_IMAGES, 0);
  }
}
function setTextureSamplerParameters(gl, target, parameteriFn, options) {
  if (options.minMag) {
    parameteriFn.call(gl, target, TEXTURE_MIN_FILTER, options.minMag);
    parameteriFn.call(gl, target, TEXTURE_MAG_FILTER, options.minMag);
  }
  if (options.min) {
    parameteriFn.call(gl, target, TEXTURE_MIN_FILTER, options.min);
  }
  if (options.mag) {
    parameteriFn.call(gl, target, TEXTURE_MAG_FILTER, options.mag);
  }
  if (options.wrap) {
    parameteriFn.call(gl, target, TEXTURE_WRAP_S, options.wrap);
    parameteriFn.call(gl, target, TEXTURE_WRAP_T, options.wrap);
    if (target === TEXTURE_3D$1 || isSampler(gl, target)) {
      parameteriFn.call(gl, target, TEXTURE_WRAP_R, options.wrap);
    }
  }
  if (options.wrapR) {
    parameteriFn.call(gl, target, TEXTURE_WRAP_R, options.wrapR);
  }
  if (options.wrapS) {
    parameteriFn.call(gl, target, TEXTURE_WRAP_S, options.wrapS);
  }
  if (options.wrapT) {
    parameteriFn.call(gl, target, TEXTURE_WRAP_T, options.wrapT);
  }
  if (options.minLod !== void 0) {
    parameteriFn.call(gl, target, TEXTURE_MIN_LOD, options.minLod);
  }
  if (options.maxLod !== void 0) {
    parameteriFn.call(gl, target, TEXTURE_MAX_LOD, options.maxLod);
  }
  if (options.baseLevel !== void 0) {
    parameteriFn.call(gl, target, TEXTURE_BASE_LEVEL, options.baseLevel);
  }
  if (options.maxLevel !== void 0) {
    parameteriFn.call(gl, target, TEXTURE_MAX_LEVEL, options.maxLevel);
  }
  if (options.compareFunc !== void 0) {
    parameteriFn.call(gl, target, TEXTURE_COMPARE_FUNC, options.compareFunc);
  }
  if (options.compareMode !== void 0) {
    parameteriFn.call(gl, target, TEXTURE_COMPARE_MODE, options.compareMode);
  }
}
function setTextureParameters(gl, tex, options) {
  const target = options.target || TEXTURE_2D$2;
  gl.bindTexture(target, tex);
  setTextureSamplerParameters(gl, target, gl.texParameteri, options);
}
function setSamplerParameters(gl, sampler, options) {
  setTextureSamplerParameters(gl, sampler, gl.samplerParameteri, options);
}
function createSampler(gl, options) {
  const sampler = gl.createSampler();
  setSamplerParameters(gl, sampler, options);
  return sampler;
}
function createSamplers(gl, samplerOptions) {
  const samplers = {};
  Object.keys(samplerOptions).forEach(function(name) {
    samplers[name] = createSampler(gl, samplerOptions[name]);
  });
  return samplers;
}
function make1Pixel(color) {
  color = color || defaults$1.textureColor;
  if (isArrayBuffer2(color)) {
    return color;
  }
  return new Uint8Array([color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255]);
}
function setTextureFilteringForSize(gl, tex, options, width, height, internalFormat) {
  options = options || defaults$1.textureOptions;
  internalFormat = internalFormat || RGBA$1;
  const target = options.target || TEXTURE_2D$2;
  width = width || options.width;
  height = height || options.height;
  gl.bindTexture(target, tex);
  if (canGenerateMipmap(gl, width, height, internalFormat)) {
    gl.generateMipmap(target);
  } else {
    const filtering = canFilter(internalFormat) ? LINEAR$1 : NEAREST;
    gl.texParameteri(target, TEXTURE_MIN_FILTER, filtering);
    gl.texParameteri(target, TEXTURE_MAG_FILTER, filtering);
    gl.texParameteri(target, TEXTURE_WRAP_S, CLAMP_TO_EDGE$1);
    gl.texParameteri(target, TEXTURE_WRAP_T, CLAMP_TO_EDGE$1);
  }
}
function shouldAutomaticallySetTextureFilteringForSize(options) {
  return options.auto === true || options.auto === void 0 && options.level === void 0;
}
function getCubeFaceOrder(gl, options) {
  options = options || {};
  return options.cubeFaceOrder || [
    TEXTURE_CUBE_MAP_POSITIVE_X,
    TEXTURE_CUBE_MAP_NEGATIVE_X,
    TEXTURE_CUBE_MAP_POSITIVE_Y,
    TEXTURE_CUBE_MAP_NEGATIVE_Y,
    TEXTURE_CUBE_MAP_POSITIVE_Z,
    TEXTURE_CUBE_MAP_NEGATIVE_Z
  ];
}
function getCubeFacesWithNdx(gl, options) {
  const faces = getCubeFaceOrder(gl, options);
  const facesWithNdx = faces.map(function(face, ndx) {
    return { face, ndx };
  });
  facesWithNdx.sort(function(a, b) {
    return a.face - b.face;
  });
  return facesWithNdx;
}
function setTextureFromElement(gl, tex, element, options) {
  options = options || defaults$1.textureOptions;
  const target = options.target || TEXTURE_2D$2;
  const level = options.level || 0;
  let width = element.width;
  let height = element.height;
  const internalFormat = options.internalFormat || options.format || RGBA$1;
  const formatType = getFormatAndTypeForInternalFormat(internalFormat);
  const format = options.format || formatType.format;
  const type = options.type || formatType.type;
  setPackState(gl, options);
  gl.bindTexture(target, tex);
  if (target === TEXTURE_CUBE_MAP$1) {
    const imgWidth = element.width;
    const imgHeight = element.height;
    let size;
    let slices;
    if (imgWidth / 6 === imgHeight) {
      size = imgHeight;
      slices = [0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0];
    } else if (imgHeight / 6 === imgWidth) {
      size = imgWidth;
      slices = [0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5];
    } else if (imgWidth / 3 === imgHeight / 2) {
      size = imgWidth / 3;
      slices = [0, 0, 1, 0, 2, 0, 0, 1, 1, 1, 2, 1];
    } else if (imgWidth / 2 === imgHeight / 3) {
      size = imgWidth / 2;
      slices = [0, 0, 1, 0, 0, 1, 1, 1, 0, 2, 1, 2];
    } else {
      throw "can't figure out cube map from element: " + (element.src ? element.src : element.nodeName);
    }
    const ctx = getShared2DContext();
    if (ctx) {
      ctx.canvas.width = size;
      ctx.canvas.height = size;
      width = size;
      height = size;
      getCubeFacesWithNdx(gl, options).forEach(function(f) {
        const xOffset = slices[f.ndx * 2 + 0] * size;
        const yOffset = slices[f.ndx * 2 + 1] * size;
        ctx.drawImage(element, xOffset, yOffset, size, size, 0, 0, size, size);
        gl.texImage2D(f.face, level, internalFormat, format, type, ctx.canvas);
      });
      ctx.canvas.width = 1;
      ctx.canvas.height = 1;
    } else if (typeof createImageBitmap !== "undefined") {
      width = size;
      height = size;
      getCubeFacesWithNdx(gl, options).forEach(function(f) {
        const xOffset = slices[f.ndx * 2 + 0] * size;
        const yOffset = slices[f.ndx * 2 + 1] * size;
        gl.texImage2D(f.face, level, internalFormat, size, size, 0, format, type, null);
        createImageBitmap(element, xOffset, yOffset, size, size, {
          premultiplyAlpha: "none",
          colorSpaceConversion: "none"
        }).then(function(imageBitmap) {
          setPackState(gl, options);
          gl.bindTexture(target, tex);
          gl.texImage2D(f.face, level, internalFormat, format, type, imageBitmap);
          if (shouldAutomaticallySetTextureFilteringForSize(options)) {
            setTextureFilteringForSize(gl, tex, options, width, height, internalFormat);
          }
        });
      });
    }
  } else if (target === TEXTURE_3D$1 || target === TEXTURE_2D_ARRAY$1) {
    const smallest = Math.min(element.width, element.height);
    const largest = Math.max(element.width, element.height);
    const depth = largest / smallest;
    if (depth % 1 !== 0) {
      throw "can not compute 3D dimensions of element";
    }
    const xMult = element.width === largest ? 1 : 0;
    const yMult = element.height === largest ? 1 : 0;
    gl.pixelStorei(UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(UNPACK_ROW_LENGTH, element.width);
    gl.pixelStorei(UNPACK_IMAGE_HEIGHT, 0);
    gl.pixelStorei(UNPACK_SKIP_IMAGES, 0);
    gl.texImage3D(target, level, internalFormat, smallest, smallest, smallest, 0, format, type, null);
    for (let d = 0; d < depth; ++d) {
      const srcX = d * smallest * xMult;
      const srcY = d * smallest * yMult;
      gl.pixelStorei(UNPACK_SKIP_PIXELS, srcX);
      gl.pixelStorei(UNPACK_SKIP_ROWS, srcY);
      gl.texSubImage3D(target, level, 0, 0, d, smallest, smallest, 1, format, type, element);
    }
    setSkipStateToDefault(gl);
  } else {
    gl.texImage2D(target, level, internalFormat, format, type, element);
  }
  if (shouldAutomaticallySetTextureFilteringForSize(options)) {
    setTextureFilteringForSize(gl, tex, options, width, height, internalFormat);
  }
  setTextureParameters(gl, tex, options);
}
function noop() {
}
function urlIsSameOrigin(url) {
  if (typeof document !== "undefined") {
    const a = document.createElement("a");
    a.href = url;
    return a.hostname === location.hostname && a.port === location.port && a.protocol === location.protocol;
  } else {
    const localOrigin = new URL(location.href).origin;
    const urlOrigin = new URL(url, location.href).origin;
    return urlOrigin === localOrigin;
  }
}
function setToAnonymousIfUndefinedAndURLIsNotSameOrigin(url, crossOrigin) {
  return crossOrigin === void 0 && !urlIsSameOrigin(url) ? "anonymous" : crossOrigin;
}
function loadImage(url, crossOrigin, callback) {
  callback = callback || noop;
  let img;
  crossOrigin = crossOrigin !== void 0 ? crossOrigin : defaults$1.crossOrigin;
  crossOrigin = setToAnonymousIfUndefinedAndURLIsNotSameOrigin(url, crossOrigin);
  if (typeof Image !== "undefined") {
    img = new Image();
    if (crossOrigin !== void 0) {
      img.crossOrigin = crossOrigin;
    }
    const clearEventHandlers = function clearEventHandlers2() {
      img.removeEventListener("error", onError);
      img.removeEventListener("load", onLoad);
      img = null;
    };
    const onError = function onError2() {
      const msg = "couldn't load image: " + url;
      error$1(msg);
      callback(msg, img);
      clearEventHandlers();
    };
    const onLoad = function onLoad2() {
      callback(null, img);
      clearEventHandlers();
    };
    img.addEventListener("error", onError);
    img.addEventListener("load", onLoad);
    img.src = url;
    return img;
  } else if (typeof ImageBitmap !== "undefined") {
    let err;
    let bm;
    const cb = function cb2() {
      callback(err, bm);
    };
    const options = {};
    if (crossOrigin) {
      options.mode = "cors";
    }
    fetch(url, options).then(function(response) {
      if (!response.ok) {
        throw response;
      }
      return response.blob();
    }).then(function(blob) {
      return createImageBitmap(blob, {
        premultiplyAlpha: "none",
        colorSpaceConversion: "none"
      });
    }).then(function(bitmap) {
      bm = bitmap;
      setTimeout(cb);
    }).catch(function(e) {
      err = e;
      setTimeout(cb);
    });
    img = null;
  }
  return img;
}
function isTexImageSource(obj) {
  return typeof ImageBitmap !== "undefined" && obj instanceof ImageBitmap || typeof ImageData !== "undefined" && obj instanceof ImageData || typeof HTMLElement !== "undefined" && obj instanceof HTMLElement;
}
function loadAndUseImage(obj, crossOrigin, callback) {
  if (isTexImageSource(obj)) {
    setTimeout(function() {
      callback(null, obj);
    });
    return obj;
  }
  return loadImage(obj, crossOrigin, callback);
}
function setTextureTo1PixelColor(gl, tex, options) {
  options = options || defaults$1.textureOptions;
  const target = options.target || TEXTURE_2D$2;
  gl.bindTexture(target, tex);
  if (options.color === false) {
    return;
  }
  const color = make1Pixel(options.color);
  if (target === TEXTURE_CUBE_MAP$1) {
    for (let ii = 0; ii < 6; ++ii) {
      gl.texImage2D(TEXTURE_CUBE_MAP_POSITIVE_X + ii, 0, RGBA$1, 1, 1, 0, RGBA$1, UNSIGNED_BYTE$1, color);
    }
  } else if (target === TEXTURE_3D$1 || target === TEXTURE_2D_ARRAY$1) {
    gl.texImage3D(target, 0, RGBA$1, 1, 1, 1, 0, RGBA$1, UNSIGNED_BYTE$1, color);
  } else {
    gl.texImage2D(target, 0, RGBA$1, 1, 1, 0, RGBA$1, UNSIGNED_BYTE$1, color);
  }
}
function loadTextureFromUrl(gl, tex, options, callback) {
  callback = callback || noop;
  options = options || defaults$1.textureOptions;
  setTextureTo1PixelColor(gl, tex, options);
  options = Object.assign({}, options);
  const img = loadAndUseImage(options.src, options.crossOrigin, function(err, img2) {
    if (err) {
      callback(err, tex, img2);
    } else {
      setTextureFromElement(gl, tex, img2, options);
      callback(null, tex, img2);
    }
  });
  return img;
}
function loadCubemapFromUrls(gl, tex, options, callback) {
  callback = callback || noop;
  const urls = options.src;
  if (urls.length !== 6) {
    throw "there must be 6 urls for a cubemap";
  }
  const level = options.level || 0;
  const internalFormat = options.internalFormat || options.format || RGBA$1;
  const formatType = getFormatAndTypeForInternalFormat(internalFormat);
  const format = options.format || formatType.format;
  const type = options.type || UNSIGNED_BYTE$1;
  const target = options.target || TEXTURE_2D$2;
  if (target !== TEXTURE_CUBE_MAP$1) {
    throw "target must be TEXTURE_CUBE_MAP";
  }
  setTextureTo1PixelColor(gl, tex, options);
  options = Object.assign({}, options);
  let numToLoad = 6;
  const errors = [];
  const faces = getCubeFaceOrder(gl, options);
  let imgs;
  function uploadImg(faceTarget) {
    return function(err, img) {
      --numToLoad;
      if (err) {
        errors.push(err);
      } else {
        if (img.width !== img.height) {
          errors.push("cubemap face img is not a square: " + img.src);
        } else {
          setPackState(gl, options);
          gl.bindTexture(target, tex);
          if (numToLoad === 5) {
            getCubeFaceOrder().forEach(function(otherTarget) {
              gl.texImage2D(otherTarget, level, internalFormat, format, type, img);
            });
          } else {
            gl.texImage2D(faceTarget, level, internalFormat, format, type, img);
          }
          if (shouldAutomaticallySetTextureFilteringForSize(options)) {
            gl.generateMipmap(target);
          }
        }
      }
      if (numToLoad === 0) {
        callback(errors.length ? errors : void 0, tex, imgs);
      }
    };
  }
  imgs = urls.map(function(url, ndx) {
    return loadAndUseImage(url, options.crossOrigin, uploadImg(faces[ndx]));
  });
}
function loadSlicesFromUrls(gl, tex, options, callback) {
  callback = callback || noop;
  const urls = options.src;
  const internalFormat = options.internalFormat || options.format || RGBA$1;
  const formatType = getFormatAndTypeForInternalFormat(internalFormat);
  const format = options.format || formatType.format;
  const type = options.type || UNSIGNED_BYTE$1;
  const target = options.target || TEXTURE_2D_ARRAY$1;
  if (target !== TEXTURE_3D$1 && target !== TEXTURE_2D_ARRAY$1) {
    throw "target must be TEXTURE_3D or TEXTURE_2D_ARRAY";
  }
  setTextureTo1PixelColor(gl, tex, options);
  options = Object.assign({}, options);
  let numToLoad = urls.length;
  const errors = [];
  let imgs;
  const level = options.level || 0;
  let width = options.width;
  let height = options.height;
  const depth = urls.length;
  let firstImage = true;
  function uploadImg(slice) {
    return function(err, img) {
      --numToLoad;
      if (err) {
        errors.push(err);
      } else {
        setPackState(gl, options);
        gl.bindTexture(target, tex);
        if (firstImage) {
          firstImage = false;
          width = options.width || img.width;
          height = options.height || img.height;
          gl.texImage3D(target, level, internalFormat, width, height, depth, 0, format, type, null);
          for (let s = 0; s < depth; ++s) {
            gl.texSubImage3D(target, level, 0, 0, s, width, height, 1, format, type, img);
          }
        } else {
          let src = img;
          let ctx;
          if (img.width !== width || img.height !== height) {
            ctx = getShared2DContext();
            src = ctx.canvas;
            ctx.canvas.width = width;
            ctx.canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
          }
          gl.texSubImage3D(target, level, 0, 0, slice, width, height, 1, format, type, src);
          if (ctx && src === ctx.canvas) {
            ctx.canvas.width = 0;
            ctx.canvas.height = 0;
          }
        }
        if (shouldAutomaticallySetTextureFilteringForSize(options)) {
          gl.generateMipmap(target);
        }
      }
      if (numToLoad === 0) {
        callback(errors.length ? errors : void 0, tex, imgs);
      }
    };
  }
  imgs = urls.map(function(url, ndx) {
    return loadAndUseImage(url, options.crossOrigin, uploadImg(ndx));
  });
}
function setTextureFromArray(gl, tex, src, options) {
  options = options || defaults$1.textureOptions;
  const target = options.target || TEXTURE_2D$2;
  gl.bindTexture(target, tex);
  let width = options.width;
  let height = options.height;
  let depth = options.depth;
  const level = options.level || 0;
  const internalFormat = options.internalFormat || options.format || RGBA$1;
  const formatType = getFormatAndTypeForInternalFormat(internalFormat);
  const format = options.format || formatType.format;
  const type = options.type || getTextureTypeForArrayType(gl, src, formatType.type);
  if (!isArrayBuffer2(src)) {
    const Type = getTypedArrayTypeForGLType(type);
    src = new Type(src);
  } else if (src instanceof Uint8ClampedArray) {
    src = new Uint8Array(src.buffer);
  }
  const bytesPerElement = getBytesPerElementForInternalFormat(internalFormat, type);
  const numElements = src.byteLength / bytesPerElement;
  if (numElements % 1) {
    throw "length wrong size for format: " + glEnumToString(gl, format);
  }
  let dimensions;
  if (target === TEXTURE_3D$1 || target === TEXTURE_2D_ARRAY$1) {
    if (!width && !height && !depth) {
      const size = Math.cbrt(numElements);
      if (size % 1 !== 0) {
        throw "can't guess cube size of array of numElements: " + numElements;
      }
      width = size;
      height = size;
      depth = size;
    } else if (width && (!height || !depth)) {
      dimensions = guessDimensions(gl, target, height, depth, numElements / width);
      height = dimensions.width;
      depth = dimensions.height;
    } else if (height && (!width || !depth)) {
      dimensions = guessDimensions(gl, target, width, depth, numElements / height);
      width = dimensions.width;
      depth = dimensions.height;
    } else {
      dimensions = guessDimensions(gl, target, width, height, numElements / depth);
      width = dimensions.width;
      height = dimensions.height;
    }
  } else {
    dimensions = guessDimensions(gl, target, width, height, numElements);
    width = dimensions.width;
    height = dimensions.height;
  }
  setSkipStateToDefault(gl);
  gl.pixelStorei(UNPACK_ALIGNMENT, options.unpackAlignment || 1);
  setPackState(gl, options);
  if (target === TEXTURE_CUBE_MAP$1) {
    const elementsPerElement = bytesPerElement / src.BYTES_PER_ELEMENT;
    const faceSize = numElements / 6 * elementsPerElement;
    getCubeFacesWithNdx(gl, options).forEach((f) => {
      const offset = faceSize * f.ndx;
      const data = src.subarray(offset, offset + faceSize);
      gl.texImage2D(f.face, level, internalFormat, width, height, 0, format, type, data);
    });
  } else if (target === TEXTURE_3D$1 || target === TEXTURE_2D_ARRAY$1) {
    gl.texImage3D(target, level, internalFormat, width, height, depth, 0, format, type, src);
  } else {
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, src);
  }
  return {
    width,
    height,
    depth,
    type
  };
}
function setEmptyTexture(gl, tex, options) {
  const target = options.target || TEXTURE_2D$2;
  gl.bindTexture(target, tex);
  const level = options.level || 0;
  const internalFormat = options.internalFormat || options.format || RGBA$1;
  const formatType = getFormatAndTypeForInternalFormat(internalFormat);
  const format = options.format || formatType.format;
  const type = options.type || formatType.type;
  setPackState(gl, options);
  if (target === TEXTURE_CUBE_MAP$1) {
    for (let ii = 0; ii < 6; ++ii) {
      gl.texImage2D(TEXTURE_CUBE_MAP_POSITIVE_X + ii, level, internalFormat, options.width, options.height, 0, format, type, null);
    }
  } else if (target === TEXTURE_3D$1 || target === TEXTURE_2D_ARRAY$1) {
    gl.texImage3D(target, level, internalFormat, options.width, options.height, options.depth, 0, format, type, null);
  } else {
    gl.texImage2D(target, level, internalFormat, options.width, options.height, 0, format, type, null);
  }
}
function createTexture(gl, options, callback) {
  callback = callback || noop;
  options = options || defaults$1.textureOptions;
  const tex = gl.createTexture();
  const target = options.target || TEXTURE_2D$2;
  let width = options.width || 1;
  let height = options.height || 1;
  const internalFormat = options.internalFormat || RGBA$1;
  gl.bindTexture(target, tex);
  if (target === TEXTURE_CUBE_MAP$1) {
    gl.texParameteri(target, TEXTURE_WRAP_S, CLAMP_TO_EDGE$1);
    gl.texParameteri(target, TEXTURE_WRAP_T, CLAMP_TO_EDGE$1);
  }
  let src = options.src;
  if (src) {
    if (typeof src === "function") {
      src = src(gl, options);
    }
    if (typeof src === "string") {
      loadTextureFromUrl(gl, tex, options, callback);
    } else if (isArrayBuffer2(src) || Array.isArray(src) && (typeof src[0] === "number" || Array.isArray(src[0]) || isArrayBuffer2(src[0]))) {
      const dimensions = setTextureFromArray(gl, tex, src, options);
      width = dimensions.width;
      height = dimensions.height;
    } else if (Array.isArray(src) && (typeof src[0] === "string" || isTexImageSource(src[0]))) {
      if (target === TEXTURE_CUBE_MAP$1) {
        loadCubemapFromUrls(gl, tex, options, callback);
      } else {
        loadSlicesFromUrls(gl, tex, options, callback);
      }
    } else {
      setTextureFromElement(gl, tex, src, options);
      width = src.width;
      height = src.height;
    }
  } else {
    setEmptyTexture(gl, tex, options);
  }
  if (shouldAutomaticallySetTextureFilteringForSize(options)) {
    setTextureFilteringForSize(gl, tex, options, width, height, internalFormat);
  }
  setTextureParameters(gl, tex, options);
  return tex;
}
function resizeTexture(gl, tex, options, width, height, depth) {
  width = width || options.width;
  height = height || options.height;
  depth = depth || options.depth;
  const target = options.target || TEXTURE_2D$2;
  gl.bindTexture(target, tex);
  const level = options.level || 0;
  const internalFormat = options.internalFormat || options.format || RGBA$1;
  const formatType = getFormatAndTypeForInternalFormat(internalFormat);
  const format = options.format || formatType.format;
  let type;
  const src = options.src;
  if (!src) {
    type = options.type || formatType.type;
  } else if (isArrayBuffer2(src) || Array.isArray(src) && typeof src[0] === "number") {
    type = options.type || getTextureTypeForArrayType(gl, src, formatType.type);
  } else {
    type = options.type || formatType.type;
  }
  if (target === TEXTURE_CUBE_MAP$1) {
    for (let ii = 0; ii < 6; ++ii) {
      gl.texImage2D(TEXTURE_CUBE_MAP_POSITIVE_X + ii, level, internalFormat, width, height, 0, format, type, null);
    }
  } else if (target === TEXTURE_3D$1 || target === TEXTURE_2D_ARRAY$1) {
    gl.texImage3D(target, level, internalFormat, width, height, depth, 0, format, type, null);
  } else {
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
  }
}
function isAsyncSrc(src) {
  return typeof src === "string" || Array.isArray(src) && typeof src[0] === "string";
}
function createTextures(gl, textureOptions, callback) {
  callback = callback || noop;
  let numDownloading = 0;
  const errors = [];
  const textures2 = {};
  const images = {};
  function callCallbackIfReady() {
    if (numDownloading === 0) {
      setTimeout(function() {
        callback(errors.length ? errors : void 0, textures2, images);
      }, 0);
    }
  }
  Object.keys(textureOptions).forEach(function(name) {
    const options = textureOptions[name];
    let onLoadFn;
    if (isAsyncSrc(options.src)) {
      onLoadFn = function(err, tex, img) {
        images[name] = img;
        --numDownloading;
        if (err) {
          errors.push(err);
        }
        callCallbackIfReady();
      };
      ++numDownloading;
    }
    textures2[name] = createTexture(gl, options, onLoadFn);
  });
  callCallbackIfReady();
  return textures2;
}
var textures = Object.freeze({
  __proto__: null,
  setTextureDefaults_: setDefaults$1,
  createSampler,
  createSamplers,
  setSamplerParameters,
  createTexture,
  setEmptyTexture,
  setTextureFromArray,
  loadTextureFromUrl,
  setTextureFromElement,
  setTextureFilteringForSize,
  setTextureParameters,
  setDefaultTextureColor,
  createTextures,
  resizeTexture,
  canGenerateMipmap,
  canFilter,
  getNumComponentsForFormat,
  getBytesPerElementForInternalFormat,
  getFormatAndTypeForInternalFormat
});
var error = error$1;
var warn = warn$1;
function getElementById(id) {
  return typeof document !== "undefined" && document.getElementById ? document.getElementById(id) : null;
}
var TEXTURE0 = 33984;
var DYNAMIC_DRAW = 35048;
var ARRAY_BUFFER = 34962;
var ELEMENT_ARRAY_BUFFER$1 = 34963;
var UNIFORM_BUFFER = 35345;
var TRANSFORM_FEEDBACK_BUFFER = 35982;
var TRANSFORM_FEEDBACK = 36386;
var COMPILE_STATUS = 35713;
var LINK_STATUS = 35714;
var FRAGMENT_SHADER = 35632;
var VERTEX_SHADER = 35633;
var SEPARATE_ATTRIBS = 35981;
var ACTIVE_UNIFORMS = 35718;
var ACTIVE_ATTRIBUTES = 35721;
var TRANSFORM_FEEDBACK_VARYINGS = 35971;
var ACTIVE_UNIFORM_BLOCKS = 35382;
var UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER = 35396;
var UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER = 35398;
var UNIFORM_BLOCK_DATA_SIZE = 35392;
var UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES = 35395;
var FLOAT = 5126;
var FLOAT_VEC2 = 35664;
var FLOAT_VEC3 = 35665;
var FLOAT_VEC4 = 35666;
var INT = 5124;
var INT_VEC2 = 35667;
var INT_VEC3 = 35668;
var INT_VEC4 = 35669;
var BOOL = 35670;
var BOOL_VEC2 = 35671;
var BOOL_VEC3 = 35672;
var BOOL_VEC4 = 35673;
var FLOAT_MAT2 = 35674;
var FLOAT_MAT3 = 35675;
var FLOAT_MAT4 = 35676;
var SAMPLER_2D = 35678;
var SAMPLER_CUBE = 35680;
var SAMPLER_3D = 35679;
var SAMPLER_2D_SHADOW = 35682;
var FLOAT_MAT2x3 = 35685;
var FLOAT_MAT2x4 = 35686;
var FLOAT_MAT3x2 = 35687;
var FLOAT_MAT3x4 = 35688;
var FLOAT_MAT4x2 = 35689;
var FLOAT_MAT4x3 = 35690;
var SAMPLER_2D_ARRAY = 36289;
var SAMPLER_2D_ARRAY_SHADOW = 36292;
var SAMPLER_CUBE_SHADOW = 36293;
var UNSIGNED_INT = 5125;
var UNSIGNED_INT_VEC2 = 36294;
var UNSIGNED_INT_VEC3 = 36295;
var UNSIGNED_INT_VEC4 = 36296;
var INT_SAMPLER_2D = 36298;
var INT_SAMPLER_3D = 36299;
var INT_SAMPLER_CUBE = 36300;
var INT_SAMPLER_2D_ARRAY = 36303;
var UNSIGNED_INT_SAMPLER_2D = 36306;
var UNSIGNED_INT_SAMPLER_3D = 36307;
var UNSIGNED_INT_SAMPLER_CUBE = 36308;
var UNSIGNED_INT_SAMPLER_2D_ARRAY = 36311;
var TEXTURE_2D$1 = 3553;
var TEXTURE_CUBE_MAP = 34067;
var TEXTURE_3D = 32879;
var TEXTURE_2D_ARRAY = 35866;
var typeMap = {};
function getBindPointForSamplerType(gl, type) {
  return typeMap[type].bindPoint;
}
function floatSetter(gl, location2) {
  return function(v) {
    gl.uniform1f(location2, v);
  };
}
function floatArraySetter(gl, location2) {
  return function(v) {
    gl.uniform1fv(location2, v);
  };
}
function floatVec2Setter(gl, location2) {
  return function(v) {
    gl.uniform2fv(location2, v);
  };
}
function floatVec3Setter(gl, location2) {
  return function(v) {
    gl.uniform3fv(location2, v);
  };
}
function floatVec4Setter(gl, location2) {
  return function(v) {
    gl.uniform4fv(location2, v);
  };
}
function intSetter(gl, location2) {
  return function(v) {
    gl.uniform1i(location2, v);
  };
}
function intArraySetter(gl, location2) {
  return function(v) {
    gl.uniform1iv(location2, v);
  };
}
function intVec2Setter(gl, location2) {
  return function(v) {
    gl.uniform2iv(location2, v);
  };
}
function intVec3Setter(gl, location2) {
  return function(v) {
    gl.uniform3iv(location2, v);
  };
}
function intVec4Setter(gl, location2) {
  return function(v) {
    gl.uniform4iv(location2, v);
  };
}
function uintSetter(gl, location2) {
  return function(v) {
    gl.uniform1ui(location2, v);
  };
}
function uintArraySetter(gl, location2) {
  return function(v) {
    gl.uniform1uiv(location2, v);
  };
}
function uintVec2Setter(gl, location2) {
  return function(v) {
    gl.uniform2uiv(location2, v);
  };
}
function uintVec3Setter(gl, location2) {
  return function(v) {
    gl.uniform3uiv(location2, v);
  };
}
function uintVec4Setter(gl, location2) {
  return function(v) {
    gl.uniform4uiv(location2, v);
  };
}
function floatMat2Setter(gl, location2) {
  return function(v) {
    gl.uniformMatrix2fv(location2, false, v);
  };
}
function floatMat3Setter(gl, location2) {
  return function(v) {
    gl.uniformMatrix3fv(location2, false, v);
  };
}
function floatMat4Setter(gl, location2) {
  return function(v) {
    gl.uniformMatrix4fv(location2, false, v);
  };
}
function floatMat23Setter(gl, location2) {
  return function(v) {
    gl.uniformMatrix2x3fv(location2, false, v);
  };
}
function floatMat32Setter(gl, location2) {
  return function(v) {
    gl.uniformMatrix3x2fv(location2, false, v);
  };
}
function floatMat24Setter(gl, location2) {
  return function(v) {
    gl.uniformMatrix2x4fv(location2, false, v);
  };
}
function floatMat42Setter(gl, location2) {
  return function(v) {
    gl.uniformMatrix4x2fv(location2, false, v);
  };
}
function floatMat34Setter(gl, location2) {
  return function(v) {
    gl.uniformMatrix3x4fv(location2, false, v);
  };
}
function floatMat43Setter(gl, location2) {
  return function(v) {
    gl.uniformMatrix4x3fv(location2, false, v);
  };
}
function samplerSetter(gl, type, unit, location2) {
  const bindPoint = getBindPointForSamplerType(gl, type);
  return isWebGL2(gl) ? function(textureOrPair) {
    let texture;
    let sampler;
    if (!textureOrPair || isTexture(gl, textureOrPair)) {
      texture = textureOrPair;
      sampler = null;
    } else {
      texture = textureOrPair.texture;
      sampler = textureOrPair.sampler;
    }
    gl.uniform1i(location2, unit);
    gl.activeTexture(TEXTURE0 + unit);
    gl.bindTexture(bindPoint, texture);
    gl.bindSampler(unit, sampler);
  } : function(texture) {
    gl.uniform1i(location2, unit);
    gl.activeTexture(TEXTURE0 + unit);
    gl.bindTexture(bindPoint, texture);
  };
}
function samplerArraySetter(gl, type, unit, location2, size) {
  const bindPoint = getBindPointForSamplerType(gl, type);
  const units = new Int32Array(size);
  for (let ii = 0; ii < size; ++ii) {
    units[ii] = unit + ii;
  }
  return isWebGL2(gl) ? function(textures2) {
    gl.uniform1iv(location2, units);
    textures2.forEach(function(textureOrPair, index) {
      gl.activeTexture(TEXTURE0 + units[index]);
      let texture;
      let sampler;
      if (!textureOrPair || isTexture(gl, textureOrPair)) {
        texture = textureOrPair;
        sampler = null;
      } else {
        texture = textureOrPair.texture;
        sampler = textureOrPair.sampler;
      }
      gl.bindSampler(unit, sampler);
      gl.bindTexture(bindPoint, texture);
    });
  } : function(textures2) {
    gl.uniform1iv(location2, units);
    textures2.forEach(function(texture, index) {
      gl.activeTexture(TEXTURE0 + units[index]);
      gl.bindTexture(bindPoint, texture);
    });
  };
}
typeMap[FLOAT] = { Type: Float32Array, size: 4, setter: floatSetter, arraySetter: floatArraySetter };
typeMap[FLOAT_VEC2] = { Type: Float32Array, size: 8, setter: floatVec2Setter, cols: 2 };
typeMap[FLOAT_VEC3] = { Type: Float32Array, size: 12, setter: floatVec3Setter, cols: 3 };
typeMap[FLOAT_VEC4] = { Type: Float32Array, size: 16, setter: floatVec4Setter, cols: 4 };
typeMap[INT] = { Type: Int32Array, size: 4, setter: intSetter, arraySetter: intArraySetter };
typeMap[INT_VEC2] = { Type: Int32Array, size: 8, setter: intVec2Setter, cols: 2 };
typeMap[INT_VEC3] = { Type: Int32Array, size: 12, setter: intVec3Setter, cols: 3 };
typeMap[INT_VEC4] = { Type: Int32Array, size: 16, setter: intVec4Setter, cols: 4 };
typeMap[UNSIGNED_INT] = { Type: Uint32Array, size: 4, setter: uintSetter, arraySetter: uintArraySetter };
typeMap[UNSIGNED_INT_VEC2] = { Type: Uint32Array, size: 8, setter: uintVec2Setter, cols: 2 };
typeMap[UNSIGNED_INT_VEC3] = { Type: Uint32Array, size: 12, setter: uintVec3Setter, cols: 3 };
typeMap[UNSIGNED_INT_VEC4] = { Type: Uint32Array, size: 16, setter: uintVec4Setter, cols: 4 };
typeMap[BOOL] = { Type: Uint32Array, size: 4, setter: intSetter, arraySetter: intArraySetter };
typeMap[BOOL_VEC2] = { Type: Uint32Array, size: 8, setter: intVec2Setter, cols: 2 };
typeMap[BOOL_VEC3] = { Type: Uint32Array, size: 12, setter: intVec3Setter, cols: 3 };
typeMap[BOOL_VEC4] = { Type: Uint32Array, size: 16, setter: intVec4Setter, cols: 4 };
typeMap[FLOAT_MAT2] = { Type: Float32Array, size: 32, setter: floatMat2Setter, rows: 2, cols: 2 };
typeMap[FLOAT_MAT3] = { Type: Float32Array, size: 48, setter: floatMat3Setter, rows: 3, cols: 3 };
typeMap[FLOAT_MAT4] = { Type: Float32Array, size: 64, setter: floatMat4Setter, rows: 4, cols: 4 };
typeMap[FLOAT_MAT2x3] = { Type: Float32Array, size: 32, setter: floatMat23Setter, rows: 2, cols: 3 };
typeMap[FLOAT_MAT2x4] = { Type: Float32Array, size: 32, setter: floatMat24Setter, rows: 2, cols: 4 };
typeMap[FLOAT_MAT3x2] = { Type: Float32Array, size: 48, setter: floatMat32Setter, rows: 3, cols: 2 };
typeMap[FLOAT_MAT3x4] = { Type: Float32Array, size: 48, setter: floatMat34Setter, rows: 3, cols: 4 };
typeMap[FLOAT_MAT4x2] = { Type: Float32Array, size: 64, setter: floatMat42Setter, rows: 4, cols: 2 };
typeMap[FLOAT_MAT4x3] = { Type: Float32Array, size: 64, setter: floatMat43Setter, rows: 4, cols: 3 };
typeMap[SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1 };
typeMap[SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
typeMap[SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D };
typeMap[SAMPLER_2D_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1 };
typeMap[SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
typeMap[SAMPLER_2D_ARRAY_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
typeMap[SAMPLER_CUBE_SHADOW] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
typeMap[INT_SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1 };
typeMap[INT_SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D };
typeMap[INT_SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
typeMap[INT_SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
typeMap[UNSIGNED_INT_SAMPLER_2D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D$1 };
typeMap[UNSIGNED_INT_SAMPLER_3D] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_3D };
typeMap[UNSIGNED_INT_SAMPLER_CUBE] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_CUBE_MAP };
typeMap[UNSIGNED_INT_SAMPLER_2D_ARRAY] = { Type: null, size: 0, setter: samplerSetter, arraySetter: samplerArraySetter, bindPoint: TEXTURE_2D_ARRAY };
function floatAttribSetter(gl, index) {
  return function(b) {
    if (b.value) {
      gl.disableVertexAttribArray(index);
      switch (b.value.length) {
        case 4:
          gl.vertexAttrib4fv(index, b.value);
          break;
        case 3:
          gl.vertexAttrib3fv(index, b.value);
          break;
        case 2:
          gl.vertexAttrib2fv(index, b.value);
          break;
        case 1:
          gl.vertexAttrib1fv(index, b.value);
          break;
        default:
          throw new Error("the length of a float constant value must be between 1 and 4!");
      }
    } else {
      gl.bindBuffer(ARRAY_BUFFER, b.buffer);
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(
        index,
        b.numComponents || b.size,
        b.type || FLOAT,
        b.normalize || false,
        b.stride || 0,
        b.offset || 0
      );
      if (gl.vertexAttribDivisor) {
        gl.vertexAttribDivisor(index, b.divisor || 0);
      }
    }
  };
}
function intAttribSetter(gl, index) {
  return function(b) {
    if (b.value) {
      gl.disableVertexAttribArray(index);
      if (b.value.length === 4) {
        gl.vertexAttrib4iv(index, b.value);
      } else {
        throw new Error("The length of an integer constant value must be 4!");
      }
    } else {
      gl.bindBuffer(ARRAY_BUFFER, b.buffer);
      gl.enableVertexAttribArray(index);
      gl.vertexAttribIPointer(
        index,
        b.numComponents || b.size,
        b.type || INT,
        b.stride || 0,
        b.offset || 0
      );
      if (gl.vertexAttribDivisor) {
        gl.vertexAttribDivisor(index, b.divisor || 0);
      }
    }
  };
}
function uintAttribSetter(gl, index) {
  return function(b) {
    if (b.value) {
      gl.disableVertexAttribArray(index);
      if (b.value.length === 4) {
        gl.vertexAttrib4uiv(index, b.value);
      } else {
        throw new Error("The length of an unsigned integer constant value must be 4!");
      }
    } else {
      gl.bindBuffer(ARRAY_BUFFER, b.buffer);
      gl.enableVertexAttribArray(index);
      gl.vertexAttribIPointer(
        index,
        b.numComponents || b.size,
        b.type || UNSIGNED_INT,
        b.stride || 0,
        b.offset || 0
      );
      if (gl.vertexAttribDivisor) {
        gl.vertexAttribDivisor(index, b.divisor || 0);
      }
    }
  };
}
function matAttribSetter(gl, index, typeInfo) {
  const defaultSize = typeInfo.size;
  const count = typeInfo.count;
  return function(b) {
    gl.bindBuffer(ARRAY_BUFFER, b.buffer);
    const numComponents = b.size || b.numComponents || defaultSize;
    const size = numComponents / count;
    const type = b.type || FLOAT;
    const typeInfo2 = typeMap[type];
    const stride = typeInfo2.size * numComponents;
    const normalize = b.normalize || false;
    const offset = b.offset || 0;
    const rowOffset = stride / count;
    for (let i = 0; i < count; ++i) {
      gl.enableVertexAttribArray(index + i);
      gl.vertexAttribPointer(
        index + i,
        size,
        type,
        normalize,
        stride,
        offset + rowOffset * i
      );
      if (gl.vertexAttribDivisor) {
        gl.vertexAttribDivisor(index + i, b.divisor || 0);
      }
    }
  };
}
var attrTypeMap = {};
attrTypeMap[FLOAT] = { size: 4, setter: floatAttribSetter };
attrTypeMap[FLOAT_VEC2] = { size: 8, setter: floatAttribSetter };
attrTypeMap[FLOAT_VEC3] = { size: 12, setter: floatAttribSetter };
attrTypeMap[FLOAT_VEC4] = { size: 16, setter: floatAttribSetter };
attrTypeMap[INT] = { size: 4, setter: intAttribSetter };
attrTypeMap[INT_VEC2] = { size: 8, setter: intAttribSetter };
attrTypeMap[INT_VEC3] = { size: 12, setter: intAttribSetter };
attrTypeMap[INT_VEC4] = { size: 16, setter: intAttribSetter };
attrTypeMap[UNSIGNED_INT] = { size: 4, setter: uintAttribSetter };
attrTypeMap[UNSIGNED_INT_VEC2] = { size: 8, setter: uintAttribSetter };
attrTypeMap[UNSIGNED_INT_VEC3] = { size: 12, setter: uintAttribSetter };
attrTypeMap[UNSIGNED_INT_VEC4] = { size: 16, setter: uintAttribSetter };
attrTypeMap[BOOL] = { size: 4, setter: intAttribSetter };
attrTypeMap[BOOL_VEC2] = { size: 8, setter: intAttribSetter };
attrTypeMap[BOOL_VEC3] = { size: 12, setter: intAttribSetter };
attrTypeMap[BOOL_VEC4] = { size: 16, setter: intAttribSetter };
attrTypeMap[FLOAT_MAT2] = { size: 4, setter: matAttribSetter, count: 2 };
attrTypeMap[FLOAT_MAT3] = { size: 9, setter: matAttribSetter, count: 3 };
attrTypeMap[FLOAT_MAT4] = { size: 16, setter: matAttribSetter, count: 4 };
var errorRE = /ERROR:\s*\d+:(\d+)/gi;
function addLineNumbersWithError(src, log = "", lineOffset = 0) {
  const matches = [...log.matchAll(errorRE)];
  const lineNoToErrorMap = new Map(matches.map((m, ndx) => {
    const lineNo = parseInt(m[1]);
    const next = matches[ndx + 1];
    const end = next ? next.index : log.length;
    const msg = log.substring(m.index, end);
    return [lineNo - 1, msg];
  }));
  return src.split("\n").map((line, lineNo) => {
    const err = lineNoToErrorMap.get(lineNo);
    return `${lineNo + 1 + lineOffset}: ${line}${err ? `

^^^ ${err}` : ""}`;
  }).join("\n");
}
var spaceRE = /^[ \t]*\n/;
function prepShaderSource(shaderSource) {
  let lineOffset = 0;
  if (spaceRE.test(shaderSource)) {
    lineOffset = 1;
    shaderSource = shaderSource.replace(spaceRE, "");
  }
  return { lineOffset, shaderSource };
}
function reportError(progOptions, msg) {
  progOptions.errorCallback(msg);
  if (progOptions.callback) {
    setTimeout(() => {
      progOptions.callback(`${msg}
${progOptions.errors.join("\n")}`);
    });
  }
  return null;
}
function checkShaderStatus(gl, shaderType, shader, errFn) {
  errFn = errFn || error;
  const compiled = gl.getShaderParameter(shader, COMPILE_STATUS);
  if (!compiled) {
    const lastError = gl.getShaderInfoLog(shader);
    const { lineOffset, shaderSource } = prepShaderSource(gl.getShaderSource(shader));
    const error2 = `${addLineNumbersWithError(shaderSource, lastError, lineOffset)}
Error compiling ${glEnumToString(gl, shaderType)}: ${lastError}`;
    errFn(error2);
    return error2;
  }
  return "";
}
function getProgramOptions(opt_attribs, opt_locations, opt_errorCallback) {
  let transformFeedbackVaryings;
  let transformFeedbackMode;
  let callback;
  if (typeof opt_locations === "function") {
    opt_errorCallback = opt_locations;
    opt_locations = void 0;
  }
  if (typeof opt_attribs === "function") {
    opt_errorCallback = opt_attribs;
    opt_attribs = void 0;
  } else if (opt_attribs && !Array.isArray(opt_attribs)) {
    const opt = opt_attribs;
    opt_errorCallback = opt.errorCallback;
    opt_attribs = opt.attribLocations;
    transformFeedbackVaryings = opt.transformFeedbackVaryings;
    transformFeedbackMode = opt.transformFeedbackMode;
    callback = opt.callback;
  }
  const errorCallback = opt_errorCallback || error;
  const errors = [];
  const options = {
    errorCallback(msg, ...args) {
      errors.push(msg);
      errorCallback(msg, ...args);
    },
    transformFeedbackVaryings,
    transformFeedbackMode,
    callback,
    errors
  };
  {
    let attribLocations = {};
    if (Array.isArray(opt_attribs)) {
      opt_attribs.forEach(function(attrib, ndx) {
        attribLocations[attrib] = opt_locations ? opt_locations[ndx] : ndx;
      });
    } else {
      attribLocations = opt_attribs || {};
    }
    options.attribLocations = attribLocations;
  }
  return options;
}
var defaultShaderType = [
  "VERTEX_SHADER",
  "FRAGMENT_SHADER"
];
function getShaderTypeFromScriptType(gl, scriptType) {
  if (scriptType.indexOf("frag") >= 0) {
    return FRAGMENT_SHADER;
  } else if (scriptType.indexOf("vert") >= 0) {
    return VERTEX_SHADER;
  }
  return void 0;
}
function deleteProgramAndShaders(gl, program, notThese) {
  const shaders = gl.getAttachedShaders(program);
  for (const shader of shaders) {
    if (notThese.has(shader)) {
      gl.deleteShader(shader);
    }
  }
  gl.deleteProgram(program);
}
var wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
function createProgramNoCheck(gl, shaders, programOptions) {
  const program = gl.createProgram();
  const {
    attribLocations,
    transformFeedbackVaryings,
    transformFeedbackMode
  } = getProgramOptions(programOptions);
  for (let ndx = 0; ndx < shaders.length; ++ndx) {
    let shader = shaders[ndx];
    if (typeof shader === "string") {
      const elem = getElementById(shader);
      const src = elem ? elem.text : shader;
      let type = gl[defaultShaderType[ndx]];
      if (elem && elem.type) {
        type = getShaderTypeFromScriptType(gl, elem.type) || type;
      }
      shader = gl.createShader(type);
      gl.shaderSource(shader, prepShaderSource(src).shaderSource);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
  }
  Object.entries(attribLocations).forEach(([attrib, loc]) => gl.bindAttribLocation(program, loc, attrib));
  {
    let varyings = transformFeedbackVaryings;
    if (varyings) {
      if (varyings.attribs) {
        varyings = varyings.attribs;
      }
      if (!Array.isArray(varyings)) {
        varyings = Object.keys(varyings);
      }
      gl.transformFeedbackVaryings(program, varyings, transformFeedbackMode || SEPARATE_ATTRIBS);
    }
  }
  gl.linkProgram(program);
  return program;
}
function createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
  const progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
  const shaderSet = new Set(shaders);
  const program = createProgramNoCheck(gl, shaders, progOptions);
  function hasErrors(gl2, program2) {
    const errors = getProgramErrors(gl2, program2, progOptions.errorCallback);
    if (errors) {
      deleteProgramAndShaders(gl2, program2, shaderSet);
    }
    return errors;
  }
  if (progOptions.callback) {
    waitForProgramLinkCompletionAsync(gl, program).then(() => {
      const errors = hasErrors(gl, program);
      progOptions.callback(errors, errors ? void 0 : program);
    });
    return void 0;
  }
  return hasErrors(gl, program) ? void 0 : program;
}
function wrapCallbackFnToAsyncFn(fn) {
  return function(gl, arg1, ...args) {
    return new Promise((resolve, reject) => {
      const programOptions = getProgramOptions(...args);
      programOptions.callback = (err, program) => {
        if (err) {
          reject(err);
        } else {
          resolve(program);
        }
      };
      fn(gl, arg1, programOptions);
    });
  };
}
var createProgramAsync = wrapCallbackFnToAsyncFn(createProgram);
var createProgramInfoAsync = wrapCallbackFnToAsyncFn(createProgramInfo);
async function waitForProgramLinkCompletionAsync(gl, program) {
  const ext = gl.getExtension("KHR_parallel_shader_compile");
  const checkFn = ext ? (gl2, program2) => gl2.getProgramParameter(program2, ext.COMPLETION_STATUS_KHR) : () => true;
  let waitTime = 0;
  do {
    await wait(waitTime);
    waitTime = 1e3 / 60;
  } while (!checkFn(gl, program));
}
async function waitForAllProgramsLinkCompletionAsync(gl, programs2) {
  for (const program of Object.values(programs2)) {
    await waitForProgramLinkCompletionAsync(gl, program);
  }
}
function getProgramErrors(gl, program, errFn) {
  errFn = errFn || error;
  const linked = gl.getProgramParameter(program, LINK_STATUS);
  if (!linked) {
    const lastError = gl.getProgramInfoLog(program);
    errFn(`Error in program linking: ${lastError}`);
    const shaders = gl.getAttachedShaders(program);
    const errors = shaders.map((shader) => checkShaderStatus(gl, gl.getShaderParameter(shader, gl.SHADER_TYPE), shader, errFn));
    return `${lastError}
${errors.filter((_) => _).join("\n")}`;
  }
  return void 0;
}
function createProgramFromScripts(gl, shaderScriptIds, opt_attribs, opt_locations, opt_errorCallback) {
  const progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
  const shaders = [];
  for (const scriptId of shaderScriptIds) {
    const shaderScript = getElementById(scriptId);
    if (!shaderScript) {
      return reportError(progOptions, `unknown script element: ${scriptId}`);
    }
    shaders.push(shaderScript.text);
  }
  return createProgram(gl, shaders, progOptions);
}
function createProgramFromSources(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
  return createProgram(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback);
}
function isBuiltIn(info) {
  const name = info.name;
  return name.startsWith("gl_") || name.startsWith("webgl_");
}
var tokenRE = /(\.|\[|]|\w+)/g;
var isDigit = (s) => s >= "0" && s <= "9";
function addSetterToUniformTree(fullPath, setter, node, uniformSetters) {
  const tokens = fullPath.split(tokenRE).filter((s) => s !== "");
  let tokenNdx = 0;
  let path = "";
  for (; ; ) {
    const token = tokens[tokenNdx++];
    path += token;
    const isArrayIndex = isDigit(token[0]);
    const accessor = isArrayIndex ? parseInt(token) : token;
    if (isArrayIndex) {
      path += tokens[tokenNdx++];
    }
    const isLastToken = tokenNdx === tokens.length;
    if (isLastToken) {
      node[accessor] = setter;
      break;
    } else {
      const token2 = tokens[tokenNdx++];
      const isArray = token2 === "[";
      const child = node[accessor] || (isArray ? [] : {});
      node[accessor] = child;
      node = child;
      uniformSetters[path] = uniformSetters[path] || /* @__PURE__ */ (function(node2) {
        return function(value) {
          setUniformTree(node2, value);
        };
      })(child);
      path += token2;
    }
  }
}
function createUniformSetters(gl, program) {
  let textureUnit = 0;
  function createUniformSetter(program2, uniformInfo, location2) {
    const isArray = uniformInfo.name.endsWith("[0]");
    const type = uniformInfo.type;
    const typeInfo = typeMap[type];
    if (!typeInfo) {
      throw new Error(`unknown type: 0x${type.toString(16)}`);
    }
    let setter;
    if (typeInfo.bindPoint) {
      const unit = textureUnit;
      textureUnit += uniformInfo.size;
      if (isArray) {
        setter = typeInfo.arraySetter(gl, type, unit, location2, uniformInfo.size);
      } else {
        setter = typeInfo.setter(gl, type, unit, location2, uniformInfo.size);
      }
    } else {
      if (typeInfo.arraySetter && isArray) {
        setter = typeInfo.arraySetter(gl, location2);
      } else {
        setter = typeInfo.setter(gl, location2);
      }
    }
    setter.location = location2;
    return setter;
  }
  const uniformSetters = {};
  const uniformTree = {};
  const numUniforms = gl.getProgramParameter(program, ACTIVE_UNIFORMS);
  for (let ii = 0; ii < numUniforms; ++ii) {
    const uniformInfo = gl.getActiveUniform(program, ii);
    if (isBuiltIn(uniformInfo)) {
      continue;
    }
    let name = uniformInfo.name;
    if (name.endsWith("[0]")) {
      name = name.substr(0, name.length - 3);
    }
    const location2 = gl.getUniformLocation(program, uniformInfo.name);
    if (location2) {
      const setter = createUniformSetter(program, uniformInfo, location2);
      uniformSetters[name] = setter;
      addSetterToUniformTree(name, setter, uniformTree, uniformSetters);
    }
  }
  return uniformSetters;
}
function createTransformFeedbackInfo(gl, program) {
  const info = {};
  const numVaryings = gl.getProgramParameter(program, TRANSFORM_FEEDBACK_VARYINGS);
  for (let ii = 0; ii < numVaryings; ++ii) {
    const varying = gl.getTransformFeedbackVarying(program, ii);
    info[varying.name] = {
      index: ii,
      type: varying.type,
      size: varying.size
    };
  }
  return info;
}
function bindTransformFeedbackInfo(gl, transformFeedbackInfo, bufferInfo) {
  if (transformFeedbackInfo.transformFeedbackInfo) {
    transformFeedbackInfo = transformFeedbackInfo.transformFeedbackInfo;
  }
  if (bufferInfo.attribs) {
    bufferInfo = bufferInfo.attribs;
  }
  for (const name in bufferInfo) {
    const varying = transformFeedbackInfo[name];
    if (varying) {
      const buf = bufferInfo[name];
      if (buf.offset) {
        gl.bindBufferRange(TRANSFORM_FEEDBACK_BUFFER, varying.index, buf.buffer, buf.offset, buf.size);
      } else {
        gl.bindBufferBase(TRANSFORM_FEEDBACK_BUFFER, varying.index, buf.buffer);
      }
    }
  }
}
function createTransformFeedback(gl, programInfo, bufferInfo) {
  const tf = gl.createTransformFeedback();
  gl.bindTransformFeedback(TRANSFORM_FEEDBACK, tf);
  gl.useProgram(programInfo.program);
  bindTransformFeedbackInfo(gl, programInfo, bufferInfo);
  gl.bindTransformFeedback(TRANSFORM_FEEDBACK, null);
  return tf;
}
function createUniformBlockSpecFromProgram(gl, program) {
  const numUniforms = gl.getProgramParameter(program, ACTIVE_UNIFORMS);
  const uniformData = [];
  const uniformIndices = [];
  for (let ii = 0; ii < numUniforms; ++ii) {
    uniformIndices.push(ii);
    uniformData.push({});
    const uniformInfo = gl.getActiveUniform(program, ii);
    uniformData[ii].name = uniformInfo.name;
  }
  [
    ["UNIFORM_TYPE", "type"],
    ["UNIFORM_SIZE", "size"],
    // num elements
    ["UNIFORM_BLOCK_INDEX", "blockNdx"],
    ["UNIFORM_OFFSET", "offset"]
  ].forEach(function(pair) {
    const pname = pair[0];
    const key = pair[1];
    gl.getActiveUniforms(program, uniformIndices, gl[pname]).forEach(function(value, ndx) {
      uniformData[ndx][key] = value;
    });
  });
  const blockSpecs = {};
  const numUniformBlocks = gl.getProgramParameter(program, ACTIVE_UNIFORM_BLOCKS);
  for (let ii = 0; ii < numUniformBlocks; ++ii) {
    const name = gl.getActiveUniformBlockName(program, ii);
    const blockSpec = {
      index: gl.getUniformBlockIndex(program, name),
      usedByVertexShader: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER),
      usedByFragmentShader: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER),
      size: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_DATA_SIZE),
      uniformIndices: gl.getActiveUniformBlockParameter(program, ii, UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES)
    };
    blockSpec.used = blockSpec.usedByVertexShader || blockSpec.usedByFragmentShader;
    blockSpecs[name] = blockSpec;
  }
  return {
    blockSpecs,
    uniformData
  };
}
var arraySuffixRE = /\[\d+\]\.$/;
var pad = (v, padding) => ((v + (padding - 1)) / padding | 0) * padding;
function createUniformBlockUniformSetter(view, isArray, rows, cols) {
  if (isArray || rows) {
    cols = cols || 1;
    const numElements = view.length;
    const totalRows = numElements / 4;
    return function(value) {
      let dst = 0;
      let src = 0;
      for (let row = 0; row < totalRows; ++row) {
        for (let col = 0; col < cols; ++col) {
          view[dst++] = value[src++];
        }
        dst += 4 - cols;
      }
    };
  } else {
    return function(value) {
      if (value.length) {
        view.set(value);
      } else {
        view[0] = value;
      }
    };
  }
}
function createUniformBlockInfoFromProgram(gl, program, uniformBlockSpec, blockName) {
  const blockSpecs = uniformBlockSpec.blockSpecs;
  const uniformData = uniformBlockSpec.uniformData;
  const blockSpec = blockSpecs[blockName];
  if (!blockSpec) {
    warn("no uniform block object named:", blockName);
    return {
      name: blockName,
      uniforms: {}
    };
  }
  const array = new ArrayBuffer(blockSpec.size);
  const buffer = gl.createBuffer();
  const uniformBufferIndex = blockSpec.index;
  gl.bindBuffer(UNIFORM_BUFFER, buffer);
  gl.uniformBlockBinding(program, blockSpec.index, uniformBufferIndex);
  let prefix = blockName + ".";
  if (arraySuffixRE.test(prefix)) {
    prefix = prefix.replace(arraySuffixRE, ".");
  }
  const uniforms = {};
  const setters = {};
  const setterTree = {};
  blockSpec.uniformIndices.forEach(function(uniformNdx) {
    const data = uniformData[uniformNdx];
    let name = data.name;
    if (name.startsWith(prefix)) {
      name = name.substr(prefix.length);
    }
    const isArray = name.endsWith("[0]");
    if (isArray) {
      name = name.substr(0, name.length - 3);
    }
    const typeInfo = typeMap[data.type];
    const Type = typeInfo.Type;
    const byteLength = isArray ? pad(typeInfo.size, 16) * data.size : typeInfo.size * data.size;
    const uniformView = new Type(array, data.offset, byteLength / Type.BYTES_PER_ELEMENT);
    uniforms[name] = uniformView;
    const setter = createUniformBlockUniformSetter(uniformView, isArray, typeInfo.rows, typeInfo.cols);
    setters[name] = setter;
    addSetterToUniformTree(name, setter, setterTree, setters);
  });
  return {
    name: blockName,
    array,
    asFloat: new Float32Array(array),
    // for debugging
    buffer,
    uniforms,
    setters
  };
}
function createUniformBlockInfo(gl, programInfo, blockName) {
  return createUniformBlockInfoFromProgram(gl, programInfo.program, programInfo.uniformBlockSpec, blockName);
}
function bindUniformBlock(gl, programInfo, uniformBlockInfo) {
  const uniformBlockSpec = programInfo.uniformBlockSpec || programInfo;
  const blockSpec = uniformBlockSpec.blockSpecs[uniformBlockInfo.name];
  if (blockSpec) {
    const bufferBindIndex = blockSpec.index;
    gl.bindBufferRange(UNIFORM_BUFFER, bufferBindIndex, uniformBlockInfo.buffer, uniformBlockInfo.offset || 0, uniformBlockInfo.array.byteLength);
    return true;
  }
  return false;
}
function setUniformBlock(gl, programInfo, uniformBlockInfo) {
  if (bindUniformBlock(gl, programInfo, uniformBlockInfo)) {
    gl.bufferData(UNIFORM_BUFFER, uniformBlockInfo.array, DYNAMIC_DRAW);
  }
}
function setBlockUniforms(uniformBlockInfo, values) {
  const setters = uniformBlockInfo.setters;
  for (const name in values) {
    const setter = setters[name];
    if (setter) {
      const value = values[name];
      setter(value);
    }
  }
}
function setUniformTree(tree, values) {
  for (const name in values) {
    const prop = tree[name];
    if (typeof prop === "function") {
      prop(values[name]);
    } else {
      setUniformTree(tree[name], values[name]);
    }
  }
}
function setUniforms(setters, ...args) {
  const actualSetters = setters.uniformSetters || setters;
  const numArgs = args.length;
  for (let aNdx = 0; aNdx < numArgs; ++aNdx) {
    const values = args[aNdx];
    if (Array.isArray(values)) {
      const numValues = values.length;
      for (let ii = 0; ii < numValues; ++ii) {
        setUniforms(actualSetters, values[ii]);
      }
    } else {
      for (const name in values) {
        const setter = actualSetters[name];
        if (setter) {
          setter(values[name]);
        }
      }
    }
  }
}
var setUniformsAndBindTextures = setUniforms;
function createAttributeSetters(gl, program) {
  const attribSetters = {};
  const numAttribs = gl.getProgramParameter(program, ACTIVE_ATTRIBUTES);
  for (let ii = 0; ii < numAttribs; ++ii) {
    const attribInfo = gl.getActiveAttrib(program, ii);
    if (isBuiltIn(attribInfo)) {
      continue;
    }
    const index = gl.getAttribLocation(program, attribInfo.name);
    const typeInfo = attrTypeMap[attribInfo.type];
    const setter = typeInfo.setter(gl, index, typeInfo);
    setter.location = index;
    attribSetters[attribInfo.name] = setter;
  }
  return attribSetters;
}
function setAttributes(setters, buffers) {
  for (const name in buffers) {
    const setter = setters[name];
    if (setter) {
      setter(buffers[name]);
    }
  }
}
function setBuffersAndAttributes(gl, programInfo, buffers) {
  if (buffers.vertexArrayObject) {
    gl.bindVertexArray(buffers.vertexArrayObject);
  } else {
    setAttributes(programInfo.attribSetters || programInfo, buffers.attribs);
    if (buffers.indices) {
      gl.bindBuffer(ELEMENT_ARRAY_BUFFER$1, buffers.indices);
    }
  }
}
function createProgramInfoFromProgram(gl, program) {
  const uniformSetters = createUniformSetters(gl, program);
  const attribSetters = createAttributeSetters(gl, program);
  const programInfo = {
    program,
    uniformSetters,
    attribSetters
  };
  if (isWebGL2(gl)) {
    programInfo.uniformBlockSpec = createUniformBlockSpecFromProgram(gl, program);
    programInfo.transformFeedbackInfo = createTransformFeedbackInfo(gl, program);
  }
  return programInfo;
}
var notIdRE = /\s|{|}|;/;
function createProgramInfo(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
  const progOptions = getProgramOptions(opt_attribs, opt_locations, opt_errorCallback);
  const errors = [];
  shaderSources = shaderSources.map(function(source) {
    if (!notIdRE.test(source)) {
      const script = getElementById(source);
      if (!script) {
        const err = `no element with id: ${source}`;
        progOptions.errorCallback(err);
        errors.push(err);
      } else {
        source = script.text;
      }
    }
    return source;
  });
  if (errors.length) {
    return reportError(progOptions, "");
  }
  const origCallback = progOptions.callback;
  if (origCallback) {
    progOptions.callback = (err, program2) => {
      origCallback(err, err ? void 0 : createProgramInfoFromProgram(gl, program2));
    };
  }
  const program = createProgramFromSources(gl, shaderSources, progOptions);
  if (!program) {
    return null;
  }
  return createProgramInfoFromProgram(gl, program);
}
function checkAllPrograms(gl, programs2, programSpecs, noDeleteShadersSet, programOptions) {
  for (const [name, program] of Object.entries(programs2)) {
    const options = { ...programOptions };
    const spec = programSpecs[name];
    if (!Array.isArray(spec)) {
      Object.assign(options, spec);
    }
    const errors = getProgramErrors(gl, program, options.errorCallback);
    if (errors) {
      for (const program2 of Object.values(programs2)) {
        const shaders = gl.getAttachedShaders(program2);
        gl.deleteProgram(program2);
        for (const shader of shaders) {
          if (!noDeleteShadersSet.has(shader)) {
            gl.deleteShader(shader);
          }
        }
      }
      return errors;
    }
  }
  return void 0;
}
function createPrograms(gl, programSpecs, programOptions = {}) {
  const noDeleteShadersSet = /* @__PURE__ */ new Set();
  const programs2 = Object.fromEntries(Object.entries(programSpecs).map(([name, spec]) => {
    const options = { ...programOptions };
    const shaders = Array.isArray(spec) ? spec : spec.shaders;
    if (!Array.isArray(spec)) {
      Object.assign(options, spec);
    }
    shaders.forEach(noDeleteShadersSet.add, noDeleteShadersSet);
    return [name, createProgramNoCheck(gl, shaders, options)];
  }));
  if (programOptions.callback) {
    waitForAllProgramsLinkCompletionAsync(gl, programs2).then(() => {
      const errors2 = checkAllPrograms(gl, programs2, programSpecs, noDeleteShadersSet, programOptions);
      programOptions.callback(errors2, errors2 ? void 0 : programs2);
    });
    return void 0;
  }
  const errors = checkAllPrograms(gl, programs2, programSpecs, noDeleteShadersSet, programOptions);
  return errors ? void 0 : programs2;
}
function createProgramInfos(gl, programSpecs, programOptions) {
  programOptions = getProgramOptions(programOptions);
  function createProgramInfosForPrograms(gl2, programs3) {
    return Object.fromEntries(Object.entries(programs3).map(
      ([name, program]) => [name, createProgramInfoFromProgram(gl2, program)]
    ));
  }
  const origCallback = programOptions.callback;
  if (origCallback) {
    programOptions.callback = (err, programs3) => {
      origCallback(err, err ? void 0 : createProgramInfosForPrograms(gl, programs3));
    };
  }
  const programs2 = createPrograms(gl, programSpecs, programOptions);
  if (origCallback || !programs2) {
    return void 0;
  }
  return createProgramInfosForPrograms(gl, programs2);
}
var createProgramsAsync = wrapCallbackFnToAsyncFn(createPrograms);
var createProgramInfosAsync = wrapCallbackFnToAsyncFn(createProgramInfos);
var programs = Object.freeze({
  __proto__: null,
  createAttributeSetters,
  createProgram,
  createProgramAsync,
  createPrograms,
  createProgramsAsync,
  createProgramFromScripts,
  createProgramFromSources,
  createProgramInfo,
  createProgramInfoAsync,
  createProgramInfos,
  createProgramInfosAsync,
  createProgramInfoFromProgram,
  createUniformSetters,
  createUniformBlockSpecFromProgram,
  createUniformBlockInfoFromProgram,
  createUniformBlockInfo,
  createTransformFeedback,
  createTransformFeedbackInfo,
  bindTransformFeedbackInfo,
  setAttributes,
  setBuffersAndAttributes,
  setUniforms,
  setUniformsAndBindTextures,
  setUniformBlock,
  setBlockUniforms,
  bindUniformBlock
});
var TRIANGLES = 4;
var UNSIGNED_SHORT = 5123;
function drawBufferInfo(gl, bufferInfo, type, count, offset, instanceCount) {
  type = type === void 0 ? TRIANGLES : type;
  const indices = bufferInfo.indices;
  const elementType = bufferInfo.elementType;
  const numElements = count === void 0 ? bufferInfo.numElements : count;
  offset = offset === void 0 ? 0 : offset;
  if (elementType || indices) {
    if (instanceCount !== void 0) {
      gl.drawElementsInstanced(type, numElements, elementType === void 0 ? UNSIGNED_SHORT : bufferInfo.elementType, offset, instanceCount);
    } else {
      gl.drawElements(type, numElements, elementType === void 0 ? UNSIGNED_SHORT : bufferInfo.elementType, offset);
    }
  } else {
    if (instanceCount !== void 0) {
      gl.drawArraysInstanced(type, offset, numElements, instanceCount);
    } else {
      gl.drawArrays(type, offset, numElements);
    }
  }
}
function drawObjectList(gl, objectsToDraw) {
  let lastUsedProgramInfo = null;
  let lastUsedBufferInfo = null;
  objectsToDraw.forEach(function(object) {
    if (object.active === false) {
      return;
    }
    const programInfo = object.programInfo;
    const bufferInfo = object.vertexArrayInfo || object.bufferInfo;
    let bindBuffers = false;
    const type = object.type === void 0 ? TRIANGLES : object.type;
    if (programInfo !== lastUsedProgramInfo) {
      lastUsedProgramInfo = programInfo;
      gl.useProgram(programInfo.program);
      bindBuffers = true;
    }
    if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
      if (lastUsedBufferInfo && lastUsedBufferInfo.vertexArrayObject && !bufferInfo.vertexArrayObject) {
        gl.bindVertexArray(null);
      }
      lastUsedBufferInfo = bufferInfo;
      setBuffersAndAttributes(gl, programInfo, bufferInfo);
    }
    setUniforms(programInfo, object.uniforms);
    drawBufferInfo(gl, bufferInfo, type, object.count, object.offset, object.instanceCount);
  });
  if (lastUsedBufferInfo && lastUsedBufferInfo.vertexArrayObject) {
    gl.bindVertexArray(null);
  }
}
var draw = Object.freeze({
  __proto__: null,
  drawBufferInfo,
  drawObjectList
});
var FRAMEBUFFER = 36160;
var RENDERBUFFER = 36161;
var TEXTURE_2D = 3553;
var UNSIGNED_BYTE = 5121;
var DEPTH_COMPONENT = 6402;
var RGBA = 6408;
var DEPTH_COMPONENT24 = 33190;
var DEPTH_COMPONENT32F = 36012;
var DEPTH24_STENCIL8 = 35056;
var DEPTH32F_STENCIL8 = 36013;
var RGBA4 = 32854;
var RGB5_A1 = 32855;
var RGB565 = 36194;
var DEPTH_COMPONENT16 = 33189;
var STENCIL_INDEX = 6401;
var STENCIL_INDEX8 = 36168;
var DEPTH_STENCIL = 34041;
var COLOR_ATTACHMENT0 = 36064;
var DEPTH_ATTACHMENT = 36096;
var STENCIL_ATTACHMENT = 36128;
var DEPTH_STENCIL_ATTACHMENT = 33306;
var CLAMP_TO_EDGE = 33071;
var LINEAR = 9729;
var defaultAttachments = [
  { format: RGBA, type: UNSIGNED_BYTE, min: LINEAR, wrap: CLAMP_TO_EDGE },
  { format: DEPTH_STENCIL }
];
var attachmentsByFormat = {};
attachmentsByFormat[DEPTH_STENCIL] = DEPTH_STENCIL_ATTACHMENT;
attachmentsByFormat[STENCIL_INDEX] = STENCIL_ATTACHMENT;
attachmentsByFormat[STENCIL_INDEX8] = STENCIL_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT] = DEPTH_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT16] = DEPTH_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT24] = DEPTH_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT32F] = DEPTH_ATTACHMENT;
attachmentsByFormat[DEPTH24_STENCIL8] = DEPTH_STENCIL_ATTACHMENT;
attachmentsByFormat[DEPTH32F_STENCIL8] = DEPTH_STENCIL_ATTACHMENT;
function getAttachmentPointForFormat(format, internalFormat) {
  return attachmentsByFormat[format] || attachmentsByFormat[internalFormat];
}
var renderbufferFormats = {};
renderbufferFormats[RGBA4] = true;
renderbufferFormats[RGB5_A1] = true;
renderbufferFormats[RGB565] = true;
renderbufferFormats[DEPTH_STENCIL] = true;
renderbufferFormats[DEPTH_COMPONENT16] = true;
renderbufferFormats[STENCIL_INDEX] = true;
renderbufferFormats[STENCIL_INDEX8] = true;
function isRenderbufferFormat(format) {
  return renderbufferFormats[format];
}
var MAX_COLOR_ATTACHMENT_POINTS = 32;
function isColorAttachmentPoint(attachmentPoint) {
  return attachmentPoint >= COLOR_ATTACHMENT0 && attachmentPoint < COLOR_ATTACHMENT0 + MAX_COLOR_ATTACHMENT_POINTS;
}
function createFramebufferInfo(gl, attachments, width, height) {
  const target = FRAMEBUFFER;
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(target, fb);
  width = width || gl.drawingBufferWidth;
  height = height || gl.drawingBufferHeight;
  attachments = attachments || defaultAttachments;
  const usedColorAttachmentsPoints = [];
  const framebufferInfo = {
    framebuffer: fb,
    attachments: [],
    width,
    height
  };
  attachments.forEach(function(attachmentOptions, i) {
    let attachment = attachmentOptions.attachment;
    const samples = attachmentOptions.samples;
    const format = attachmentOptions.format;
    let attachmentPoint = attachmentOptions.attachmentPoint || getAttachmentPointForFormat(format, attachmentOptions.internalFormat);
    if (!attachmentPoint) {
      attachmentPoint = COLOR_ATTACHMENT0 + i;
    }
    if (isColorAttachmentPoint(attachmentPoint)) {
      usedColorAttachmentsPoints.push(attachmentPoint);
    }
    if (!attachment) {
      if (samples !== void 0 || isRenderbufferFormat(format)) {
        attachment = gl.createRenderbuffer();
        gl.bindRenderbuffer(RENDERBUFFER, attachment);
        if (samples > 1) {
          gl.renderbufferStorageMultisample(RENDERBUFFER, samples, format, width, height);
        } else {
          gl.renderbufferStorage(RENDERBUFFER, format, width, height);
        }
      } else {
        const textureOptions = Object.assign({}, attachmentOptions);
        textureOptions.width = width;
        textureOptions.height = height;
        if (textureOptions.auto === void 0) {
          textureOptions.auto = false;
          textureOptions.min = textureOptions.min || textureOptions.minMag || LINEAR;
          textureOptions.mag = textureOptions.mag || textureOptions.minMag || LINEAR;
          textureOptions.wrapS = textureOptions.wrapS || textureOptions.wrap || CLAMP_TO_EDGE;
          textureOptions.wrapT = textureOptions.wrapT || textureOptions.wrap || CLAMP_TO_EDGE;
        }
        attachment = createTexture(gl, textureOptions);
      }
    }
    if (isRenderbuffer(gl, attachment)) {
      gl.framebufferRenderbuffer(target, attachmentPoint, RENDERBUFFER, attachment);
    } else if (isTexture(gl, attachment)) {
      if (attachmentOptions.layer !== void 0) {
        gl.framebufferTextureLayer(
          target,
          attachmentPoint,
          attachment,
          attachmentOptions.level || 0,
          attachmentOptions.layer
        );
      } else {
        gl.framebufferTexture2D(
          target,
          attachmentPoint,
          attachmentOptions.target || TEXTURE_2D,
          attachment,
          attachmentOptions.level || 0
        );
      }
    } else {
      throw new Error("unknown attachment type");
    }
    framebufferInfo.attachments.push(attachment);
  });
  if (gl.drawBuffers) {
    gl.drawBuffers(usedColorAttachmentsPoints);
  }
  return framebufferInfo;
}
function resizeFramebufferInfo(gl, framebufferInfo, attachments, width, height) {
  width = width || gl.drawingBufferWidth;
  height = height || gl.drawingBufferHeight;
  framebufferInfo.width = width;
  framebufferInfo.height = height;
  attachments = attachments || defaultAttachments;
  attachments.forEach(function(attachmentOptions, ndx) {
    const attachment = framebufferInfo.attachments[ndx];
    const format = attachmentOptions.format;
    const samples = attachmentOptions.samples;
    if (samples !== void 0 || isRenderbuffer(gl, attachment)) {
      gl.bindRenderbuffer(RENDERBUFFER, attachment);
      if (samples > 1) {
        gl.renderbufferStorageMultisample(RENDERBUFFER, samples, format, width, height);
      } else {
        gl.renderbufferStorage(RENDERBUFFER, format, width, height);
      }
    } else if (isTexture(gl, attachment)) {
      resizeTexture(gl, attachment, attachmentOptions, width, height);
    } else {
      throw new Error("unknown attachment type");
    }
  });
}
function bindFramebufferInfo(gl, framebufferInfo, target) {
  target = target || FRAMEBUFFER;
  if (framebufferInfo) {
    gl.bindFramebuffer(target, framebufferInfo.framebuffer);
    gl.viewport(0, 0, framebufferInfo.width, framebufferInfo.height);
  } else {
    gl.bindFramebuffer(target, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}
var framebuffers = Object.freeze({
  __proto__: null,
  bindFramebufferInfo,
  createFramebufferInfo,
  resizeFramebufferInfo
});
var ELEMENT_ARRAY_BUFFER = 34963;
function createVertexArrayInfo(gl, programInfos, bufferInfo) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  if (!programInfos.length) {
    programInfos = [programInfos];
  }
  programInfos.forEach(function(programInfo) {
    setBuffersAndAttributes(gl, programInfo, bufferInfo);
  });
  gl.bindVertexArray(null);
  return {
    numElements: bufferInfo.numElements,
    elementType: bufferInfo.elementType,
    vertexArrayObject: vao
  };
}
function createVAOAndSetAttributes(gl, setters, attribs, indices) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  setAttributes(setters, attribs);
  if (indices) {
    gl.bindBuffer(ELEMENT_ARRAY_BUFFER, indices);
  }
  gl.bindVertexArray(null);
  return vao;
}
function createVAOFromBufferInfo(gl, programInfo, bufferInfo) {
  return createVAOAndSetAttributes(gl, programInfo.attribSetters || programInfo, bufferInfo.attribs, bufferInfo.indices);
}
var vertexArrays = Object.freeze({
  __proto__: null,
  createVertexArrayInfo,
  createVAOAndSetAttributes,
  createVAOFromBufferInfo
});
var defaults = {
  addExtensionsToContext: true
};
function setDefaults(newDefaults) {
  copyExistingProperties(newDefaults, defaults);
  setDefaults$2(newDefaults);
  setDefaults$1(newDefaults);
}
var prefixRE = /^(.*?)_/;
function addExtensionToContext(gl, extensionName) {
  glEnumToString(gl, 0);
  const ext = gl.getExtension(extensionName);
  if (ext) {
    const enums = {};
    const fnSuffix = prefixRE.exec(extensionName)[1];
    const enumSuffix = "_" + fnSuffix;
    for (const key in ext) {
      const value = ext[key];
      const isFunc = typeof value === "function";
      const suffix = isFunc ? fnSuffix : enumSuffix;
      let name = key;
      if (key.endsWith(suffix)) {
        name = key.substring(0, key.length - suffix.length);
      }
      if (gl[name] !== void 0) {
        if (!isFunc && gl[name] !== value) {
          warn$1(name, gl[name], value, key);
        }
      } else {
        if (isFunc) {
          gl[name] = /* @__PURE__ */ (function(origFn) {
            return function() {
              return origFn.apply(ext, arguments);
            };
          })(value);
        } else {
          gl[name] = value;
          enums[name] = value;
        }
      }
    }
    enums.constructor = {
      name: ext.constructor.name
    };
    glEnumToString(enums, 0);
  }
  return ext;
}
var supportedExtensions = [
  "ANGLE_instanced_arrays",
  "EXT_blend_minmax",
  "EXT_color_buffer_float",
  "EXT_color_buffer_half_float",
  "EXT_disjoint_timer_query",
  "EXT_disjoint_timer_query_webgl2",
  "EXT_frag_depth",
  "EXT_sRGB",
  "EXT_shader_texture_lod",
  "EXT_texture_filter_anisotropic",
  "OES_element_index_uint",
  "OES_standard_derivatives",
  "OES_texture_float",
  "OES_texture_float_linear",
  "OES_texture_half_float",
  "OES_texture_half_float_linear",
  "OES_vertex_array_object",
  "WEBGL_color_buffer_float",
  "WEBGL_compressed_texture_atc",
  "WEBGL_compressed_texture_etc1",
  "WEBGL_compressed_texture_pvrtc",
  "WEBGL_compressed_texture_s3tc",
  "WEBGL_compressed_texture_s3tc_srgb",
  "WEBGL_depth_texture",
  "WEBGL_draw_buffers"
];
function addExtensionsToContext(gl) {
  for (let ii = 0; ii < supportedExtensions.length; ++ii) {
    addExtensionToContext(gl, supportedExtensions[ii]);
  }
}
function create3DContext(canvas, opt_attribs) {
  const names = ["webgl", "experimental-webgl"];
  let context = null;
  for (let ii = 0; ii < names.length; ++ii) {
    context = canvas.getContext(names[ii], opt_attribs);
    if (context) {
      if (defaults.addExtensionsToContext) {
        addExtensionsToContext(context);
      }
      break;
    }
  }
  return context;
}
function getWebGLContext(canvas, opt_attribs) {
  const gl = create3DContext(canvas, opt_attribs);
  return gl;
}
function createContext(canvas, opt_attribs) {
  const names = ["webgl2", "webgl", "experimental-webgl"];
  let context = null;
  for (let ii = 0; ii < names.length; ++ii) {
    context = canvas.getContext(names[ii], opt_attribs);
    if (context) {
      if (defaults.addExtensionsToContext) {
        addExtensionsToContext(context);
      }
      break;
    }
  }
  return context;
}
function getContext(canvas, opt_attribs) {
  const gl = createContext(canvas, opt_attribs);
  return gl;
}
function resizeCanvasToDisplaySize(canvas, multiplier) {
  multiplier = multiplier || 1;
  multiplier = Math.max(0, multiplier);
  const width = canvas.clientWidth * multiplier | 0;
  const height = canvas.clientHeight * multiplier | 0;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}
export {
  addExtensionsToContext,
  attributes,
  bindFramebufferInfo,
  bindTransformFeedbackInfo,
  bindUniformBlock,
  canFilter,
  canGenerateMipmap,
  createAttribsFromArrays,
  createAttributeSetters,
  createBufferFromArray,
  createBufferFromTypedArray,
  createBufferInfoFromArrays,
  createBuffersFromArrays,
  createFramebufferInfo,
  createProgram,
  createProgramAsync,
  createProgramFromScripts,
  createProgramFromSources,
  createProgramInfo,
  createProgramInfoAsync,
  createProgramInfoFromProgram,
  createProgramInfos,
  createProgramInfosAsync,
  createPrograms,
  createProgramsAsync,
  createSampler,
  createSamplers,
  createTexture,
  createTextures,
  createTransformFeedback,
  createTransformFeedbackInfo,
  createUniformBlockInfo,
  createUniformBlockInfoFromProgram,
  createUniformBlockSpecFromProgram,
  createUniformSetters,
  createVAOAndSetAttributes,
  createVAOFromBufferInfo,
  createVertexArrayInfo,
  draw,
  drawBufferInfo,
  drawObjectList,
  framebuffers,
  getArray as getArray_,
  getBytesPerElementForInternalFormat,
  getContext,
  getFormatAndTypeForInternalFormat,
  getGLTypeForTypedArray,
  getGLTypeForTypedArrayType,
  getNumComponentsForFormat,
  getNumComponents as getNumComponents_,
  getTypedArrayTypeForGLType,
  getWebGLContext,
  glEnumToString,
  isArrayBuffer$1 as isArrayBuffer,
  isWebGL1,
  isWebGL2,
  loadTextureFromUrl,
  programs,
  resizeCanvasToDisplaySize,
  resizeFramebufferInfo,
  resizeTexture,
  setAttribInfoBufferFromArray,
  setDefaults$2 as setAttributeDefaults_,
  setAttributePrefix,
  setAttributes,
  setBlockUniforms,
  setBuffersAndAttributes,
  setDefaultTextureColor,
  setDefaults,
  setEmptyTexture,
  setSamplerParameters,
  setDefaults$1 as setTextureDefaults_,
  setTextureFilteringForSize,
  setTextureFromArray,
  setTextureFromElement,
  setTextureParameters,
  setUniformBlock,
  setUniforms,
  setUniformsAndBindTextures,
  textures,
  typedarrays,
  utils,
  vertexArrays
};
//# sourceMappingURL=twgl-base__js.js.map
