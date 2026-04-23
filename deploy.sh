#!/bin/bash
set -e

echo "🚀 Deploying Movie Recommendation System to EC2..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/parthrewri/Movie-Recommendation-system.git"
PROJECT_DIR="$HOME/Movie-Recommendation-system"
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Step 1: Update system
echo -e "${YELLOW}[1/7] Updating system packages...${NC}"
sudo yum update -y > /dev/null 2>&1 || sudo apt-get update -y > /dev/null 2>&1
echo -e "${GREEN}✓ System updated${NC}"

# Step 2: Install dependencies
echo -e "${YELLOW}[2/7] Installing Python and Node.js...${NC}"
if ! command -v python3 &> /dev/null; then
    sudo yum install -y python3 python3-pip > /dev/null 2>&1 || sudo apt-get install -y python3 python3-pip > /dev/null 2>&1
fi

if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - > /dev/null 2>&1 || true
    sudo yum install -y nodejs > /dev/null 2>&1 || sudo apt-get install -y nodejs > /dev/null 2>&1
fi

if ! command -v git &> /dev/null; then
    sudo yum install -y git > /dev/null 2>&1 || sudo apt-get install -y git > /dev/null 2>&1
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Clone or update repository
echo -e "${YELLOW}[3/7] Cloning/updating repository...${NC}"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    git pull origin main
else
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi
echo -e "${GREEN}✓ Repository ready${NC}"

# Step 4: Setup Backend
echo -e "${YELLOW}[4/7] Setting up FastAPI backend...${NC}"
pip3 install --upgrade pip > /dev/null 2>&1
pip3 install -q fastapi uvicorn pandas numpy pydantic scikit-learn 2>/dev/null || true

# Kill existing backend
pkill -f "uvicorn API" || true
sleep 2

# Start backend
echo "Starting FastAPI on port $BACKEND_PORT..."
nohup python3 -m uvicorn API:app --host 0.0.0.0 --port $BACKEND_PORT > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✓ Backend running (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend failed to start. Check backend.log${NC}"
    cat "$PROJECT_DIR/backend.log"
fi

# Step 5: Setup Frontend
echo -e "${YELLOW}[5/7] Setting up Next.js frontend...${NC}"
cd "$PROJECT_DIR/frontend"
npm install -q 2>/dev/null || npm install

# Step 6: Build Frontend
echo -e "${YELLOW}[6/7] Building Next.js application...${NC}"
npm run build

# Step 7: Start Frontend with PM2
echo -e "${YELLOW}[7/7] Starting frontend with PM2...${NC}"
npm install -g pm2 -q 2>/dev/null || true

# Kill old PM2 process if exists
pm2 delete mrs-frontend 2>/dev/null || true
sleep 1

# Start with PM2
pm2 start "npm run start" --name "mrs-frontend" --cwd "$PROJECT_DIR/frontend"
pm2 save

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Service Status:"
echo -e "  Frontend:  ${GREEN}http://$(hostname -I | awk '{print $1}'):$FRONTEND_PORT${NC}"
echo -e "  Backend:   ${GREEN}http://$(hostname -I | awk '{print $1}'):$BACKEND_PORT${NC}"
echo ""
echo "📋 Useful Commands:"
echo "  • Check backend: curl http://localhost:$BACKEND_PORT/"
echo "  • Check frontend: curl http://localhost:$FRONTEND_PORT/"
echo "  • View logs: pm2 logs"
echo "  • Backend logs: tail -f $PROJECT_DIR/backend.log"
echo "  • Restart: bash $PROJECT_DIR/deploy.sh"
echo ""
