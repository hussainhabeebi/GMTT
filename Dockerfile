# GMTT Dashboard — static-site image served by nginx.
#
# Build:  docker build -t gmtt-dashboard .
# Run:    docker run -p 8080:80 gmtt-dashboard
# Behind nginx basic_auth too:
#   docker run -p 8080:80 -e BASIC_AUTH=1 \
#     -e HTPASSWD='gmtt:$apr1$abc...$xyz' gmtt-dashboard
#
# Tip: generate the htpasswd value with:
#   htpasswd -nbB gmtt 'Gmtt*2027*ai'

FROM nginx:1.27-alpine

# Tools for entrypoint htpasswd write
RUN apk add --no-cache apache2-utils

# Wipe the default nginx welcome page
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy static site
WORKDIR /usr/share/nginx/html
COPY login.html              ./
COPY ["GMTT Dashboard.html",  "./GMTT Dashboard.html"]
COPY app/                    ./app/
COPY n8n-workflows/          ./n8n-workflows/

# nginx config + entrypoint
COPY docker/nginx.conf       /etc/nginx/conf.d/gmtt.conf
COPY docker/entrypoint.sh    /docker-entrypoint.d/40-gmtt-auth.sh
RUN chmod +x /docker-entrypoint.d/40-gmtt-auth.sh

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -q --spider http://127.0.0.1/health || exit 1
