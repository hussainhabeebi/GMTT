FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy dashboard
COPY gmtt-dashboard.html /usr/share/nginx/html/index.html

# nginx config — single page, CORS headers, gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
