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

CREATE TABLE users
(
    invited_by     telegram_id REFERENCES users (telegram_id),
    telegram_id    telegram_id PRIMARY KEY,
    nickname       TEXT,
    ticket_balance SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE summary_tickets_balances
(
    caller address REFERENCES callers (address),
    ticket_balance   SMALLINT DEFAULT 0,
    PRIMARY KEY (caller, task)
);

CREATE TABLE callers
(
    -- "user"  telegram_id REFERENCES users (telegram_id),
    address address PRIMARY KEY,
    ticket_balance  SMALLINT CHECK (ticket_balance BETWEEN 0 AND 3) DEFAULT 0
);

-- CREATE EXTENSION pg_cron;

CREATE OR REPLACE FUNCTION update_weekly_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the balance in summary_tickets_balances for each caller
    INSERT INTO summary_tickets_balances (caller, ticket_balance)
    SELECT address, ticket_balance
    FROM callers
    WHERE ticket_balance > 0
    ON CONFLICT (caller) 
    DO UPDATE SET ticket_balance = summary_tickets_balances.ticket_balance + EXCLUDED.ticket_balance;

    -- Reset the ticket balance in the callers table after updating
    UPDATE callers
    SET ticket_balance = 0
    WHERE ticket_balance > 0;

END;
$$ LANGUAGE plpgsql;

-- Call trigger with pg_cron library every Sunday at 00:00. Also can use pgAgent...
-- SELECT SELECT cron.schedule('0 0 * * 0', 'SELECT update_weekly_balances();');

-- Manual call
-- SELECT update_weekly_balances();