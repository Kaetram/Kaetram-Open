precision mediump float;
// TODO: There is a bit too much branching here, need to try and simplify a bit

const int uTilesetCount = TILESET_COUNT;

varying vec2 vPixelCoord;
varying vec2 vTextureCoord;

uniform sampler2D uLayer;

// Hardcoded for now, just has to work.
uniform sampler2D uTilesets0;
uniform sampler2D uTilesets1;
uniform sampler2D uTilesets2;
uniform sampler2D uTilesets3;
uniform sampler2D uTilesets4;
uniform sampler2D uTilesets5;
uniform sampler2D uTilesets[uTilesetCount];

uniform vec2 uTilesetTileSize[uTilesetCount];
uniform vec2 uTilesetTileOffset[uTilesetCount];
uniform vec2 uInverseTilesetTextureSize[uTilesetCount];
uniform float uAlpha;
uniform int uRepeatTiles;

const float Flag_FlippedAntiDiagonal = 2.0;
const float Flag_FlippedVertical = 4.0;
const float Flag_FlippedHorizontal = 8.0;
const vec4 c_one4 = vec4(1.0, 1.0, 1.0, 1.0);

// returns 1.0 if flag is set, 0.0 is not
float hasFlag(float value, float flag)
{
    float byteVal = 1.0;

    // early out in trivial cases
    if (value == 0.0)
        return 0.0;

    // Only 4 since our highest flag is `8`, so we only need to check 4 bits
    for (int i = 0; i < 4; ++i)
    {
        if (mod(value, 2.0) > 0.0 && mod(flag, 2.0) > 0.0)
            return 1.0;

        value = floor(value / 2.0);
        flag = floor(flag / 2.0);

        if (!(value > 0.0 && flag > 0.0))
            return 0.0;
    }

    return 0.0;
}

vec2 getTilesetTileSize(int index)
{
    for (int i = 0; i < uTilesetCount; ++i)
        if (i == index)
            return uTilesetTileSize[i];

    return vec2(0.0, 0.0);
}

vec2 getTilesetTileOffset(int index)
{
    for (int i = 0; i < uTilesetCount; ++i)
        if (i == index)
            return uTilesetTileOffset[i];

    return vec2(0.0, 0.0);
}

vec4 getColor(int index, vec2 coord) {
    for (int i = 0; i < uTilesetCount; ++i)
        if (i == index)
            return texture2D(uTilesets[i], coord * uInverseTilesetTextureSize[i]);

    return vec4(0.0, 0.0, 0.0, 0.0);
}

void main()
{
    if (uRepeatTiles == 0 && (vTextureCoord.x < 0.0 || vTextureCoord.x > 1.0 || vTextureCoord.y < 0.0 || vTextureCoord.y > 1.0))
        discard;

    vec4 tile = texture2D(uLayer, vTextureCoord);

    if (tile == c_one4)
        discard;

    float flipFlags = floor(tile.w * 255.0);

    // GLSL ES 2.0 doesn't have bitwise flags...
    // int isFlippedAD = (flipFlags & Flag_FlippedAntiDiagonal) >> 1;
    // int isFlippedY = (flipFlags & Flag_FlippedVertical) >> 2;
    // int isFlippedX = (flipFlags & Flag_FlippedHorizontal) >> 3;

    int imgIndex = int(floor(tile.z * 255.0));
    vec2 tileSize = getTilesetTileSize(imgIndex);
    vec2 tileOffset = getTilesetTileOffset(imgIndex);

    vec2 flipVec = vec2(hasFlag(flipFlags, Flag_FlippedHorizontal), hasFlag(flipFlags, Flag_FlippedVertical));

    vec2 tileCoord = floor(tile.xy * 255.0);

    // tileOffset.x is 'spacing', tileOffset.y is 'margin'
    tileCoord.x = (tileCoord.x * tileSize.x) + (tileCoord.x * tileOffset.x) + tileOffset.y;
    tileCoord.y = (tileCoord.y * tileSize.y) + (tileCoord.y * tileOffset.x) + tileOffset.y;

    vec2 offsetInTile = mod(vPixelCoord, tileSize);
    vec2 offsetInTileFlipped = abs((tileSize * flipVec) - offsetInTile);

    // if isFlippedAD is set, this will flip the x/y coords
    if (hasFlag(flipFlags, Flag_FlippedAntiDiagonal) == 1.0)
    {
        float x = offsetInTileFlipped.x;
        offsetInTileFlipped.x = offsetInTileFlipped.y;
        offsetInTileFlipped.y = x;
    }

    vec4 color = getColor(imgIndex, tileCoord + offsetInTileFlipped);

    gl_FragColor = vec4(color.rgb, color.a * uAlpha);
}