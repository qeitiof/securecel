import { Router, Request, Response, RequestHandler } from "express";
import sql from "mssql";
import { z } from "zod";
import { atendenteSchema, updateAtendenteSchema } from "../schemas";
import { connectToDatabase } from "../database";

const router = Router();

// Listar todos os atendentes
router.get("/", (async (req: Request, res: Response) => {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query("SELECT * FROM Atendentes");
    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao listar atendentes:", err);
    res.status(500).json({
      message: "Erro ao listar atendentes",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Buscar atendente por ID
router.get("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input("atendente_id", sql.Int, id)
      .query("SELECT * FROM Atendentes WHERE atendente_id = @atendente_id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Atendente não encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Erro ao buscar atendente:", err);
    res.status(500).json({
      message: "Erro ao buscar atendente",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Criar novo atendente
router.post("/", (async (req: Request, res: Response) => {
  try {
    const atendenteData = atendenteSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se o email já está em uso
    const emailCheck = await pool
      .request()
      .input("email", sql.VarChar, atendenteData.email_atendente)
      .query(
        "SELECT COUNT(*) as count FROM Atendentes WHERE email_atendente = @email"
      );

    if (emailCheck.recordset[0].count > 0) {
      return res.status(400).json({ message: "Email já está em uso" });
    }

    const result = await pool
      .request()
      .input("nome", sql.VarChar, atendenteData.nome_atendente)
      .input("email", sql.VarChar, atendenteData.email_atendente)
      .input("telefone", sql.VarChar, atendenteData.telefone_atendente)
      .input("cargo", sql.VarChar, atendenteData.cargo)
      .input("data_admissao", sql.Date, new Date(atendenteData.data_admissao))
      .query(`
        INSERT INTO Atendentes (nome_atendente, email_atendente, telefone_atendente, cargo, data_admissao)
        VALUES (@nome, @email, @telefone, @cargo, @data_admissao);
        SELECT SCOPE_IDENTITY() as atendente_id;
      `);

    res.status(201).json({
      message: "Atendente criado com sucesso",
      atendente_id: result.recordset[0].atendente_id,
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

    console.error("Erro ao criar atendente:", err);
    res.status(500).json({
      message: "Erro ao criar atendente",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Atualizar atendente
router.put("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const updateData = updateAtendenteSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se o atendente existe
    const checkResult = await pool
      .request()
      .input("atendente_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Atendentes WHERE atendente_id = @atendente_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Atendente não encontrado" });
    }

    // Se o email está sendo atualizado, verifica se já está em uso
    if (updateData.email_atendente) {
      const emailCheck = await pool
        .request()
        .input("email", sql.VarChar, updateData.email_atendente)
        .input("atendente_id", sql.Int, id)
        .query(
          "SELECT COUNT(*) as count FROM Atendentes WHERE email_atendente = @email AND atendente_id != @atendente_id"
        );

      if (emailCheck.recordset[0].count > 0) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
    }

    // Constrói a query dinamicamente
    const updateFields = Object.keys(updateData)
      .map((key) => `${key} = @${key}`)
      .join(", ");

    const query = `
      UPDATE Atendentes 
      SET ${updateFields}
      WHERE atendente_id = @atendente_id;
    `;

    const request = pool.request().input("atendente_id", sql.Int, id);

    // Adiciona os parâmetros dinamicamente
    Object.entries(updateData).forEach(([key, value]) => {
      if (key === "data_admissao") {
        request.input(key, sql.Date, new Date(value as string));
      } else {
        request.input(key, sql.VarChar, value);
      }
    });

    await request.query(query);

    res.json({ message: "Atendente atualizado com sucesso" });
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

    console.error("Erro ao atualizar atendente:", err);
    res.status(500).json({
      message: "Erro ao atualizar atendente",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Deletar atendente
router.delete("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();

    // Verifica se o atendente existe
    const checkResult = await pool
      .request()
      .input("atendente_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Atendentes WHERE atendente_id = @atendente_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Atendente não encontrado" });
    }

    // Verifica se existem registros dependentes
    const dependencias = await pool
      .request()
      .input("atendente_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Atendimentos WHERE atendente_id = @atendente_id"
      );

    if (dependencias.recordset[0].count > 0) {
      return res.status(400).json({
        message:
          "Não é possível excluir o atendente pois existem atendimentos vinculados a ele",
      });
    }

    await pool
      .request()
      .input("atendente_id", sql.Int, id)
      .query("DELETE FROM Atendentes WHERE atendente_id = @atendente_id");

    res.json({ message: "Atendente excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir atendente:", err);
    res.status(500).json({
      message: "Erro ao excluir atendente",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

export default router;
