#!/bin/sh
# Generate the Prisma client based on the current architecture
npx prisma generate

# Push the schema to the database (creates tables if they don't exist)
npx prisma db push --accept-data-loss

# Start the Next.js standalone server
exec node server.js
