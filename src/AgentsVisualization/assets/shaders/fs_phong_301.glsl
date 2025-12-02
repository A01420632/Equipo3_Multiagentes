#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;
in vec4 v_color;

// Scene uniforms
uniform vec4 u_ambientLight;
uniform vec4 u_diffuseLight;
uniform vec4 u_specularLight;

// Model uniforms
uniform float u_shininess;

out vec4 outColor;

void main() {
    // v_normal must be normalized because the shader will interpolate
    // it for each fragment
    vec3 normal = normalize(v_normal);

    // Normalize the other incoming vectors
    vec3 surfToLigthDirection = normalize(v_surfaceToLight);
    vec3 surfToViewDirection = normalize(v_surfaceToView);

    // CALCULATIONS FOR THE AMBIENT, DIFFUSE and SPECULAR COMPONENTS
    float diffuse = max(dot(normal, surfToLigthDirection), 0.0);

    float specular = 0.0;
    if(diffuse >0.0){
        vec3 reflected = 2.0 * dot(surfToLigthDirection, normal) * normal - surfToLigthDirection;
        specular = pow(max(dot(reflected, surfToViewDirection),0.0), u_shininess);
    }


    // Compute the three parts of the Phong lighting model using vertex color
    vec4 ambientColor = u_ambientLight * v_color;
    vec4 diffuseColor = u_diffuseLight * v_color * diffuse;
    vec4 specularColor = u_specularLight * vec4(1.0, 1.0, 1.0, 1.0) * specular;

    // Use the color from the MTL file
    outColor = ambientColor + diffuseColor + specularColor;
}
