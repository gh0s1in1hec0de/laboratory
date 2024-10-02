CREATE TABLE tasks
(
    task_id     SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_tickets SMALLINT NOT NULL DEFAULT 1,
    created_at unix_time_seconds NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())
);

CREATE TABLE users_tasks_relations
(
    caller_address address REFERENCES callers (address),
    task_id       SERIAL REFERENCES tasks (task_id),
    PRIMARY KEY (caller_address, task_id)
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
    -- Обновляем баланс билетов только если сумма не превысит 3
    UPDATE callers
    SET ticket_balance = LEAST(3, ticket_balance + (SELECT reward_tickets FROM tasks WHERE task_id = NEW.task_id))
    WHERE address = NEW.caller_address
    AND ticket_balance < 3;  -- Условие для обновления только если текущий баланс меньше 3

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
    -- Уменьшаем количество билетов у пользователя
    UPDATE callers
    SET ticket_balance = GREATEST(0, ticket_balance - (SELECT reward_tickets FROM tasks WHERE task_id = OLD.task_id))
    WHERE address = OLD.caller_address;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_task_removal
    AFTER DELETE
    ON users_tasks_relations
    FOR EACH ROW
EXECUTE FUNCTION decrement_ticket_balance();


-- maybe delete?
-- CREATE OR REPLACE FUNCTION decrement_ticket_balance()
--     RETURNS TRIGGER AS
-- $$
-- BEGIN
--     UPDATE users
--     SET ticket_balance = ticket_balance - 1
--     WHERE telegram_id = (SELECT "user" FROM callers WHERE address = NEW.caller_address);

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;


-- CREATE TRIGGER user_whitelist_purchase
--     AFTER INSERT
--     ON whitelist_relations
--     FOR EACH ROW
-- EXECUTE FUNCTION decrement_ticket_balance();





-- CREATE EXTENSION pg_cron;

-- CREATE OR REPLACE FUNCTION update_weekly_balances()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Update the balance in summary_tickets_balances for each caller
--     INSERT INTO summary_tickets_balances (caller, ticket_balance)
--     SELECT address, ticket_balance
--     FROM callers
--     WHERE ticket_balance > 0
--     ON CONFLICT (caller) 
--     DO UPDATE SET ticket_balance = summary_tickets_balances.ticket_balance + EXCLUDED.ticket_balance;

--     -- Reset the ticket balance in the callers table after updating
--     UPDATE callers
--     SET ticket_balance = 0
--     WHERE ticket_balance > 0;

-- END;
-- $$ LANGUAGE plpgsql;

-- Call trigger with pg_cron library every Sunday at 00:00. Also can use pgAgent...
-- SELECT SELECT cron.schedule('0 0 * * 0', 'SELECT update_weekly_balances();');

-- Manual call
-- SELECT update_weekly_balances();



CREATE OR REPLACE FUNCTION process_staged_tasks()
    RETURNS void AS
$$
DECLARE
    task_record RECORD;
BEGIN
    -- Итерируем по всем задачам, добавленным более недели назад и еще не отмеченным как staged
    FOR task_record IN
        SELECT * FROM tasks
        WHERE created_at <= EXTRACT(EPOCH FROM NOW()) - (7 * 24 * 60 * 60)
    LOOP
        -- Переводим задачу в состояние staged
        UPDATE tasks
        SET staged = TRUE
        WHERE task_id = task_record.task_id;

        -- Итерируем по всем пользователям, связанным с этой задачей
        UPDATE summary_tickets_balances stb
        SET ticket_balance = stb.ticket_balance + (
            SELECT reward_tickets
            FROM tasks
            WHERE task_id = task_record.task_id
        )
        WHERE caller IN (
            SELECT caller_address
            FROM users_tasks_relations
            WHERE task_id = task_record.task_id
        );

        -- Обновляем баланс билетов в таблице callers
        UPDATE callers c
        SET ticket_balance = ticket_balance - (
            SELECT reward_tickets
            FROM tasks
            WHERE task_id = task_record.task_id
        )
        WHERE address IN (
            SELECT caller_address
            FROM users_tasks_relations
            WHERE task_id = task_record.task_id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_and_process_tasks()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Вызываем функцию обработки задач
    PERFORM process_staged_tasks();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completion_check
    AFTER INSERT OR UPDATE
    ON users_tasks_relations
    FOR EACH ROW
EXECUTE FUNCTION check_and_process_tasks();

