CREATE TABLE IF NOT EXISTS districts (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_districts_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('citizen','cmo_admin','department_officer') NOT NULL,
  department_id INT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY ix_users_department_id (department_id),
  KEY ix_users_role_active (role,is_active),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grievances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference_number VARCHAR(32) NOT NULL,
  citizen_id BIGINT UNSIGNED NOT NULL,
  district VARCHAR(80) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  status ENUM('Submitted','Under Review','In Progress','Resolved','Reopened') NOT NULL DEFAULT 'Submitted',
  ai_department_suggestion INT UNSIGNED NULL,
  ai_category_suggestion VARCHAR(100) NULL,
  ai_priority_suggestion ENUM('Low','Medium','High') NULL,
  ai_summary TEXT NULL,
  assigned_department_id INT UNSIGNED NULL,
  assigned_officer_id BIGINT UNSIGNED NULL,
  due_at DATETIME NULL,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_grievances_reference (reference_number),
  KEY ix_grievances_citizen (citizen_id),
  KEY ix_grievances_status (status),
  KEY ix_grievances_district (district),
  KEY ix_grievances_category (category),
  KEY ix_grievances_priority (priority),
  KEY ix_grievances_department (assigned_department_id),
  KEY ix_grievances_officer (assigned_officer_id),
  KEY ix_grievances_created (created_at),
  CONSTRAINT fk_grievances_citizen FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_grievances_district FOREIGN KEY (district) REFERENCES districts(name) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_grievances_ai_department FOREIGN KEY (ai_department_suggestion) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_grievances_department FOREIGN KEY (assigned_department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_grievances_officer FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grievance_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grievance_id BIGINT UNSIGNED NOT NULL,
  previous_status ENUM('Submitted','Under Review','In Progress','Resolved','Reopened') NULL,
  new_status ENUM('Submitted','Under Review','In Progress','Resolved','Reopened') NOT NULL,
  remarks TEXT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_history_grievance_created (grievance_id,created_at),
  KEY ix_history_changed_by (changed_by),
  CONSTRAINT fk_history_grievance FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS department_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grievance_id BIGINT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  officer_id BIGINT UNSIGNED NULL,
  assigned_by BIGINT UNSIGNED NOT NULL,
  assignment_notes TEXT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_assignments_grievance (grievance_id,assigned_at),
  KEY ix_assignments_department (department_id),
  KEY ix_assignments_officer (officer_id),
  KEY ix_assignments_assigned_by (assigned_by),
  CONSTRAINT fk_assignments_grievance FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_officer FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_admin FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grievance_id BIGINT UNSIGNED NOT NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_attachments_grievance (grievance_id),
  KEY ix_attachments_uploader (uploaded_by),
  CONSTRAINT fk_attachments_grievance FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS citizen_feedback (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  grievance_id BIGINT UNSIGNED NOT NULL,
  citizen_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comments TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_feedback_grievance (grievance_id),
  KEY ix_feedback_citizen (citizen_id),
  CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_feedback_grievance FOREIGN KEY (grievance_id) REFERENCES grievances(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_feedback_citizen FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_enquiries_email_created (email,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
