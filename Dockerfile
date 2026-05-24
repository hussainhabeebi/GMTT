FROM nginx:alpine

COPY . /usr/share/nginx/html/

RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index login.html;\n\
    charset utf-8;\n\
    gzip on;\n\
    gzip_types text/html text/css application/javascript application/json;\n\
    location ~* \\.(css|js|json)$ {\n\
        add_header Access-Control-Allow-Origin "*";\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ =404;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
