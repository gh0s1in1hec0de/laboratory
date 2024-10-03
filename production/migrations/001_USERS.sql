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

CREATE TABLE callers
(
    caller_id      SERIAL UNIQUE,
    address        address PRIMARY KEY,
    invited_by     address REFERENCES callers (address) ON DELETE SET NULL,
    ticket_balance SMALLINT NOT NULL DEFAULT 0
);

-- Not referencing caller allow people accomplish tasks without logging in firstly
CREATE TABLE earnings_per_period
(
    caller         address,
    ticket_balance SMALLINT DEFAULT 0 CHECK (ticket_balance <= 3),
    PRIMARY KEY (caller)
);