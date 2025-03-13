-- DROP DATABASE IF EXISTS planify;
DROP TABLE IF EXISTS utilisateur CASCADE;

-- CREATE DATABASE planify;

CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    prenom VARCHAR(32),
    nom VARCHAR(32),
    date_de_naissance DATE,
    pseudo VARCHAR(32),
    email VARCHAR(32)
    mot_de_passe VARCHAR(64),
);

