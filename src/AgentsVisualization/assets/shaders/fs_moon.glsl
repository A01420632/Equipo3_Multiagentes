#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;
in vec2 v_texCoord;

// Scene uniforms
uniform vec4 u_ambientLight;
uniform vec4 u_diffuseLight;
uniform vec4 u_specularLight;

// Model uniforms
uniform float u_shininess;
uniform sampler2D u_texture;
uniform float u_emissive; // Emisión de luz propia

out vec4 outColor;

void main() {
    // Normalize vectors
    vec3 normal = normalize(v_normal);
    vec3 surfToLightDirection = normalize(v_surfaceToLight);
    vec3 surfToViewDirection = normalize(v_surfaceToView);

    // Get color from texture
    vec4 texColor = texture(u_texture, v_texCoord);

    // CALCULATIONS FOR THE AMBIENT, DIFFUSE and SPECULAR COMPONENTS
    float diffuse = max(dot(normal, surfToLightDirection), 0.0);

    float specular = 0.0;
    if(diffuse > 0.0){
        vec3 reflected = 2.0 * dot(surfToLightDirection, normal) * normal - surfToLightDirection;
        specular = pow(max(dot(reflected, surfToViewDirection), 0.0), u_shininess);
    }

    // Compute the three parts of the Phong lighting model using texture color
    vec4 ambientColor = u_ambientLight * texColor;
    vec4 diffuseColor = u_diffuseLight * texColor * diffuse;
    vec4 specularColor = u_specularLight * vec4(1.0, 1.0, 1.0, 1.0) * specular;

    // Add emissive component to make moon glow
    vec4 emissiveColor = texColor * u_emissive;

    // Final color with texture and self-illumination
    outColor = ambientColor + diffuseColor + specularColor + emissiveColor;
}
