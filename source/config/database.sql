-- =============================================
--  BANCO DE DADOS - GESTÃO DE CURSOS ONLINE
-- =============================================

DROP DATABASE IF EXISTS unidb;
CREATE DATABASE unidb;
USE unidb;

-- =========================
--  PERFIS E USUÁRIOS
-- =========================
CREATE TABLE user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(100) NOT NULL
);

CREATE TABLE associated (
    id_user     INT NOT NULL,
    id_profile  INT NOT NULL,
    PRIMARY KEY(id_user, id_profile),
    FOREIGN KEY(id_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(id_profile) REFERENCES user_profiles(id)
);

-- =========================
--  CURSOS E TURMAS
-- =========================
CREATE TABLE courses (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  VARCHAR(255),
    max_students INT NOT NULL
);

CREATE TABLE classes (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    id_course   INT NOT NULL,
    id_teacher   INT NOT NULL,
    starts_on    DATE NOT NULL,
    ends_on      DATE NOT NULL,
    period       VARCHAR(50),
    name         VARCHAR(100) NOT NULL,
    max_students INT NULL,
    archived     BOOLEAN NOT NULL DEFAULT false,

    FOREIGN KEY(id_course) REFERENCES courses(id) ON DELETE CASCADE, 
    FOREIGN KEY(id_teacher) REFERENCES users(id)
);

-- =========================
--  MATRÍCULAS
-- =========================
CREATE TABLE enrolment (
  id_student  INT NOT NULL,
  id_class    INT NOT NULL,
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active      BOOLEAN NOT NULL DEFAULT true,

  PRIMARY KEY(id_student, id_class),
  FOREIGN KEY(id_student) REFERENCES users(id),
  FOREIGN KEY(id_class) REFERENCES classes(id)
);

-- =========================
--  MATERIAIS DE AULA
-- =========================
CREATE TABLE materials (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    id_class    INT NOT NULL,
    title       VARCHAR(50) NOT NULL,
    description VARCHAR(100),
    posted_at   DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(id_class) REFERENCES classes(id)
);

-- =========================
--  ATIVIDADES / SUBMISSÕES / NOTAS
-- =========================
CREATE TABLE activities (
    id  INT AUTO_INCREMENT PRIMARY KEY,
    id_class     INT NOT NULL,
    title        VARCHAR(50) NOT NULL,
    description  VARCHAR(100),
    type         VARCHAR(50),
    max_grade    DECIMAL(3,1) NOT NULL,
    due_date     DATETIME NOT NULL,

    FOREIGN KEY(id_class) REFERENCES classes(id)
);

CREATE TABLE submissions (
    id_student   INT NOT NULL,
    id_activity  INT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    content      VARCHAR(100),
    PRIMARY KEY(id_student, id_activity),

    FOREIGN KEY(id_student) REFERENCES users(id),
    FOREIGN KEY(id_activity) REFERENCES activities(id)
);

CREATE TABLE grades (
    id_student      INT NOT NULL,
    id_activity     INT NOT NULL,
    grade           DECIMAL(3,1) NOT NULL,
    submission_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id_student, id_activity),
    FOREIGN KEY(id_student) REFERENCES users(id),
    FOREIGN KEY(id_activity) REFERENCES activities(id)
);

-- =========================
--  HISTÓRICO 
-- =========================
CREATE TABLE history (
    id_student  INT NOT NULL,
    id_class    INT NOT NULL,
    final_grade DECIMAL(3,1),
    status      VARCHAR(20),
    PRIMARY KEY(id_student, id_class),
    FOREIGN KEY(id_student) REFERENCES users(id),
    FOREIGN KEY(id_class) REFERENCES classes(id)
);

-- =============================================
-- POPULAÇÃO INICIAL DO BANCO universidadedb
-- =============================================

-- -- PERFIS DE USUÁRIO
INSERT INTO user_profiles (id, name) VALUES
  (1, 'ADMIN'),
  (2, 'TEACHER'),
  (3, 'STUDENT');

-- CURSOS
INSERT INTO courses (id, name, description, max_students) VALUES
  (1, 'Banco de Dados I',  'Introdução a bancos de dados relacionais.', 30),
  (2, 'Programação Web',   'Fundamentos de desenvolvimento Web.',       30),
  (3, 'Algoritmos',        'Lógica de programação e estruturas básicas.', 30);