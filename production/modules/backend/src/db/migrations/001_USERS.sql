CREATE DOMAIN telegram_id AS VARCHAR(512);
CREATE DOMAIN address AS VARCHAR(512);
CREATE DOMAIN coins AS BIGINT CHECK ( VALUE >= 0 );

-- In fact will be used only as core height storage, but may be extended later
CREATE TABLE heights
(
    contract_address address PRIMARY KEY,
    height           BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE users
(
    invited_by     telegram_id REFERENCES users (telegram_id),
    telegram_id    telegram_id PRIMARY KEY,
    nickname       TEXT,
    ticket_balance SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE callers
(
    "user"  telegram_id REFERENCES users (telegram_id),
    address address PRIMARY KEY
);
