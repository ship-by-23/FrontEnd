#!/bin/sh
set -eu

runtime_config="/usr/share/nginx/html/runtime-config.js"
nginx_template="/etc/nginx/simpandulu.conf.template"
nginx_config="/etc/nginx/conf.d/default.conf"
api_url="${API_URL:-}"
app_env="${APP_ENV:-production}"
app_version="${APP_VERSION:-unknown}"

if [ -z "$api_url" ]; then
  echo "API_URL is required at container runtime." >&2
  exit 1
fi

case "$api_url" in
  https://*|http://*) ;;
  *) echo "API_URL must use http:// or https://." >&2; exit 1 ;;
esac

case "$api_url" in
  */api/v1|*/api/v1/) ;;
  *) echo "API_URL must end with /api/v1." >&2; exit 1 ;;
esac

api_url="${api_url%/}"
api_origin=$(printf '%s' "$api_url" | sed -E 's#^(https?://[^/]+).*#\1#')
escaped_origin=$(printf '%s' "$api_origin" | sed 's/[&|]/\\&/g')
escaped_api_url=$(printf '%s' "$api_url" | sed 's/[\\"]/[\\&]/g')
escaped_app_env=$(printf '%s' "$app_env" | sed 's/[\\"]/[\\&]/g')
escaped_app_version=$(printf '%s' "$app_version" | sed 's/[\\"]/[\\&]/g')

printf '%s\n' "window.__SIMPANDULU_CONFIG__ = { apiUrl: \"$escaped_api_url\", appEnv: \"$escaped_app_env\", appVersion: \"$escaped_app_version\" };" > "$runtime_config"
sed "s|__API_ORIGIN__|$escaped_origin|g" "$nginx_template" > "$nginx_config"
