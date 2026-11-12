CREATE TABLE IF NOT EXISTS action_taken_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grievance_id BIGINT UNSIGNED NOT NULL,
  submitted_by BIGINT UNSIGNED NOT NULL,
  report_title VARCHAR(200) NOT NULL,
  action_description TEXT NOT NULL,
  findings TEXT NULL,
  resolution_details TEXT NULL,
  report_status ENUM('draft','submitted','approved','changes_requested') NOT NULL DEFAULT 'draft',
  reviewed_by BIGINT UNSIGNED NULL,
  review_remarks TEXT NULL,
  submitted_at DATETIME NULL,
  reviewed_at DATETIME NULL,
  previous_report_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_action_reports_grievance (grievance_id, created_at),
  KEY ix_action_reports_status (report_status, submitted_at),
  KEY ix_action_reports_author (submitted_by),
  CONSTRAINT fk_action_reports_grievance FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_action_reports_author FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_action_reports_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_action_reports_previous FOREIGN KEY (previous_report_id) REFERENCES action_taken_reports(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS action_taken_report_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id BIGINT UNSIGNED NOT NULL,
  reviewed_by BIGINT UNSIGNED NOT NULL,
  decision ENUM('approved','changes_requested') NOT NULL,
  remarks TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_report_reviews_report (report_id, created_at),
  CONSTRAINT fk_report_reviews_report FOREIGN KEY (report_id) REFERENCES action_taken_reports(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_report_reviews_user FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS action_taken_report_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_report_attachments_report (report_id),
  CONSTRAINT fk_report_attachments_report FOREIGN KEY (report_id) REFERENCES action_taken_reports(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_report_attachments_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
