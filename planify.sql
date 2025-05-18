-- psql -U postgres -d planify
DROP DATABASE IF EXISTS planify;
CREATE DATABASE planify;

\c planify;

DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS token CASCADE;
DROP TABLE IF EXISTS reunion CASCADE;
DROP TABLE IF EXISTS proposition_date CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS response CASCADE;
DROP TABLE IF EXISTS no_account CASCADE;

CREATE TABLE "user" (
    user_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(32) NOT NULL,
    surname VARCHAR(32) NOT NULL,
    birthdate DATE NOT NULL,
    username VARCHAR(32) NOT NULL,
    email VARCHAR(32) NOT NULL,
    password VARCHAR(64) NOT NULL,
    profilepicture TEXT NOT NULL
);

CREATE TABLE token (
    user_id VARCHAR(32) NOT NULL,
    token TEXT NOT NULL,
    expire_at TIMESTAMP
);

CREATE TABLE reunion (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    name VARCHAR(32) NOT NULL,
    UNIQUE (user_id, name)
);

CREATE TABLE proposition_date(
    reunion_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration TIME NOT NULL,
    PRIMARY KEY (reunion_id, date, time, duration),
    FOREIGN KEY (reunion_id) REFERENCES reunion(id),
    UNIQUE (reunion_id, date, time, duration)
);

CREATE TABLE participants (
    reunion_id INT NOT NULL,
    email VARCHAR(32) NOT NULL,
    PRIMARY KEY (reunion_id, email),
    FOREIGN KEY (reunion_id) REFERENCES reunion(id),
    UNIQUE (reunion_id, email)
);

CREATE TABLE response (
    reunion_id INT NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    response BOOLEAN,
    PRIMARY KEY (reunion_id, user_id, date, time),
    FOREIGN KEY (reunion_id) REFERENCES reunion(id),
    UNIQUE (reunion_id, user_id, date, time)
);

CREATE TABLE no_account (
    reunion_id INT NOT NULL,
    profilepicture TEXT NOT NULL,
    email VARCHAR(32) NOT NULL,
    token TEXT NOT NULL,
    PRIMARY KEY (reunion_id, email),
    FOREIGN KEY (reunion_id) REFERENCES reunion(id),
    UNIQUE (reunion_id, email)
);

ALTER TABLE proposition_date
DROP CONSTRAINT proposition_date_reunion_id_fkey,
ADD CONSTRAINT proposition_date_reunion_id_fkey
FOREIGN KEY (reunion_id)
REFERENCES reunion(id)
ON DELETE CASCADE;

ALTER TABLE participants
DROP CONSTRAINT participants_reunion_id_fkey,
ADD CONSTRAINT participants_reunion_id_fkey
FOREIGN KEY (reunion_id)
REFERENCES reunion(id)
ON DELETE CASCADE;

ALTER TABLE no_account
DROP CONSTRAINT no_account_reunion_id_fkey,
ADD CONSTRAINT no_account_reunion_id_fkey
FOREIGN KEY (reunion_id)
REFERENCES reunion(id)
ON DELETE CASCADE;

ALTER TABLE response
DROP CONSTRAINT response_reunion_id_fkey,
ADD CONSTRAINT response_reunion_id_fkey
FOREIGN KEY (reunion_id)
REFERENCES reunion(id)
ON DELETE CASCADE;
