import { Router, Request, Response, RequestHandler } from "express";
import sql from "mssql";
import { z } from "zod";
import { apoliceSchema, updateApoliceSchema } from "../schemas";
import { connectToDatabase } from "../database";

const router = Router();

// Listar todas as apólices
router.get("/", (async (req: Request, res: Response) => {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
      SELECT a.*, 
        c.nome as cliente_nome,
        cel.modelo as celular_modelo,
        p.nome_plano,
        d.status,
        d.data_inicio,
        d.data_fim
      FROM Apolices a
      LEFT JOIN Clientes c ON a.cliente_id = c.cliente_id
      LEFT JOIN Celulares cel ON a.celular_id = cel.celular_id
      LEFT JOIN Planos p ON a.plano_id = p.plano_id
      LEFT JOIN Detalhes_Apolices d ON a.apolice_id = d.apolice_id
      GROUP BY a.apolice_id, a.cliente_id, a.celular_id, a.plano_id, 
        d.data_inicio, d.data_fim, d.status,
        c.nome, cel.modelo, p.nome_plano
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao listar apólices:", err);
    res.status(500).json({
      message: "Erro ao listar apólices",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Buscar apólice por ID
router.get("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();
    const result = await pool.request().input("apolice_id", sql.Int, id).query(`
        SELECT a.*, 
          c.nome as cliente_nome,
          cel.modelo as celular_modelo,
          p.nome_plano,
        FROM Apolices a
        LEFT JOIN Clientes c ON a.cliente_id = c.cliente_id
        LEFT JOIN Celulares cel ON a.celular_id = cel.celular_id
        LEFT JOIN Planos p ON a.plano_id = p.plano_id
        LEFT JOIN Detalhes_Apolices d ON a.apolice_id = d.apolice_id
        WHERE a.apolice_id = @apolice_id
        GROUP BY a.apolice_id, a.cliente_id, a.celular_id, a.plano_id, 
          a.data_inicio, a.data_fim, a.valor_total, a.status,
          c.nome, cel.modelo, p.nome_plano
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Apólice não encontrada" });
    }

    // Busca os pagamentos da apólice
    const pagamentos = await pool
      .request()
      .input("apolice_id", sql.Int, id)
      .query("SELECT * FROM Pagamentos WHERE apolice_id = @apolice_id");

    // Busca os sinistros da apólice
    const sinistros = await pool
      .request()
      .input("apolice_id", sql.Int, id)
      .query("SELECT * FROM Sinistros WHERE apolice_id = @apolice_id");

    res.json({
      ...result.recordset[0],
      pagamentos: pagamentos.recordset,
      sinistros: sinistros.recordset,
    });
  } catch (err) {
    console.error("Erro ao buscar apólice:", err);
    res.status(500).json({
      message: "Erro ao buscar apólice",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Criar nova apólice
router.post("/", (async (req: Request, res: Response) => {
  try {
    const apoliceData = apoliceSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se o cliente existe
    const clienteResult = await pool
      .request()
      .input("cliente_id", sql.Int, apoliceData.cliente_id)
      .query(
        "SELECT COUNT(*) as count FROM Clientes WHERE cliente_id = @cliente_id"
      );

    if (clienteResult.recordset[0].count === 0) {
      return res.status(400).json({ message: "Cliente não encontrado" });
    }

    // Verifica se o celular existe
    const celularResult = await pool
      .request()
      .input("celular_id", sql.Int, apoliceData.celular_id)
      .query(
        "SELECT COUNT(*) as count FROM Celulares WHERE celular_id = @celular_id"
      );

    if (celularResult.recordset[0].count === 0) {
      return res.status(400).json({ message: "Celular não encontrado" });
    }

    // Verifica se o plano existe
    const planoResult = await pool
      .request()
      .input("plano_id", sql.Int, apoliceData.plano_id)
      .query("SELECT COUNT(*) as count FROM Planos WHERE plano_id = @plano_id");

    if (planoResult.recordset[0].count === 0) {
      return res.status(400).json({ message: "Plano não encontrado" });
    }

    // Inicia uma transação
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Insere a apólice
      const apoliceResult = await transaction
        .request()
        .input("cliente_id", sql.Int, apoliceData.cliente_id)
        .input("celular_id", sql.Int, apoliceData.celular_id)
        .input("plano_id", sql.Int, apoliceData.plano_id).query(`
          INSERT INTO Apolices (cliente_id, celular_id, plano_id)
          VALUES (@cliente_id, @celular_id, @plano_id);
          SELECT SCOPE_IDENTITY() as apolice_id;
        `);

      const apoliceId = apoliceResult.recordset[0].apolice_id;

      // Insere os dados básicos na tabela Detalhes_Apolices
      await transaction
        .request()
        .input("apolice_id", sql.Int, apoliceId)
        .input("data_inicio", sql.Date, apoliceData.data_inicio)
        .input("data_fim", sql.Date, apoliceData.data_fim)
        .input("status", sql.VarChar, apoliceData.status).query(`
          INSERT INTO Detalhes_Apolices (apolice_id, data_inicio, data_fim, status)
          VALUES (@apolice_id, @data_inicio, @data_fim, @status);
        `);

      await transaction.commit();

      res.status(201).json({
        message: "Apólice criada com sucesso",
        apolice_id: apoliceId,
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Erro de validação dos dados",
        errors: err.errors.map((error: z.ZodIssue) => ({
          field: error.path.join("."),
          message: error.message,
        })),
      });
    }

    console.error("Erro ao criar apólice:", err);
    res.status(500).json({
      message: "Erro ao criar apólice",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Atualizar apólice
router.put("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const updateData = updateApoliceSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se a apólice existe
    const checkResult = await pool
      .request()
      .input("apolice_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Apolices WHERE apolice_id = @apolice_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Apólice não encontrada" });
    }

    // Verifica se o cliente existe (se estiver sendo atualizado)
    if (updateData.cliente_id) {
      const clienteResult = await pool
        .request()
        .input("cliente_id", sql.Int, updateData.cliente_id)
        .query(
          "SELECT COUNT(*) as count FROM Clientes WHERE cliente_id = @cliente_id"
        );

      if (clienteResult.recordset[0].count === 0) {
        return res.status(400).json({ message: "Cliente não encontrado" });
      }
    }

    // Verifica se o celular existe (se estiver sendo atualizado)
    if (updateData.celular_id) {
      const celularResult = await pool
        .request()
        .input("celular_id", sql.Int, updateData.celular_id)
        .query(
          "SELECT COUNT(*) as count FROM Celulares WHERE celular_id = @celular_id"
        );

      if (celularResult.recordset[0].count === 0) {
        return res.status(400).json({ message: "Celular não encontrado" });
      }
    }

    // Verifica se o plano existe (se estiver sendo atualizado)
    if (updateData.plano_id) {
      const planoResult = await pool
        .request()
        .input("plano_id", sql.Int, updateData.plano_id)
        .query(
          "SELECT COUNT(*) as count FROM Planos WHERE plano_id = @plano_id"
        );

      if (planoResult.recordset[0].count === 0) {
        return res.status(400).json({ message: "Plano não encontrado" });
      }
    }

    // Inicia uma transação
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Atualiza os dados da apólice
      if (Object.keys(updateData).length > 0) {
        const updateFields = Object.keys(updateData)
          .filter((key) =>
            ["cliente_id", "celular_id", "plano_id"].includes(key)
          )
          .map((key) => `${key} = @${key}`)
          .join(", ");

        if (updateFields) {
          const query = `
            UPDATE Apolices 
            SET ${updateFields}
            WHERE apolice_id = @apolice_id;
          `;

          const request = transaction
            .request()
            .input("apolice_id", sql.Int, id);

          // Adiciona os parâmetros dinamicamente
          Object.entries(updateData).forEach(([key, value]) => {
            if (["cliente_id", "celular_id", "plano_id"].includes(key)) {
              request.input(key, sql.Int, value);
            }
          });

          await request.query(query);
        }

        // Atualiza os dados na tabela Detalhes_Apolices
        const detalhesFields = Object.keys(updateData)
          .filter((key) => ["data_inicio", "data_fim", "status"].includes(key))
          .map((key) => `${key} = @${key}`)
          .join(", ");

        if (detalhesFields) {
          const query = `
            UPDATE Detalhes_Apolices 
            SET ${detalhesFields}
            WHERE apolice_id = @apolice_id;
          `;

          const request = transaction
            .request()
            .input("apolice_id", sql.Int, id);

          // Adiciona os parâmetros dinamicamente
          Object.entries(updateData).forEach(([key, value]) => {
            if (["data_inicio", "data_fim"].includes(key)) {
              request.input(key, sql.Date, value);
            } else if (key === "status") {
              request.input(key, sql.VarChar, value);
            }
          });

          await request.query(query);
        }
      }

      await transaction.commit();
      res.json({ message: "Apólice atualizada com sucesso" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Erro de validação dos dados",
        errors: err.errors.map((error: z.ZodIssue) => ({
          field: error.path.join("."),
          message: error.message,
        })),
      });
    }

    console.error("Erro ao atualizar apólice:", err);
    res.status(500).json({
      message: "Erro ao atualizar apólice",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Deletar apólice
router.delete("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();

    // Verifica se a apólice existe
    const checkResult = await pool
      .request()
      .input("apolice_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Apolices WHERE apolice_id = @apolice_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Apólice não encontrada" });
    }

    // Verifica se existem registros dependentes
    const dependencias = await pool.request().input("apolice_id", sql.Int, id)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM Pagamentos WHERE apolice_id = @apolice_id) as pagamentos,
          (SELECT COUNT(*) FROM Sinistros WHERE apolice_id = @apolice_id) as sinistros
      `);

    if (
      dependencias.recordset[0].pagamentos > 0 ||
      dependencias.recordset[0].sinistros > 0
    ) {
      return res.status(400).json({
        message:
          "Não é possível excluir a apólice pois existem pagamentos ou sinistros vinculados a ela",
      });
    }

    // Inicia uma transação
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Remove os detalhes da apólice
      await transaction
        .request()
        .input("apolice_id", sql.Int, id)
        .query("DELETE FROM Detalhes_Apolices WHERE apolice_id = @apolice_id");

      // Remove a apólice
      await transaction
        .request()
        .input("apolice_id", sql.Int, id)
        .query("DELETE FROM Apolices WHERE apolice_id = @apolice_id");

      await transaction.commit();
      res.json({ message: "Apólice excluída com sucesso" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Erro ao excluir apólice:", err);
    res.status(500).json({
      message: "Erro ao excluir apólice",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

export default router;
