FROM nginx:alpine

# Copy app files into nginx web root
COPY . /usr/share/nginx/html/

# Custom nginx config — handles spaces in filename, CORS, caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
