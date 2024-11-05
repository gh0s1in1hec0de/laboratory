CREATE TABLE reward_jettons
(
    master_address     address PRIMARY KEY,
    our_wallet_address address NOT NULL,
    metadata           JSONB   NOT NULL,

    current_balance    coins   NOT NULL DEFAULT 0,
    locked_for_rewards coins   NOT NULL DEFAULT 0,
    reward_amount      coins   NOT NULL CHECK ( reward_amount > 0 ),
    is_active          BOOLEAN NOT NULL,
    CHECK (current_balance > reward_amount)
);

CREATE OR REPLACE FUNCTION create_reward_pools_for_new_launch()
    RETURNS TRIGGER AS
$$
DECLARE
    reward_total RECORD;
BEGIN
    SELECT array_agg(master_address) AS master_addresses, array_agg(reward_amount) AS reward_amounts
    INTO reward_total
    FROM reward_jettons
    WHERE current_balance > locked_for_rewards + reward_amount
      AND is_active = TRUE;

    INSERT INTO reward_pools (token_launch, reward_jetton, reward_amount)
    SELECT NEW.address, unnest(reward_total.master_addresses), unnest(reward_total.reward_amounts);

    UPDATE reward_jettons
    SET locked_for_rewards = locked_for_rewards + reward_amount
    WHERE master_address = ANY (reward_total.master_addresses);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_reward_pool
    AFTER INSERT
    ON token_launches
    FOR EACH ROW
EXECUTE FUNCTION create_reward_pools_for_new_launch();

CREATE OR REPLACE FUNCTION return_reward_pools()
    RETURNS TRIGGER AS
$$
DECLARE
    reward_info RECORD;
BEGIN
    FOR reward_info IN
        SELECT reward_jetton, reward_amount
        FROM reward_pools
        WHERE token_launch = OLD.address
        LOOP
            UPDATE reward_jettons
            SET locked_for_rewards = GREATEST(locked_for_rewards - reward_info.reward_amount, 0)
            WHERE master_address = reward_info.reward_jetton;
        END LOOP;

    DELETE
    FROM reward_pools
    WHERE token_launch = OLD.address;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_failed_token_launch
    AFTER UPDATE OF is_successful
    ON token_launches
    FOR EACH ROW
    WHEN (OLD.is_successful IS DISTINCT FROM NEW.is_successful AND NEW.is_successful = FALSE)
EXECUTE FUNCTION return_reward_pools();

CREATE TABLE reward_pools
(
    token_launch  address NOT NULL REFERENCES token_launches (address),
    reward_jetton address NOT NULL REFERENCES reward_jettons (master_address),

    reward_amount coins   NOT NULL DEFAULT 0 CHECK (reward_amount > 0),

    PRIMARY KEY (token_launch, reward_jetton)
);

CREATE TYPE user_launch_reward_status AS ENUM ('unclaimed', 'claimed');
CREATE TABLE user_launch_reward_positions
(
    "user"        address                   NOT NULL REFERENCES callers (address),
    token_launch  address                   NOT NULL REFERENCES token_launches (address),
    reward_jetton address                   NOT NULL REFERENCES reward_jettons (master_address),
    user_claim    BIGINT                    NOT NULL REFERENCES user_claims (id),

    balance       coins                     NOT NULL DEFAULT 0,
    status        user_launch_reward_status NOT NULL DEFAULT 'unclaimed',

    PRIMARY KEY ("user", token_launch, reward_jetton)
);

CREATE TABLE user_reward_jetton_balances
(
    "user"        address NOT NULL REFERENCES callers (address),
    reward_jetton address NOT NULL REFERENCES reward_jettons (master_address),

    balance       coins   NOT NULL DEFAULT 0,
    PRIMARY KEY ("user", reward_jetton)
);

CREATE OR REPLACE FUNCTION update_balances_after_claim()
    RETURNS TRIGGER AS
$$
DECLARE
    current_user_balance   coins;
    current_jetton_balance coins;
    current_locked_balance coins;
BEGIN

    SELECT balance
    INTO current_user_balance
    FROM user_reward_jetton_balances
    WHERE "user" = OLD."user"
      AND reward_jetton = OLD.reward_jetton
        FOR UPDATE;

    -- Well, I know - but handling this case super-duper way will bloat the code x3
    IF current_user_balance - OLD.balance > 0 THEN
        UPDATE user_reward_jetton_balances
        SET balance = current_user_balance - OLD.balance
        WHERE "user" = OLD."user"
          AND reward_jetton = OLD.reward_jetton;
    ELSE
        DELETE
        FROM user_reward_jetton_balances
        WHERE "user" = OLD."user"
          AND reward_jetton = OLD.reward_jetton;
    END IF;


    SELECT current_balance, locked_for_rewards
    INTO current_jetton_balance, current_locked_balance
    FROM reward_jettons
    WHERE master_address = OLD.reward_jetton
        FOR UPDATE;

    IF current_jetton_balance - OLD.balance < 0 THEN
        UPDATE reward_jettons
        SET current_balance = 0
        WHERE master_address = OLD.reward_jetton;
    ELSE
        UPDATE reward_jettons
        SET current_balance = current_jetton_balance - OLD.balance
        WHERE master_address = OLD.reward_jetton;
    END IF;

    IF current_locked_balance - OLD.balance < 0 THEN
        UPDATE reward_jettons
        SET locked_for_rewards = 0
        WHERE master_address = OLD.reward_jetton;
    ELSE
        UPDATE reward_jettons
        SET locked_for_rewards = current_locked_balance - OLD.balance
        WHERE master_address = OLD.reward_jetton;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_reward_claim_and_jetton_update
    AFTER UPDATE OF status
    ON user_launch_reward_positions
    FOR EACH ROW
    WHEN (NEW.status = 'claimed')
EXECUTE FUNCTION update_balances_after_claim();

-- ERROR HANDLING
CREATE TABLE user_launch_reward_errors
(
    id         BIGSERIAL PRIMARY KEY,
    user_claim BIGINT NOT NULL REFERENCES user_claims (id),
    details    TEXT   NOT NULL
);

CREATE OR REPLACE FUNCTION log_user_launch_reward_error(user_claim BIGINT, details TEXT) RETURNS void AS
$$
BEGIN
    INSERT INTO user_launch_reward_errors (user_claim, details)
    VALUES (user_claim, details);
END;
$$ LANGUAGE plpgsql;

-- Calculating rewards per user claim
CREATE OR REPLACE FUNCTION calculate_user_rewards_for_claim()
    RETURNS TRIGGER AS
$$
DECLARE
    reward_jetton_value      address;
    calculated_balance_value NUMERIC(39, 0); -- Final result is a whole number
BEGIN
    -- Loop through the reward pools and store the calculated values into variables
    FOR reward_jetton_value, calculated_balance_value IN
        SELECT rp.reward_jetton,
               NEW.jetton_amount::NUMERIC(78, 0) * rp.reward_amount::NUMERIC(78, 0) / tl.total_supply::NUMERIC(39, 0)
        -- Ensure final result is a whole number
        FROM reward_pools rp
                 JOIN token_launches tl ON rp.token_launch = tl.address
        WHERE rp.token_launch = NEW.token_launch
        LOOP
            -- Insert into user_launch_reward
            INSERT INTO user_launch_reward_positions ("user", token_launch, reward_jetton, user_claim, balance)
            VALUES (NEW.actor, NEW.token_launch, reward_jetton_value, NEW.id, calculated_balance_value);

            -- Upsert (Insert or Update) the user_reward_jetton_balances
            INSERT INTO user_reward_jetton_balances ("user", reward_jetton, balance)
            VALUES (NEW.actor, reward_jetton_value, calculated_balance_value)
            ON CONFLICT ("user", reward_jetton)
                DO UPDATE SET balance = user_reward_jetton_balances.balance + EXCLUDED.balance;
        END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_launch_reward
    AFTER INSERT
    ON user_claims
    FOR EACH ROW
EXECUTE FUNCTION calculate_user_rewards_for_claim();

-- Errors tracing to client-
CREATE OR REPLACE FUNCTION notify_user_launch_reward_error()
    RETURNS trigger AS
$$
BEGIN
    PERFORM pg_notify(
            'user_launch_reward_error',
            json_build_object(
                    'id', NEW.id,
                    'user_claim', NEW.user_claim,
                    'details', NEW.details
            )::text
            );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_user_launch_reward_error
    AFTER INSERT
    ON user_launch_reward_errors
    FOR EACH ROW
EXECUTE FUNCTION notify_user_launch_reward_error();