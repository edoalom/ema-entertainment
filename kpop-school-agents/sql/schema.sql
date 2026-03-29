CREATE DATABASE IF NOT EXISTS kpop_agents CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kpop_agents;

-- Conversazioni con gli agenti
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

-- Log chiamate API
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

-- Email in arrivo (per VAL)
CREATE TABLE IF NOT EXISTS emails_inbox (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE,
  from_address VARCHAR(255),
  to_alias VARCHAR(100),
  subject TEXT,
  body TEXT,
  category VARCHAR(100)
