CREATE TABLE user (
    id_user VARCHAR(32) PRIMARY KEY,
    name VARCHAR(32),
    surname VARCHAR(32),
    birthdate DATE,
    username VARCHAR(32),
    email VARCHAR(32),
    password VARCHAR(64)
);

CREATE TABLE token (
    id_user VARCHAR(32),
    token TEXT NOT NULL,
    expire_at TIMESTAMP
);

CREATE TABLE calendar (
    id SERIAL PRIMARY KEY
);

CREATE TABLE user_calendar (
    etat ENUM('PERSONAL', 'PRESENT', 'INVITATION'),
    role ENUM('ORGANIZER', 'PARTICIPANT'),
    user_id INT,
    calendar_id INT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (calendar_id) REFERENCES calendar(id)
);

CREATE TABLE message (
    id SERIAL PRIMARY KEY,
    id_user VARCHAR(32),
    content TEXT,
    time TIME,
    calendar_id INT,
    FOREIGN KEY (calendar_id) REFERENCES calendar(id)
);

CREATE TABLE proposition (
    id SERIAL PRIMARY KEY,
    content TEXT,
    date_propose SMALLDATETIME,
    date_envoi TIMESTAMP DEFAULT NOW(),
    calendar_id INT,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (calendar_id) REFERENCES calendar(id)
);

CREATE TABLE reaction (
    react ENUM('AGREE', 'DISAGREE'),
    user_id INT,
    proposition_id INT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (proposition_id) REFERENCES proposition(id)
);
