INSERT INTO callers (address)
VALUES ('0:57b14c1667a2bd7d7b3fce9a7450034fe7c3ced5da3607dd55bdeeea28283d19');

INSERT INTO reward_jettons (master_address, metadata, current_balance, reward_amount)
VALUES ('jetton_address_1', '{}', 1000000000, 20000000);
INSERT INTO reward_jettons (master_address, metadata, current_balance, reward_amount)
VALUES ('jetton_address_2', '{}', 2000000000, 40000000);
INSERT INTO reward_jettons (master_address, metadata, current_balance, reward_amount)
VALUES ('jetton_address_3', '{}', 3000000000, 60000000);

INSERT INTO token_launches (id, identifier, address, creator, version, metadata, timings, total_supply, created_at)
VALUES (1, 'launch_1', '0:66286b4745a0624888d1c7ef17cbb19d1ef773dafbe94666c208568ab1a99145', 'creator_address_1', 'V1', '{}', '{}', 1000000000000, 1620000000);
INSERT INTO token_launches (id, identifier, address, creator, version, metadata, timings, total_supply, created_at)
VALUES (2, 'launch_2', '0:0:0077f625d523d7214bf6f04056a954738075eef6427ed6ce5a9184370e9774b0', 'creator_address_2', 'V1', '{}', '{}', 2000000000000, 1621000000);
SELECT * FROM reward_pools;

INSERT INTO user_claims (token_launch, actor, jetton_amount)
VALUES ('launch_address_1', '0:57b14c1667a2bd7d7b3fce9a7450034fe7c3ced5da3607dd55bdeeea28283d19', 15000000000);
INSERT INTO user_claims (token_launch, actor, jetton_amount)
VALUES ('launch_address_2', '0:57b14c1667a2bd7d7b3fce9a7450034fe7c3ced5da3607dd55bdeeea28283d19', 60000000000);

SELECT *
FROM user_claims;
SELECT *
FROM user_launch_reward_positions;
SELECT *
FROM user_reward_jetton_balances;
SELECT *
FROM user_launch_reward_errors;

UPDATE user_launch_reward_positions
SET status = 'claimed'
WHERE token_launch = 'launch_address_1';