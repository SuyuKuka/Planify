-- psql -U postgres -d planify -h localhost
DROP DATABASE IF EXISTS planify;
DROP TABLE IF EXISTS utilisateur CASCADE;
DROP TABLE IF EXISTS token CASCADE;

CREATE DATABASE planify;

CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    prenom VARCHAR(32),
    nom VARCHAR(32),
    date_de_naissance DATE,
    pseudo VARCHAR(32),
    email VARCHAR(32),
    mot_de_passe VARCHAR(64)
);

CREATE TABLE token (
    email VARCHAR(32),
    token TEXT NOT NULL,
    expire_at TIMESTAMP
);