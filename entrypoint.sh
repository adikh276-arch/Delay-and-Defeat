#!/bin/sh
# Inject runtime environment variables into Vite JS bundle
if [ -n "$DATABASE_URL" ]; then
    echo "Injecting DATABASE_URL into static build..."
    find /usr/share/nginx/html/delay_and_defeat/assets -name '*.js' -exec sed -i "s|RUNTIME_ENV_DATABASE_URL|${DATABASE_URL}|g" {} +
else
    echo "WARNING: DATABASE_URL is not set!"
fi

exec nginx -g "daemon off;"
