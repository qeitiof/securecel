-- Trigger para histórico de alterações na tabela Clientes
CREATE TABLE Historico_Clientes (
    historico_id INT PRIMARY KEY IDENTITY(1,1),
    cliente_id INT,
    data_alteracao DATETIME,
    tipo_operacao VARCHAR(10),
    dados_antigos VARCHAR(MAX),
    dados_novos VARCHAR(MAX)
)
GO

CREATE TRIGGER trg_Historico_Clientes
ON Clientes
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @tipo_operacao VARCHAR(10)
    DECLARE @dados_antigos VARCHAR(MAX)
    DECLARE @dados_novos VARCHAR(MAX)
    DECLARE @cliente_id INT

    -- Determina o tipo de operação
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
        SET @tipo_operacao = 'UPDATE'
    ELSE IF EXISTS (SELECT 1 FROM inserted)
        SET @tipo_operacao = 'INSERT'
    ELSE
        SET @tipo_operacao = 'DELETE'

    -- Processa os dados
    IF @tipo_operacao = 'UPDATE' OR @tipo_operacao = 'DELETE'
    BEGIN
        SELECT @cliente_id = cliente_id,
               @dados_antigos = CONCAT('nome:', nome, ';cpf:', cpf, ';email:', email, ';telefone:', telefone)
        FROM deleted
    END

    IF @tipo_operacao = 'UPDATE' OR @tipo_operacao = 'INSERT'
    BEGIN
        SELECT @dados_novos = CONCAT('nome:', nome, ';cpf:', cpf, ';email:', email, ';telefone:', telefone)
        FROM inserted
    END

    -- Insere no histórico
    INSERT INTO Historico_Clientes (cliente_id, data_alteracao, tipo_operacao, dados_antigos, dados_novos)
    VALUES (@cliente_id, GETDATE(), @tipo_operacao, @dados_antigos, @dados_novos)
END
GO

-- Função para calcular o valor total das apólices ativas de um cliente
CREATE FUNCTION fn_CalcularTotalApolicesAtivas
(
    @cliente_id INT
)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @total DECIMAL(10,2)

    SELECT @total = SUM(p.valor_mensal)
    FROM Apolices a
    INNER JOIN Planos p ON a.plano_id = p.plano_id
    INNER JOIN Detalhes_Apolices da ON a.apolice_id = da.apolice_id
    WHERE a.cliente_id = @cliente_id
    AND da.status = 'Ativa'
    AND da.data_fim >= GETDATE()

    RETURN ISNULL(@total, 0)
END
GO

-- Procedure para registrar um novo sinistro com validações aprimoradas
CREATE PROCEDURE sp_RegistrarSinistro
    @apolice_id INT,
    @tipo_ocorrencia_id INT,
    @descricao VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @apolice_valida BIT = 0
    DECLARE @mensagem VARCHAR(200)
    DECLARE @status_em_analise_id INT

    -- Verifica se a apólice existe e está ativa
    SELECT @apolice_valida = 1
    FROM Apolices a
    INNER JOIN Detalhes_Apolices da ON a.apolice_id = da.apolice_id
    WHERE a.apolice_id = @apolice_id
      AND da.status = 'ATIVA'
      AND da.data_fim >= CAST(GETDATE() AS DATE)

    IF @apolice_valida = 0
    BEGIN
        SET @mensagem = 'Apólice inválida ou não está ativa'
        RAISERROR(@mensagem, 16, 1)
        RETURN
    END

    -- Descobre o ID do status "ABERTO" (ajuste conforme o valor real cadastrado)
    SELECT @status_em_analise_id = status_sinistro_id
    FROM Status_Sinistros
    WHERE UPPER(nome_status) = 'ABERTO'

    IF @status_em_analise_id IS NULL
    BEGIN
        SET @mensagem = 'Status "ABERTO" não cadastrado em Status_Sinistros'
        RAISERROR(@mensagem, 16, 1)
        RETURN
    END

    -- Verifica se já existe um sinistro em aberto para esta apólice
    IF EXISTS (
        SELECT 1 
        FROM Sinistros 
        WHERE apolice_id = @apolice_id 
          AND status_sinistro_id = @status_em_analise_id
    )
    BEGIN
        SET @mensagem = 'Já existe um sinistro em aberto para esta apólice'
        RAISERROR(@mensagem, 16, 1)
        RETURN
    END

    -- Registra o sinistro
    INSERT INTO Sinistros (
        apolice_id,
        data_ocorrencia,
        tipo_ocorrencia_id,
        descricao,
        status_sinistro_id
    )
    VALUES (
        @apolice_id,
        GETDATE(),
        @tipo_ocorrencia_id,
        @descricao,
        @status_em_analise_id
    )

    SET @mensagem = 'Sinistro registrado com sucesso'
    PRINT @mensagem
END
GO