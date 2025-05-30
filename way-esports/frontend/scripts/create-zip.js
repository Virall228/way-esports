const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}📦 Preparing WAY Esports Mini App for distribution...${colors.reset}\n`);

try {
    // Step 1: Clean and build
    console.log(`${colors.yellow}🧹 Cleaning previous builds...${colors.reset}`);
    execSync('npm run clean', { stdio: 'inherit' });
    
    console.log(`${colors.yellow}🏗️  Building production bundle...${colors.reset}`);
    execSync('npm run build:prod', { stdio: 'inherit' });

    // Step 2: Create dist-zip directory if it doesn't exist
    const zipDir = path.join(__dirname, '../dist-zip');
    if (!fs.existsSync(zipDir)) {
        fs.mkdirSync(zipDir);
    }

    // Step 3: Create ZIP file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipPath = path.join(zipDir, `way-esports-mini-app-${timestamp}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
        console.log(`${colors.green}✅ Successfully created: ${colors.bright}${zipPath}${colors.reset}`);
        console.log(`${colors.cyan}📊 Total size: ${colors.bright}${(archive.pointer() / 1024 / 1024).toFixed(2)} MB${colors.reset}\n`);
        
        console.log(`${colors.bright}Next steps:${colors.reset}`);
        console.log(`1. Upload the ZIP file to your hosting service`);
        console.log(`2. Extract the contents to your web server`);
        console.log(`3. Configure your Telegram Bot with the hosted URL`);
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    // Add dist folder to zip
    archive.directory(path.join(__dirname, '../dist'), false);

    // Add important files
    const filesToInclude = [
        'README.md',
        'package.json',
        'package-lock.json',
        '.env.production'
    ];

    filesToInclude.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: file });
        }
    });

    // Add version info
    const packageJson = require('../package.json');
    const versionInfo = {
        name: packageJson.name,
        version: packageJson.version,
        buildDate: new Date().toISOString(),
        node: process.version,
        npm: execSync('npm -v').toString().trim()
    };

    archive.append(JSON.stringify(versionInfo, null, 2), { name: 'version.json' });

    archive.finalize();

} catch (error) {
    console.error(`${colors.red}❌ Error creating ZIP:${colors.reset}`, error);
    process.exit(1);
} 