# Quick Start Guide - EPiC Structural Dashboard

## TL;DR - Just Want to Build?

```bash
# 1. Install dependencies (if not done yet)
npm install

# 2. Build for production
npm run build

# 3. Check the output
ls -lh dist/

# Done! Your build is in the /dist folder
```

## Development Workflow

```bash
# Start development server
npm run dev
# → http://localhost:5175

# Build for production
npm run build
# → Creates /dist folder

# Preview production build
npm run preview
# → http://localhost:4175
```

## All Available Commands

```bash
# Development
npm run dev              # Start dev server (fast, no type checking)

# Building
npm run build           # Production build (recommended)
npm run build:check     # Build with TypeScript type checking
npm run build:staging   # Build for staging environment
npm run build:production # Build for production environment
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run type-check      # Run TypeScript type checker

# Testing
npm test                # Run tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Generate coverage report
```

## Project Structure

```
EPiC-Structrual/
├── src/              # Frontend source (React + TypeScript)
├── backend/          # Backend source (Python Flask)
├── public/           # Static assets
├── dist/            # Build output (created by npm run build)
└── node_modules/    # Dependencies
```

## TypeScript Configuration

This project uses **loose TypeScript** (`strict: false`):
- Type errors are warnings, not blockers
- Build works even with type errors
- Gradually add types over time

## Backend Setup (Flask API)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python flask_regression_api.py
```

## Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Port Already in Use
```bash
# Kill existing processes
pkill -f vite
npm run dev
```

### Type Errors
```bash
# See all type errors (optional - won't block build)
npm run type-check
```

## What Changed After Reorganization

- ✅ Frontend moved from `rephrame-react-dashboard/` to root
- ✅ Backend moved to `backend/` folder
- ✅ Build command simplified (no type checking by default)
- ✅ Added @types/node for process.env support
- ⚠️ Old folders can be deleted: `rephrame-react-dashboard/`, `build/`

## Next Steps

1. Run `npm install` if you haven't
2. Run `npm run build` to test production build
3. Check `/dist` folder for build output
4. (Optional) Run `npm run dev` to test dev server
5. (Optional) Clean up old folders

## Need Help?

- **Build issues**: See `BUILD_STATUS.md`
- **Project info**: See `CLAUDE.md`
- **Migration notes**: See `MIGRATION.md`
- **General info**: See `README.md`
