INSERT INTO users (telegram_id, nickname)
VALUES (123456789, 'Pavel Durov');

INSERT INTO callers ("user", address)
VALUES (123456789, '0xPavelDurovIceBaths228');

INSERT INTO tasks (name, description)
VALUES ('task1', 'some description');

DO
$$
    BEGIN
       FOR i in 1..5 LOOP
               INSERT INTO tasks (name, description)
               VALUES (
                       'task' || lpad(to_hex(i), 1, '0'),
                       'some description'
                      );
           end loop;
    end;
$$;

DO
$$
    BEGIN
        FOR i IN 1..20 LOOP
                INSERT INTO token_launches (address, creator, name, metadata, timings)
                VALUES (
                           '0x' || lpad(to_hex(i), 48, '0'),
                           '0xPavelDurovIceBaths228',
                           'TokenLaunch_' || i,
                           ('{"description": "Test metadata for launch ' || i || '"}')::jsonb,
                           '{"start_time": "2024-09-01T00:00:00", "end_time": "2024-09-30T23:59:59"}'::jsonb
                       );
            END LOOP;
    END
$$;

