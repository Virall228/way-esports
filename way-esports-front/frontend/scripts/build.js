const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}🚀 Starting WAY Esports Mini App build process...${colors.reset}\n`);

try {
    // Step 1: Clean previous build
    console.log(`${colors.yellow}📦 Cleaning previous build...${colors.reset}`);
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true });
    }
    console.log(`${colors.green}✓ Previous build cleaned${colors.reset}\n`);

    // Step 2: Type checking
    console.log(`${colors.yellow}🔍 Running type check...${colors.reset}`);
    execSync('npm run type-check', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Type check passed${colors.reset}\n`);

    // Step 3: Linting
    console.log(`${colors.yellow}🔍 Running linter...${colors.reset}`);
    execSync('npm run lint', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Linting passed${colors.reset}\n`);

    // Step 4: Building
    console.log(`${colors.yellow}🏗️  Building production bundle...${colors.reset}`);
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`${colors.green}✓ Production bundle built${colors.reset}\n`);

    // Step 5: Verify build
    console.log(`${colors.yellow}🔍 Verifying build...${colors.reset}`);
    if (!fs.existsSync('dist') || !fs.existsSync('dist/index.html')) {
        throw new Error('Build verification failed: dist directory or index.html not found');
    }
    console.log(`${colors.green}✓ Build verified${colors.reset}\n`);

    // Step 6: Create version file
    const packageJson = require('../package.json');
    const versionInfo = {
        version: packageJson.version,
        buildTime: new Date().toISOString(),
        name: packageJson.name,
    };
    fs.writeFileSync('dist/version.json', JSON.stringify(versionInfo, null, 2));
    console.log(`${colors.green}✓ Version file created${colors.reset}\n`);

    console.log(`${colors.bright}${colors.green}✅ Build completed successfully!${colors.reset}\n`);
    console.log(`${colors.cyan}Next steps:${colors.reset}`);
    console.log(`1. Deploy the contents of the ${colors.bright}dist${colors.reset} directory to your hosting service`);
    console.log(`2. Configure your Telegram Bot with the hosted URL`);
    console.log(`3. Test your Mini App in Telegram\n`);

} catch (error) {
    console.error(`${colors.red}❌ Build failed:${colors.reset}`, error);
    process.exit(1);
} 