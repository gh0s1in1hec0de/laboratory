CREATE DOMAIN coins AS NUMERIC(39, 0) CHECK ( VALUE >= 0 );

CREATE TABLE launch_metadata
(
    onchain_metadata_link TEXT NOT NULL PRIMARY KEY,
    telegram_link         TEXT,
    x_link                TEXT,
    website               TEXT,
    extra                 TEXT
);

CREATE TYPE launch_version AS ENUM ('V1', 'V2A', 'V2');
CREATE TABLE token_launches
(
    id                           SERIAL            NOT NULL,
    address                      address           NOT NULL PRIMARY KEY,
    identifier                   TEXT              NOT NULL,

    creator                      address           NOT NULL,
    version                      launch_version    NOT NULL,
    -- Original json, not one with url field only
    metadata                     JSONB             NOT NULL,
    timings                      JSONB             NOT NULL,
    total_supply                 coins             NOT NULL,
    platform_share               FLOAT             NOT NULL CHECK (platform_share >= 0 AND platform_share <= 100),

    -- Time of transaction, where actual launch was created
    created_at                   unix_time_seconds NOT NULL,
    -- All null by default
    is_successful                BOOLEAN,
    post_deploy_enrollment_stats JSONB,
    dex_data                     JSONB
);

CREATE TABLE whitelist_relations
(
    token_launch_address address REFERENCES token_launches (address),
    caller_address       address REFERENCES callers (address),
    PRIMARY KEY (token_launch_address, caller_address)
);

CREATE TYPE user_action_type AS ENUM ('whitelist_buy', 'public_buy', 'whitelist_refund', 'public_refund', 'total_refund', 'claim');
CREATE TABLE user_actions
(
    id             BIGSERIAL PRIMARY KEY,
    actor          address           NOT NULL REFERENCES callers (address),
    token_launch   address           NOT NULL REFERENCES token_launches (address),
    action_type    user_action_type  NOT NULL,
    -- Balance update format mock see onchain/contracts/tlb/main.tlb#L163
    whitelist_tons coins             NOT NULL DEFAULT 0,
    public_tons    coins             NOT NULL DEFAULT 0,
    jettons        coins             NOT NULL DEFAULT 0,
    -- Timestamp from on-chain data
    lt             BIGINT            NOT NULL,
    timestamp      unix_time_seconds NOT NULL,
    query_id       BIGINT            NOT NULL,
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

-- Separate table for claims with actual claimed jettons value
-- It is user by dispenser to count reward after
CREATE TABLE user_claims
(
    id            BIGSERIAL PRIMARY KEY,
    token_launch  address NOT NULL REFERENCES token_launches (address),
    actor         address NOT NULL REFERENCES callers (address),
    jetton_amount coins   NOT NULL CHECK ( jetton_amount > 0 ),
    -- As user is able to claim jettons only once for one launch
    UNIQUE (actor, token_launch)
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

CREATE TABLE launch_balances
(
    token_launch           address PRIMARY KEY REFERENCES token_launches (address),
    creator_tons_collected coins NOT NULL DEFAULT 0,
    wl_tons_collected      coins NOT NULL DEFAULT 0,
    pub_tons_collected     coins NOT NULL DEFAULT 0,
    total_tons_collected   coins NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION register_actor_fallback() RETURNS TRIGGER AS
$$
BEGIN
    -- Check if the actor (caller) exists in the callers table
    IF NOT EXISTS (SELECT 1 FROM callers WHERE address = NEW.actor) THEN
        -- Insert a new caller with the actor's address and default values
        INSERT INTO callers (address)
        VALUES (NEW.actor);
    END IF;

    -- Continue with the insertion in user_actions
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_verify_actor
    BEFORE INSERT
    ON user_actions
    FOR EACH ROW
EXECUTE FUNCTION register_actor_fallback();
