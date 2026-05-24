FROM nginx:alpine

<<<<<<< HEAD
# Copy app into nginx web root
COPY . /usr/share/nginx/html/

# Write nginx config inline — no separate file to forget
=======
COPY . /usr/share/nginx/html/

>>>>>>> 79b24c205bdc0351a9ff55e440b43b2e66cfb784
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index login.html;\n\
    charset utf-8;\n\
    gzip on;\n\
    gzip_types text/html text/css application/javascript application/json;\n\
<<<<<<< HEAD
    gzip_min_length 1024;\n\
    location ~* \\.(css|js|json)$ {\n\
        add_header Access-Control-Allow-Origin "*";\n\
        expires 1h;\n\
    }\n\
    location = / { try_files /login.html =404; }\n\
    location / { try_files $uri $uri/ =404; }\n\
=======
    location ~* \\.(css|js|json)$ {\n\
        add_header Access-Control-Allow-Origin "*";\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ =404;\n\
    }\n\
>>>>>>> 79b24c205bdc0351a9ff55e440b43b2e66cfb784
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
