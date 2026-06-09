#!/bin/sh
# Push the schema to the database (creates tables if they don't exist) using the pinned version matching package.json
npx prisma@5.22.0 db push --accept-data-loss

# Start the Next.js standalone server
exec node server.js
