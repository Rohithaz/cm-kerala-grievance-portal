ALTER TABLE grievance_history
  ADD COLUMN citizen_visible BOOLEAN NOT NULL DEFAULT FALSE AFTER remarks;
