import express, { Request, Response, Router, RequestHandler } from "express";
import cors from "cors";
import dotenv from "dotenv";
import sql from "mssql";
import { z } from "zod";
import clientesRouter from "./routes/clientes";
import marcasRouter from "./routes/marcas";
import celularesRouter from "./routes/celulares";
import planosRouter from "./routes/planos";
import coberturasRouter from "./routes/coberturas";
import apolicesRouter from "./routes/apolices";
import atendentesRouter from "./routes/atendentes";
import atendimentosRouter from "./routes/atendimentos";
// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração do SQL Server
const dbConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: false, // Use true se estiver usando Azure ou SSL
    trustServerCertificate: true, // Para certificados autoassinados
  },
};

console.log(dbConfig);

// Função para conectar ao banco de dados
async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log("Conexão com o SQL Server estabelecida com sucesso!");
    return pool;
  } catch (err) {
    console.log(err);

    console.error("Erro ao conectar ao SQL Server:", err);
    throw err;
  }
}

// Middlewares
app.use(cors()); // Habilita CORS para todas as rotas
app.use(express.json()); // Parseia requisições JSON

// Configuração para servir arquivos estáticos da pasta public
app.use(express.static("public"));

// Rotas
app.use("/api/clientes", clientesRouter);
app.use("/api/marcas", marcasRouter);
app.use("/api/celulares", celularesRouter);
app.use("/api/planos", planosRouter);
app.use("/api/coberturas", coberturasRouter);
app.use("/api/apolices", apolicesRouter);
app.use("/api/atendentes", atendentesRouter);
app.use("/api/atendimentos", atendimentosRouter);

// Rota padrão para servir o index.html
app.get("/", (req: Request, res: Response) => {
  res.sendFile("index.html", { root: "./public" });
});

// Rota para testar a conexão com o banco
app.get("/clientes", async (req: Request, res: Response) => {
  try {
    const pool = await connectToDatabase();
    const result = await pool.request().query("SELECT * from clientes");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({
      message: "Erro ao conectar ao banco de dados",
      error: (err as Error).message,
    });
  }
});

const insertCostumerSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().min(11),
  cpf: z.string().min(11),
});

const updateCostumerSchema = insertCostumerSchema.partial();

type insertCostumerType = z.infer<typeof insertCostumerSchema>;
type updateCostumerType = z.infer<typeof updateCostumerSchema>;

app.post("/clientes", (async (req: Request, res: Response) => {
  try {
    const { cpf, email, nome, telefone } = insertCostumerSchema.parse(req.body);

    const pool = await connectToDatabase();
    const result = await pool
      .request()
      .input("nome", sql.VarChar, nome)
      .input("email", sql.VarChar, email)
      .input("cpf", sql.VarChar, cpf || null)
      .input("telefone", sql.VarChar, telefone || null).query(`
        INSERT INTO clientes (nome, email, telefone, cpf, data_cadastro)
        VALUES (@nome, @email, @telefone, @cpf, GETDATE());
        SELECT SCOPE_IDENTITY() as id;
      `);

    return res.status(201).json({
      message: "Cliente cadastrado com sucesso",
      id: result.recordset[0].id,
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

    console.error("Erro ao cadastrar cliente:", err);
    return res.status(500).json({
      message: "Erro ao cadastrar cliente",
      error: (err as Error).message,
    });
  }
}) as unknown as RequestHandler);

// Rota para atualizar um cliente
app.put("/clientes/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const updateData = updateCostumerSchema.parse(req.body);

    const pool = await connectToDatabase();

    // Verifica se o cliente existe
    const checkResult = await pool
      .request()
      .input("cliente_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM clientes WHERE cliente_id = @cliente_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({
        message: "Cliente não encontrado",
      });
    }

    // Constrói a query dinamicamente baseada nos campos fornecidos
    const updateFields = Object.keys(updateData)
      .map((key) => `${key} = @${key}`)
      .join(", ");

    const query = `
      UPDATE clientes 
      SET ${updateFields}
      WHERE cliente_id = @cliente_id;
    `;

    console.log("query");
    console.log(query);

    const request = pool.request().input("cliente_id", sql.Int, id);

    // Adiciona os parâmetros dinamicamente
    Object.entries(updateData).forEach(([key, value]) => {
      request.input(key, sql.VarChar, value);
    });

    await request.query(query);

    return res.status(200).json({
      message: "Cliente atualizado com sucesso",
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

    console.error("Erro ao atualizar cliente:", err);
    return res.status(500).json({
      message: "Erro ao atualizar cliente",
      error: (err as Error).message,
    });
  }
}) as unknown as RequestHandler);

// Rota para excluir um cliente
app.delete("/clientes/:id", (async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const pool = await connectToDatabase();

    // Verifica se o cliente existe
    const checkResult = await pool
      .request()
      .input("cliente_id", sql.Int, id)
      .query(
        "SELECT COUNT(*) as count FROM clientes WHERE cliente_id = @cliente_id"
      );

    if (checkResult.recordset[0].count === 0) {
      return res.status(404).json({
        message: "Cliente não encontrado",
      });
    }

    await pool
      .request()
      .input("cliente_id", sql.Int, id)
      .query("DELETE FROM clientes WHERE cliente_id = @cliente_id");

    return res.status(200).json({
      message: "Cliente excluído com sucesso",
    });
  } catch (err) {
    console.error("Erro ao excluir cliente:", err);
    return res.status(500).json({
      message: "Erro ao excluir cliente",
      error: (err as Error).message,
    });
  }
}) as unknown as RequestHandler);

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
