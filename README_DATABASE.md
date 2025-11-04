# Database Configuration Guide

## MySQL Database Setup

This application is configured to use MySQL as the database. Follow these steps to connect your existing MySQL database:

### 1. Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `MYSQL_DATABASE_URL` in `.env` with your MySQL connection string:
```
MYSQL_DATABASE_URL="mysql://username:password@host:port/database_name"
```

Example:
```
MYSQL_DATABASE_URL="mysql://admin:mypassword@db.example.com:3306/forexfactory_db"
```

### 2. Database Schema Migration

Once you provide your existing database schema, we can:

1. **Option A: Use your existing database as-is**
   - Update `prisma/schema.prisma` to match your existing tables
   - Run `npx prisma db pull` to introspect your database
   - Run `npx prisma generate` to generate the Prisma Client

2. **Option B: Migrate your existing data to the new schema**
   - Keep the current Prisma schema
   - Write migration scripts to transfer data
   - Run `npx prisma migrate deploy` to apply migrations

### 3. Common Prisma Commands

```bash
# Pull schema from existing database
npx prisma db pull

# Generate Prisma Client
npx prisma generate

# Create migrations
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Open Prisma Studio (GUI for database)
npx prisma studio

# Format schema file
npx prisma format
```

### 4. Connection Troubleshooting

If you encounter connection issues:

1. **Check MySQL version compatibility**: Prisma supports MySQL 5.6 and higher
2. **Verify connection string format**: Ensure special characters in password are URL-encoded
3. **Check network access**: Ensure your MySQL server allows connections from this host
4. **SSL Configuration**: If your MySQL requires SSL, add `?sslaccept=strict` to the connection URL

### 5. Current Schema Overview

The default schema includes these main tables:
- **users**: User accounts and authentication
- **posts**: Blog posts and articles  
- **categories**: Content categories
- **tags**: Post tags
- **downloads**: EA/Indicator downloads
- **newsletter_subscribers**: Email subscribers

When you provide your existing database schema, we'll update this to match your structure exactly.

### 6. Security Notes

- Never commit `.env` file to version control
- Use environment variables for all sensitive data
- Consider using connection pooling for production
- Enable SSL for database connections in production