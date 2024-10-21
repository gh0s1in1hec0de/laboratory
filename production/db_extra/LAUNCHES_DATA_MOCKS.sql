INSERT INTO launch_metadata(onchain_metadata_link, telegram_link, x_link, website, influencer_support)
VALUES ('onchain_metadata_link_1', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_2', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_3', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_4', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_5', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_6', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_7', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_8', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_9', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_10', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_11', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_12', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_13', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_14', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_15', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_16', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_17', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_18', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_19', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_20', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_21', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_22', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_23', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_24', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_25', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_26', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_27', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_28', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_29', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_30', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_31', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_32', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_33', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_34', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_35', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_36', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE),
       ('onchain_metadata_link_37', 'https://t.me/launch_3', 'https://x.com/launch_3', 'https://launch3.com', TRUE);

INSERT INTO token_launches (address, identifier, creator, version, metadata, timings, total_supply, platform_share,
                            min_ton_treshold,
                            created_at, is_successful)
VALUES ('addr_1', 'Launch 1', 'creator_1', 'V1', '{
  "uri": "onchain_metadata_link_1"
}', '{}', 1000000, 1.5, 1000000000, 1697731200, TRUE),
       ('addr_2', 'Launch 2', 'creator_2', 'V2A', '{
         "uri": "onchain_metadata_link_2"
       }', '{}', 2000000, 1.5, 1000000000, 1697817600, TRUE),
       ('addr_3', 'Launch 3', 'creator_3', 'V1', '{
         "uri": "onchain_metadata_link_3"
       }', '{}', 1500000, 1.5, 1000000000, 1697904000, TRUE),
       ('addr_4', 'Launch 4', 'creator_4', 'V2A', '{
         "uri": "onchain_metadata_link_4"
       }', '{}', 1800000, 1.5, 1000000000, 1697990400, TRUE),
       ('addr_5', 'Launch 5', 'creator_5', 'V1', '{
         "uri": "onchain_metadata_link_5"
       }', '{}', 2500000, 1.5, 1000000000, 1698076800, TRUE),
       ('addr_6', 'Launch 6', 'creator_6', 'V2A', '{
         "uri": "onchain_metadata_link_6"
       }', '{}', 3000000, 1.5, 1000000000, 1698163200, TRUE),
       ('addr_7', 'Launch 7', 'creator_7', 'V1', '{
         "uri": "onchain_metadata_link_7"
       }', '{}', 2700000, 0.5, 1000000000, 1698249600, TRUE),
       ('addr_8', 'Launch 8', 'creator_8', 'V2A', '{
         "uri": "onchain_metadata_link_8"
       }', '{}', 3100000, 0.5, 1000000000, 1698336000, TRUE),
       ('addr_9', 'Launch 9', 'creator_9', 'V1', '{
         "uri": "onchain_metadata_link_9"
       }', '{}', 3200000, 0.5, 1000000000, 1698422400, TRUE),
       ('addr_10', 'Launch 10', 'creator_10', 'V2A', '{
         "uri": "onchain_metadata_link_10"
       }', '{}', 2900000, 0.5, 1000000000, 1698508800, TRUE),
       ('addr_11', 'Launch 11', 'creator_11', 'V1', '{
         "uri": "onchain_metadata_link_11"
       }', '{}', 3300000, 0.5, 1000000000, 1698595200, TRUE),
       ('addr_12', 'Launch 12', 'creator_12', 'V2A', '{
         "uri": "onchain_metadata_link_12"
       }', '{}', 3400000, 0.5, 1000000000, 1698681600, TRUE);
UPDATE launch_balances
SET total_tons_collected = 6000
WHERE token_launch = 'addr_1';
UPDATE launch_balances
SET total_tons_collected = 8000
WHERE token_launch = 'addr_2';
UPDATE launch_balances
SET total_tons_collected = 5000
WHERE token_launch = 'addr_3';
UPDATE launch_balances
SET total_tons_collected = 9000
WHERE token_launch = 'addr_4';
UPDATE launch_balances
SET total_tons_collected = 7000
WHERE token_launch = 'addr_5';

INSERT INTO token_launches (address, identifier, creator, version, metadata, timings, total_supply, platform_share,
                            min_ton_treshold,
                            created_at, is_successful)
VALUES ('addr_13', 'Launch 13', 'creator_13', 'V1', '{
  "uri": "onchain_metadata_link_14"
}', '{}', 1000000, 1.5, 1000000000, 1697731300, FALSE),
       ('addr_14', 'Launch 14', 'creator_14', 'V2A', '{
         "uri": "onchain_metadata_link_15"
       }', '{}', 2000000, 1.5, 1000000000, 1697817700, FALSE),
       ('addr_15', 'Launch 15', 'creator_15', 'V1', '{
         "uri": "onchain_metadata_link_16"
       }', '{}', 1500000, 1.5, 1000000000, 1697904100, FALSE),
       ('addr_16', 'Launch 16', 'creator_16', 'V2A', '{
         "uri": "onchain_metadata_link_17"
       }', '{}', 1800000, 1.5, 1000000000, 1697990500, FALSE),
       ('addr_17', 'Launch 17', 'creator_17', 'V1', '{
         "uri": "onchain_metadata_link_18"
       }', '{}', 2500000, 1.5, 1000000000, 1698076900, FALSE),
       ('addr_18', 'Launch 18', 'creator_18', 'V2A', '{
         "uri": "onchain_metadata_link_19"
       }', '{}', 3000000, 1.5, 1000000000, 1698163300, FALSE),
       ('addr_19', 'Launch 19', 'creator_19', 'V1', '{
         "uri": "onchain_metadata_link_20"
       }', '{}', 2700000, 0.5, 1000000000, 1698250000, FALSE),
       ('addr_20', 'Launch 20', 'creator_20', 'V2A', '{
         "uri": "onchain_metadata_link_21"
       }', '{}', 3100000, 0.5, 1000000000, 1698336400, FALSE),
       ('addr_21', 'Launch 21', 'creator_21', 'V1', '{
         "uri": "onchain_metadata_link_22"
       }', '{}', 3200000, 0.5, 1000000000, 1698422800, FALSE),
       ('addr_22', 'Launch 22', 'creator_22', 'V2A', '{
         "uri": "onchain_metadata_link_23"
       }', '{}', 2900000, 0.5, 1000000000, 1698509200, FALSE),
       ('addr_23', 'Launch 23', 'creator_23', 'V1', '{
         "uri": "onchain_metadata_link_24"
       }', '{}', 3300000, 0.5, 1000000000, 1698595600, FALSE),
       ('addr_24', 'Launch 24', 'creator_24', 'V2A', '{
         "uri": "onchain_metadata_link_25"
       }', '{}', 3400000, 0.5, 1000000000, 1698682000, FALSE);
UPDATE launch_balances
SET total_tons_collected = 3000
WHERE token_launch = 'addr_13';
UPDATE launch_balances
SET total_tons_collected = 3750
WHERE token_launch = 'addr_14';
UPDATE launch_balances
SET total_tons_collected = 2000
WHERE token_launch = 'addr_15';
UPDATE launch_balances
SET total_tons_collected = 4500
WHERE token_launch = 'addr_16';
UPDATE launch_balances
SET total_tons_collected = 1000
WHERE token_launch = 'addr_17';

INSERT INTO token_launches (address, identifier, creator, version, metadata, timings, total_supply, platform_share,
                            min_ton_treshold,
                            created_at, is_successful)
VALUES ('addr_25', 'Launch 25', 'creator_25', 'V1', '{
  "uri": "onchain_metadata_link_26"
}', '{}', 1000000, 1.5, 1000000000, 1697731400, NULL),
       ('addr_26', 'Launch 26', 'creator_26', 'V2A', '{
         "uri": "onchain_metadata_link_27"
       }', '{}', 2000000, 1.5, 1000000000, 1697817800, NULL),
       ('addr_27', 'Launch 27', 'creator_27', 'V1', '{
         "uri": "onchain_metadata_link_28"
       }', '{}', 1500000, 1.5, 1000000000, 1697904200, NULL),
       ('addr_28', 'Launch 28', 'creator_28', 'V2A', '{
         "uri": "onchain_metadata_link_29"
       }', '{}', 1800000, 1.5, 1000000000, 1697990600, NULL),
       ('addr_29', 'Launch 29', 'creator_29', 'V1', '{
         "uri": "onchain_metadata_link_30"
       }', '{}', 2500000, 1.5, 1000000000, 1698077000, NULL),
       ('addr_30', 'Launch 30', 'creator_30', 'V2A', '{
         "uri": "onchain_metadata_link_31"
       }', '{}', 3000000, 1.5, 1000000000, 1698163400, NULL),
       ('addr_31', 'Launch 31', 'creator_31', 'V1', '{
         "uri": "onchain_metadata_link_32"
       }', '{}', 2700000, 0.5, 1000000000, 1698250100, NULL),
       ('addr_32', 'Launch 32', 'creator_32', 'V2A', '{
         "uri": "onchain_metadata_link_33"
       }', '{}', 3100000, 0.5, 1000000000, 1698336500, NULL),
       ('addr_33', 'Launch 33', 'creator_33', 'V1', '{
         "uri": "onchain_metadata_link_34"
       }', '{}', 3200000, 0.5, 1000000000, 1698422900, NULL),
       ('addr_34', 'Launch 34', 'creator_34', 'V2A', '{
         "uri": "onchain_metadata_link_35"
       }', '{}', 2900000, 0.5, 1000000000, 1698509300, NULL),
       ('addr_35', 'Launch 35', 'creator_35', 'V1', '{
         "uri": "onchain_metadata_link_36"
       }', '{}', 3300000, 0.5, 1000000000, 1698595700, NULL),
       ('addr_36', 'Launch 36', 'creator_36', 'V2A', '{
         "uri": "onchain_metadata_link_37"
       }', '{}', 3400000, 0.5, 1000000000, 1698682100, NULL);

UPDATE launch_balances
SET total_tons_collected = 4000
WHERE token_launch = 'addr_25';
UPDATE launch_balances
SET total_tons_collected = 3500
WHERE token_launch = 'addr_26';
UPDATE launch_balances
SET total_tons_collected = 4200
WHERE token_launch = 'addr_27';
UPDATE launch_balances
SET total_tons_collected = 2500
WHERE token_launch = 'addr_28';
UPDATE launch_balances
SET total_tons_collected = 1500
WHERE token_launch = 'addr_29';

INSERT INTO callers (address)
VALUES ('meow'),
       ('meow1'),
       ('meow2'),
       ('meow3'),
       ('meow4');

-- User balances for the first 5 launches
INSERT INTO user_balances (caller, token_launch)
VALUES
-- Launch 1 with 5 balances
('meow', 'addr_1'),
('meow1', 'addr_1'),
('meow2', 'addr_1'),
('meow3', 'addr_1'),
('meow4', 'addr_1'),
-- Launch 2 with 4 balances
('meow', 'addr_2'),
('meow1', 'addr_2'),
('meow2', 'addr_2'),
('meow3', 'addr_2'),
-- Launch 3 with 3 balances
('meow', 'addr_3'),
('meow1', 'addr_3'),
('meow2', 'addr_3'),
-- Launch 4 with 2 balances
('meow', 'addr_4'),
('meow1', 'addr_4'),
-- Launch 5 with 1 balance
('meow', 'addr_5');


