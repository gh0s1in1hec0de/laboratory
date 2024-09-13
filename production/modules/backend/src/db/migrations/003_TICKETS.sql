CREATE TABLE tasks
(
    task_id     SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
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
    UPDATE users
    SET ticket_balance = ticket_balance + 1
    WHERE telegram_id = (SELECT "user" FROM callers WHERE address = NEW.caller);

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
    UPDATE users
    SET ticket_balance = ticket_balance - 1
    WHERE telegram_id = (SELECT "user" FROM callers WHERE address = NEW.caller_address);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER user_whitelist_purchase
    AFTER INSERT
    ON whitelist_relations
    FOR EACH ROW
EXECUTE FUNCTION decrement_ticket_balance();
