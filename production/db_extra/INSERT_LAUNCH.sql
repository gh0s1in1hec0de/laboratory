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
VALUES ('0:569e61aae4246661b330fec24aaa8760d8bb22634fcaef7b86bbeab62be4d21f',
        'XMAS Xmas',
        '0:57b14c1667a2bd7d7b3fce9a7450034fe7c3ced5da3607dd55bdeeea28283d19',
        'V1',
        '{
          "symbol": "XMAS",
          "name": "Xmas",
          "description": "In cooperation with Santa and TON Blockchain",
          "image": "https://ipfs.io/ipfs/QmV6cq1UzdqDHQT1PnjxW8DvZYAByUuVh8uGK3yhJcv63e",
          "uri": "https://ipfs.io/ipfs/QmX1iE62YQHCkXa2UBgWCAi5KPgXruLm8TxpEnQRdbFYcd"
        }',
           -- Unix time seconds here
        '{
          "startTime": "1732209600",
          "creatorRoundEndTime": "1732209900",
          "wlRoundEndTime": "1732210200",
          "publicRoundEndTime": "1732210500",
          "endTime": "1732296900"
        }',
        2025000000000000,
        1.5,
        4000000000,
        1732208964);