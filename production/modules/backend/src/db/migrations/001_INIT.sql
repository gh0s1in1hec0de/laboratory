CREATE DOMAIN telegram_id AS VARCHAR(512);
CREATE DOMAIN address AS VARCHAR(512);
CREATE DOMAIN coins AS BIGINT CHECK ( VALUE >= 0 );

-- In fact will be used only as core height storage, but may be extended later
CREATE TABLE heights
(
    contract_address address PRIMARY KEY,
    height           BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE users
(
    invited_by     telegram_id REFERENCES users (telegram_id),
    telegram_id    telegram_id PRIMARY KEY,
    nickname       TEXT,
    ticket_balance SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE callers
(
    "user"  telegram_id REFERENCES users (telegram_id),
    address address PRIMARY KEY
);

CREATE TYPE launch_version AS ENUM ('V1', 'V2A');
CREATE TABLE token_launches
(
    id                      SERIAL         NOT NULL,
    identifier              TEXT UNIQUE    NOT NULL,

    address                 address        NOT NULL PRIMARY KEY,
    creator                 address        NOT NULL REFERENCES callers (address),
    version                 launch_version NOT NULL,
    -- Original json, not one with url field only
    metadata                JSONB          NOT NULL,
    timings                 JSONB          NOT NULL,
    -- Time of transaction, where actual launch was created
    created_at              TIMESTAMP      NOT NULL,
    -- Both null by default
    is_successful           BOOLEAN,
    deployed_jetton_address address,
    deployed_pool_address   address
);

CREATE TYPE user_action_type AS ENUM ('whitelist_buy', 'public_buy', 'whitelist_refund', 'public_refund', 'total_refund', 'claim');
CREATE TABLE user_actions
(
    id             BIGSERIAL PRIMARY KEY,
    actor          address          NOT NULL REFERENCES callers (address),
    token_launch   address          NOT NULL REFERENCES token_launches (address),
    action_type    user_action_type NOT NULL,
    -- Balance update format mock see onchain/contracts/tlb/main.tlb#L163
    whitelist_tons coins            NOT NULL DEFAULT 0,
    public_tons    coins            NOT NULL DEFAULT 0,
    jettons        coins            NOT NULL DEFAULT 0,
    -- Timestamp from on-chain data
    lt             BIGINT           NOT NULL,
    timestamp      TIMESTAMP        NOT NULL,
    query_id       BIGINT           NOT NULL,
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

-- Balances can't be negative by design
CREATE TABLE user_balances
(
    caller         address NOT NULL REFERENCES callers (address),
    token_launch   address NOT NULL REFERENCES token_launches (address),
    whitelist_tons coins   NOT NULL DEFAULT 0,
    public_tons    coins   NOT NULL DEFAULT 0,
    jettons        coins   NOT NULL DEFAULT 0,
    CONSTRAINT user_token_launch_unique UNIQUE (caller, token_launch)
);
