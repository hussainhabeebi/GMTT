# GMTT Dashboard — Deploy Instructions

## Files needed
```
gmtt-dockerfile/
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
└── gmtt-dashboard.html   ← copy from output
```

## Option A — Coolify (recommended, your stack)
1. Create a new Coolify app → Docker Compose
2. Upload this folder (or point to a Git repo)
3. Set domain: `gmtt.aiingo.com`
4. Coolify handles SSL via Let's Encrypt automatically
5. Deploy

## Option B — Manual on your Contabo VPS
```bash
# Upload files to VPS
scp -r gmtt-dockerfile/ user@156.67.110.188:/opt/gmtt/

# SSH in and build
ssh user@156.67.110.188
cd /opt/gmtt/gmtt-dockerfile
cp /path/to/gmtt-dashboard.html .

docker build -t gmtt-dashboard .
docker run -d --name gmtt-dashboard --restart unless-stopped -p 3080:80 gmtt-dashboard
```

## Rebuild after dashboard update
```bash
docker build -t gmtt-dashboard . && docker stop gmtt-dashboard && docker rm gmtt-dashboard
docker run -d --name gmtt-dashboard --restart unless-stopped -p 3080:80 gmtt-dashboard
```

## Health check
```
curl http://gmtt.aiingo.com/health
# → ok
```
