FROM nginx:alpine

# Copy app into nginx web root
COPY . /usr/share/nginx/html/

# Write nginx config inline — no separate file to forget
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index login.html;\n\
    charset utf-8;\n\
    gzip on;\n\
    gzip_types text/html text/css application/javascript application/json;\n\
    gzip_min_length 1024;\n\
    location ~* \\.(css|js|json)$ {\n\
        add_header Access-Control-Allow-Origin "*";\n\
        expires 1h;\n\
    }\n\
    location = / { try_files /login.html =404; }\n\
    location / { try_files $uri $uri/ =404; }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
