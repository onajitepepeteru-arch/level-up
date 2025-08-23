#!/bin/bash

# Leveling-Up Fitness App - Production Package Creation Script

echo "🚀 Creating Leveling-Up Fitness App Production Package..."

# Create temporary directory for packaging
PACKAGE_DIR="leveling-up-fitness-app"
mkdir -p $PACKAGE_DIR

# Copy backend files
echo "📦 Packaging backend..."
mkdir -p $PACKAGE_DIR/backend
cp -r backend/* $PACKAGE_DIR/backend/
# Remove any cache or unnecessary files
find $PACKAGE_DIR/backend -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find $PACKAGE_DIR/backend -name "*.pyc" -delete 2>/dev/null || true

# Copy frontend files
echo "📦 Packaging frontend..."
mkdir -p $PACKAGE_DIR/frontend
cp -r frontend/* $PACKAGE_DIR/frontend/
# Remove node_modules if it exists (will be reinstalled)
rm -rf $PACKAGE_DIR/frontend/node_modules 2>/dev/null || true
# Remove build folder (will be created during deployment)
rm -rf $PACKAGE_DIR/frontend/build 2>/dev/null || true

# Copy CI workflows and dependabot
echo "🧪 Adding CI workflows..."
mkdir -p $PACKAGE_DIR/.github/workflows
cp -r .github/workflows/*.yml $PACKAGE_DIR/.github/workflows/ 2>/dev/null || true
mkdir -p $PACKAGE_DIR/.github
cp -r .github/dependabot.yml $PACKAGE_DIR/.github/ 2>/dev/null || true

# Copy documentation
echo "📚 Adding documentation..."
cp README.md $PACKAGE_DIR/
cp SETUP_GUIDE.md $PACKAGE_DIR/
cp DATABASE_ACCESS.md $PACKAGE_DIR/
cp DEPLOYMENT_INSTRUCTIONS.md $PACKAGE_DIR/
cp API_DOCUMENTATION.md $PACKAGE_DIR/
cp FINAL_SUMMARY.md $PACKAGE_DIR/
cp PRODUCTION_SUMMARY.md $PACKAGE_DIR/

# Create env samples (no secrets)
echo "🧩 Adding .env.sample files..."
mkdir -p $PACKAGE_DIR/frontend
mkdir -p $PACKAGE_DIR/backend
cat > $PACKAGE_DIR/frontend/.env.sample << 'EOF'
# Frontend env
REACT_APP_BACKEND_URL=https://your-backend-domain.com
EOF
cat > $PACKAGE_DIR/backend/.env.sample << 'EOF'
# Backend env
# Replace with your real Mongo connection string (do not commit secrets)
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
EOF

# Create startup scripts
echo "🔧 Creating startup scripts..."

# Backend startup script
cat > $PACKAGE_DIR/start_backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Leveling-Up Backend..."
cd backend
pip install -r requirements.txt
python server.py
EOF

# Frontend startup script  
cat > $PACKAGE_DIR/start_frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Leveling-Up Frontend..."
cd frontend
yarn install
yarn start
EOF

# Make startup scripts executable
chmod +x $PACKAGE_DIR/start_backend.sh
chmod +x $PACKAGE_DIR/start_frontend.sh

# Create production deployment script
cat > $PACKAGE_DIR/deploy_production.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying Leveling-Up to Production..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies and build
echo "📦 Building frontend for production..."
cd frontend
yarn install
yarn build
cd ..

echo "✅ Production build complete!"
echo "📋 Next steps:"
echo "1. Deploy backend to your server (Heroku, AWS, etc.)"
echo "2. Deploy frontend build folder to hosting (Vercel, Netlify, etc.)"
echo "3. Update environment variables with your production URLs"
echo "4. Configure your database connection"
echo "5. Launch! 🚀"
EOF

chmod +x $PACKAGE_DIR/deploy_production.sh

# Create package info file
cat > $PACKAGE_DIR/PACKAGE_INFO.md << 'EOF'
# 📦 Leveling-Up Fitness App - Production Package

## 🚀 Quick Start

### Development
```bash
# Start backend
./start_backend.sh

# Start frontend (in new terminal)
./start_frontend.sh
```

### Production
```bash
# Build for production
./deploy_production.sh
```

## 📁 Package Contents

- `backend/` - Complete FastAPI backend
- `frontend/` - Complete React frontend  
- `.github/` - GitHub Actions CI and Dependabot  
- `*.md` - Comprehensive documentation
- `start_*.sh` - Development startup scripts
- `deploy_production.sh` - Production build script

## 🔑 Default Credentials

- **Admin Email**: admin@levelingup.com
- **Admin Password**: Admin@LevelingUp2025
- **Database**: levelingup_production

## 📞 Support

All documentation included. Ready for immediate deployment!

**Your fitness app empire starts here!** 💪
EOF

# Create archive
echo "📦 Creating downloadable archive..."
tar -czf leveling-up-fitness-app.tar.gz $PACKAGE_DIR

echo "✅ Package created successfully!"
echo "📦 File: leveling-up-fitness-app.tar.gz"
echo "📋 Size: $(du -h leveling-up-fitness-app.tar.gz | cut -f1)"
echo ""
echo "🎉 Your Leveling-Up Fitness App is ready for deployment!"
echo "Extract the archive and follow the instructions in DEPLOYMENT_INSTRUCTIONS.md"

# Clean up temporary directory
rm -rf $PACKAGE_DIR

echo "🚀 Ready to launch your fitness empire!"