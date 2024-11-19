INSERT INTO token_launches (address,
                            identifier,
                            creator,
                            version,
                            metadata,
                            timings,
                            total_supply,
                            platform_share,
                            min_ton_treshold,
                            created_at)
VALUES ('',
        '',
        '',
        'V1',
        '{
          "uri": "onchain_metadata_link_here"
        }',
           -- Unix time seconds here
        '{
          "startTime": "",
          "creatorRoundEndTime": "",
          "wlRoundEndTime": "",
          "publicRoundEndTime": "",
          "endTime": ""
        }',
        1000000,
        1.5,
        1000000000,
           -- Tx created_at field
        1697731300);