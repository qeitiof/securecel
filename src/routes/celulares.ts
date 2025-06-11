import { Router, Request, Response, RequestHandler } from "express";
import sql from "mssql";
import { z } from "zod";
import { celularSchema, updateCelularSchema } from "../schemas";
import { connectToDatabase } from "../database";

const router = Router();

// Listar todos os celulares
router.get("/", (async (req: Request, res: Response) => {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
      SELECT c.celular_id as celulare_id ,c.*, m.nome as marca_nome
      FROM Celulares c
      LEFT JOIN Marcas m ON c.marca_id = m.marca_id
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao listar celulares:", err);
    res.status(500).json({
      message: "Erro ao listar celulares",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Buscar celular por ID
router.get("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();
    const result = await pool.request().input("celular_id", sql.Int, id).query(`
        SELECT c.celular_id as celulare_id ,c.*, m.nome as marca_nome
        FROM Celulares c
        LEFT JOIN Marcas m ON c.marca_id = m.marca_id
        WHERE c.celular_id = @celular_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Celular não encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Erro ao buscar celular:", err);
    res.status(500).json({
      message: "Erro ao buscar celular",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Criar novo celular
router.post("/", (async (req: Request, res: Response) => {
  try {
    const celularData = celularSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se a marca existe
    const marcaResult = await pool
      .request()
      .input("marca_id", sql.Int, celularData.marca_id)
      .query("SELECT COUNT(*) as count FROM Marcas WHERE marca_id = @marca_id");

    if (marcaResult.recordset[0].count === 0) {
      return res.status(400).json({ message: "Marca não encontrada" });
    }

    const result = await pool
      .request()
      .input("marca_id", sql.Int, celularData.marca_id)
      .input("modelo", sql.VarChar, celularData.modelo)
      .input("imei", sql.VarChar, celularData.imei)
      .input("valor", sql.Decimal, celularData.valor).query(`
        INSERT INTO Celulares (marca_id, modelo, imei, valor)
        VALUES (@marca_id, @modelo, @imei, @valor);
        SELECT SCOPE_IDENTITY() as celular_id;
      `);

    res.status(201).json({
      message: "Celular criado com sucesso",
      celular_id: result.recordset[0].celular_id,
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

    console.error("Erro ao criar celular:", err);
    res.status(500).json({
      message: "Erro ao criar celular",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Atualizar celular
router.put("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const updateData = updateCelularSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se o celular existe
    const checkResult = await pool
      .request()
      .input("celular_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Celulares WHERE celular_id = @celular_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Celular não encontrado" });
    }

    // Se estiver atualizando a marca, verifica se ela existe
    if (updateData.marca_id) {
      const marcaResult = await pool
        .request()
        .input("marca_id", sql.Int, updateData.marca_id)
        .query(
          "SELECT COUNT(*) as count FROM Marcas WHERE marca_id = @marca_id"
        );

      if (marcaResult.recordset[0].count === 0) {
        return res.status(400).json({ message: "Marca não encontrada" });
      }
    }

    // Constrói a query dinamicamente
    const updateFields = Object.keys(updateData)
      .map((key) => `${key} = @${key}`)
      .join(", ");

    const query = `
      UPDATE Celulares 
      SET ${updateFields}
      WHERE celular_id = @celular_id;
    `;

    const request = pool.request().input("celular_id", sql.Int, id);

    // Adiciona os parâmetros dinamicamente
    Object.entries(updateData).forEach(([key, value]) => {
      if (key === "valor") {
        request.input(key, sql.Decimal, value);
      } else {
        request.input(key, sql.VarChar, value);
      }
    });

    await request.query(query);

    res.json({ message: "Celular atualizado com sucesso" });
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

    console.error("Erro ao atualizar celular:", err);
    res.status(500).json({
      message: "Erro ao atualizar celular",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Deletar celular
router.delete("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();

    // Verifica se o celular existe
    const checkResult = await pool
      .request()
      .input("celular_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Celulares WHERE celular_id = @celular_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Celular não encontrado" });
    }

    // Verifica se existem registros dependentes
    const dependencias = await pool
      .request()
      .input("celular_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Apolices WHERE celular_id = @celular_id"
      );

    if (dependencias.recordset[0].count > 0) {
      return res.status(400).json({
        message:
          "Não é possível excluir o celular pois existem apólices vinculadas a ele",
      });
    }

    await pool
      .request()
      .input("celular_id", sql.Int, id)
      .query("DELETE FROM Celulares WHERE celular_id = @celular_id");

    res.json({ message: "Celular excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir celular:", err);
    res.status(500).json({
      message: "Erro ao excluir celular",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

export default router;
