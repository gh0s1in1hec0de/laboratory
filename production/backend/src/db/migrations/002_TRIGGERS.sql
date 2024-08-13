CREATE OR REPLACE FUNCTION update_user_balance()
    RETURNS TRIGGER AS
$$
BEGIN
    IF NEW.action_type IN ('whitelist_buy', 'whitelist_refund') THEN
        UPDATE user_balances
        SET whitelist_tons = whitelist_tons + CASE
                                    WHEN NEW.action_type = 'whitelist_buy' THEN NEW.whitelist_tons
                                    WHEN NEW.action_type = 'whitelist_refund' THEN -NEW.whitelist_tons
            END
        WHERE "user" = NEW.actor
          AND token_launch = NEW.token_launch;

        IF NOT FOUND THEN
            IF NEW.action_type = 'whitelist_buy' THEN
                INSERT INTO user_balances ("user", token_launch, whitelist_tons)
                VALUES (NEW.actor, NEW.token_launch, NEW.whitelist_tons);
            ELSE
                RAISE EXCEPTION 'no existing whitelist_tons balance found for user % and token launch %', NEW.actor, NEW.token_launch;
            END IF;
        END IF;

    ELSIF NEW.action_type IN ('public_buy', 'public_refund') THEN
        UPDATE user_balances
        SET public_tons = public_tons + CASE
                                            WHEN NEW.action_type = 'public_buy' THEN NEW.public_tons
                                            WHEN NEW.action_type = 'public_refund' THEN -NEW.public_tons
            END,
            jettons     = jettons + CASE
                                        WHEN NEW.action_type = 'public_buy' THEN NEW.jettons
                                        WHEN NEW.action_type = 'public_refund' THEN -NEW.jettons
                END
        WHERE "user" = NEW.actor
          AND token_launch = NEW.token_launch;

        IF NOT FOUND THEN
            IF NEW.action_type = 'public_buy' THEN
                INSERT INTO user_balances ("user", token_launch, public_tons, jettons)
                VALUES (NEW.actor, NEW.token_launch, NEW.public_tons, NEW.jettons);
            ELSE
                RAISE EXCEPTION 'no existing public_tons or jettons balance found for user % and token launch %', NEW.actor, NEW.token_launch;
            END IF;
        END IF;

    ELSIF NEW.action_type = 'claim' THEN
        UPDATE user_balances
        SET whitelist_tons     = whitelist_tons - NEW.whitelist_tons,
            public_tons = public_tons - NEW.public_tons,
            jettons     = jettons - NEW.jettons
        WHERE "user" = NEW.actor
          AND token_launch = NEW.token_launch;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'no existing balance found for user % and token launch % for claim', NEW.actor, NEW.token_launch;
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