CREATE TABLE tasks
(
    task_id     SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    reward_tickets SMALLINT NOT NULL DEFAULT 1,
    description TEXT NOT NULL
);

CREATE TABLE users_tasks_relations
(
    caller address REFERENCES callers (address),
    task   SERIAL REFERENCES tasks (task_id),
    PRIMARY KEY (caller, task)
);

CREATE TABLE whitelist_relations
(
    token_launch_address address REFERENCES token_launches (address),
    caller_address       address REFERENCES callers (address),
    PRIMARY KEY (token_launch_address, caller_address)
);

CREATE OR REPLACE FUNCTION increment_ticket_balance()
    RETURNS TRIGGER AS
$$
BEGIN
    UPDATE callers
    SET ticket_balance = ticket_balance + 1
    WHERE address = NEW.caller;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_task_completion
    AFTER INSERT
    ON users_tasks_relations
    FOR EACH ROW
EXECUTE FUNCTION increment_ticket_balance();


CREATE OR REPLACE FUNCTION decrement_ticket_balance()
    RETURNS TRIGGER AS
$$
BEGIN
    UPDATE callers
    SET ticket_balance = ticket_balance - 1
    WHERE address = NEW.caller_address;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER user_whitelist_purchase
    AFTER INSERT
    ON whitelist_relations
    FOR EACH ROW
EXECUTE FUNCTION decrement_ticket_balance();


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