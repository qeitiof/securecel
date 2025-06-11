import { Router, Request, Response, RequestHandler } from "express";
import sql from "mssql";
import { z } from "zod";
import { coberturaSchema, updateCoberturaSchema } from "../schemas";
import { connectToDatabase } from "../database";

const router = Router();

// Listar todas as coberturas
router.get("/", (async (req: Request, res: Response) => {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
      SELECT c.*, p.nome_plano
      FROM Coberturas c
      LEFT JOIN Planos p ON c.plano_id = p.plano_id
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao listar coberturas:", err);
    res.status(500).json({
      message: "Erro ao listar coberturas",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Buscar cobertura por ID
router.get("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();
    const result = await pool.request().input("cobertura_id", sql.Int, id)
      .query(`
        SELECT c.*, p.nome_plano
        FROM Coberturas c
        LEFT JOIN Planos p ON c.plano_id = p.plano_id
        WHERE c.cobertura_id = @cobertura_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Cobertura não encontrada" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Erro ao buscar cobertura:", err);
    res.status(500).json({
      message: "Erro ao buscar cobertura",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Criar nova cobertura
router.post("/", (async (req: Request, res: Response) => {
  try {
    const coberturaData = coberturaSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se o plano existe
    const planoResult = await pool
      .request()
      .input("plano_id", sql.Int, coberturaData.plano_id)
      .query("SELECT COUNT(*) as count FROM Planos WHERE plano_id = @plano_id");

    if (planoResult.recordset[0].count === 0) {
      return res.status(400).json({ message: "Plano não encontrado" });
    }

    const result = await pool
      .request()
      .input("plano_id", sql.Int, coberturaData.plano_id)
      .input("descricao", sql.VarChar, coberturaData.descricao).query(`
        INSERT INTO Coberturas (plano_id, descricao)
        VALUES (@plano_id, @descricao);
        SELECT SCOPE_IDENTITY() as cobertura_id;
      `);

    res.status(201).json({
      message: "Cobertura criada com sucesso",
      cobertura_id: result.recordset[0].cobertura_id,
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

    console.error("Erro ao criar cobertura:", err);
    res.status(500).json({
      message: "Erro ao criar cobertura",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Atualizar cobertura
router.put("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const updateData = updateCoberturaSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se a cobertura existe
    const checkResult = await pool
      .request()
      .input("cobertura_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Coberturas WHERE cobertura_id = @cobertura_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Cobertura não encontrada" });
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

    // Constrói a query dinamicamente
    const updateFields = Object.keys(updateData)
      .map((key) => `${key} = @${key}`)
      .join(", ");

    const query = `
      UPDATE Coberturas 
      SET ${updateFields}
      WHERE cobertura_id = @cobertura_id;
    `;

    const request = pool.request().input("cobertura_id", sql.Int, id);

    // Adiciona os parâmetros dinamicamente
    Object.entries(updateData).forEach(([key, value]) => {
      if (key === "plano_id") {
        request.input(key, sql.Int, value);
      } else if (key === "descricao") {
        request.input(key, sql.VarChar, value);
      }
    });

    await request.query(query);

    res.json({ message: "Cobertura atualizada com sucesso" });
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

    console.error("Erro ao atualizar cobertura:", err);
    res.status(500).json({
      message: "Erro ao atualizar cobertura",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Deletar cobertura
router.delete("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();

    // Verifica se a cobertura existe
    const checkResult = await pool
      .request()
      .input("cobertura_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Coberturas WHERE cobertura_id = @cobertura_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Cobertura não encontrada" });
    }

    await pool
      .request()
      .input("cobertura_id", sql.Int, id)
      .query("DELETE FROM Coberturas WHERE cobertura_id = @cobertura_id");

    res.json({ message: "Cobertura excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir cobertura:", err);
    res.status(500).json({
      message: "Erro ao excluir cobertura",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

export default router;
