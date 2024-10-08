CREATE TABLE reward_jettons
(
    master_address  address PRIMARY KEY,
    metadata        JSONB,

    current_balance coins NOT NULL DEFAULT 0,
    reward_amount   coins NOT NULL CHECK ( reward_amount > 0 ),

    CHECK (current_balance > reward_amount)
);

CREATE OR REPLACE FUNCTION create_reward_pool_for_new_token_launch()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Insert a new reward pool for each reward_jetton where current_balance > reward_amount
    INSERT INTO reward_pools (token_launch, reward_jetton, reward_amount)
    SELECT NEW.address, master_address, reward_amount
    FROM reward_jettons
    WHERE current_balance > reward_amount;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_reward_pool
    AFTER INSERT
    ON token_launches
    FOR EACH ROW
EXECUTE FUNCTION create_reward_pool_for_new_token_launch();


CREATE TABLE reward_pools
(
    token_launch  address NOT NULL REFERENCES token_launches (address),
    reward_jetton address NOT NULL REFERENCES reward_jettons (master_address),

    reward_amount coins   NOT NULL DEFAULT 0 CHECK (reward_amount > 0),

    PRIMARY KEY (token_launch, reward_jetton)
);

CREATE TYPE user_launch_reward_status AS ENUM ('unclaimed', 'processing', 'claimed');
CREATE TABLE user_launch_rewards
(
    "user"        address                   NOT NULL REFERENCES callers (address),
    token_launch  address                   NOT NULL REFERENCES token_launches (address),
    reward_jetton address                   NOT NULL REFERENCES reward_jettons (master_address),
    user_claim    BIGINT                    NOT NULL REFERENCES user_claims (id),

    balance       coins                     NOT NULL DEFAULT 0,
    status        user_launch_reward_status NOT NULL DEFAULT 'unclaimed',
    created_at    TIMESTAMP                 NOT NULL DEFAULT now(),

    PRIMARY KEY ("user", token_launch, reward_jetton)
);

CREATE TABLE user_reward_jetton_balances
(
    "user"        address NOT NULL REFERENCES callers (address),
    reward_jetton address NOT NULL REFERENCES reward_jettons (master_address),

    balance       coins   NOT NULL DEFAULT 0,
    PRIMARY KEY ("user", reward_jetton)
);

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
-- ###

CREATE OR REPLACE FUNCTION create_user_launch_reward_for_claim()
    RETURNS TRIGGER AS
$$
DECLARE
    reward_jetton_value      address;
    calculated_balance_value coins;
BEGIN
    -- Start a transaction for the trigger's operations
    BEGIN
        -- Loop through the reward pools and store the calculated values into variables
        FOR reward_jetton_value, calculated_balance_value IN
            SELECT rp.reward_jetton,
                   rp.reward_amount * NEW.jetton_amount / tl.total_supply
            FROM reward_pools rp
                     JOIN token_launches tl ON rp.token_launch = tl.address
            WHERE rp.token_launch = NEW.token_launch
            LOOP
                -- Insert into user_launch_reward
                INSERT INTO user_launch_rewards ("user", token_launch, reward_jetton, user_claim, balance)
                VALUES (NEW.actor, NEW.token_launch, reward_jetton_value, NEW.id, calculated_balance_value);

                -- Upsert (Insert or Update) the user_reward_jetton_balances
                INSERT INTO user_reward_jetton_balances ("user", reward_jetton, balance)
                VALUES (NEW.actor, reward_jetton_value, calculated_balance_value)
                ON CONFLICT ("user", reward_jetton)
                    DO UPDATE SET balance = user_reward_jetton_balances.balance + EXCLUDED.balance;
            END LOOP;
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM log_user_launch_reward_error(NEW.id, SQLERRM);
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_launch_reward
    AFTER INSERT
    ON user_claims
    FOR EACH ROW
EXECUTE FUNCTION create_user_launch_reward_for_claim();

-- Code, related to claims of corresponding withdrawals
CREATE TABLE user_claim_applications
(
    id           VARCHAR(512) NOT NULL,
    "user"       address      NOT NULL REFERENCES callers (address),
    token_launch address REFERENCES token_launches (address),

    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    satisfied    BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE OR REPLACE FUNCTION mark_rewards_as_processing()
    RETURNS TRIGGER AS
$$
BEGIN
    -- Update user_launch_reward to 'processing' for rewards created before the user_claim_application
    UPDATE user_launch_rewards
    SET status = 'processing'
    WHERE "user" = NEW."user"
      AND created_at < NEW.created_at
      AND status = 'unclaimed'
      AND (NEW.token_launch IS NULL OR token_launch = NEW.token_launch);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_rewards_processing
    AFTER INSERT
    ON user_claim_applications
    FOR EACH ROW
EXECUTE FUNCTION mark_rewards_as_processing();


CREATE OR REPLACE FUNCTION mark_rewards_as_claimed()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.satisfied THEN
        -- Update user_launch_reward to 'claimed' if token_launch is provided or based on creation time
        UPDATE user_launch_rewards
        SET status = 'claimed'
        WHERE "user" = NEW."user"
          AND created_at < NEW.created_at
          AND status = 'processing'
          AND (NEW.token_launch IS NULL OR token_launch = NEW.token_launch);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_rewards_claimed
    AFTER UPDATE OF satisfied
    ON user_claim_applications
    FOR EACH ROW
EXECUTE FUNCTION mark_rewards_as_claimed();

-- Listening for user launch reward errors
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




