-- =========================
-- BANCO ACADEMIA - SCHEMA
-- DDL somente (sem seeds)
-- Para aplicar junto com os seeds, veja db/seed.sample.sql
-- =========================

DROP DATABASE IF EXISTS academia;
CREATE DATABASE academia;
USE academia;

-- =========================
-- ADMIN (opcional)
-- =========================
CREATE TABLE Adm (
  id_admin INT AUTO_INCREMENT PRIMARY KEY,
  email    VARCHAR(100) NOT NULL UNIQUE,
  senha    VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- =========================
-- PROFESSOR
-- =========================
CREATE TABLE Professor (
  id_professor INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(100) NOT NULL,
  cpf          CHAR(11)     NOT NULL UNIQUE,
  email        VARCHAR(100) NOT NULL UNIQUE,
  senha        VARCHAR(255) NOT NULL,
  status       ENUM('Ativo','Inativo') DEFAULT 'Ativo',
  criado_em    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- ALUNO (vinculado a 1 professor)
-- =========================
CREATE TABLE Aluno (
  id_aluno       INT AUTO_INCREMENT PRIMARY KEY,
  id_professor   INT NOT NULL,
  nome           VARCHAR(100) NOT NULL,
  cpf            CHAR(11)     NOT NULL UNIQUE,
  email          VARCHAR(100) NOT NULL UNIQUE,
  senha          VARCHAR(255) NOT NULL,
  status         ENUM('Ativo','Inativo') DEFAULT 'Ativo',
  tipo_matricula ENUM('Mensal','Trimestral','Semestral','Anual') DEFAULT 'Mensal',
  data_pagamento DATE NULL,
  id_treino_ativo INT NULL,
  criado_em      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aluno_professor
    FOREIGN KEY (id_professor) REFERENCES Professor(id_professor)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_aluno_prof (id_professor)
) ENGINE=InnoDB;

-- =========================
-- EXERCICIO (catálogo)
-- =========================
CREATE TABLE Exercicio (
  id_exercicio   INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(100) NOT NULL,
  descricao      TEXT,
  grupo_muscular VARCHAR(50),
  equipamento    VARCHAR(100),
  UNIQUE KEY uq_exercicio_nome (nome)
) ENGINE=InnoDB;

-- =========================
-- TREINO / FICHA
-- =========================
CREATE TABLE Treino (
  id_treino     INT AUTO_INCREMENT PRIMARY KEY,
  id_aluno      INT NOT NULL,
  id_professor  INT NOT NULL,
  nome          VARCHAR(100) NOT NULL,
  data_criacao  DATE NOT NULL DEFAULT (CURRENT_DATE),
  observacoes   TEXT,
  CONSTRAINT fk_treino_aluno
    FOREIGN KEY (id_aluno) REFERENCES Aluno(id_aluno)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_treino_prof
    FOREIGN KEY (id_professor) REFERENCES Professor(id_professor)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_treino_aluno (id_aluno),
  INDEX idx_treino_prof (id_professor)
) ENGINE=InnoDB;

-- FK do treino ativo (agora Treino já existe)
ALTER TABLE Aluno
  ADD CONSTRAINT fk_aluno_treino_ativo
  FOREIGN KEY (id_treino_ativo) REFERENCES Treino(id_treino)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================
-- TREINO_EXERCICIO
-- =========================
CREATE TABLE Treino_Exercicio (
  id_treino     INT NOT NULL,
  id_exercicio  INT NOT NULL,
  ordem         INT DEFAULT 1,
  series        INT,
  repeticoes    INT,
  carga_kg      DECIMAL(6,2),
  descanso_segundos INT,
  PRIMARY KEY (id_treino, id_exercicio),
  CONSTRAINT fk_tx_treino
    FOREIGN KEY (id_treino) REFERENCES Treino(id_treino)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tx_exercicio
    FOREIGN KEY (id_exercicio) REFERENCES Exercicio(id_exercicio)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_tx_treino (id_treino),
  INDEX idx_tx_exercicio (id_exercicio)
) ENGINE=InnoDB;
