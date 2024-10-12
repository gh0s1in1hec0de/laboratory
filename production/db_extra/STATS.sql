CREATE OR REPLACE FUNCTION synthetic_numeric_function()
    RETURNS NUMERIC AS
$$
DECLARE
    result NUMERIC(39, 0);
BEGIN
    -- Simple multiplication and division using NUMERIC
    result := (999999999999999999999999::NUMERIC(78, 0) * 888888888888888888888888::NUMERIC(78, 0)) / 777777777777777777::NUMERIC(39, 0);
    RETURN result;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION synthetic_bigint_function()
    RETURNS BIGINT AS
$$
DECLARE
    result BIGINT;
BEGIN
    -- Use smaller values that are within the BIGINT range
    result := (999999999::BIGINT * 888888888::BIGINT) / 777777::BIGINT;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Measuring NUMERIC function performance
EXPLAIN ANALYZE
SELECT synthetic_numeric_function();

-- Measuring BIGINT function performance
EXPLAIN ANALYZE
SELECT synthetic_bigint_function();
