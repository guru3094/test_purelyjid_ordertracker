CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.sync_execution (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    execution_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    execution_end TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('SUCCESS','FAILED','RUNNING')),

    rows_read INTEGER NOT NULL DEFAULT 0,

    rows_inserted INTEGER NOT NULL DEFAULT 0,

    rows_updated INTEGER NOT NULL DEFAULT 0,

    rows_failed INTEGER NOT NULL DEFAULT 0,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
