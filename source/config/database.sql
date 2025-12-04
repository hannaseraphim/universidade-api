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
    password    VARCHAR(512) NOT NULL
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
    FOREIGN KEY(id_teacher) REFERENCES users(id) ON DELETE CASCADE 
);

-- =========================
--  MATRÍCULAS
-- =========================
CREATE TABLE enrolment (
  id_student  INT NOT NULL,
  id_class    INT NOT NULL,
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active      BOOLEAN NOT NULL DEFAULT true,
  status      ENUM("passed", "failed", "enrolled") DEFAULT ("enrolled"),

  PRIMARY KEY(id_student, id_class, enrolled_at),
  FOREIGN KEY(id_student) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(id_class) REFERENCES classes(id) ON DELETE CASCADE
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

    FOREIGN KEY(id_class) REFERENCES classes(id) ON DELETE CASCADE
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
    due_date     DATE NOT NULL,

    FOREIGN KEY(id_class) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE submissions (
    id_student   INT NOT NULL,
    id_activity  INT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    content      VARCHAR(100),
    PRIMARY KEY(id_student, id_activity),

    FOREIGN KEY(id_student) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(id_activity) REFERENCES activities(id) ON DELETE CASCADE
);

CREATE TABLE grades (
    id_student      INT NOT NULL,
    id_activity     INT NOT NULL,
    grade           DECIMAL(3,1) NOT NULL,
    submission_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id_student, id_activity),
    FOREIGN KEY(id_student) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(id_activity) REFERENCES activities(id) ON DELETE CASCADE
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
    FOREIGN KEY(id_student) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(id_class) REFERENCES classes(id) ON DELETE CASCADE
);

-- =============================================
-- POPULAÇÃO INICIAL DO BANCO universidadedb
-- =============================================

--
INSERT INTO user_profiles (id, name) VALUES
  (1, 'Administrador'),
  (2, 'Professor'),
  (3, 'Aluno');

-- Usuários

INSERT INTO users (name, email, password) VALUES
("Hanna Seraphim", "hanna@uni.com", "$2a$10$z.2U47YdOfemyXA8hXGFq.0jQvikIQTv4fUrEsZzfaGlBBDSQPAju"),
("Carlos Mendes", "carlos@uni.com", "$2a$10$Q9j4hX9uV7kZCwQhYfFZQOeJkYp2t6QnYwZkYkYwZkYkYwZkYkYw"),
("Fernanda Lima", "fernanda@uni.com", "$2a$10$A7h3kL9uP5mZCwQhYfFZQOeJkYp2t6QnYwZkYkYwZkYkYwZkYkYw"),
("João Pereira", "joao@uni.com", "$2a$10$B8j5mN2vT6nZCwQhYfFZQOeJkYp2t6QnYwZkYkYwZkYkYwZkYkYw"),
("Mariana Souza", "mariana@uni.com", "$2a$10$C9k6oP3wU7oZCwQhYfFZQOeJkYp2t6QnYwZkYkYwZkYkYwZkYkYw"),
("Roberto Silva", "roberto@uni.com", "$2a$10$D0l7pQ4xV8pZCwQhYfFZQOeJkYp2t6QnYwZkYkYwZkYkYwZkYkYw");

-- Associações
INSERT INTO associated (id_user, id_profile) VALUES
(1, 3),
(1, 2),
(1, 1),
(2, 2),
(3, 3),
(4, 3),
(5, 3),
(6, 2);

-- CURSOS
INSERT INTO courses (id, name, description, max_students) VALUES
(1, 'Banco de Dados I',  'Introdução a bancos de dados relacionais.', 30),
(2, 'Programação Web',   'Fundamentos de desenvolvimento Web.',       30),
(3, 'Algoritmos',        'Lógica de programação e estruturas básicas.', 30),
(4, 'Engenharia de Software', 'Princípios de engenharia e boas práticas.', 40),
(5, 'Redes de Computadores', 'Fundamentos de redes e protocolos.', 35);


-- TURMAS
INSERT INTO classes (id_course, id_teacher, starts_on, ends_on, period, name, max_students, archived) VALUES
(1, 2, '2025-02-01', '2025-06-30', 'Matutino', 'BDI - Turma A', 30, false),
(2, 6, '2025-02-01', '2025-06-30', 'Noturno', 'Web - Turma B', 25, false),
(3, 2, '2025-08-01', '2025-12-15', 'Vespertino', 'Algoritmos - Turma C', 30, false);
  

-- MATRÍCULAS
INSERT INTO enrolment (id_student, id_class, enrolled_at, active, status) VALUES
(3, 1, NOW(), true, "failed"),
(4, 1, NOW(), true, "enrolled"),
(5, 2, NOW(), true, "passed"),
(1, 3, NOW(), true, "passed");

-- MATERIAIS DE ESTUDO
INSERT INTO materials (id_class, title, description) VALUES
(1, "Introdução ao SQL", "Slides sobre comandos básicos."),
(1, "Modelo Relacional", "PDF com exemplos de tabelas."),
(2, "HTML e CSS", "Apostila introdutória."),
(3, "Estruturas de Controle", "Exercícios práticos.");

-- ATIVIDADES
INSERT INTO activities (id_class, title, description, type, max_grade, due_date) VALUES
(1, "Lista de Exercícios 1", "Consultas SQL básicas.", "Exercício", 10.0, '2025-03-15'),
(1, "Projeto Final", "Criação de banco de dados.", "Projeto", 20.0, '2025-06-20'),
(2, "Site Estático", "Construção de página HTML.", "Projeto", 15.0, '2025-04-10'),
(3, "Exercícios de Algoritmos", "Problemas de lógica.", "Exercício", 10.0, '2025-09-20');

-- ENVIOS
INSERT INTO submissions (id_student, id_activity, content) VALUES
(3, 1, "Consultas SQL resolvidas."),
(4, 1, "Resolução parcial."),
(5, 3, "Página HTML com CSS."),
(1, 4, "Resolução dos problemas de lógica.");

-- NOTAS
INSERT INTO grades (id_student, id_activity, grade) VALUES
(3, 1, 9.0),
(4, 1, 7.5),
(5, 3, 14.0),
(1, 4, 8.5);

-- HISTÓRICO
INSERT INTO history (id_student, id_class, final_grade, status) VALUES
(3, 1, 8.5, "Aprovado"),
(4, 1, 7.0, "Aprovado"),
(5, 2, 14.0, "Aprovado"),
(1, 3, 8.5, "Aprovado");

-- Arquivar turmas caso elas passem do tempo de término a cada 7 dias
CREATE EVENT archive_classes
ON SCHEDULE EVERY 7 DAY
DO
  UPDATE classes
  SET archived = TRUE
  WHERE ends_on < CURDATE();