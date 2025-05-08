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
    PRIMARY KEY (reunion_id, date, time),
    FOREIGN KEY (reunion_id) REFERENCES reunion(id),
    UNIQUE (reunion_id, date, time)
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
    FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    UNIQUE (reunion_id, user_id, date, time)
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

ALTER TABLE response
DROP CONSTRAINT response_reunion_id_fkey,
ADD CONSTRAINT response_reunion_id_fkey
FOREIGN KEY (reunion_id)
REFERENCES reunion(id)
ON DELETE CASCADE;

INSERT INTO "user" (user_id, name, surname, birthdate, username, email, password, profilepicture) VALUES ('@suyu', 'Michel', 'CHEN', '2004-08-26', 'Suyu', 'michelchen052@gmail.com', '$2b$10$GMxouQxE4fIiz6RXDsHzPOtKml.Ee6DYijs0Nvkpy.x7DcCSepO/i', '/images/profile/default.png');
INSERT INTO "user" (user_id, name, surname, birthdate, username, email, password, profilepicture) VALUES ('@nophy', 'Vanessa', 'HEJL', '2001-06-06', 'Nophy', 'vanessa.hejl@gmail.com', '$2b$10$GMxouQxE4fIiz6RXDsHzPOtKml.Ee6DYijs0Nvkpy.x7DcCSepO/i', '/images/profile/default.png');
