INSERT INTO districts (name) VALUES
('Thiruvananthapuram'),('Kollam'),('Pathanamthitta'),('Alappuzha'),('Kottayam'),('Idukki'),('Ernakulam'),('Thrissur'),('Palakkad'),('Malappuram'),('Kozhikode'),('Wayanad'),('Kannur'),('Kasaragod')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO departments (name,description) VALUES
('Public Works Department','Maintains public roads, bridges and government infrastructure.'),
('Health and Family Welfare Department','Oversees public health services, hospitals and family welfare programmes.'),
('General Education Department','Supports school education and government educational institutions.'),
('Higher Education Department','Coordinates colleges, universities and higher education services.'),
('Local Self Government Department','Works with local bodies on civic services and community infrastructure.'),
('Water Resources Department','Manages water supply, irrigation and water resource infrastructure.'),
('Kerala State Electricity Board','Provides electricity distribution and related customer services.'),
('Transport Department','Administers public transport and road transport services.'),
('Revenue Department','Coordinates land administration and revenue services.'),
('Police Department','Provides public safety and law enforcement services.'),
('Agriculture Department','Supports farmers, agricultural services and related programmes.'),
('Civil Supplies Department','Oversees public distribution and civil supplies services.')
ON DUPLICATE KEY UPDATE description=VALUES(description);
