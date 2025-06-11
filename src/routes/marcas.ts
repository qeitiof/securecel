import { Router, Request, Response, RequestHandler } from "express";
import sql from "mssql";
import { z } from "zod";
import { marcaSchema, updateMarcaSchema } from "../schemas";
import { connectToDatabase } from "../database";

const router = Router();

// Listar todas as marcas
router.get("/", (async (req: Request, res: Response) => {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query("SELECT * FROM Marcas");
    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao listar marcas:", err);
    res.status(500).json({
      message: "Erro ao listar marcas",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Buscar marca por ID
router.get("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input("marca_id", sql.Int, id)
      .query("SELECT * FROM Marcas WHERE marca_id = @marca_id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Marca não encontrada" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Erro ao buscar marca:", err);
    res.status(500).json({
      message: "Erro ao buscar marca",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Criar nova marca
router.post("/", (async (req: Request, res: Response) => {
  try {
    const marcaData = marcaSchema.parse(req.body);
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input("nome", sql.VarChar, marcaData.nome).query(`
        INSERT INTO Marcas (nome)
        VALUES (@nome);
        SELECT SCOPE_IDENTITY() as marca_id;
      `);

    res.status(201).json({
      message: "Marca criada com sucesso",
      marca_id: result.recordset[0].marca_id,
    });
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

    console.error("Erro ao criar marca:", err);
    res.status(500).json({
      message: "Erro ao criar marca",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Atualizar marca
router.put("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const updateData = updateMarcaSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se a marca existe
    const checkResult = await pool
      .request()
      .input("marca_id", sql.Int, id)
      .query("SELECT COUNT(*) as count FROM Marcas WHERE marca_id = @marca_id");

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Marca não encontrada" });
    }

    // Constrói a query dinamicamente
    const updateFields = Object.keys(updateData)
      .map((key) => `${key} = @${key}`)
      .join(", ");

    const query = `
      UPDATE Marcas 
      SET ${updateFields}
      WHERE marca_id = @marca_id;
    `;

    const request = pool.request().input("marca_id", sql.Int, id);

    // Adiciona os parâmetros dinamicamente
    Object.entries(updateData).forEach(([key, value]) => {
      request.input(key, sql.VarChar, value);
    });

    await request.query(query);

    res.json({ message: "Marca atualizada com sucesso" });
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

    console.error("Erro ao atualizar marca:", err);
    res.status(500).json({
      message: "Erro ao atualizar marca",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Deletar marca
router.delete("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();

    // Verifica se a marca existe
    const checkResult = await pool
      .request()
      .input("marca_id", sql.Int, id)
      .query("SELECT COUNT(*) as count FROM Marcas WHERE marca_id = @marca_id");

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Marca não encontrada" });
    }

    // Verifica se existem registros dependentes
    const dependencias = await pool
      .request()
      .input("marca_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Celulares WHERE marca_id = @marca_id"
      );

    if (dependencias.recordset[0].count > 0) {
      return res.status(400).json({
        message:
          "Não é possível excluir a marca pois existem celulares vinculados a ela",
      });
    }

    await pool
      .request()
      .input("marca_id", sql.Int, id)
      .query("DELETE FROM Marcas WHERE marca_id = @marca_id");

    res.json({ message: "Marca excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir marca:", err);
    res.status(500).json({
      message: "Erro ao excluir marca",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

export default router;
