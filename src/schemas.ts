import { z } from "zod";

// Schema para Clientes
export const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
});

export const updateClienteSchema = clienteSchema.partial();

// Schema para Marcas
export const marcaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
});

export const updateMarcaSchema = marcaSchema.partial();

// Schema para Celulares
export const celularSchema = z.object({
  marca_id: z.string(),
  modelo: z.string().min(1, "Modelo é obrigatório"),
  imei: z.string().min(1, "IMEI é obrigatório"),
  valor: z.string().transform((val) => Number(val)),
});

export const updateCelularSchema = celularSchema.partial();

// Schema para Planos
export const planoSchema = z.object({
  nome_plano: z.string().min(1, "Nome do plano é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor_mensal: z.string().transform((val) => Number(val)),
  coberturas: z.array(z.number().int()).optional(),
});

export const updatePlanoSchema = planoSchema.partial();

// Schema para Coberturas
export const coberturaSchema = z.object({
  plano_id: z.number(),
  descricao: z.string().min(1, "Descrição é obrigatória"),
});

export const updateCoberturaSchema = coberturaSchema.partial();

// Schema para Apólices
export const apoliceSchema = z.object({
  celular_id: z.string(),
  cliente_id: z.string(),
  plano_id: z.string(),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim: z.string().min(1, "Data de fim é obrigatória"),
  status: z.enum(["ATIVA", "CANCELADA", "SUSPENSA"], {
    errorMap: () => ({ message: "Status inválido" }),
  }),
});

export const updateApoliceSchema = z.object({
  celular_id: z.string().optional(),
  cliente_id: z.string().optional(),
  plano_id: z.string().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  status: z
    .enum(["ATIVA", "CANCELADA", "SUSPENSA"], {
      errorMap: () => ({ message: "Status inválido" }),
    })
    .optional(),
});

export const metodoPagamentoSchema = z.object({
  nome: z.string().min(2),
});

export const pagamentoSchema = z.object({
  apolice_id: z.string(),
  data_pagamento: z.string().transform((str) => new Date(str)),
  valor_pago: z.string(),
  status: z.enum(["PENDENTE", "PAGO", "CANCELADO", "ATRASADO"]),
  metodo_pagamento_id: z.string(),
});

export const atendenteSchema = z.object({
  nome_atendente: z.string().min(2),
  email_atendente: z.string().email(),
  telefone_atendente: z.string().min(11),
  cargo: z.string().min(2),
  data_admissao: z.string().transform((str) => new Date(str)),
});

export const atendimentoSchema = z.object({
  cliente_id: z.string(),
  atendente_id: z.string(),
  data_atendimento: z.string().transform((str) => new Date(str)),
  tipo_contato: z.enum(["TELEFONE", "EMAIL", "CHAT", "PRESENCIAL"]),
  assunto: z.string().min(2),
  observacoes: z.string(),
});

export const sinistroSchema = z.object({
  apolice_id: z.string(),
  data_ocorrencia: z.string().transform((str) => new Date(str)),
  tipo_ocorrencia: z.string().min(2),
  descricao: z.string(),
  status: z.enum(["ABERTO", "EM_ANALISE", "APROVADO", "REJEITADO", "FECHADO"]),
});

export const updateMetodoPagamentoSchema = metodoPagamentoSchema.partial();
export const updatePagamentoSchema = pagamentoSchema.partial();
export const updateAtendenteSchema = atendenteSchema.partial();
export const updateAtendimentoSchema = atendimentoSchema.partial();
export const updateSinistroSchema = sinistroSchema.partial();
