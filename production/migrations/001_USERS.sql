CREATE DOMAIN telegram_id AS VARCHAR(512);
-- 1024 is not actual max length of TON address, just using static length for better perfomance
CREATE DOMAIN address AS VARCHAR(1024);
CREATE DOMAIN coins AS BIGINT CHECK ( VALUE >= 0 );
CREATE DOMAIN unix_time_seconds AS BIGINT;

-- In fact will be used only as core height storage, but may be extended later
CREATE TABLE heights
(
    contract_address address PRIMARY KEY,
    height           BIGINT NOT NULL DEFAULT 0
);

-- CREATE TABLE users
-- (
--     invited_by     telegram_id REFERENCES users (telegram_id),
--     telegram_id    telegram_id PRIMARY KEY,
--     nickname       TEXT,
--     ticket_balance SMALLINT NOT NULL DEFAULT 0
-- );

CREATE TABLE callers
(
    address address PRIMARY KEY,
    ticket_balance  SMALLINT CHECK (ticket_balance BETWEEN 0 AND 3) DEFAULT 0
);

CREATE TABLE summary_tickets_balances
(
    caller address REFERENCES callers (address),
    ticket_balance   SMALLINT DEFAULT 0,
    PRIMARY KEY (caller)
);