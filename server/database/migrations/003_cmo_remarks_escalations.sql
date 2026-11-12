CREATE TABLE IF NOT EXISTS grievance_remarks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grievance_id BIGINT UNSIGNED NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  remark TEXT NOT NULL,
  visibility ENUM('internal','citizen') NOT NULL DEFAULT 'internal',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_remarks_grievance_created (grievance_id, created_at),
  KEY ix_remarks_author (created_by),
  CONSTRAINT fk_remarks_grievance FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_remarks_author FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grievance_escalations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grievance_id BIGINT UNSIGNED NOT NULL,
  escalated_by BIGINT UNSIGNED NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_escalations_grievance_created (grievance_id, created_at),
  KEY ix_escalations_author (escalated_by),
  CONSTRAINT fk_escalations_grievance FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_escalations_author FOREIGN KEY (escalated_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
