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

-- Procedure para registrar um novo sinistro com validações
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

    -- Descobre o ID do status "Em Análise"
    SELECT @status_em_analise_id = status_sinistro_id
    FROM Status_Sinistros
    WHERE UPPER(nome_status) = 'ABERTO' -- ajuste conforme o valor real cadastrado

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