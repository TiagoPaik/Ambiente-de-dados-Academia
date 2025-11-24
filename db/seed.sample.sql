-- =========================
-- BANCO ACADEMIA - SEEDS (SAMPLE / SANITIZED)
-- Dados fictícios para desenvolvimento / testes.
-- Não contém informações sensíveis de produção.
-- =========================

USE academia;

-- ADMIN (opcional)
INSERT INTO Adm (email, senha) VALUES
('admin@academia.com','123');

-- PROFESSORES
INSERT INTO Professor (nome, cpf, email, senha) VALUES
('Carlos Silva', '11111111111', 'carlos@academia.com', '123'),
('Paula Souza',  '22222222222', 'paula@academia.com',  '123');

-- ALUNOS
INSERT INTO Aluno (id_professor, nome, cpf, email, senha) VALUES
((SELECT id_professor FROM Professor WHERE email='carlos@academia.com'),
 'João Aluno', '33333333333', 'joao@aluno.com','123'),
((SELECT id_professor FROM Professor WHERE email='paula@academia.com'),
 'Maria Aluna', '44444444444', 'maria@aluna.com','123');

-- EXERCICIOS
INSERT INTO Exercicio (nome, grupo_muscular) VALUES
('Supino Reto','Peito'),
('Puxada Frontal','Costas'),
('Agachamento Livre','Pernas');

-- TREINO DE EXEMPLO
INSERT INTO Treino (id_aluno, id_professor, nome, observacoes)
VALUES (
  (SELECT id_aluno FROM Aluno WHERE email='joao@aluno.com'),
  (SELECT id_professor FROM Professor WHERE email='carlos@academia.com'),
  'Treino A',
  'Foco em peito e costas'
);

-- Itens da ficha
INSERT INTO Treino_Exercicio
(id_treino, id_exercicio, ordem, series, repeticoes, carga_kg, descanso_segundos)
SELECT t.id_treino, e.id_exercicio, 1, 4, 10, 40, 90
FROM Treino t
JOIN Exercicio e ON e.nome='Supino Reto'
WHERE t.nome='Treino A'
LIMIT 1;

-- Define a ficha ativa do João
UPDATE Aluno
SET id_treino_ativo = (
  SELECT id_treino FROM Treino WHERE nome='Treino A' LIMIT 1
)
WHERE email='joao@aluno.com';
