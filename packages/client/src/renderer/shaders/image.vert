precision highp float;

attribute vec2 aPosition;
attribute vec2 aTexture;

uniform float uInverseTileScale;

uniform vec2 uOffset;
uniform vec2 uSize;
uniform vec2 uViewportSize;
// uniform mat3 uProjection;

varying vec2 vTextureCoord;

void main()
{
    // squash from [-1, 1] to [0, 1]
    vec2 position = aPosition;
    position += 1.0;
    position /= 2.0;

    // round offset to the nearest multiple of the inverse scale
    // this essentially clamps offset to whole "pixels"
    vec2 offset = uOffset + (uInverseTileScale / 2.0);
    offset -= mod(offset, uInverseTileScale);

    // modify offset by viewport & size
    offset.x -= uViewportSize.x / 2.0;
    offset.y += (uViewportSize.y / 2.0) - uSize.y;

    // calculate this vertex position based on image size and offset
    position *= uSize;
    position += offset;

    // project to clip space
    position *= (2.0 / uViewportSize);

    vTextureCoord = aTexture;
    gl_Position = vec4(position, 0.0, 1.0);
}