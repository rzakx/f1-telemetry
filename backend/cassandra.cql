-- THIS FILE CONTAINS TEMPLATE STRUCTURE FOR CASSANDRA f1telemetry KEYSPACE
-- NOTE: it's crucial to change cassandra.yaml config FILE
-- materialized_views_enabled: true
-- sasi_indexes_enabled: true

-- SAI are definitely more efficient than SASI indexes, but
-- SAI doesnt support LIKE '%val%' clauses...
-- There are ongoing development trends targeting LIKE clause for SAI indexes in cassandra 6.0

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

DROP INDEX IF EXISTS accounts_login_idx;
CREATE CUSTOM INDEX accounts_login_idx ON accounts (login)
    USING 'org.apache.cassandra.index.sai.StorageAttachedIndex'
    WITH OPTIONS = {
        'case_sensitive': false,
        'normalize': true,
        'ascii': true
    };

DROP INDEX IF EXISTS accounts_login_like;
CREATE CUSTOM INDEX accounts_login_like ON accounts (login)
    USING 'org.apache.cassandra.index.sasi.SASIIndex'
    WITH OPTIONS = {
        'mode': 'PREFIX',
        'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.NonTokenizingAnalyzer',
        'case_sensitive': 'false'
    };

DROP INDEX IF EXISTS accounts_email_idx;
CREATE CUSTOM INDEX accounts_email_idx ON accounts (email)
    USING 'org.apache.cassandra.index.sai.StorageAttachedIndex'
    WITH OPTIONS = {
        'case_sensitive': false,
        'normalize': true,
        'ascii': true
    };

CREATE INDEX accounts_ip_idx ON accounts (ip);
CREATE INDEX accounts_reset_idx ON accounts (reset);

DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
    user_id uuid,
    session_id text,
    session_type int,
    track_id int,
    car_id int,
    last_update timestamp,
    completed boolean,
    summary text
    PRIMARY KEY (user_id, session_id)
);

CREATE INDEX ON sessions (last_update) USING 'sai';
CREATE INDEX ON sessions (track_id) USING 'sai';
CREATE INDEX ON sessions (car_id) USING 'sai';
CREATE INDEX ON sessions (session_type) USING 'sai';

CREATE TABLE frames (
    id text,
    frame int,
    data_type text,
    data text,
    PRIMARY KEY (id, frame, data_type)
) WITH CLUSTERING ORDER BY (frame ASC);

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