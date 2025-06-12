import { Router, Request, Response, RequestHandler } from "express";
import sql from "mssql";
import { z } from "zod";
import { atendimentoSchema, updateAtendimentoSchema } from "../schemas";
import { connectToDatabase } from "../database";

const router = Router();

// Listar todos os atendimentos
router.get("/", (async (req: Request, res: Response) => {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
      SELECT 
        a.*,
        c.nome as cliente_nome,
        at.nome_atendente as atendente_nome
      FROM Atendimentos a
      LEFT JOIN Clientes c ON a.cliente_id = c.cliente_id
      LEFT JOIN Atendentes at ON a.atendente_id = at.atendente_id
      ORDER BY a.data_atendimento DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao listar atendimentos:", err);
    res.status(500).json({
      message: "Erro ao listar atendimentos",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Buscar atendimento por ID
router.get("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();
    const result = await pool.request().input("atendimento_id", sql.Int, id)
      .query(`
        SELECT 
          a.*,
          c.nome as cliente_nome,
          at.nome_atendente as atendente_nome
        FROM Atendimentos a
        LEFT JOIN Clientes c ON a.cliente_id = c.cliente_id
        LEFT JOIN Atendentes at ON a.atendente_id = at.atendente_id
        WHERE a.atendimento_id = @atendimento_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Atendimento não encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Erro ao buscar atendimento:", err);
    res.status(500).json({
      message: "Erro ao buscar atendimento",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Criar novo atendimento
router.post("/", (async (req: Request, res: Response) => {
  try {
    const atendimentoData = atendimentoSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se o cliente existe
    const clienteCheck = await pool
      .request()
      .input("cliente_id", sql.Int, atendimentoData.cliente_id)
      .query(
        "SELECT COUNT(*) as count FROM Clientes WHERE cliente_id = @cliente_id"
      );

    if (clienteCheck.recordset[0].count === 0) {
      return res.status(400).json({ message: "Cliente não encontrado" });
    }

    // Verifica se o atendente existe
    const atendenteCheck = await pool
      .request()
      .input("atendente_id", sql.Int, atendimentoData.atendente_id)
      .query(
        "SELECT COUNT(*) as count FROM Atendentes WHERE atendente_id = @atendente_id"
      );

    if (atendenteCheck.recordset[0].count === 0) {
      return res.status(400).json({ message: "Atendente não encontrado" });
    }

    const result = await pool
      .request()
      .input("cliente_id", sql.Int, atendimentoData.cliente_id)
      .input("atendente_id", sql.Int, atendimentoData.atendente_id)
      .input(
        "data_atendimento",
        sql.DateTime,
        new Date(atendimentoData.data_atendimento)
      )
      .input("tipo_contato", sql.VarChar, atendimentoData.tipo_contato)
      .input("assunto", sql.VarChar, atendimentoData.assunto)
      .input("observacoes", sql.VarChar, atendimentoData.observacoes).query(`
        INSERT INTO Atendimentos (cliente_id, atendente_id, data_atendimento, tipo_contato, assunto, observacoes)
        VALUES (@cliente_id, @atendente_id, @data_atendimento, @tipo_contato, @assunto, @observacoes);
        SELECT SCOPE_IDENTITY() as atendimento_id;
      `);

    res.status(201).json({
      message: "Atendimento criado com sucesso",
      atendimento_id: result.recordset[0].atendimento_id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Erro de validação dos dados",
        errors: err.errors.map((error) => ({
          field: error.path.join("."),
          message: error.message,
        })),
      });
    }

    console.error("Erro ao criar atendimento:", err);
    res.status(500).json({
      message: "Erro ao criar atendimento",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Atualizar atendimento
router.put("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const updateData = updateAtendimentoSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se o atendimento existe
    const checkResult = await pool
      .request()
      .input("atendimento_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Atendimentos WHERE atendimento_id = @atendimento_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Atendimento não encontrado" });
    }

    // Se o cliente está sendo atualizado, verifica se existe
    if (updateData.cliente_id) {
      const clienteCheck = await pool
        .request()
        .input("cliente_id", sql.Int, updateData.cliente_id)
        .query(
          "SELECT COUNT(*) as count FROM Clientes WHERE cliente_id = @cliente_id"
        );

      if (clienteCheck.recordset[0].count === 0) {
        return res.status(400).json({ message: "Cliente não encontrado" });
      }
    }

    // Se o atendente está sendo atualizado, verifica se existe
    if (updateData.atendente_id) {
      const atendenteCheck = await pool
        .request()
        .input("atendente_id", sql.Int, updateData.atendente_id)
        .query(
          "SELECT COUNT(*) as count FROM Atendentes WHERE atendente_id = @atendente_id"
        );

      if (atendenteCheck.recordset[0].count === 0) {
        return res.status(400).json({ message: "Atendente não encontrado" });
      }
    }

    // Constrói a query dinamicamente
    const updateFields = Object.keys(updateData)
      .map((key) => `${key} = @${key}`)
      .join(", ");

    const query = `
      UPDATE Atendimentos 
      SET ${updateFields}
      WHERE atendimento_id = @atendimento_id;
    `;

    const request = pool.request().input("atendimento_id", sql.Int, id);

    // Adiciona os parâmetros dinamicamente
    Object.entries(updateData).forEach(([key, value]) => {
      if (key === "data_atendimento") {
        request.input(key, sql.DateTime, new Date(value as string));
      } else if (key === "cliente_id" || key === "atendente_id") {
        request.input(key, sql.Int, value);
      } else {
        request.input(key, sql.VarChar, value);
      }
    });

    await request.query(query);

    res.json({ message: "Atendimento atualizado com sucesso" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Erro de validação dos dados",
        errors: err.errors.map((error) => ({
          field: error.path.join("."),
          message: error.message,
        })),
      });
    }

    console.error("Erro ao atualizar atendimento:", err);
    res.status(500).json({
      message: "Erro ao atualizar atendimento",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Deletar atendimento
router.delete("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();

    // Verifica se o atendimento existe
    const checkResult = await pool
      .request()
      .input("atendimento_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Atendimentos WHERE atendimento_id = @atendimento_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Atendimento não encontrado" });
    }

    await pool
      .request()
      .input("atendimento_id", sql.Int, id)
      .query("DELETE FROM Atendimentos WHERE atendimento_id = @atendimento_id");

    res.json({ message: "Atendimento excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir atendimento:", err);
    res.status(500).json({
      message: "Erro ao excluir atendimento",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

export default router;
