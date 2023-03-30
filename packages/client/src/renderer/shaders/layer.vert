precision highp float;

attribute vec2 aPosition;
attribute vec2 aTexture;

uniform float uInverseTileScale;

uniform vec2 uOffset;
uniform vec2 uViewportSize;
uniform vec2 uInverseLayerTileCount;
uniform vec2 uInverseLayerTileSize;

varying vec2 vPixelCoord;
varying vec2 vTextureCoord;

void main()
{
    // round offset to the nearest multiple of the inverse scale
    // this essentially clamps offset to whole "pixels"
    vec2 offset = uOffset + (uInverseTileScale / 2.0);
    offset -= mod(offset, uInverseTileScale);

    vPixelCoord = (aTexture * uViewportSize) + offset;
    vTextureCoord = vPixelCoord * uInverseLayerTileCount * uInverseLayerTileSize;

    gl_Position = vec4(aPosition, 0.0, 1.0);
}