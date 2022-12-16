import { defineConfig } from 'cypress';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';
import badeballPreprocessor from '@badeball/cypress-cucumber-preprocessor';

const { addCucumberPreprocessorPlugin } = badeballPreprocessor;

async function setupNodeEvents(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
    await addCucumberPreprocessorPlugin(on, config);

    on(
        'file:preprocessor',
        createBundler({
            plugins: [createEsbuildPlugin(config)],
            preserveSymlinks: true
        })
    );

    // Make sure to return the config object as it might have been modified by the plugin.
    return config;
}

export default defineConfig({
    projectId: 'wkwqqh',
    e2e: {
        baseUrl: 'http://localhost:9000',
        defaultCommandTimeout: 10_000,
        specPattern: '**/*.feature',
        watchForFileChanges: true,
        setupNodeEvents
    }
});
