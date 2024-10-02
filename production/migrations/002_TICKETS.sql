CREATE TABLE tasks
(
    task_id        SERIAL PRIMARY KEY,
    name           TEXT              NOT NULL,
    description    TEXT              NOT NULL,
    reward_tickets SMALLINT          NOT NULL DEFAULT 1,
    created_at     unix_time_seconds NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())
);

-- Represents, accomplished tasks for all the users
CREATE TABLE users_tasks_relations
(
    caller_address address REFERENCES callers (address),
    task_id        SERIAL REFERENCES tasks (task_id),
    PRIMARY KEY (caller_address, task_id)
);

-- Create the function to handle the logic
CREATE OR REPLACE FUNCTION handle_users_tasks_relations_insert()
    RETURNS TRIGGER AS $$
DECLARE
    task_reward_tickets SMALLINT;
BEGIN
    BEGIN
        SELECT t.reward_tickets INTO task_reward_tickets
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

    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error occurred during ticket balance update: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to call the function after insert on users_tasks_relations
CREATE TRIGGER trg_insert_users_tasks_relations
    AFTER INSERT ON users_tasks_relations
    FOR EACH ROW
EXECUTE FUNCTION handle_users_tasks_relations_insert();



-- Create the function to delete all rows (if you prefer deleting records)
CREATE OR REPLACE FUNCTION delete_all_rows_from_earnings_per_period()
    RETURNS VOID AS $$
BEGIN
    DELETE FROM earnings_per_period;
END;
$$ LANGUAGE plpgsql;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('0 0 * * 0', $$SELECT delete_all_rows_from_earnings_per_period();$$);






