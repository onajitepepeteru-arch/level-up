#!/bin/bash

# Create a downloadable package of the LevelUp app

echo "Creating LevelUp Fitness App download package..."

# Create temp directory for package
PACKAGE_DIR="levelup-app-package"
rm -rf $PACKAGE_DIR
mkdir -p $PACKAGE_DIR

# Copy backend
echo "Copying backend..."
mkdir -p $PACKAGE_DIR/backend
cp -r backend/routes $PACKAGE_DIR/backend/
cp -r backend/lib $PACKAGE_DIR/backend/
cp -r backend/middleware $PACKAGE_DIR/backend/
cp backend/package.json $PACKAGE_DIR/backend/
cp backend/server.js $PACKAGE_DIR/backend/
cp backend/.env $PACKAGE_DIR/backend/.env.example

# Copy frontend
echo "Copying frontend..."
mkdir -p $PACKAGE_DIR/frontend
cp -r frontend/src $PACKAGE_DIR/frontend/
cp -r frontend/public $PACKAGE_DIR/frontend/
cp frontend/package.json $PACKAGE_DIR/frontend/
cp frontend/craco.config.js $PACKAGE_DIR/frontend/
cp frontend/tailwind.config.js $PACKAGE_DIR/frontend/
cp frontend/postcss.config.js $PACKAGE_DIR/frontend/
cp frontend/jsconfig.json $PACKAGE_DIR/frontend/
cp frontend/components.json $PACKAGE_DIR/frontend/
cp frontend/.env $PACKAGE_DIR/frontend/.env.example

# Copy root files
echo "Copying root files..."
cp package.json $PACKAGE_DIR/
cp SETUP_README.md $PACKAGE_DIR/README.md
cp .gitignore $PACKAGE_DIR/ 2>/dev/null || true

# Create installation instructions
cat > $PACKAGE_DIR/INSTALL.txt << 'EOF'
LevelUp Fitness App - Installation Instructions
================================================

QUICK START:
1. Rename .env.example to .env in both backend and frontend folders
2. Add your API keys to the .env files
3. Run: npm run install-all
4. Run: npm run dev
5. Open http://localhost:3000

DETAILED SETUP:
See README.md for complete setup instructions including:
- Supabase configuration
- Stripe payment setup
- OAuth provider setup
- OpenAI API configuration

REQUIREMENTS:
- Node.js 18+
- Supabase account
- Stripe account (test mode)
- OpenAI API key (optional)

For support, see README.md troubleshooting section.
EOF

# Create ZIP package
echo "Creating ZIP archive..."
zip -r levelup-app-complete.zip $PACKAGE_DIR/ -q

# Clean up temp directory
rm -rf $PACKAGE_DIR

echo "✅ Package created: levelup-app-complete.zip"
echo "📦 Size: $(du -h levelup-app-complete.zip | cut -f1)"
echo ""
echo "Download package is ready!"
