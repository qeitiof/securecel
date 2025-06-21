-- ================================================
-- FUNÇÃO: Calcula duração da apólice em dias
-- ================================================
IF OBJECT_ID('dbo.fn_DuracaoApolice') IS NOT NULL
    DROP FUNCTION dbo.fn_DuracaoApolice;
GO

CREATE FUNCTION dbo.fn_DuracaoApolice (@apolice_id INT)
RETURNS INT
AS
BEGIN
    DECLARE @dias INT;

    SELECT @dias = DATEDIFF(DAY, data_inicio, data_fim)
    FROM Detalhes_Apolices
    WHERE apolice_id = @apolice_id;

    RETURN @dias;
END;
GO

-- ================================================
-- 1. Quantidade de apólices ativas em fevereiro/2025
-- ================================================
SELECT COUNT(*) AS total_ativas
FROM Detalhes_Apolices da
JOIN Status_Apolices sa ON da.status_apolice_id = sa.status_apolice_id
WHERE sa.nome_status = 'ATIVA'
  AND '2025-02-15' BETWEEN da.data_inicio AND da.data_fim;
GO

-- ================================================
-- 2. Clientes com múltiplas apólices ativas e seus planos
-- ================================================

-- Antes de rodar esse script, dar esse insert

INSERT INTO Apolices (cliente_id, celular_id, plano_id) VALUES (1, 2, 2);
INSERT INTO Detalhes_Apolices (apolice_id, data_inicio, data_fim, status_apolice_id)
VALUES (11, '2025-01-20', '2026-01-20', 1);


SELECT 
  c.nome AS cliente,
  COUNT(DISTINCT a.apolice_id) AS total_apolices,
  STUFF((
    SELECT DISTINCT ', ' + p2.nome_plano
    FROM Apolices a2
    JOIN Planos p2 ON a2.plano_id = p2.plano_id
    JOIN Detalhes_Apolices da2 ON a2.apolice_id = da2.apolice_id
    JOIN Status_Apolices sa2 ON da2.status_apolice_id = sa2.status_apolice_id
    WHERE a2.cliente_id = c.cliente_id
      AND sa2.nome_status = 'ATIVA'
    FOR XML PATH(''), TYPE
  ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS planos
FROM Clientes c
JOIN Apolices a ON c.cliente_id = a.cliente_id
JOIN Detalhes_Apolices da ON a.apolice_id = da.apolice_id
JOIN Status_Apolices sa ON da.status_apolice_id = sa.status_apolice_id
WHERE sa.nome_status = 'ATIVA'
GROUP BY c.nome, c.cliente_id
HAVING COUNT(DISTINCT a.apolice_id) > 1
ORDER BY total_apolices DESC;
GO

-- ================================================
-- 3. Sinistros em fevereiro/2025 e tipo mais comum
-- ================================================
SELECT 
  COUNT(*) AS total_sinistros,
  toco.nome_tipo AS tipo_ocorrencia
FROM Sinistros s
JOIN Tipos_Ocorrencia toco ON s.tipo_ocorrencia_id = toco.tipo_ocorrencia_id
WHERE MONTH(s.data_ocorrencia) = 2
  AND YEAR(s.data_ocorrencia) = 2025
GROUP BY toco.nome_tipo
ORDER BY COUNT(*) DESC;
GO

-- ================================================
-- 4. Planos mais contratados e média de valor pago
-- ================================================
SELECT 
  p.nome_plano,
  COUNT(DISTINCT a.apolice_id) AS total_contratos,
  AVG(p.valor_mensal) AS valor_medio_mensal,
  SUM(pg.valor_pago) AS receita_total
FROM Apolices a
JOIN Planos p ON a.plano_id = p.plano_id
JOIN Pagamentos pg ON a.apolice_id = pg.apolice_id
JOIN Status_Pagamentos sp ON pg.status_pagamentos_id = sp.status_pagamento_id
WHERE sp.nome_status = 'Pago'
GROUP BY p.nome_plano
ORDER BY total_contratos DESC;
GO

-- ================================================
-- 5. Receita por plano em jan, fev e mar/2025 (últimos 3 meses conhecidos)
-- ================================================
WITH PagamentosRecentes AS (
  SELECT 
    a.plano_id,
    p.valor_pago,
    FORMAT(p.data_pagamento, 'yyyy-MM') AS mes
  FROM Pagamentos p
  JOIN Apolices a ON p.apolice_id = a.apolice_id
  JOIN Detalhes_Apolices da ON a.apolice_id = da.apolice_id
  JOIN Status_Apolices sa ON da.status_apolice_id = sa.status_apolice_id
  JOIN Status_Pagamentos sp ON p.status_pagamentos_id = sp.status_pagamento_id
  WHERE sa.nome_status = 'ATIVA'
    AND sp.nome_status = 'Pago'
    AND p.data_pagamento BETWEEN '2025-01-01' AND '2025-03-31'
)
SELECT 
  pl.nome_plano,
  pr.mes,
  SUM(pr.valor_pago) AS receita_total_mes
FROM PagamentosRecentes pr
JOIN Planos pl ON pr.plano_id = pl.plano_id
GROUP BY pl.nome_plano, pr.mes
ORDER BY pl.nome_plano, pr.mes;
GO

-- ================================================
-- 6. Duração das apólices por cliente e plano
-- ================================================
SELECT 
  a.apolice_id,
  c.nome AS cliente,
  p.nome_plano,
  dbo.fn_DuracaoApolice(a.apolice_id) AS dias_de_cobertura
FROM Apolices a
JOIN Clientes c ON a.cliente_id = c.cliente_id
JOIN Planos p ON a.plano_id = p.plano_id
ORDER BY dias_de_cobertura DESC;
GO
