declare module '@vue/preload-webpack-plugin' {
    import type { WebpackPluginInstance } from 'webpack';

    interface Options {
        rel: 'prefetch' | 'preload';
        as: 'script' | 'style' | 'font' | 'image' | ((entry: string) => string);
        include: 'initial' | 'all' | 'allAssets' | 'asyncChunks' | string[];
        fileWhitelist: RegExp[];
        fileBlacklist: RegExp[];
    }

    const plugin: new (options: Partial<Options>) => WebpackPluginInstance;
    export default plugin;
}
