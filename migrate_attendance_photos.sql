-- Migration: Add attendance_photos table
CREATE TABLE IF NOT EXISTS attendance_photos (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL,
    project_id INTEGER,
    photo_data BYTEA NOT NULL,
    photo_filename VARCHAR(255) DEFAULT 'photo.jpg',
    approval_status VARCHAR(20) DEFAULT 'pending',
    approved_by INTEGER,
    approved_at TIMESTAMP,
    rejected_by INTEGER,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    timestamp_captured TIMESTAMP,
    timestamp_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude FLOAT,
    longitude FLOAT,
    location_accuracy FLOAT,
    company_id INTEGER REFERENCES companies(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_photos_company ON attendance_photos(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_photos_staff ON attendance_photos(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_photos_status ON attendance_photos(approval_status);
