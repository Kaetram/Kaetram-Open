/*!
* gl-tiled - v1.0.0
* Compiled Mon, 16 Dec 2019 06:57:57 UTC
*
* gl-tiled is licensed under the MIT License.
* http://www.opensource.org/licenses/mit-license
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.glTiled = {}));
}(this, function (exports) { 'use strict';

    (function (ELayerType) {
        ELayerType[ELayerType["UNKNOWN"] = 0] = "UNKNOWN";
        ELayerType[ELayerType["Tilelayer"] = 1] = "Tilelayer";
        ELayerType[ELayerType["Imagelayer"] = 2] = "Imagelayer";
        // Objectgroup,
    })(exports.ELayerType || (exports.ELayerType = {}));

    function loadImage(url, cache, cb) {
        var asset = cache && cache[url];
        if (asset) {
            var img_1 = asset.data || asset;
            if (cb)
                cb(null, img_1);
            return img_1;
        }
        var onLoadHandler = function () {
            img.removeEventListener('load', onLoadHandler, false);
            img.removeEventListener('error', onErrorHandler, false);
            if (cb)
                cb(null, img);
        };
        var onErrorHandler = function (e) {
            img.removeEventListener('load', onLoadHandler, false);
            img.removeEventListener('error', onErrorHandler, false);
            if (cb)
                cb(e, img);
        };
        var img = new Image();
        img.src = url;
        img.addEventListener('load', onLoadHandler, false);
        img.addEventListener('error', onErrorHandler, false);
        return img;
    }

    function parseColorStr(colorStr, outColor) {
        if (colorStr) {
            if (colorStr.length === 9) {
                outColor[3] = parseInt(colorStr.substr(1, 2), 16) / 255;
                outColor[0] = parseInt(colorStr.substr(3, 2), 16) / 255;
                outColor[1] = parseInt(colorStr.substr(5, 2), 16) / 255;
                outColor[2] = parseInt(colorStr.substr(7, 2), 16) / 255;
            }
            else if (colorStr.length === 7) {
                outColor[3] = 1.0;
                outColor[0] = parseInt(colorStr.substr(1, 2), 16) / 255;
                outColor[1] = parseInt(colorStr.substr(3, 2), 16) / 255;
                outColor[2] = parseInt(colorStr.substr(5, 2), 16) / 255;
            }
        }
    }

    var GLImagelayer = /** @class */ (function () {
        function GLImagelayer(desc, assetCache) {
            var _this = this;
            this.desc = desc;

            this.type = exports.ELayerType.Imagelayer;
            this.scrollScaleX = 1;
            this.scrollScaleY = 1;
            this.gl = null;
            this.texture = null;
            this.image = null;
            this.alpha = typeof desc.opacity === 'number' ? desc.opacity : 1.0;
            // parse the transparent color
            this._transparentColor = new Float32Array(4);
            if (desc.transparentcolor)
                parseColorStr(desc.transparentcolor, this._transparentColor);
            loadImage(desc.image, assetCache, function (errEvent, img) {
                _this.image = img;
                _this.upload();
            });
        }
        GLImagelayer.prototype.glInitialize = function (gl) {
            this.glTerminate();
            this.gl = gl;
            this.texture = gl.createTexture();
            this.upload();
        };
        GLImagelayer.prototype.glTerminate = function () {
            if (!this.gl)
                return;
            if (this.texture) {
                this.gl.deleteTexture(this.texture);
                this.texture = null;
            }
            this.gl = null;
        };
        GLImagelayer.prototype.upload = function () {
            if (!this.gl || !this.image)
                return;
            this.setupTexture();
            this.uploadData(false);
        };
        GLImagelayer.prototype.uploadUniforms = function (shader) {
            if (!this.gl || !this.image)
                return;
            var gl = this.gl;
            gl.uniform1f(shader.uniforms.uAlpha, this.alpha);
            gl.uniform4fv(shader.uniforms.uTransparentColor, this._transparentColor);
            gl.uniform2f(shader.uniforms.uSize, this.image.width, this.image.height);
        };
        GLImagelayer.prototype.uploadData = function (doBind) {
            if (doBind === void 0) { doBind = true; }
            if (!this.gl || !this.image)
                return;
            var gl = this.gl;
            if (doBind)
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
        };
        GLImagelayer.prototype.setupTexture = function (doBind) {
            if (doBind === void 0) { doBind = true; }
            if (!this.gl)
                return;
            var gl = this.gl;
            if (doBind)
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
            // TODO: Allow user to set filtering
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };
        return GLImagelayer;
    }());

    (function (TilesetFlags) {
        TilesetFlags[TilesetFlags["FlippedAntiDiagonal"] = 536870912] = "FlippedAntiDiagonal";
        TilesetFlags[TilesetFlags["FlippedVertical"] = 1073741824] = "FlippedVertical";
        TilesetFlags[TilesetFlags["FlippedHorizontal"] = 2147483648] = "FlippedHorizontal";
        TilesetFlags[TilesetFlags["All"] = -536870912] = "All";
        TilesetFlags[TilesetFlags["FlippedAntiDiagonalFlag"] = 2] = "FlippedAntiDiagonalFlag";
        TilesetFlags[TilesetFlags["FlippedVerticalFlag"] = 4] = "FlippedVerticalFlag";
        TilesetFlags[TilesetFlags["FlippedHorizontalFlag"] = -8] = "FlippedHorizontalFlag";
    })(exports.TilesetFlags || (exports.TilesetFlags = {}));
    var GLTileset = /** @class */ (function () {
        function GLTileset(desc, assetCache) {
            this.desc = desc;
            this.gl = null;
            /** The images in this tileset. */

            this.images = [];
            /** The gl textures in this tileset */
            this.textures = [];
            this._lidToTileMap = {};
            // load the images
            if (this.desc.image) {
                this._addImage(this.desc.image, assetCache);
            }
            if (this.desc.tiles) {
                for (var i = 0; i < this.desc.tiles.length; ++i) {
                    var tile = this.desc.tiles[i];
                    this._lidToTileMap[tile.id] = tile;
                    if (tile.image) {
                        this._addImage(tile.image, assetCache);
                    }
                }
            }
        }
        Object.defineProperty(GLTileset.prototype, "lastgid", {
            /** The last gid in this tileset */
            get: function () {
                return this.desc.firstgid + this.desc.tilecount;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns true if the given gid is contained in this tileset
         *
         * @param gid The global ID of the tile in a map.
         */
        GLTileset.prototype.containsGid = function (gid) {
            return this.containsLocalId(this.getTileLocalId(gid));
        };
        /**
         * Returns true if the given index is contained in this tileset
         *
         * @param index The local index of a tile in this tileset.
         */
        GLTileset.prototype.containsLocalId = function (index) {
            return index >= 0 && index < this.desc.tilecount;
        };
        /**
         * Returns the tile ID for a given gid. Assumes it is within range
         *
         * @param gid The global ID of the tile in a map.
         */
        GLTileset.prototype.getTileLocalId = function (gid) {
            return (gid & ~exports.TilesetFlags.All) - this.desc.firstgid;
        };
        /**
         * Gathers the properties of a tile
         *
         * @param gid The global ID of the tile in a map.
         */
        GLTileset.prototype.getTileProperties = function (gid) {
            if (!gid)
                return null;
            var localId = this.getTileLocalId(gid);
            if (!this.containsLocalId(localId))
                return null;
            return {
                coords: {
                    x: localId % this.desc.columns,
                    y: Math.floor(localId / this.desc.columns),
                },
                imgIndex: this.images.length > 1 ? localId : 0,
                flippedX: (gid & exports.TilesetFlags.FlippedHorizontal) != 0,
                flippedY: (gid & exports.TilesetFlags.FlippedVertical) != 0,
                flippedAD: (gid & exports.TilesetFlags.FlippedAntiDiagonal) != 0,
                tile: this._lidToTileMap[localId],
            };
        };
        GLTileset.prototype.bind = function (startSlot) {
            var gl = this.gl;
            for (var i = 0; i < this.textures.length; ++i) {
                gl.activeTexture(startSlot + i);
                gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
            }
        };
        GLTileset.prototype.glInitialize = function (gl) {
            this.glTerminate();
            this.gl = gl;
            for (var i = 0; i < this.images.length; ++i) {
                // If there is already an image then that means the image finished
                // loading at some point, so we need to recreate the texture. If there
                // isn't an image here, then the loading callback will hit at some
                // point and create the texture for us there.
                if (this.images[i]) {
                    this._createTexture(i);
                }
            }
        };
        GLTileset.prototype.glTerminate = function () {
            if (!this.gl)
                return;
            var gl = this.gl;
            for (var i = 0; i < this.textures.length; ++i) {
                var tex = this.textures[i];
                if (tex) {
                    gl.deleteTexture(tex);
                }
            }
            this.textures.length = 0;
            this.gl = null;
        };
        GLTileset.prototype._addImage = function (src, assets) {
            var _this = this;
            var imgIndex = this.images.length;
            this.images.push(null);
            this.textures.push(null);
            loadImage(src, assets, function (errEvent, img) {
                if (!errEvent) {
                    _this.images[imgIndex] = img;
                    _this._createTexture(imgIndex);
                }
            });
        };
        GLTileset.prototype._createTexture = function (imgIndex) {
            if (!this.gl)
                return;
            var gl = this.gl;
            var img = this.images[imgIndex];
            var tex = this.textures[imgIndex] = gl.createTexture();
            if (!tex || !img) {
                throw new Error('Failed to create WebGL texture for tileset.');
            }
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            // TODO: Allow user to set filtering, but also need a way to do linear
            // filtering without tile tearing when zooming in.
            // Possibility: Render at scale 1 to a framebuffer, scale the frambuffer linearly
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };

        return GLTileset;
    }());

    /**
     * Due to the storage format used tileset images are limited to
     * 256 x 256 tiles, and there can only be up to 256 tilesets. Similarly
     * a multi-image tileset can only have up-to 256 images.
     *
     * Since a tileset sheet with 256x256 tiles at 16x16 tile size is 4096x4096
     * pixels I think this restriciton is probably OK. Additonally if you actually
     * approach the 256 image/tileset limit it will likely be a GPU bandwidth issue
     * long before it is an issue with our storage format here.
     *
     */
    var GLTilelayer = /** @class */ (function () {
        function GLTilelayer(desc, tilesets) {
            this.desc = desc;

            this.type = exports.ELayerType.Tilelayer;
            this.gl = null;
            this.scrollScaleX = 1;
            this.scrollScaleY = 1;
            this.texture = null;
            this._animations = [];
            this._inverseTileCount = new Float32Array(2);
            this._repeatTiles = true;
            this._inverseTileCount[0] = 1 / desc.width;
            this._inverseTileCount[1] = 1 / desc.height;
            this.textureData = new Uint8Array(desc.width * desc.height * 4);
            this.alpha = desc.opacity;
            // If this isn't true then we probably did something wrong or got bad data...
            // This has caught me putting in base64 data instead of array data more than once!
            if ((desc.width * desc.height) !== this.desc.data.length)
                throw new Error('Sizes are off! Expected: ' + (desc.width * desc.height) + ' and received: ' + this.desc.data.length);
            this._buildMapTexture(tilesets);
        }
        Object.defineProperty(GLTilelayer.prototype, "repeatTiles", {
            get: function () {
                return this._repeatTiles;
            },
            set: function (v) {
                if (v !== this._repeatTiles) {
                    this._repeatTiles = v;
                    this._setupTexture(); // delay until next draw?
                }
            },
            enumerable: true,
            configurable: true
        });
        GLTilelayer.prototype.glInitialize = function (gl) {
            this.glTerminate();
            this.gl = gl;
            this.texture = gl.createTexture();
            this._upload();
        };
        GLTilelayer.prototype.glTerminate = function () {
            if (!this.gl)
                return;
            if (this.texture) {
                this.gl.deleteTexture(this.texture);
                this.texture = null;
            }
            this.gl = null;
        };
        /**
         * Updates the layer's animations by the given delta time.
         *
         * @param dt Delta time in milliseconds to perform an update for.
         */
        GLTilelayer.prototype.update = function (dt) {
            var needsUpload = false;
            for (var i = 0; i < this._animations.length; ++i) {
                var anim = this._animations[i];
                anim.elapsedTime = (anim.elapsedTime + dt) % anim.maxTime;
                for (var f = 0; f < anim.frames.length; ++f) {
                    var frame = anim.frames[f];
                    if (anim.elapsedTime >= frame.startTime && anim.elapsedTime < frame.endTime) {
                        if (anim.activeFrame !== f) {
                            needsUpload = true;
                            anim.activeFrame = f;
                            this.textureData[anim.index] = frame.props.coords.x;
                            this.textureData[anim.index + 1] = frame.props.coords.y;
                        }
                        break;
                    }
                }
            }
            if (needsUpload)
                this._uploadData(true);
        };
        GLTilelayer.prototype.uploadUniforms = function (shader) {
            if (!this.gl)
                return;
            var gl = this.gl;
            gl.uniform1f(shader.uniforms.uAlpha, this.alpha);
            gl.uniform1i(shader.uniforms.uRepeatTiles, this._repeatTiles ? 1 : 0);
            gl.uniform2fv(shader.uniforms.uInverseLayerTileCount, this._inverseTileCount);
        };
        GLTilelayer.prototype._upload = function () {
            this._setupTexture();
            this._uploadData(false);
        };
        GLTilelayer.prototype._uploadData = function (doBind) {
            if (!this.gl)
                return;
            var gl = this.gl;
            if (doBind)
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, // level
            gl.RGBA, // internal format
            this.desc.width, this.desc.height, 0, // border
            gl.RGBA, // format
            gl.UNSIGNED_BYTE, // type
            this.textureData);
        };
        GLTilelayer.prototype._setupTexture = function (doBind) {
            if (doBind === void 0) { doBind = true; }
            if (!this.gl)
                return;
            var gl = this.gl;
            if (doBind)
                gl.bindTexture(gl.TEXTURE_2D, this.texture);
            // MUST be filtered with NEAREST or tile lookup fails
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            if (this._repeatTiles) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            }
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
        };
        /**
         * Builds the texture used as the map for this layer. Each texture has the data
         * necessary for the shader to lookup the correct texel to display.
         *
         * @param tilesets The list of tilesets, who's images will be uploaded to the GPU elsewhere.
         */
        GLTilelayer.prototype._buildMapTexture = function (tilesets) {
            // TODO:
            // - Might be faster to build this texture on the GPU in a framebuffer?
            // - Should it then be read back into RAM so it can be modified on CPU?
            // - Should it just be calculated at runtime in the main shader (upload tileset metadata)?
            //  * Isn't this last one the same as what I do here? I'd still
            //    have to format the tileset data for upload...
            // - Can I upload animation data and just lookup the right frame in the shader? That would
            //   mean I don't have to upload a new layer texture each frame like I do now.
            var index = 0;
            var data = this.desc.data;
            dataloop: for (var i = 0; i < data.length; ++i) {
                var gid = data[i];
                var imgIndex = 0;
                if (gid) {
                    for (var t = 0; t < tilesets.length; ++t) {
                        var tileset = tilesets[t];
                        var tileprops = tileset.getTileProperties(gid);
                        if (tileprops) {
                            if (tileprops.tile && tileprops.tile.animation) {
                                this._addAnimation(index, tileset, tileprops.tile.animation);
                            }
                            this.textureData[index++] = tileprops.coords.x;
                            this.textureData[index++] = tileprops.coords.y;
                            this.textureData[index++] = tileprops.imgIndex + imgIndex;
                            this.textureData[index++] =
                                (tileprops.flippedX ? exports.TilesetFlags.FlippedHorizontalFlag : 0)
                                    | (tileprops.flippedY ? exports.TilesetFlags.FlippedVerticalFlag : 0)
                                    | (tileprops.flippedAD ? exports.TilesetFlags.FlippedAntiDiagonalFlag : 0);
                            continue dataloop;
                        }
                        imgIndex += tilesets[t].images.length;
                    }
                }
                // if we reach here, it was because either this tile is 0, meaning
                // there is no tile here. Or, we failed to find the tileset for it.
                // if we failed to find a tileset, or the gid was 0, just write an empty entry.
                this.textureData[index++] = 255;
                this.textureData[index++] = 255;
                this.textureData[index++] = 255;
                this.textureData[index++] = 255;
            }
        };
        GLTilelayer.prototype._addAnimation = function (index, tileset, animationFrames) {
            var maxTime = 0;
            this._animations.push({
                index: index,
                activeFrame: -1,
                elapsedTime: 0,
                frames: animationFrames.map(function (v) {
                    var animTileGid = v.tileid + tileset.desc.firstgid;
                    var animTileProps = tileset.getTileProperties(animTileGid);
                    return {
                        duration: v.duration,
                        tileid: v.tileid,
                        props: animTileProps,
                        startTime: maxTime,
                        endTime: (maxTime += v.duration),
                    };
                }),
                maxTime: 0,
            });
            this._animations[this._animations.length - 1].maxTime = maxTime;
        };
        return GLTilelayer;
    }());

    function assertNever(x) {
        throw new Error("Unexpected object: " + x);
    }

    function hasOwnKey(obj, key) {
        return obj.hasOwnProperty(key);
    }

    /**
     * Helper class to manage GL shader programs.
     *
     */
    var GLProgram = /** @class */ (function () {
        /**
         * @param gl The rendering context.
         * @param vertexSrc The vertex shader source as an array of strings.
         * @param fragmentSrc The fragment shader source as an array of strings.
         * @param attributeLocations A key value pair showing which location
         *  each attribute should sit eg `{ position: 0, uvs: 1 }`.
         */
        function GLProgram(gl, vertexSrc, fragmentSrc, attributeLocations) {
            /** The attribute locations of this program */
            this.attributes = {};
            /** The uniform locations of this program */
            this.uniforms = {};
            this.program = GLProgram.compileProgram(gl, vertexSrc, fragmentSrc, attributeLocations);
            // build a list of attribute locations
            var aCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
            for (var i = 0; i < aCount; ++i) {
                var attrib = gl.getActiveAttrib(this.program, i);
                if (attrib) {
                    this.attributes[attrib.name] = gl.getAttribLocation(this.program, attrib.name);
                }
            }
            // build a list of uniform locations
            var uCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
            for (var i = 0; i < uCount; ++i) {
                var uniform = gl.getActiveUniform(this.program, i);
                if (uniform) {
                    var name_1 = uniform.name.replace('[0]', '');
                    var loc = gl.getUniformLocation(this.program, name_1);
                    if (loc) {
                        this.uniforms[name_1] = loc;
                    }
                }
            }
        }
        /**
         * @param gl The rendering context.
         * @param vertexSrc The vertex shader source as an array of strings.
         * @param fragmentSrc The fragment shader source as an array of strings.
         * @param attributeLocations A key value pair showing which location
         *  each attribute should sit eg `{ position: 0, uvs: 1 }`.
         */
        GLProgram.compileProgram = function (gl, vertexSrc, fragmentSrc, attributeLocations) {
            var glVertShader = GLProgram.compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
            var glFragShader = GLProgram.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
            var program = gl.createProgram();
            if (!program) {
                throw new Error('Failed to create WebGL program object.');
            }
            gl.attachShader(program, glVertShader);
            gl.attachShader(program, glFragShader);
            // optionally, set the attributes manually for the program rather than letting WebGL decide..
            if (attributeLocations) {
                for (var k in attributeLocations) {
                    if (!hasOwnKey(attributeLocations, k))
                        continue;
                    var location_1 = attributeLocations[k];
                    if (location_1) {
                        gl.bindAttribLocation(program, location_1, k);
                    }
                }
            }
            gl.linkProgram(program);
            // if linking fails, then log and cleanup
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                var errLog = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                gl.deleteShader(glVertShader);
                gl.deleteShader(glFragShader);
                throw new Error("Could not link shader program. Log:\n" + errLog);
            }
            // clean up some shaders
            gl.deleteShader(glVertShader);
            gl.deleteShader(glFragShader);
            return program;
        };
        /**
         * Compiles source into a program.
         *
         * @param gl The rendering context.
         * @param type The type, can be either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
         * @param source The fragment shader source as an array of strings.
         */
        GLProgram.compileShader = function (gl, type, source) {
            var shader = gl.createShader(type);
            if (!shader) {
                throw new Error('Failed to create WebGL shader object.');
            }
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                var errLog = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                throw new Error("Failed to compile shader. Log:\n" + errLog);
            }
            return shader;
        };
        return GLProgram;
    }());

    var backgroundVS = "precision lowp float;\n\nattribute vec2 aPosition;\n\nvoid main()\n{\n    gl_Position = vec4(aPosition, 0.0, 1.0);\n}\n";

    var backgroundFS = "precision lowp float;\n\nuniform vec4 uColor;\n\nvoid main()\n{\n    gl_FragColor = uColor;\n}";

    var tilelayerVS = "precision highp float;\n\nattribute vec2 aPosition;\nattribute vec2 aTexture;\n\nuniform float uInverseTileScale;\n\nuniform vec2 uOffset;\nuniform vec2 uViewportSize;\nuniform vec2 uInverseLayerTileCount;\nuniform vec2 uInverseLayerTileSize;\n\nvarying vec2 vPixelCoord;\nvarying vec2 vTextureCoord;\n\nvoid main()\n{\n    // round offset to the nearest multiple of the inverse scale\n    // this essentially clamps offset to whole \"pixels\"\n    vec2 offset = uOffset + (uInverseTileScale / 2.0);\n    offset -= mod(offset, uInverseTileScale);\n\n    vPixelCoord = (aTexture * uViewportSize) + offset;\n    vTextureCoord = vPixelCoord * uInverseLayerTileCount * uInverseLayerTileSize;\n\n    gl_Position = vec4(aPosition, 0.0, 1.0);\n}\n";

    var tilelayerFS = "precision mediump float;\n\n// TODO: There is a bit too much branching here, need to try and simplify a bit\n\n#pragma define(NUM_TILESETS)\n#pragma define(NUM_TILESET_IMAGES)\n\nvarying vec2 vPixelCoord;\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uLayer;\nuniform sampler2D uTilesets[NUM_TILESET_IMAGES];\n\nuniform vec2 uTilesetTileSize[NUM_TILESET_IMAGES];\nuniform vec2 uTilesetTileOffset[NUM_TILESET_IMAGES];\nuniform vec2 uInverseTilesetTextureSize[NUM_TILESET_IMAGES];\nuniform float uAlpha;\nuniform int uRepeatTiles;\n\nconst float Flag_FlippedAntiDiagonal = 2.0;\nconst float Flag_FlippedVertical = 4.0;\nconst float Flag_FlippedHorizontal = 8.0;\nconst vec4 c_one4 = vec4(1.0, 1.0, 1.0, 1.0);\n\n// returns 1.0 if flag is set, 0.0 is not\nfloat hasFlag(float value, float flag)\n{\n    float byteVal = 1.0;\n\n    // early out in trivial cases\n    if (value == 0.0)\n        return 0.0;\n\n    // Only 4 since our highest flag is `8`, so we only need to check 4 bits\n    for (int i = 0; i < 4; ++i)\n    {\n        if (mod(value, 2.0) > 0.0 && mod(flag, 2.0) > 0.0)\n            return 1.0;\n\n        value = floor(value / 2.0);\n        flag = floor(flag / 2.0);\n\n        if (!(value > 0.0 && flag > 0.0))\n            return 0.0;\n    }\n\n    return 0.0;\n}\n\nvec2 getTilesetTileSize(int index)\n{\n    for (int i = 0; i < NUM_TILESET_IMAGES; ++i)\n        if (i == index)\n            return uTilesetTileSize[i];\n\n    return vec2(0.0, 0.0);\n}\n\nvec2 getTilesetTileOffset(int index)\n{\n    for (int i = 0; i < NUM_TILESET_IMAGES; ++i)\n        if (i == index)\n            return uTilesetTileOffset[i];\n\n    return vec2(0.0, 0.0);\n}\n\nvec4 getColor(int index, vec2 coord)\n{\n    for (int i = 0; i < NUM_TILESET_IMAGES; ++i)\n        if (i == index)\n            return texture2D(uTilesets[i], coord * uInverseTilesetTextureSize[i]);\n\n    return vec4(0.0, 0.0, 0.0, 0.0);\n}\n\nvoid main()\n{\n    if (uRepeatTiles == 0 && (vTextureCoord.x < 0.0 || vTextureCoord.x > 1.0 || vTextureCoord.y < 0.0 || vTextureCoord.y > 1.0))\n        discard;\n\n    vec4 tile = texture2D(uLayer, vTextureCoord);\n\n    if (tile == c_one4)\n        discard;\n\n    float flipFlags = floor(tile.w * 255.0);\n\n    // GLSL ES 2.0 doesn't have bitwise flags...\n    // int isFlippedAD = (flipFlags & Flag_FlippedAntiDiagonal) >> 1;\n    // int isFlippedY = (flipFlags & Flag_FlippedVertical) >> 2;\n    // int isFlippedX = (flipFlags & Flag_FlippedHorizontal) >> 3;\n\n    int imgIndex = int(floor(tile.z * 255.0));\n    vec2 tileSize = getTilesetTileSize(imgIndex);\n    vec2 tileOffset = getTilesetTileOffset(imgIndex);\n\n    vec2 flipVec = vec2(hasFlag(flipFlags, Flag_FlippedHorizontal), hasFlag(flipFlags, Flag_FlippedVertical));\n\n    vec2 tileCoord = floor(tile.xy * 255.0);\n\n    // tileOffset.x is 'spacing', tileOffset.y is 'margin'\n    tileCoord.x = (tileCoord.x * tileSize.x) + (tileCoord.x * tileOffset.x) + tileOffset.y;\n    tileCoord.y = (tileCoord.y * tileSize.y) + (tileCoord.y * tileOffset.x) + tileOffset.y;\n\n    vec2 offsetInTile = mod(vPixelCoord, tileSize);\n    vec2 offsetInTileFlipped = abs((tileSize * flipVec) - offsetInTile);\n\n    // if isFlippedAD is set, this will flip the x/y coords\n    if (hasFlag(flipFlags, Flag_FlippedAntiDiagonal) == 1.0)\n    {\n        float x = offsetInTileFlipped.x;\n        offsetInTileFlipped.x = offsetInTileFlipped.y;\n        offsetInTileFlipped.y = x;\n    }\n\n    vec4 color = getColor(imgIndex, tileCoord + offsetInTileFlipped);\n\n    gl_FragColor = vec4(color.rgb, color.a * uAlpha);\n}\n";

    var imagelayerVS = "precision highp float;\n\nattribute vec2 aPosition;\nattribute vec2 aTexture;\n\nuniform float uInverseTileScale;\n\nuniform vec2 uOffset;\nuniform vec2 uSize;\nuniform vec2 uViewportSize;\n// uniform mat3 uProjection;\n\nvarying vec2 vTextureCoord;\n\nvoid main()\n{\n    // squash from [-1, 1] to [0, 1]\n    vec2 position = aPosition;\n    position += 1.0;\n    position /= 2.0;\n\n    // round offset to the nearest multiple of the inverse scale\n    // this essentially clamps offset to whole \"pixels\"\n    vec2 offset = uOffset + (uInverseTileScale / 2.0);\n    offset -= mod(offset, uInverseTileScale);\n\n    // modify offset by viewport & size\n    offset.x -= uViewportSize.x / 2.0;\n    offset.y += (uViewportSize.y / 2.0) - uSize.y;\n\n    // calculate this vertex position based on image size and offset\n    position *= uSize;\n    position += offset;\n\n    // project to clip space\n    position *= (2.0 / uViewportSize);\n\n    vTextureCoord = aTexture;\n    gl_Position = vec4(position, 0.0, 1.0);\n}\n";

    var imagelayerFS = "precision mediump float;\n\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform float uAlpha;\nuniform vec4 uTransparentColor;\n\nvoid main()\n{\n    vec4 color = texture2D(uSampler, vTextureCoord);\n\n    if (uTransparentColor.a == 1.0 && uTransparentColor.rgb == color.rgb)\n        discard;\n\n    gl_FragColor = vec4(color.rgb, color.a * uAlpha);\n}\n";

    var GLTilemap = /** @class */ (function () {
        function GLTilemap(desc, options) {
            if (options === void 0) { options = {}; }
            this.desc = desc;
            this.gl = null;
            this.shaders = null;
            this.assetCache = undefined;
            this._layers = [];
            this._tilesets = [];
            this._viewportSize = new Float32Array(2);
            this._scaledViewportSize = new Float32Array(2);
            this._inverseLayerTileSize = new Float32Array(2);
            this._quadVerts = new Float32Array([
                //x  y  u  v
                -1, -1, 0, 1,
                1, -1, 1, 1,
                1, 1, 1, 0,
                -1, -1, 0, 1,
                1, 1, 1, 0,
                -1, 1, 0, 0,
            ]);
            this._quadVertBuffer = null;
            this._firstTilelayerUniformUpload = true;
            this._tileScale = 1;
            this._totalTilesetImages = 0;
            if (options.assetCache)
                this.assetCache = options.assetCache;
            this.renderBackgroundColor = typeof options.renderBackgroundColor === 'boolean' ? options.renderBackgroundColor : true;
            this.blendMode = {
                func: options.blendMode && options.blendMode.func || [WebGLRenderingContext.SRC_ALPHA, WebGLRenderingContext.ONE_MINUS_SRC_ALPHA],
                equation: options.blendMode && options.blendMode.equation || WebGLRenderingContext.FUNC_ADD,
            };
            this._inverseLayerTileSize[0] = 1 / desc.tilewidth;
            this._inverseLayerTileSize[1] = 1 / desc.tileheight;
            for (var i = 0; i < desc.tilesets.length; ++i) {
                var tileset = new GLTileset(desc.tilesets[i], this.assetCache);
                this._totalTilesetImages += tileset.images.length;
                this._tilesets.push(tileset);
            }
            this._createInitialLayers(desc.layers, options);
            // parse the background color
            this._backgroundColor = new Float32Array(4);
            if (desc.backgroundcolor)
                parseColorStr(desc.backgroundcolor, this._backgroundColor);
            // setup the different buffers
            this._tilesetIndices = new Int32Array(this._totalTilesetImages);
            this._tilesetTileSizeBuffer = new Float32Array(this._totalTilesetImages * 2);
            this._tilesetTileOffsetBuffer = new Float32Array(this._totalTilesetImages * 2);
            this._inverseTilesetTextureSizeBuffer = new Float32Array(this._totalTilesetImages * 2);
            this._buildBufferData();
            if (options.gl) {
                this.glInitialize(options.gl);
            }
        }
        Object.defineProperty(GLTilemap.prototype, "layers", {
            get: function () {
                return this._layers;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTilemap.prototype, "tilesets", {
            get: function () {
                return this._tilesets;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTilemap.prototype, "viewportWidth", {
            get: function () {
                return this._viewportSize[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTilemap.prototype, "viewportHeight", {
            get: function () {
                return this._viewportSize[1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTilemap.prototype, "scaledViewportWidth", {
            get: function () {
                return this._scaledViewportSize[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTilemap.prototype, "scaledViewportHeight", {
            get: function () {
                return this._scaledViewportSize[1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTilemap.prototype, "repeatTiles", {
            set: function (v) {
                for (var i = 0; i < this._layers.length; ++i) {
                    var layer = this._layers[i];
                    if (layer.type === exports.ELayerType.Tilelayer) {
                        layer.repeatTiles = false;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GLTilemap.prototype, "tileScale", {
            get: function () {
                return this._tileScale;
            },
            set: function (scale) {
                if (this._tileScale != scale) {
                    this._tileScale = scale;
                    this._updateViewportSize();
                }
            },
            enumerable: true,
            configurable: true
        });
        GLTilemap.prototype.resizeViewport = function (width, height) {
            if (this._viewportSize[0] != width || this._viewportSize[1] != height) {
                this._viewportSize[0] = width;
                this._viewportSize[1] = height;
                this._updateViewportSize();
            }
        };
        GLTilemap.prototype.glInitialize = function (gl) {
            this.glTerminate();
            this.gl = gl;
            this._firstTilelayerUniformUpload = true;
            // initialize layers
            for (var i = 0; i < this._layers.length; ++i) {
                this._layers[i].glInitialize(gl);
            }
            // initialize tilesets
            for (var i = 0; i < this._tilesets.length; ++i) {
                this._tilesets[i].glInitialize(gl);
            }
            // create buffers
            this._quadVertBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._quadVerts, gl.STATIC_DRAW);
            // create shaders
            this._createShaders();
            // update viewport uniforms
            this._updateViewportSize();
        };
        GLTilemap.prototype.glTerminate = function () {
            if (!this.gl)
                return;
            var gl = this.gl;
            // destroy layers
            for (var i = 0; i < this._layers.length; ++i) {
                this._layers[i].glTerminate();
            }
            // destroy tilesets
            for (var i = 0; i < this._tilesets.length; ++i) {
                this._tilesets[i].glTerminate();
            }
            // destroy buffers
            if (this._quadVertBuffer) {
                gl.deleteBuffer(this._quadVertBuffer);
                this._quadVertBuffer = null;
            }
            // destroy shaders
            for (var k in this.shaders) {
                if (!hasOwnKey(this.shaders, k))
                    continue;
                var shader = this.shaders[k];
                gl.deleteProgram(shader.program);
            }
            this.shaders = null;
            this.gl = null;
        };
        /**
         * Updates each layer's animations by the given delta time.
         *
         * @param dt Delta time in milliseconds to perform an update for.
         */
        GLTilemap.prototype.update = function (dt) {
            for (var i = 0; i < this.layers.length; ++i) {
                var layer = this._layers[i];
                if (layer.type === exports.ELayerType.Tilelayer)
                    layer.update(dt);
            }
        };
        /**
         * Draws the tilemap.
         *
         * @param x The x offset at which to draw the map
         * @param y The y offset at which to draw the map
         */
        GLTilemap.prototype.draw = function (x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (!this.gl || !this.shaders)
                return;
            var gl = this.gl;
            gl.enable(gl.BLEND);
            gl.blendEquation(this.blendMode.equation);
            if (this.blendMode.func.length > 2) {
                gl.blendFuncSeparate(this.blendMode.func[0], this.blendMode.func[1], this.blendMode.func[2], this.blendMode.func[3]);
            }
            else {
                gl.blendFunc(this.blendMode.func[0], this.blendMode.func[1]);
            }
            // Enable attributes, these are the same for all shaders.
            gl.bindBuffer(gl.ARRAY_BUFFER, this._quadVertBuffer);
            gl.enableVertexAttribArray(GLTilemap._attribIndices.aPosition);
            gl.enableVertexAttribArray(GLTilemap._attribIndices.aTexture);
            gl.vertexAttribPointer(GLTilemap._attribIndices.aPosition, 2, gl.FLOAT, false, 16, 0);
            gl.vertexAttribPointer(GLTilemap._attribIndices.aTexture, 2, gl.FLOAT, false, 16, 8);
            // Draw background
            if (this.renderBackgroundColor && this._backgroundColor[3] > 0) {
                var bgShader = this.shaders.background;
                gl.useProgram(bgShader.program);
                gl.uniform4fv(bgShader.uniforms.uColor, this._backgroundColor);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
            // Bind tileset textures
            var imgIndex = 0;
            for (var i = 0; i < this._tilesets.length; ++i) {
                var tileset = this._tilesets[i];
                for (var t = 0; t < tileset.textures.length; ++t) {
                    this.gl.activeTexture(gl.TEXTURE1 + imgIndex);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, tileset.textures[t]);
                    imgIndex++;
                }
            }
            // Draw each layer of the map
            gl.activeTexture(gl.TEXTURE0);
            var lastShader = exports.ELayerType.UNKNOWN;
            var activeShader = null;
            for (var i = 0; i < this._layers.length; ++i) {
                var layer = this._layers[i];
                var offsetx = layer.desc.offsetx || 0;
                var offsety = layer.desc.offsety || 0;
                if (!layer.desc.visible)
                    continue;
                if (lastShader != layer.type) {
                    activeShader = this._bindShader(layer);
                    lastShader = layer.type;
                }
                if (!activeShader)
                    continue;
                switch (layer.type) {
                    case exports.ELayerType.Tilelayer:
                        layer.uploadUniforms(activeShader);
                        gl.uniform2f(activeShader.uniforms.uOffset, -offsetx + (x * layer.scrollScaleX), -offsety + (y * layer.scrollScaleY));
                        break;
                    case exports.ELayerType.Imagelayer:
                        layer.uploadUniforms(activeShader);
                        gl.uniform2f(activeShader.uniforms.uOffset, offsetx + (-x * layer.scrollScaleX), -offsety + (y * layer.scrollScaleY));
                        break;
                    // case ELayerType.Objectgroup:
                    //     break;
                    default:
                        assertNever(layer);
                }
                // if (layer.type !== ELayerType.Objectgroup)
                {
                    gl.bindTexture(gl.TEXTURE_2D, layer.texture);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                }
            }
        };
        GLTilemap.prototype.findLayerDesc = function () {
            var name = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                name[_i] = arguments[_i];
            }
            return this._doFindLayerDesc(this.desc.layers, name, 0);
        };
        GLTilemap.prototype.createLayer = function () {
            var name = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                name[_i] = arguments[_i];
            }
            if (name.length === 0)
                return false;
            var layerDesc = this._doFindLayerDesc(this.desc.layers, name, 0);
            if (!layerDesc)
                return false;
            this.createLayerFromDesc(layerDesc);
            return true;
        };
        GLTilemap.prototype.destroyLayer = function () {
            var name = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                name[_i] = arguments[_i];
            }
            if (name.length === 0)
                return false;
            var layerDesc = this._doFindLayerDesc(this.desc.layers, name, 0);
            if (!layerDesc)
                return false;
            return this.destroyLayerFromDesc(layerDesc);
        };
        GLTilemap.prototype.createLayerFromDesc = function (layer) {
            var newLayer = null;
            switch (layer.type) {
                case 'tilelayer':
                    newLayer = new GLTilelayer(layer, this.tilesets);
                    break;
                case 'objectgroup':
                    // newLayer = new GLObjectgroup(layer);
                    break;
                case 'imagelayer':
                    newLayer = new GLImagelayer(layer, this.assetCache);
                    break;
                case 'group':
                    for (var i = 0; i < layer.layers.length; ++i) {
                        this.createLayerFromDesc(layer.layers[i]);
                    }
                    break;
                default:
                    return assertNever(layer);
            }
            if (newLayer) {
                this._layers.push(newLayer);
                if (this.gl)
                    newLayer.glInitialize(this.gl);
            }
        };
        GLTilemap.prototype.destroyLayerFromDesc = function (layerDesc) {
            for (var i = 0; i < this._layers.length; ++i) {
                var layer = this._layers[i];
                if (layer.desc === layerDesc) {
                    layer.glTerminate();
                    this._layers.splice(1, 1);
                    return true;
                }
            }
            return false;
        };
        GLTilemap.prototype._doFindLayerDesc = function (layers, names, nameIndex) {
            for (var i = 0; i < layers.length; ++i) {
                var layer = layers[i];
                if (layer.name === names[nameIndex]) {
                    if (layer.type === 'group') {
                        // more names, so try something in this group
                        if (names.length < nameIndex + 1) {
                            return this._doFindLayerDesc(layer.layers, names, ++nameIndex);
                        }
                        // No more names, return the group.
                        else {
                            return layer;
                        }
                    }
                    else {
                        return layer;
                    }
                }
            }
            return null;
        };
        GLTilemap.prototype._bindShader = function (layer) {
            var gl = this.gl;
            switch (layer.type) {
                case exports.ELayerType.Tilelayer:
                    {
                        var tileShader = this.shaders.tilelayer;
                        gl.useProgram(tileShader.program);
                        // these are static, and only need to be uploaded once.
                        if (this._firstTilelayerUniformUpload) {
                            this._firstTilelayerUniformUpload = false;
                            gl.uniform1i(tileShader.uniforms.uLayer, 0);
                            gl.uniform2fv(tileShader.uniforms.uInverseLayerTileSize, this._inverseLayerTileSize);
                            gl.uniform1iv(tileShader.uniforms.uTilesets, this._tilesetIndices);
                            gl.uniform2fv(tileShader.uniforms.uTilesetTileSize, this._tilesetTileSizeBuffer);
                            gl.uniform2fv(tileShader.uniforms.uTilesetTileOffset, this._tilesetTileOffsetBuffer);
                            gl.uniform2fv(tileShader.uniforms.uInverseTilesetTextureSize, this._inverseTilesetTextureSizeBuffer);
                        }
                        return tileShader;
                    }
                case exports.ELayerType.Imagelayer:
                    {
                        var imageShader = this.shaders.imagelayer;
                        gl.useProgram(imageShader.program);
                        return imageShader;
                    }
                // case ELayerType.Objectgroup:
                //     return ;
                default:
                    return assertNever(layer);
            }
        };
        GLTilemap.prototype._updateViewportSize = function () {
            if (!this.gl || !this.shaders)
                return;
            this._scaledViewportSize[0] = this._viewportSize[0] / this._tileScale;
            this._scaledViewportSize[1] = this._viewportSize[1] / this._tileScale;
            var gl = this.gl;
            var tileShader = this.shaders.tilelayer;
            gl.useProgram(tileShader.program);
            gl.uniform2fv(tileShader.uniforms.uViewportSize, this._scaledViewportSize);
            gl.uniform1f(tileShader.uniforms.uInverseTileScale, 1.0 / this._tileScale);
            var imageShader = this.shaders.imagelayer;
            gl.useProgram(imageShader.program);
            gl.uniform2fv(imageShader.uniforms.uViewportSize, this._scaledViewportSize);
            gl.uniform1f(imageShader.uniforms.uInverseTileScale, 1.0 / this._tileScale);
        };
        GLTilemap.prototype._buildBufferData = function () {
            // Index buffer
            for (var i = 0; i < this._tilesetIndices.length; ++i)
                this._tilesetIndices[i] = i + 1;
            // tileset size buffers
            var imgIndex = 0;
            for (var i = 0; i < this._tilesets.length; ++i) {
                var tileset = this._tilesets[i];
                for (var s = 0; s < tileset.images.length; ++s) {
                    this._tilesetTileSizeBuffer[(imgIndex * 2)] = tileset.desc.tilewidth;
                    this._tilesetTileSizeBuffer[(imgIndex * 2) + 1] = tileset.desc.tileheight;
                    this._tilesetTileOffsetBuffer[(imgIndex * 2)] = tileset.desc.spacing;
                    this._tilesetTileOffsetBuffer[(imgIndex * 2) + 1] = tileset.desc.margin;
                    var imgDesc = tileset.desc.tiles && tileset.desc.tiles[s];
                    var imgWidth = imgDesc && imgDesc.imagewidth ? imgDesc.imagewidth : tileset.desc.imagewidth;
                    var imgHeight = imgDesc && imgDesc.imageheight ? imgDesc.imageheight : tileset.desc.imageheight;
                    this._inverseTilesetTextureSizeBuffer[(imgIndex * 2)] = 1 / imgWidth;
                    this._inverseTilesetTextureSizeBuffer[(imgIndex * 2) + 1] = 1 / imgHeight;
                    imgIndex++;
                }
            }
        };
        GLTilemap.prototype._createInitialLayers = function (layers, options) {
            var createTilelayers = typeof options.createAllTilelayers === 'boolean' ? options.createAllTilelayers : true;
            var createImagelayers = typeof options.createAllImagelayers === 'boolean' ? options.createAllImagelayers : true;
            // const createObjectgroups = typeof options.createAllObjectgroups === 'boolean' ? options.createAllObjectgroups : false;
            // We don't create anything, early out.
            if (!createTilelayers && !createImagelayers /*&& !createObjectgroups*/)
                return;
            for (var i = 0; i < layers.length; ++i) {
                var layer = layers[i];
                if ((layer.type === 'tilelayer' && createTilelayers)
                    // || (layer.type === 'objectgroup' && createObjectgroups)
                    || (layer.type === 'imagelayer' && createImagelayers)) {
                    this.createLayerFromDesc(layer);
                }
                else if (layer.type === 'group') {
                    this._createInitialLayers(layer.layers, options);
                }
            }
        };
        GLTilemap.prototype._createShaders = function () {
            var tilelayerFragShader = tilelayerFS
                .replace('#pragma define(NUM_TILESETS)', "#define NUM_TILESETS " + this._tilesets.length)
                .replace('#pragma define(NUM_TILESET_IMAGES)', "#define NUM_TILESET_IMAGES " + this._totalTilesetImages);
            var gl = this.gl;
            this.shaders = {
                background: new GLProgram(gl, backgroundVS, backgroundFS, GLTilemap._attribIndices),
                tilelayer: new GLProgram(gl, tilelayerVS, tilelayerFragShader, GLTilemap._attribIndices),
                imagelayer: new GLProgram(gl, imagelayerVS, imagelayerFS, GLTilemap._attribIndices),
            };
        };
        GLTilemap._attribIndices = {
            aPosition: 0,
            aTexture: 1,
        };
        return GLTilemap;
    }());

    exports.GLImagelayer = GLImagelayer;
    exports.GLTilelayer = GLTilelayer;
    exports.GLTilemap = GLTilemap;
    exports.GLTileset = GLTileset;
    exports.GLProgram = GLProgram;
    exports.parseColorStr = parseColorStr;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
