CREATE OR REPLACE FUNCTION notify_user_balance_error()
    RETURNS trigger AS
$$
BEGIN
    PERFORM pg_notify(
            'user_balance_error',
            json_build_object(
                    'id', NEW.id,
                    'action', NEW.action,
                    'details', NEW.details
            )::text
            );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_user_balance_error
    AFTER INSERT
    ON user_balance_errors
    FOR EACH ROW
EXECUTE FUNCTION notify_user_balance_error();
