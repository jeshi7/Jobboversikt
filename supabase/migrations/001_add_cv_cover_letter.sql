-- Migration: Add cv_text and cover_letter_text to applications table
-- Run this if you already have the database set up

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS cv_text TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_text TEXT;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN applications.cv_text IS 'Plain text version of the CV';
COMMENT ON COLUMN applications.cover_letter_text IS 'Plain text version of the cover letter';

