CREATE TABLE user_balance_errors
(
    id      BIGSERIAL PRIMARY KEY,
    action  BIGINT NOT NULL REFERENCES user_actions (id),
    details TEXT   NOT NULL
);

CREATE OR REPLACE FUNCTION log_user_action_error(action BIGINT, details TEXT) RETURNS void AS
$$
BEGIN
    INSERT INTO user_balance_errors (action, details)
    VALUES (action, details);
END;
$$ LANGUAGE plpgsql;

-- TODO Marry this function after release
CREATE OR REPLACE FUNCTION update_user_balance()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM callers WHERE address = NEW.actor) THEN
        INSERT INTO callers (address) VALUES (NEW.actor);
        PERFORM log_user_action_error(NEW.id, 'caller of the action not found among registered users');
    END IF;

    -- Handle negative values
    IF NEW.action_type IN ('whitelist_buy', 'whitelist_refund') THEN
        UPDATE user_balances
        SET whitelist_tons = CASE
                                 WHEN NEW.action_type = 'whitelist_buy'
                                     THEN whitelist_tons + NEW.whitelist_tons
                                 WHEN NEW.action_type = 'whitelist_refund'
                                     THEN 0
            END
        WHERE caller = NEW.actor
          AND token_launch = NEW.token_launch;

        IF NOT FOUND THEN
            IF NEW.action_type = 'whitelist_buy' THEN
                INSERT INTO user_balances (caller, token_launch, whitelist_tons)
                VALUES (NEW.actor, NEW.token_launch, NEW.whitelist_tons);
            ELSE
                PERFORM log_user_action_error(NEW.id, 'refund record can not be the first user balance update');
            END IF;
        END IF;

    ELSIF NEW.action_type IN ('public_buy', 'public_refund') THEN
        UPDATE user_balances
        SET public_tons = CASE
                              WHEN NEW.action_type = 'public_buy' THEN public_tons + NEW.public_tons
                              WHEN NEW.action_type = 'public_refund' THEN 0
            END,
            jettons     = CASE
                              WHEN NEW.action_type = 'public_buy' THEN jettons + NEW.jettons
                              WHEN NEW.action_type = 'public_refund' THEN 0
                END
        WHERE caller = NEW.actor
          AND token_launch = NEW.token_launch;

        IF NOT FOUND THEN
            IF NEW.action_type = 'public_buy' THEN
                INSERT INTO user_balances (caller, token_launch, public_tons, jettons)
                VALUES (NEW.actor, NEW.token_launch, NEW.public_tons, NEW.jettons);
            ELSE
                PERFORM log_user_action_error(NEW.id, 'refund record can not be the first user balance update');
            END IF;
        END IF;

    ELSIF NEW.action_type = 'claim' THEN
        DELETE
        FROM user_balances
        WHERE caller = NEW.actor
          AND token_launch = NEW.token_launch;

        IF NOT FOUND THEN
            PERFORM log_user_action_error(NEW.id, 'claim record can not be the first user balance update');

        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_balance
    AFTER INSERT
    ON user_actions
    FOR EACH ROW
EXECUTE FUNCTION update_user_balance();

-- One user can't have more than 15 addresses
CREATE OR REPLACE FUNCTION check_max_callers()
    RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM callers WHERE "user" = NEW."user") >= 15 THEN
        RAISE EXCEPTION 'a user cannot have more than 5 callers';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_max_callers
    BEFORE INSERT ON callers
    FOR EACH ROW
EXECUTE FUNCTION check_max_callers();

