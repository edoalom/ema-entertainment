CREATE DATABASE IF NOT EXISTS kpop_agents CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kpop_agents;

CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  agent_name VARCHAR(50) NOT NULL,
  role ENUM('user','assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (session_id),
  INDEX idx_agent (agent_name)
);

CREATE TABLE IF NOT EXISTS api_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_name VARCHAR(50) NOT NULL,
  input_tokens INT,
  output_tokens INT,
  duration_ms INT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emails_inbox (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE,
  from_address VARCHAR(255),
  to_alias VARCHAR(100),
  subject TEXT,
  body TEXT,
  category VARCHAR(100),
  assigned_agent VARCHAR(50),
  status ENUM('new','processing','replied','escalated') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emails_outbox (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inbox_id INT,
  from_alias VARCHAR(100),
  to_address VARCHAR(255),
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMP,
  status ENUM('pending','sent','failed') DEFAULT 'pending',
  FOREIGN KEY (inbox_id) REFERENCES emails_inbox(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(50),
  assigned_by VARCHAR(50) DEFAULT 'TOM',
  status ENUM('todo','in_progress','done','blocked') DEFAULT 'todo',
  priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
