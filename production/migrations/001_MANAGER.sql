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
    invited_by     address  REFERENCES callers (address) ON DELETE SET NULL,
    ticket_balance SMALLINT NOT NULL DEFAULT 0
);

-- Not referencing caller allow people accomplish tasks without logging in firstly
CREATE TABLE earnings_per_period
(
    caller         address,
    ticket_balance SMALLINT DEFAULT 0 CHECK (ticket_balance <= 3),
    PRIMARY KEY (caller)
);

CREATE TABLE tasks
(
    task_id        SERIAL PRIMARY KEY,
    name           TEXT              NOT NULL,
    description    TEXT              NOT NULL,
    reward_tickets SMALLINT          NOT NULL DEFAULT 1,
    created_at     unix_time_seconds NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())
);

-- Represents accomplished tasks for all the users
CREATE TABLE users_tasks_relations
(
    caller_address address REFERENCES callers (address),
    task_id        SERIAL REFERENCES tasks (task_id),
    PRIMARY KEY (caller_address, task_id)
);


CREATE OR REPLACE FUNCTION handle_users_tasks_relations_insert()
    RETURNS TRIGGER AS
$$
DECLARE
    task_reward_tickets SMALLINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM callers WHERE address = NEW.caller_address) THEN
        INSERT INTO callers (address)
        VALUES (NEW.caller_address);
    END IF;

    SELECT t.reward_tickets
    INTO task_reward_tickets
    FROM tasks t
    WHERE t.task_id = NEW.task_id;

    INSERT INTO earnings_per_period (caller, ticket_balance)
    VALUES (NEW.caller_address, task_reward_tickets)
    ON CONFLICT (caller) DO UPDATE
        SET ticket_balance = earnings_per_period.ticket_balance + EXCLUDED.ticket_balance;

    UPDATE callers
    SET ticket_balance = ticket_balance + task_reward_tickets
    WHERE address = NEW.caller_address;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE TRIGGER trg_insert_users_tasks_relations
    BEFORE INSERT
    ON users_tasks_relations
    FOR EACH ROW
EXECUTE FUNCTION handle_users_tasks_relations_insert();


-- Create the function to delete all rows (if you prefer deleting records)
CREATE OR REPLACE FUNCTION delete_all_rows_from_earnings_per_period()
    RETURNS VOID AS
$$
BEGIN
    DELETE FROM earnings_per_period;
END;
$$ LANGUAGE plpgsql;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('0 0 * * 0', $$SELECT delete_all_rows_from_earnings_per_period();$$);