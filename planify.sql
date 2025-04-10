-- psql -U postgres -d planify
DROP DATABASE IF EXISTS planify;
DROP TABLE IF EXISTS utilisateur CASCADE;
DROP TABLE IF EXISTS token CASCADE;

CREATE DATABASE planify;

\c planify;

CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    name VARCHAR(32),
    surname VARCHAR(32),
    birthdate DATE,
    username VARCHAR(32),
    email VARCHAR(32),
    password VARCHAR(64)
);

CREATE TABLE token (
    email VARCHAR(32),
    token TEXT NOT NULL,
    expire_at TIMESTAMP
);