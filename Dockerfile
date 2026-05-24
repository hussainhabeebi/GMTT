FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

# Option A: COPY (use this when Dockerfile is in same repo as the HTML file)
COPY gmtt-dashboard-v2.html /usr/share/nginx/html/index.html

RUN echo 'server{listen 80;server_name _;root /usr/share/nginx/html;index index.html;gzip on;gzip_types text/html text/css application/javascript application/json;add_header Access-Control-Allow-Origin * always;add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;add_header Access-Control-Allow-Headers "Content-Type, api_access_token" always;location / { try_files $uri $uri/ /index.html; }location /health { return 200 "ok"; add_header Content-Type text/plain; }}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
