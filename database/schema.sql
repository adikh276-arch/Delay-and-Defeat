CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delay_sessions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    delay_time INT NOT NULL,
    urge_before INT NOT NULL,
    urge_after INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
