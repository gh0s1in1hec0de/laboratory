-- TODO Replace 256 with max address length
CREATE DOMAIN address AS VARCHAR(256);
CREATE DOMAIN coins AS BIGINT;
CREATE TABLE users
(
    address  address PRIMARY KEY,
    nickname TEXT
);

CREATE TABLE token_launches
(
    address         address PRIMARY KEY,
    creator         address NOT NULL REFERENCES users (address),
    -- Now it is JSONB, but, after we'll determine format of metadata, we should rewrite this as explicit fields
    metadata        JSONB   NOT NULL,
    -- On creator buyout we just update this field
    creator_balance BIGINT DEFAULT 0
);

CREATE TYPE user_action AS ENUM ('wl_buy', 'public_buy', 'wl_refund', 'public_refund', 'total_refund', 'claim');
CREATE TABLE user_actions
(
    actor       address     NOT NULL REFERENCES users (address),
    action_type user_action NOT NULL,
    -- Balance update format mock see onchain/contracts/tlb/main.tlb#L163
    wl_tons     coins       NOT NULL DEFAULT 0,
    public_tons coins       NOT NULL DEFAULT 0,
    jettons     coins       NOT NULL DEFAULT 0,
    timestamp   TIMESTAMP   NOT NULL,
    PRIMARY KEY (actor, action_type, timestamp)
);

CREATE TABLE user_balances
(
    "user"         address NOT NULL REFERENCES users (address),
    token_launch   address NOT NULL REFERENCES token_launches (address),
    wl_balance     coins   NOT NULL DEFAULT 0,
    public_balance coins   NOT NULL DEFAULT 0,
    jetton_balance coins   NOT NULL DEFAULT 0,
    CONSTRAINT user_token_launch_unique UNIQUE ("user", token_launch)
);