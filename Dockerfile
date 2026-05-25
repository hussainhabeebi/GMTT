FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy both files
COPY login.html /usr/share/nginx/html/login.html
COPY gmtt-dashboard-v5.html /usr/share/nginx/html/index.html

# Nginx config: serve index.html at /, login.html at /login
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { try_files $uri $uri/ /index.html; } \
    location /login { try_files /login.html =404; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
