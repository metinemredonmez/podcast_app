-- Create test database if not exists
SELECT 'CREATE DATABASE podcast_app_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'podcast_app_test')\gexec
