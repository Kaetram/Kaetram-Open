precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform float uAlpha;
uniform vec4 uTransparentColor;

void main()
{
    vec4 color = texture2D(uSampler, vTextureCoord);

    if (uTransparentColor.a == 1.0 && uTransparentColor.rgb == color.rgb)
        discard;

    gl_FragColor = vec4(color.rgb, color.a * uAlpha);
}