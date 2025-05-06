-- psql -U postgres -d planify
DROP DATABASE IF EXISTS planify;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS token CASCADE;

CREATE DATABASE planify;

\c planify;

CREATE TABLE "user" (
    user_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(32),
    surname VARCHAR(32),
    birthdate DATE,
    username VARCHAR(32),
    email VARCHAR(32),
    password VARCHAR(64),
    profilepicture TEXT
);

CREATE TABLE token (
    user_id VARCHAR(32),
    token TEXT NOT NULL,
    expire_at TIMESTAMP
);
