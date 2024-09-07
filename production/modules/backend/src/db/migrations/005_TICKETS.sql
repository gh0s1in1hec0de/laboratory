CREATE TABLE tasks
(
    task_id     SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE users_tasks_relation
(
    caller address REFERENCES callers (address),
    task   SERIAL REFERENCES tasks (task_id),
    PRIMARY KEY (caller, task)
);

-- This table can easily solve the problem of whitelists for each token-sale
CREATE TABLE whitelist_relations
(
    token_launch_address address REFERENCES token_launches (address),
    caller_address       address REFERENCES callers (address),
    PRIMARY KEY (token_launch_address, caller_address)
);