#version 300 es
precision highp float;

in vec3 v_texCoord;
out vec4 outColor;

uniform samplerCube u_skybox;

void main() {
  outColor = texture(u_skybox, normalize(v_texCoord));
}
