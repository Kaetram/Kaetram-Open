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
    (global = global || self, factory((global.glTiled = global.glTiled || {}, global.glTiled['resource-loader'] = {})));
}(this, function (exports) { 'use strict';

    /// <reference path="./resource-loader.d.ts" />
    /**
     * Creates the tiled loader middleware function and returns it.
     *
     * @example
     * var loader = new Loader();
     *
     * // add this middleware so that any map files we load will also have all their sub resources
     * // loaded too.
     * loader.use(glTiled['resource-loader'].tiledMiddlewareFactory());
     * loader.add('lightworld', 'maps/lttp/lightworld/lightworld.json');
     * loader.load(function ()
     * {
     *      // create the tilemap using the loaded map data (`resources.lightworld.data`) and passing
     *      // all resources as the third parameter which is the resource cache the Tilemap object
     *      // will search for map resources in before trying to load them itself.
     *      var tilemap = new glTiled.Tilemap(gl, loader.resources.lightworld.data, loader.resources);
     * })
     */
    function tiledMiddlewareFactory() {
        return function tiledMiddleware(resource, next) {
            if (!resource.data
                || resource.type !== Loader.Resource.TYPE.JSON
                || !resource.data.layers
                || !resource.data.tilesets) {
                next();
                return;
            }
            var loadOptions = {
                crossOrigin: resource.crossOrigin,
                loadType: Loader.Resource.LOAD_TYPE.IMAGE,
                metadata: resource.metadata.imageMetadata,
                parentResource: resource,
            };
            var urlDir = resource.url.replace(this.baseUrl, '');
            urlDir = urlDir.substr(0, urlDir.lastIndexOf('/')) + '/';
            for (var i = 0; i < resource.data.tilesets.length; ++i) {
                var tileset = resource.data.tilesets[i];
                if (tileset.image) {
                    if (!this.resources[tileset.image]) {
                        this.add(tileset.image, urlDir + tileset.image, loadOptions);
                    }
                }
                if (resource.data.tiles) {
                    for (var key in resource.data.tiles) {
                        var tile = resource.data.tiles[key];
                        if (tile.image && !this.resources[tile.image]) {
                            this.add(tile.image, urlDir + tile.image, loadOptions);
                        }
                    }
                }
            }
            for (var i = 0; i < resource.data.layers.length; ++i) {
                var layer = resource.data.layers[i];
                if (layer.image) {
                    if (!this.resources[layer.image]) {
                        this.add(layer.image, urlDir + layer.image, loadOptions);
                    }
                }
            }
            next();
        };
    }

    exports.tiledMiddlewareFactory = tiledMiddlewareFactory;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
