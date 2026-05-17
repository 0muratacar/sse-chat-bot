#!/bin/sh
set -e

DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\(.*\):[0-9]*/.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')

export PGPASSWORD="$DB_PASS"

# Create database if it doesn't exist
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 \
  || psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
  "CREATE DATABASE \"$DB_NAME\";"

npx prisma migrate deploy
npx prisma db seed
exec node dist/server.js
