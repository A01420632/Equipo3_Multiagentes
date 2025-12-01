#version 300 es

in vec4 a_position;
out vec3 v_texCoord;

uniform mat4 u_viewDirectionProjectionInverse;

void main() {
  gl_Position = a_position;
  gl_Position.z = 1.0; // Asegurar que el skybox esté al fondo
  v_texCoord = (u_viewDirectionProjectionInverse * a_position).xyz;
}
