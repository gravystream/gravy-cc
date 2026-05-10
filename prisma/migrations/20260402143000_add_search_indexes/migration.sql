-- Add full-text search indexes for creator discovery
-- GIN index on niches array for fast array containment checks
CREATE INDEX IF NOT EXISTS "idx_creator_niches" ON "CreatorProfile" USING GIN ("niches");

-- GIN index on platforms array
CREATE INDEX IF NOT EXISTS "idx_creator_platforms" ON "CreatorProfile" USING GIN ("platforms");

-- GIN index on languages array
CREATE INDEX IF NOT EXISTS "idx_creator_languages" ON "CreatorProfile" USING GIN ("languages");

-- B-tree indexes for common filters
CREATE INDEX IF NOT EXISTS "idx_creator_availability" ON "CreatorProfile" ("availability");
CREATE INDEX IF NOT EXISTS "idx_creator_verified" ON "CreatorProfile" ("isVerified");
CREATE INDEX IF NOT EXISTS "idx_creator_rating" ON "CreatorProfile" ("avgRating" DESC);
CREATE INDEX IF NOT EXISTS "idx_creator_location" ON "CreatorProfile" ("location");

-- Full-text search index using tsvector for text search across name, bio, tagline
CREATE INDEX IF NOT EXISTS "idx_creator_fulltext" ON "CreatorProfile" USING GIN (
  to_tsvector('english',
    coalesce("displayName", '') || ' ' ||
    coalesce("username", '') || ' ' ||
    coalesce("bio", '') || ' ' ||
    coalesce("tagline", '') || ' ' ||
    coalesce("location", '')
  )
);

-- Campaign search indexes
CREATE INDEX IF NOT EXISTS "idx_campaign_status" ON "Campaign" ("status");
CREATE INDEX IF NOT EXISTS "idx_campaign_brand" ON "Campaign" ("brandId");
CREATE INDEX IF NOT EXISTS "idx_campaign_fulltext" ON "Campaign" USING GIN (
  to_tsvector('english',
    coalesce("title", '') || ' ' ||
    coalesce("description", '')
  )
);

-- Job search indexes
CREATE INDEX IF NOT EXISTS "idx_job_status" ON "Job" ("status");
CREATE INDEX IF NOT EXISTS "idx_job_fulltext" ON "Job" USING GIN (
  to_tsvector('english',
    coalesce("title", '') || ' ' ||
    coalesce("description", '')
  )
);
