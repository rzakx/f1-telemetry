-- THIS FILE CONTAINS TEMPLATE STRUCTURE FOR CASSANDRA f1telemetry KEYSPACE

CREATE KEYSPACE IF NOT EXISTS f1telemetry WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
USE f1telemetry;

CREATE TABLE access (
    user_id              uuid,
    access_token         text,
    access_token_expiry  timestamp,
    refresh_token        text,
    refresh_token_expiry timestamp,
    device_info          text,
    last_used            timestamp,
    primary key (user_id, refresh_token)
);

CREATE MATERIALIZED VIEW access_by_at AS
SELECT * FROM access
WHERE access_token IS NOT NULL AND user_id IS NOT NULL AND refresh_token IS NOT NULL
PRIMARY KEY (access_token, user_id, refresh_token);

CREATE MATERIALIZED VIEW access_by_rt AS
SELECT * FROM access
WHERE refresh_token IS NOT NULL AND user_id IS NOT NULL
PRIMARY KEY (refresh_token, user_id);

CREATE TABLE accounts (
    id          uuid primary key,
    login       text,
    email       text,
    passwd      text,
    avatar      text,
    banner      text,
    favcar      int,
    favtrack    int,
    ip          text,
    registered  timestamp,
    reset       text
);

CREATE INDEX accounts_login_idx ON accounts (login);
CREATE INDEX accounts_email_idx ON accounts (email);
CREATE INDEX accounts_ip_idx ON accounts (ip);
CREATE INDEX accounts_reset_idx ON accounts (reset);

create table setups (
    id      uuid primary key,
    author  uuid,
    weather int,
    track   int,
    type    int,
    car     int,
    public  boolean,
    barf    int,
    barr    int,
    brakeb  int,
    brakep  int,
    camberf decimal,
    camberr decimal,
    created timestamp,
    diffoff int,
    diffon  int,
    fuel    int,
    heightf int,
    heightr int,
    susf    int,
    susr    int,
    tirefl  decimal,
    tirefr  decimal,
    tirerl  decimal,
    tirerr  decimal,
    toef    decimal,
    toer    decimal,
    wingf   int,
    wingr   int
);

CREATE INDEX setups_author_idx ON setups (author);
CREATE INDEX setups_car_idx ON setups (car);
CREATE INDEX setups_public_idx ON setups (public);
CREATE INDEX setups_track_idx ON setups (track);
CREATE INDEX setups_type_idx ON setups (type);
CREATE INDEX setups_weather_idx ON setups (weather);