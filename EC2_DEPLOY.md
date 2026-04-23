# EC2 Deployment Guide - Movie Recommendation System

## Instance Information
- **IP Address**: `3.81.101.217`
- **Repository**: `https://github.com/parthrewri/Movie-Recommendation-system.git`

## Prerequisites
Ensure you have:
1. SSH access to the EC2 instance (or use AWS Systems Manager / Instance Connect)
2. Security group allows inbound on ports 3000 (frontend) and 8000 (backend)
3. Python 3.8+ installed
4. Node.js 16+ installed
5. Git installed

## Step 1: Connect to EC2

### Option A: Using SSH (if you have a keypair)
```bash
ssh -i your-key.pem ec2-user@3.81.101.217
```

### Option B: Using AWS Systems Manager Session Manager (no keypair needed)
```bash
aws ssm start-session --target <instance-id>
```

### Option C: Using AWS Instance Connect (browser-based)
Go to EC2 Dashboard → Select Instance → Instance Connect tab → Connect

---

## Step 2: Clone the Repository

```bash
cd /home/ec2-user  # or your preferred directory
git clone https://github.com/parthrewri/Movie-Recommendation-system.git
cd Movie-Recommendation-system
```

---

## Step 3: Set Up Backend (FastAPI)

```bash
# Install Python dependencies
pip3 install fastapi uvicorn pandas numpy pydantic scikit-learn

# Copy data files (if not already in repo)
# Make sure these files are in the project root:
# - movies.csv
# - posters.csv
# - ratings.csv

# Run the backend on port 8000
python3 -m uvicorn API:app --host 0.0.0.0 --port 8000 &
```

---

## Step 4: Set Up Frontend (Next.js)

```bash
cd frontend

# Install Node dependencies
npm install

# Build the frontend for production
npm run build

# Run the frontend on port 3000 (using PM2 for persistence)
npm install -g pm2
pm2 start "npm run start" --name "mrs-frontend"
pm2 startup
pm2 save
```

---

## Step 5: Configure Firewall / Security Group

In AWS Console:
1. Go to **EC2 Dashboard** → **Security Groups**
2. Find the security group for your instance
3. Add inbound rules:
   - Port 3000 (TCP) - Frontend - Source: `0.0.0.0/0` (or your IP)
   - Port 8000 (TCP) - Backend - Source: `0.0.0.0/0` (or your IP)

---

## Step 6: Update Frontend API URL for Production

Edit `frontend/app/page.tsx` and update the API constant:

**From:**
```typescript
const API = 'http://127.0.0.1:8000'
```

**To:**
```typescript
const API = 'http://3.81.101.217:8000'
// Or use environment variable:
const API = process.env.NEXT_PUBLIC_API_URL || 'http://3.81.101.217:8000'
```

Then rebuild and restart:
```bash
npm run build
pm2 restart mrs-frontend
```

---

## Step 7: Access Your Application

- **Frontend**: `http://3.81.101.217:3000`
- **Backend API**: `http://3.81.101.217:8000`
- **Health Check**: `http://3.81.101.217:8000/` (should return JSON)

---

## Troubleshooting

### Backend won't start (Port 8000 in use)
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>
```

### Frontend won't build
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Check logs with PM2
```bash
pm2 logs mrs-frontend
pm2 logs
```

### Data files missing
Download/upload the CSV files to the project root:
```bash
# From local machine
scp -i your-key.pem movies.csv ec2-user@3.81.101.217:/home/ec2-user/Movie-Recommendation-system/
scp -i your-key.pem posters.csv ec2-user@3.81.101.217:/home/ec2-user/Movie-Recommendation-system/
scp -i your-key.pem ratings.csv ec2-user@3.81.101.217:/home/ec2-user/Movie-Recommendation-system/
```

---

## Automated Deployment Script

Save this as `deploy.sh` on your EC2 instance and run with `bash deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Movie Recommendation System..."

# Clone/Pull repository
if [ -d "Movie-Recommendation-system" ]; then
    cd Movie-Recommendation-system
    git pull origin main
else
    git clone https://github.com/parthrewri/Movie-Recommendation-system.git
    cd Movie-Recommendation-system
fi

# Setup Backend
echo "⚙️  Setting up backend..."
pip3 install -q fastapi uvicorn pandas numpy pydantic scikit-learn

# Kill existing backend process
pkill -f "uvicorn API" || true
sleep 2

# Start Backend
echo "🔧 Starting FastAPI backend on port 8000..."
nohup python3 -m uvicorn API:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
sleep 3

# Setup Frontend
echo "⚙️  Setting up frontend..."
cd frontend
npm install -q

# Build frontend
echo "🏗️  Building Next.js frontend..."
npm run build

# Start with PM2
echo "🚀 Starting Next.js frontend on port 3000..."
pm2 start "npm run start" --name "mrs-frontend" || pm2 restart mrs-frontend
pm2 save

echo "✅ Deployment complete!"
echo "Frontend: http://3.81.101.217:3000"
echo "Backend: http://3.81.101.217:8000"
```

---

## Monitoring

Check if services are running:
```bash
# Check backend
curl http://localhost:8000/

# Check frontend
curl http://localhost:3000/

# View running processes
pm2 list
ps aux | grep uvicorn
```

---

## Next Steps
1. Copy deployment script to EC2
2. Upload data CSV files (movies.csv, posters.csv, ratings.csv)
3. Run the automated deployment script
4. Test both endpoints
5. Monitor logs for any issues
