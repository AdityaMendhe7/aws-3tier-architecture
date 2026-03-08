-- Run automatically by MySQL Docker container on first launch
-- Mirrors the RDS Aurora schema used in production

USE webappdb;

CREATE TABLE IF NOT EXISTS books (
  id          INT NOT NULL AUTO_INCREMENT,
  amount      DECIMAL(10,2) NOT NULL,
  description VARCHAR(100)  NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Seed data
INSERT INTO books (amount, description) VALUES
  (29.99, 'Clean Code - Robert C. Martin'),
  (49.99, 'Designing Data-Intensive Applications'),
  (39.99, 'The Phoenix Project'),
  (34.99, 'AWS Certified Solutions Architect Guide');
