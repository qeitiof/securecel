import { Router, Request, Response, RequestHandler } from "express";
import sql from "mssql";
import { z } from "zod";
import { planoSchema, updatePlanoSchema } from "../schemas";
import { connectToDatabase } from "../database";

const router = Router();

// Listar todos os planos
router.get("/", (async (req: Request, res: Response) => {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query(`
      SELECT 
        p.*,
        (
          SELECT COALESCE(
            (
              SELECT cobertura_id as [data()]
              FROM Coberturas
              WHERE plano_id = p.plano_id
              FOR XML PATH('')
            ), ''
          )
        ) as coberturas_ids,
        (
          SELECT COALESCE(
            (
              SELECT descricao as [data()]
              FROM Coberturas
              WHERE plano_id = p.plano_id
              FOR XML PATH('')
            ), ''
          )
        ) as coberturas_nomes
      FROM Planos p
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Erro ao listar planos:", err);
    res.status(500).json({
      message: "Erro ao listar planos",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Buscar plano por ID
router.get("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();
    const result = await pool.request().input("plano_id", sql.Int, id).query(`
        SELECT 
          p.*,
          (
            SELECT COALESCE(
              (
                SELECT cobertura_id as [data()]
                FROM Coberturas
                WHERE plano_id = p.plano_id
                FOR XML PATH('')
              ), ''
            )
          ) as coberturas_ids,
          (
            SELECT COALESCE(
              (
                SELECT descricao as [data()]
                FROM Coberturas
                WHERE plano_id = p.plano_id
                FOR XML PATH('')
              ), ''
            )
          ) as coberturas_nomes
        FROM Planos p
        WHERE p.plano_id = @plano_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Erro ao buscar plano:", err);
    res.status(500).json({
      message: "Erro ao buscar plano",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Criar novo plano
router.post("/", (async (req: Request, res: Response) => {
  try {
    const planoData = planoSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Inicia a transação
    const transaction = await pool.transaction();
    try {
      await transaction.begin();

      // Insere o plano
      const planoResult = await transaction
        .request()
        .input("nome_plano", sql.VarChar, planoData.nome_plano)
        .input("descricao", sql.VarChar, planoData.descricao)
        .input("valor_mensal", sql.Decimal, planoData.valor_mensal).query(`
          INSERT INTO Planos (nome_plano, descricao, valor_mensal)
          VALUES (@nome_plano, @descricao, @valor_mensal);
          SELECT SCOPE_IDENTITY() as plano_id;
        `);

      const planoId = planoResult.recordset[0].plano_id;

      // Insere as coberturas do plano
      if (planoData.coberturas && planoData.coberturas.length > 0) {
        for (const coberturaId of planoData.coberturas) {
          await transaction
            .request()
            .input("plano_id", sql.Int, planoId)
            .input("cobertura_id", sql.Int, coberturaId).query(`
              INSERT INTO Coberturas (plano_id, descricao)
              SELECT @plano_id, descricao
              FROM Coberturas
              WHERE cobertura_id = @cobertura_id;
            `);
        }
      }

      await transaction.commit();

      res.status(201).json({
        message: "Plano criado com sucesso",
        plano_id: planoId,
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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

    console.error("Erro ao criar plano:", err);
    res.status(500).json({
      message: "Erro ao criar plano",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Atualizar plano
router.put("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const updateData = updatePlanoSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se o plano existe
    const checkResult = await pool
      .request()
      .input("plano_id", sql.Int, id)
      .query("SELECT COUNT(*) as count FROM Planos WHERE plano_id = @plano_id");

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }

    // Inicia a transação
    const transaction = await pool.transaction();
    try {
      await transaction.begin();

      // Atualiza os dados do plano
      const updateFields = Object.keys(updateData)
        .filter((key) => key !== "coberturas")
        .map((key) => `${key} = @${key}`)
        .join(", ");

      if (updateFields) {
        const query = `
          UPDATE Planos 
          SET ${updateFields}
          WHERE plano_id = @plano_id;
        `;

        const request = transaction.request().input("plano_id", sql.Int, id);

        // Adiciona os parâmetros dinamicamente
        Object.entries(updateData).forEach(([key, value]) => {
          if (key !== "coberturas") {
            if (key === "valor_mensal") {
              request.input(key, sql.Decimal, value);
            } else {
              request.input(key, sql.VarChar, value);
            }
          }
        });

        await request.query(query);
      }

      // Atualiza as coberturas do plano
      if (updateData.coberturas) {
        // Remove todas as coberturas existentes
        await transaction
          .request()
          .input("plano_id", sql.Int, id)
          .query("DELETE FROM Coberturas WHERE plano_id = @plano_id");

        // Insere as novas coberturas
        for (const coberturaId of updateData.coberturas) {
          await transaction
            .request()
            .input("plano_id", sql.Int, id)
            .input("cobertura_id", sql.Int, coberturaId).query(`
              INSERT INTO Coberturas (plano_id, descricao)
              SELECT @plano_id, descricao
              FROM Coberturas
              WHERE cobertura_id = @cobertura_id;
            `);
        }
      }

      await transaction.commit();

      res.json({ message: "Plano atualizado com sucesso" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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

    console.error("Erro ao atualizar plano:", err);
    res.status(500).json({
      message: "Erro ao atualizar plano",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Deletar plano
router.delete("/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const pool = await connectToDatabase();

    // Verifica se o plano existe
    const checkResult = await pool
      .request()
      .input("plano_id", sql.Int, id)
      .query("SELECT COUNT(*) as count FROM Planos WHERE plano_id = @plano_id");

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: "Plano não encontrado" });
    }

    // Verifica se existem registros dependentes
    const dependencias = await pool
      .request()
      .input("plano_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM Apolices WHERE plano_id = @plano_id"
      );

    if (dependencias.recordset[0].count > 0) {
      return res.status(400).json({
        message:
          "Não é possível excluir o plano pois existem apólices vinculadas a ele",
      });
    }

    // Inicia a transação
    const transaction = await pool.transaction();
    try {
      await transaction.begin();

      // Remove as coberturas do plano
      await transaction
        .request()
        .input("plano_id", sql.Int, id)
        .query("DELETE FROM Coberturas WHERE plano_id = @plano_id");

      // Remove o plano
      await transaction
        .request()
        .input("plano_id", sql.Int, id)
        .query("DELETE FROM Planos WHERE plano_id = @plano_id");

      await transaction.commit();

      res.json({ message: "Plano excluído com sucesso" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("Erro ao excluir plano:", err);
    res.status(500).json({
      message: "Erro ao excluir plano",
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

export default router;
