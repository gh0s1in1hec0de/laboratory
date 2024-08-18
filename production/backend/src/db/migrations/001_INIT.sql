-- TODO Replace 256 with max address length
CREATE DOMAIN address AS VARCHAR(256);
CREATE DOMAIN coins AS BIGINT CHECK ( VALUE >= 0 );

-- A little trick to store height that is related to core
CREATE TABLE global_settings
(
    setting_key   TEXT PRIMARY KEY,
    setting_value TIMESTAMP
);


CREATE TABLE users
(
    address  address PRIMARY KEY,
    nickname TEXT
);

CREATE TABLE token_launches
(
    address         address PRIMARY KEY,
    creator         address   NOT NULL REFERENCES users (address),
    -- Now it is JSONB, but, after we'll determine format of metadata, we should rewrite this as explicit fields
    metadata        JSONB     NOT NULL,
    -- On creator buyout we just update this field
    creator_balance BIGINT DEFAULT 0,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    -- lt of last transaction we know about
    height          BIGINT DEFAULT 0
);

CREATE TYPE user_action_type AS ENUM ('whitelist_buy', 'public_buy', 'whitelist_refund', 'public_refund', 'total_refund', 'claim');
CREATE TABLE user_actions
(
    id             BIGSERIAL PRIMARY KEY,
    actor          address          NOT NULL REFERENCES users (address),
    token_launch   address          NOT NULL REFERENCES token_launches (address),
    action_type    user_action_type NOT NULL,
    -- Balance update format mock see onchain/contracts/tlb/main.tlb#L163
    whitelist_tons coins            NOT NULL DEFAULT 0,
    public_tons    coins            NOT NULL DEFAULT 0,
    jettons        coins            NOT NULL DEFAULT 0,
    -- Timestamp from on-chain data
    timestamp      TIMESTAMP        NOT NULL,
    -- TODO Replace with constraint: actor, action_type, timestamp must be unique
    UNIQUE (actor, action_type, timestamp),

    CONSTRAINT chk_whitelist_buy CHECK (
        (action_type = 'whitelist_buy' AND whitelist_tons > 0 AND public_tons = 0 AND jettons = 0)
            OR (action_type != 'whitelist_buy')
        ),
    CONSTRAINT chk_public_buy CHECK (
        (action_type = 'public_buy' AND public_tons > 0 AND jettons > 0 AND whitelist_tons = 0)
            OR (action_type != 'public_buy')
        ),
    CONSTRAINT chk_whitelist_refund CHECK (
        (action_type = 'whitelist_refund' AND whitelist_tons > 0 AND public_tons = 0 AND jettons = 0)
            OR (action_type != 'whitelist_refund')
        ),
    CONSTRAINT chk_public_refund CHECK (
        (action_type = 'public_refund' AND public_tons > 0 AND jettons > 0 AND whitelist_tons = 0)
            OR (action_type != 'public_refund')
        )
);

CREATE TABLE user_balances
(
    "user"         address NOT NULL REFERENCES users (address),
    token_launch   address NOT NULL REFERENCES token_launches (address),
    whitelist_tons coins   NOT NULL DEFAULT 0,
    public_tons    coins   NOT NULL DEFAULT 0,
    jettons        coins   NOT NULL DEFAULT 0,
    CONSTRAINT user_token_launch_unique UNIQUE ("user", token_launch)
);
