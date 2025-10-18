-- Setup script for PolicyPal database
-- Run this with: sudo -u postgres psql -f setup-db.sql

-- Create the database if it doesn't exist
CREATE DATABASE policypal;

-- Create the user with the correct password
CREATE USER "user" WITH PASSWORD 'password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE policypal TO "user";

-- Allow the user to create databases (useful for testing)
ALTER USER "user" CREATEDB;

-- Connect to the policypal database and grant schema privileges
\c policypal;
GRANT ALL ON SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "user";

