import { Router, Request, Response, RequestHandler } from 'express';
import sql from 'mssql';
import { z } from 'zod';
import { clienteSchema, updateClienteSchema } from '../schemas';
import { connectToDatabase } from '../database';

const router = Router();

// Listar todos os clientes
router.get('/', (async (req: Request, res: Response) => {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query('SELECT * FROM Clientes');
    res.json(result.recordset);
  } catch (err) {
    console.error('Erro ao listar clientes:', err);
    res.status(500).json({
      message: 'Erro ao listar clientes',
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Buscar cliente por ID
router.get('/:id', (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input('cliente_id', sql.Int, id)
      .query('SELECT * FROM Clientes WHERE cliente_id = @cliente_id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Erro ao buscar cliente:', err);
    res.status(500).json({
      message: 'Erro ao buscar cliente',
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Criar novo cliente
router.post('/', (async (req: Request, res: Response) => {
  try {
    const clienteData = clienteSchema.parse(req.body);
    const pool = await connectToDatabase();

    const result = await pool
      .request()
      .input('nome', sql.VarChar, clienteData.nome)
      .input('email', sql.VarChar, clienteData.email)
      .input('telefone', sql.VarChar, clienteData.telefone)
      .input('cpf', sql.VarChar, clienteData.cpf)
      .query(`
        INSERT INTO Clientes (nome, email, telefone, cpf, data_cadastro)
        VALUES (@nome, @email, @telefone, @cpf, GETDATE());
        SELECT SCOPE_IDENTITY() as cliente_id;
      `);

    res.status(201).json({
      message: 'Cliente criado com sucesso',
      cliente_id: result.recordset[0].cliente_id,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Erro de validação dos dados',
        errors: err.errors.map((error: z.ZodIssue) => ({
          field: error.path.join('.'),
          message: error.message,
        })),
      });
    }

    console.error('Erro ao criar cliente:', err);
    res.status(500).json({
      message: 'Erro ao criar cliente',
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Atualizar cliente
router.put('/:id', (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const updateData = updateClienteSchema.parse(req.body);
    const pool = await connectToDatabase();

    // Verifica se o cliente existe
    const checkResult = await pool
      .request()
      .input('cliente_id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM Clientes WHERE cliente_id = @cliente_id');

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Constrói a query dinamicamente
    const updateFields = Object.keys(updateData)
      .map(key => `${key} = @${key}`)
      .join(', ');

    const query = `
      UPDATE Clientes 
      SET ${updateFields}
      WHERE cliente_id = @cliente_id;
    `;

    const request = pool.request().input('cliente_id', sql.Int, id);

    // Adiciona os parâmetros dinamicamente
    Object.entries(updateData).forEach(([key, value]) => {
      request.input(key, sql.VarChar, value);
    });

    await request.query(query);

    res.json({ message: 'Cliente atualizado com sucesso' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Erro de validação dos dados',
        errors: err.errors.map((error: z.ZodIssue) => ({
          field: error.path.join('.'),
          message: error.message,
        })),
      });
    }

    console.error('Erro ao atualizar cliente:', err);
    res.status(500).json({
      message: 'Erro ao atualizar cliente',
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

// Deletar cliente
router.delete('/:id', (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const pool = await connectToDatabase();

    // Verifica se o cliente existe
    const checkResult = await pool
      .request()
      .input('cliente_id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM Clientes WHERE cliente_id = @cliente_id');

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Verifica se existem registros dependentes
    const dependencias = await pool
      .request()
      .input('cliente_id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM Apolices WHERE cliente_id = @cliente_id');

    if (dependencias.recordset[0].count > 0) {
      return res.status(400).json({
        message: 'Não é possível excluir o cliente pois existem apólices vinculadas a ele',
      });
    }

    await pool
      .request()
      .input('cliente_id', sql.Int, id)
      .query('DELETE FROM Clientes WHERE cliente_id = @cliente_id');

    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    res.status(500).json({
      message: 'Erro ao excluir cliente',
      error: (err as Error).message,
    });
  }
}) as RequestHandler);

export default router; 