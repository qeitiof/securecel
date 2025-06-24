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
-- 1. Total de Apólices Ativas em 15/02/2025
-- ================================================
SELECT COUNT(*) AS [Total de Apólices Ativas]
FROM Detalhes_Apolices da
WHERE da.status = 'ATIVA'
  AND '2025-02-15' BETWEEN da.data_inicio AND da.data_fim;
GO
-- ================================================
-- 2. Clientes que atrasaram pagamentos e valor total em atraso por cliente.
-- ================================================

-- Inserção de pagamentos com status diferente de 'Pago' (2 = Pendente, 3 = Cancelado)
INSERT INTO Pagamentos (apolice_id, data_pagamento, valor_pago, status_pagamentos_id, metodo_pagamento_id) VALUES
(1, '2025-03-01', 50.00, 2, 1), -- pendente
(2, '2025-03-05', 80.00, 2, 2), -- pendente
(3, '2025-03-10', 100.00, 3, 3); -- cancelado

WITH PagamentosAtrasados AS (
  SELECT 
    p.apolice_id,
    p.valor_pago,
    p.status_pagamentos_id
  FROM Pagamentos p
  JOIN Status_Pagamentos sp ON p.status_pagamentos_id = sp.status_pagamento_id
  WHERE sp.nome_status <> 'Pago'
)
SELECT 
  c.nome AS [Nome do Cliente],
  COUNT(pa.apolice_id) AS [Qtde de Pagamentos Atrasados],
  FORMAT(SUM(pa.valor_pago), 'C', 'pt-BR') AS [Valor Total em Atraso]
FROM Clientes c
JOIN Apolices a ON c.cliente_id = a.cliente_id
JOIN PagamentosAtrasados pa ON a.apolice_id = pa.apolice_id
GROUP BY c.nome
ORDER BY [Valor Total em Atraso] DESC;


-- ================================================
-- 3. Sinistros em Fevereiro/2025 por Tipo
-- ================================================
SELECT 
  toco.nome_tipo AS [Tipo de Ocorrência],
  COUNT(*) AS [Total de Sinistros]
FROM Sinistros s
JOIN Tipos_Ocorrencia toco ON s.tipo_ocorrencia_id = toco.tipo_ocorrencia_id
WHERE MONTH(s.data_ocorrencia) = 2
  AND YEAR(s.data_ocorrencia) = 2025
GROUP BY toco.nome_tipo
ORDER BY [Total de Sinistros] DESC;
GO

-- ================================================
-- 4. Planos Mais Contratados e Média de Valor Pago
-- ================================================
SELECT 
  p.nome_plano AS [Plano],
  COUNT(DISTINCT a.apolice_id) AS [Total de Contratos],
  FORMAT(AVG(p.valor_mensal), 'C', 'pt-BR') AS [Valor Médio Mensal],
  FORMAT(SUM(pg.valor_pago), 'C', 'pt-BR') AS [Receita Total]
FROM Apolices a
JOIN Planos p ON a.plano_id = p.plano_id
JOIN Pagamentos pg ON a.apolice_id = pg.apolice_id
JOIN Status_Pagamentos sp ON pg.status_pagamentos_id = sp.status_pagamento_id
WHERE sp.nome_status = 'Pago'
GROUP BY p.nome_plano
ORDER BY [Total de Contratos] DESC;
GO

-- ================================================
-- 5. Receita Mensal por Plano (Jan-Mar/2025)
-- ================================================
WITH PagamentosRecentes AS (
  SELECT 
    a.plano_id,
    p.valor_pago,
    FORMAT(p.data_pagamento, 'yyyy-MM') AS mes
  FROM Pagamentos p
  JOIN Apolices a ON p.apolice_id = a.apolice_id
  JOIN Detalhes_Apolices da ON a.apolice_id = da.apolice_id
  JOIN Status_Pagamentos sp ON p.status_pagamentos_id = sp.status_pagamento_id
  WHERE da.status = 'ATIVA'
    AND sp.nome_status = 'Pago'
    AND p.data_pagamento BETWEEN '2025-01-01' AND '2025-03-31'
)
SELECT 
  pl.nome_plano AS [Plano],
  pr.mes AS [Mês],
  FORMAT(SUM(pr.valor_pago), 'C', 'pt-BR') AS [Receita Total]
FROM PagamentosRecentes pr
JOIN Planos pl ON pr.plano_id = pl.plano_id
GROUP BY pl.nome_plano, pr.mes
ORDER BY pl.nome_plano, pr.mes;
GO

-- ================================================
-- 6. Duração das Apólices por Cliente e Plano
-- ================================================
SELECT 
  a.apolice_id AS [ID Apólice],
  c.nome AS [Nome do Cliente],
  p.nome_plano AS [Plano Contratado],
  dbo.fn_DuracaoApolice(a.apolice_id) AS [Duração em Dias]
FROM Apolices a
JOIN Clientes c ON a.cliente_id = c.cliente_id
JOIN Planos p ON a.plano_id = p.plano_id
ORDER BY [Duração em Dias] DESC;
GO
