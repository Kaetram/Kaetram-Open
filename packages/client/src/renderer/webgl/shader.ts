/**
 * Used for organization of WebGL information. We use this to
 * apply shaders and assign it to a WebGLProgram.
 */

import log from '../../lib/log';

interface Attributes {
    [key: string]: number;
}

interface UniformAttributes {
    [key: string]: WebGLUniformLocation;
}

/**
 * Huge thanks to the creator of gl-tiled for providing this framework. It has
 * been modified by me to use more standard approaches.
 */

export default class ProgramData {
    public id = '';

    public program: WebGLProgram;

    // The attributes for the program.
    public attributes: Attributes = {};

    // The uniform attributes for the program.
    public uniforms: UniformAttributes = {};

    public constructor(
        context: WebGLRenderingContext,
        vertexShader: string,
        fragmentShader: string,
        attributes: Attributes = {}
    ) {
        this.id = (context.canvas as HTMLCanvasElement).id;
        this.program = this.compile(context, vertexShader, fragmentShader, attributes)!;

        // Build attribute locations based on the created program.
        let count = context.getProgramParameter(this.program, context.ACTIVE_ATTRIBUTES);

        for (let i = 0; i < count; i++) {
            let attribute = context.getActiveAttrib(this.program, i);

            if (!attribute) continue;

            this.attributes[attribute.name] = context.getAttribLocation(
                this.program,
                attribute.name
            );
        }

        // Build the uniform locations based on the created program.
        count = context.getProgramParameter(this.program, context.ACTIVE_UNIFORMS);

        for (let i = 0; i < count; i++) {
            let uniform = context.getActiveUniform(this.program, i);

            // Skip if we cannot get the uniform.
            if (!uniform) continue;

            // We need to remove the array index from the name.
            let name = uniform.name.replace('[0]', ''),
                location = context.getUniformLocation(this.program, name);

            // If the location is valid, add it to the uniforms.
            if (location) this.uniforms[name] = location;
        }
    }

    /**
     * Used to attach shaders and attributes onto a WebGL rendering context.
     * @param context The context we want to attach the program to.
     * @param vertexShader The vertex shader we want to use.
     * @param fragmentShader The fragment shader we want to use.
     * @param attributes (Optional) The attributes we want to use.
     */

    private compile(
        context: WebGLRenderingContext,
        vertexShader: string,
        fragmentShader: string,
        attributes: Attributes = {}
    ): WebGLProgram | undefined {
        // Compile both the vertex and fragment shaders and store the results.
        let glVertex = this.compileShader(context, context.VERTEX_SHADER, vertexShader),
            glFragment = this.compileShader(context, context.FRAGMENT_SHADER, fragmentShader),
            program = context.createProgram();

        if (!program) {
            log.error('Could not create WebGL program.');

            return;
        }

        // Attach the shaders to the program.
        context.attachShader(program, glVertex!);
        context.attachShader(program, glFragment!);

        // Iterate through the attributes and bind them to the program.
        for (let key in attributes) context.bindAttribLocation(program, attributes[key], key);

        // Link the program and check for errors.
        context.linkProgram(program);

        if (!context.getProgramParameter(program, context.LINK_STATUS)) {
            log.error(`Could not link the WebGL program: ${context.getProgramInfoLog(program)}`);

            context.deleteProgram(program);
            context.deleteShader(glVertex!);
            context.deleteShader(glFragment!);

            return;
        }

        // Delete the shaders since we no longer need them.
        context.deleteShader(glVertex!);
        context.deleteShader(glFragment!);

        return program;
    }

    /**
     * Compiles the shader and returns it.
     * @param context The context for which we want to compile the shader.
     * @param type The type of shader we want to compile.
     * @param source The source code for the shader.
     * @returns The compiled shader object.
     */

    private compileShader(
        context: WebGLRenderingContext,
        type: number,
        source: string
    ): WebGLShader | undefined {
        let shader = context.createShader(type);

        // If we cannot create a shader, return undefined.
        if (!shader) {
            log.error(`Failed to create shader of type ${type}`);

            return;
        }

        context.shaderSource(shader, source);
        context.compileShader(shader);

        // We could not compile the shader properly.
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            log.error(`Failed to compile shader: ${context.getShaderInfoLog(shader)}`);

            return;
        }

        return shader;
    }
}
