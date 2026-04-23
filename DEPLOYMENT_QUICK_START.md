# 🚀 Quick EC2 Deployment Guide

## Summary
Your Movie Recommendation System is ready to deploy on EC2 at `3.81.101.217`

## Files Provided
- **`EC2_DEPLOY.md`** - Comprehensive deployment documentation
- **`deploy.sh`** - Automated deployment script (run on EC2)
- **`frontend/.env.production`** - Production environment variables
- **`frontend/app/page.tsx`** - Updated to use environment variables

## Quick Start (5 minutes)

### 1. Connect to EC2
```bash
# Option A: SSH (if you have a keypair)
ssh -i your-key.pem ec2-user@3.81.101.217

# Option B: AWS Systems Manager (no keypair needed)
# Go to EC2 Dashboard → Select Instance → Instance Connect → Connect

# Option C: AWS Instance Connect browser
# (Same as Option B - easiest)
```

### 2. Run Automated Deployment
```bash
# Clone the repo and deployment script
git clone https://github.com/parthrewri/Movie-Recommendation-system.git
cd Movie-Recommendation-system

# Make the script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

### 3. Upload Data Files (if needed)
If `movies.csv`, `posters.csv`, and `ratings.csv` are not in the repo, upload them:

```bash
# From your local machine
scp -i your-key.pem movies.csv ec2-user@3.81.101.217:~/Movie-Recommendation-system/
scp -i your-key.pem posters.csv ec2-user@3.81.101.217:~/Movie-Recommendation-system/
scp -i your-key.pem ratings.csv ec2-user@3.81.101.217:~/Movie-Recommendation-system/
```

### 4. Access Your Application
- **Frontend**: http://3.81.101.217:3000
- **Backend API**: http://3.81.101.217:8000
- **Health Check**: curl http://3.81.101.217:8000/

## Troubleshooting

### Check if services are running
```bash
# Frontend (should return HTML)
curl -s http://localhost:3000/ | head -20

# Backend (should return JSON)
curl http://localhost:8000/

# View all processes
pm2 list
ps aux | grep uvicorn
```

### View Logs
```bash
# Frontend logs
pm2 logs mrs-frontend

# Backend logs
tail -f ~/Movie-Recommendation-system/backend.log

# All logs
pm2 logs
```

### Restart Services
```bash
# Restart frontend
pm2 restart mrs-frontend

# Restart backend (kill and restart)
pkill -f "uvicorn API"
python3 -m uvicorn API:app --host 0.0.0.0 --port 8000 &

# Or run the full deployment script again
./deploy.sh
```

### Common Issues

**Issue: Port 3000/8000 already in use**
```bash
# Find and kill the process
lsof -i :3000
lsof -i :8000
kill -9 <PID>
```

**Issue: Frontend can't reach backend**
- Check that port 8000 is open in security group
- Verify backend is running: `curl http://localhost:8000/`
- Check browser console for CORS errors

**Issue: Permission denied on deploy.sh**
```bash
chmod +x deploy.sh
./deploy.sh
```

## Security Group Configuration

In AWS Console, add inbound rules:
| Port | Protocol | Source |
|------|----------|--------|
| 3000 | TCP | 0.0.0.0/0 (or your IP) |
| 8000 | TCP | 0.0.0.0/0 (or your IP) |

## Monitoring & Maintenance

### Check disk space
```bash
df -h
```

### Update the application
```bash
cd ~/Movie-Recommendation-system
git pull origin main
./deploy.sh  # Re-deploy to apply changes
```

### Keep logs clean
```bash
# Clear PM2 logs
pm2 flush

# Clear backend logs
> ~/Movie-Recommendation-system/backend.log
```

## Environment Variables

**For production on EC2** (already set in `frontend/.env.production`):
```
NEXT_PUBLIC_API_URL=http://3.81.101.217:8000
```

**For local development**:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Useful Commands

```bash
# Show detailed PM2 status
pm2 show mrs-frontend

# Watch PM2 in real-time
pm2 monit

# Save PM2 startup script
pm2 startup
pm2 save

# View environment variables
pm2 env 0

# Kill all PM2 apps
pm2 kill

# Permanently delete a PM2 app
pm2 delete mrs-frontend
```

## Success Indicators ✅

- [ ] EC2 instance is running
- [ ] SSH/Systems Manager connection works
- [ ] `./deploy.sh` completes without errors
- [ ] `curl http://3.81.101.217:8000/` returns JSON
- [ ] `http://3.81.101.217:3000` loads in browser
- [ ] Movies display and recommendations work
- [ ] Can search and filter by genre

## Next Steps

1. Run the deployment script on EC2
2. Test both endpoints in browser
3. Set up monitoring/alerts (optional)
4. Configure SSL/HTTPS (optional)
5. Set up auto-scaling (optional)

## Support

For issues or questions:
1. Check the logs: `pm2 logs`
2. Review `EC2_DEPLOY.md` for detailed instructions
3. Check AWS EC2 console for instance status
4. Verify security group rules allow traffic

---

**Repository**: https://github.com/parthrewri/Movie-Recommendation-system
**Instance IP**: 3.81.101.217
