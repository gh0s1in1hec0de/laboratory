CREATE TABLE reward_jettons
(
    master_address     address PRIMARY KEY,
    our_wallet_address address NOT NULL,
    metadata           JSONB   NOT NULL,

    current_balance    coins   NOT NULL DEFAULT 0,
    reward_amount      coins   NOT NULL CHECK ( reward_amount > 0 ),

    CHECK (current_balance > reward_amount)
);

CREATE OR REPLACE FUNCTION create_reward_pool_for_new_token_launch()
    RETURNS TRIGGER AS
$$
DECLARE
    reward_total RECORD;
BEGIN
    SELECT array_agg(master_address) AS master_addresses, array_agg(reward_amount) AS reward_amounts
    INTO reward_total
    FROM reward_jettons
    WHERE current_balance > reward_amount;

    INSERT INTO reward_pools (token_launch, reward_jetton, reward_amount)
    SELECT NEW.address, unnest(reward_total.master_addresses), unnest(reward_total.reward_amounts);

    UPDATE reward_jettons
    SET current_balance = current_balance - reward_amount
    WHERE master_address = ANY (reward_total.master_addresses);

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

CREATE OR REPLACE FUNCTION handle_reward_claim()
    RETURNS TRIGGER AS
$$
DECLARE
    current_balance coins;
BEGIN
    -- Get the current balance for the user and reward jetton
    SELECT balance
    INTO current_balance
    FROM user_reward_jetton_balances
    WHERE "user" = OLD."user"
      AND reward_jetton = OLD.reward_jetton
        FOR UPDATE; -- Locker

    IF current_balance - OLD.balance = 0 THEN
        -- Cleaning dead data
        DELETE
        FROM user_reward_jetton_balances
        WHERE "user" = OLD."user"
          AND reward_jetton = OLD.reward_jetton;
    ELSIF current_balance - OLD.balance > 0 THEN
        UPDATE user_reward_jetton_balances
        SET balance = balance - OLD.balance
        WHERE "user" = OLD."user"
          AND reward_jetton = OLD.reward_jetton;
    ELSE
        RAISE EXCEPTION 'Insufficient balance to claim. Current balance: %, Claim amount: %', current_balance, OLD.balance;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_handle_reward_claim
    AFTER UPDATE OF status
    ON user_launch_reward_positions
    FOR EACH ROW
    WHEN (NEW.status = 'claimed')
EXECUTE FUNCTION handle_reward_claim();


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
                INSERT INTO user_launch_reward_positions ("user", token_launch, reward_jetton, user_claim, balance)
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



