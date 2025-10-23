const fs = require('fs');
const path = require('path');

/**
 * Build script to inject environment variables from .env file into the Figma plugin
 * This runs during the build process to make env vars available to the plugin
 */

function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envPath)) {
        console.log('No .env file found, using default values');
        return {
            FIGMA_TOKEN: '',
            FIGMA_FILE_KEY: 'KkqX7OKAggFzvfB0CMUwBz',
            FIGMA_API_BASE_URL: 'https://api.figma.com/v1'
        };
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });

    return {
        FIGMA_TOKEN: envVars.FIGMA_TOKEN || '',
        FIGMA_FILE_KEY: envVars.FIGMA_FILE_KEY || 'KkqX7OKAggFzvfB0CMUwBz',
        FIGMA_API_BASE_URL: envVars.FIGMA_API_BASE_URL || 'https://api.figma.com/v1'
    };
}

function injectEnvIntoUI() {
    const envVars = loadEnvFile();
    const uiPath = path.join(__dirname, 'ui.html');
    
    if (!fs.existsSync(uiPath)) {
        console.error('ui.html not found');
        return;
    }

    let uiContent = fs.readFileSync(uiPath, 'utf8');
    
    // Replace the hardcoded envConfig with actual env values
    const envConfigReplacement = `const envConfig = {
            figmaToken: '${envVars.FIGMA_TOKEN}',
            fileKey: '${envVars.FIGMA_FILE_KEY}',
            baseUrl: '${envVars.FIGMA_API_BASE_URL}'
        };`;

    // Find and replace the envConfig section
    const envConfigRegex = /const envConfig = \{[\s\S]*?\};/;
    if (envConfigRegex.test(uiContent)) {
        uiContent = uiContent.replace(envConfigRegex, envConfigReplacement);
        console.log('✅ Environment variables injected into ui.html');
    } else {
        console.warn('⚠️ Could not find envConfig section in ui.html');
    }

    fs.writeFileSync(uiPath, uiContent);
    console.log('📝 Updated ui.html with environment variables');
}

// Run the injection
injectEnvIntoUI();
