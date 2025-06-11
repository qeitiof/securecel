CREATE TABLE [Clientes] (
  [cliente_id] int PRIMARY KEY IDENTITY(1, 1),
  [nome] varchar(100),
  [cpf] varchar(11) UNIQUE,
  [email] varchar(100),
  [telefone] varchar(15),
  [data_cadastro] date
)
GO

CREATE TABLE [Celulares] (
  [celular_id] int PRIMARY KEY IDENTITY(1, 1),
  [cliente_id] int,
  [marca_id] int,
  [modelo] varchar(50),
  [imei] varchar(20) UNIQUE,
  [valor] decimal(10,2)
)
GO

CREATE TABLE [Marcas] (
  [marca_id] int PRIMARY KEY IDENTITY(1, 1),
  [nome] varchar(50)
)
GO

CREATE TABLE [Planos] (
  [plano_id] int PRIMARY KEY IDENTITY(1, 1),
  [nome_plano] varchar(50),
  [descricao] varchar(500),
  [valor_mensal] decimal(10,2)
)
GO

CREATE TABLE [Coberturas] (
  [cobertura_id] int PRIMARY KEY IDENTITY(1, 1),
  [plano_id] int,
  [descricao] varchar(500)
)
GO

CREATE TABLE [Apolices] (
  [apolice_id] int PRIMARY KEY IDENTITY(1, 1),
  [cliente_id] int,
  [celular_id] int,
  [plano_id] int
)
GO

CREATE TABLE [Detalhes_Apolices] (
  [apolice_id] int,
  [data_inicio] date,
  [data_fim] date,
  [status] varchar(20)
)
GO

CREATE TABLE [Pagamentos] (
  [pagamento_id] int PRIMARY KEY IDENTITY(1, 1),
  [apolice_id] int,
  [data_pagamento] date,
  [valor_pago] decimal(10,2),
  [status] varchar(20),
  [metodo_pagamento_id] int
)
GO

CREATE TABLE [Metodo_Pagamento] (
  [metodo_pagamento_id] int PRIMARY KEY IDENTITY(1, 1),
  [nome] varchar(50)
)
GO

CREATE TABLE [Sinistros] (
  [sinistro_id] int PRIMARY KEY IDENTITY(1, 1),
  [apolice_id] int,
  [data_ocorrencia] date,
  [tipo_ocorrencia] varchar(30),
  [descricao] varchar(500),
  [status] varchar(20)
)
GO

CREATE TABLE [Atendimentos] (
  [atendimento_id] int PRIMARY KEY IDENTITY(1, 1),
  [cliente_id] int,
  [atendente_id] int,
  [data_atendimento] datetime,
  [tipo_contato] varchar(20),
  [assunto] varchar(100),
  [observacoes] varchar(500)
)
GO

CREATE TABLE [Atendentes] (
  [atendente_id] int PRIMARY KEY IDENTITY(1, 1),
  [nome_atendente] varchar(100),
  [email_atendente] varchar(100) UNIQUE,
  [telefone_atendente] varchar(15),
  [cargo] varchar(50),
  [data_admissao] date
)
GO

ALTER TABLE [Celulares] ADD FOREIGN KEY ([cliente_id]) REFERENCES [Clientes] ([cliente_id])
GO

ALTER TABLE [Celulares] ADD FOREIGN KEY ([marca_id]) REFERENCES [Marcas] ([marca_id])
GO

ALTER TABLE [Coberturas] ADD FOREIGN KEY ([plano_id]) REFERENCES [Planos] ([plano_id])
GO

ALTER TABLE [Apolices] ADD FOREIGN KEY ([cliente_id]) REFERENCES [Clientes] ([cliente_id])
GO

ALTER TABLE [Apolices] ADD FOREIGN KEY ([celular_id]) REFERENCES [Celulares] ([celular_id])
GO

ALTER TABLE [Apolices] ADD FOREIGN KEY ([plano_id]) REFERENCES [Planos] ([plano_id])
GO

ALTER TABLE [Detalhes_Apolices] ADD FOREIGN KEY ([apolice_id]) REFERENCES [Apolices] ([apolice_id])
GO

ALTER TABLE [Pagamentos] ADD FOREIGN KEY ([apolice_id]) REFERENCES [Apolices] ([apolice_id])
GO

ALTER TABLE [Pagamentos] ADD FOREIGN KEY ([metodo_pagamento_id]) REFERENCES [Metodo_Pagamento] ([metodo_pagamento_id])
GO

ALTER TABLE [Sinistros] ADD FOREIGN KEY ([apolice_id]) REFERENCES [Apolices] ([apolice_id])
GO

ALTER TABLE [Atendimentos] ADD FOREIGN KEY ([cliente_id]) REFERENCES [Clientes] ([cliente_id])
GO

ALTER TABLE [Atendimentos] ADD FOREIGN KEY ([atendente_id]) REFERENCES [Atendentes] ([atendente_id])
GO




drop table Clientes
drop table Celulares
drop table Marcas
drop table Planos
drop table Coberturas
drop table Apolices
drop table Detalhes_Apolices
drop table Pagamentos
drop table Metodo_Pagamento
drop table Sinistros
drop table Atendimentos
drop table Atendentes


Project SeguroCelular {
  database_type: "MySQL"
}

Table Clientes {
  cliente_id int [pk, increment]
  nome varchar(100)
  cpf varchar(14) [unique]
  email varchar(100)
  telefone varchar(15)
  data_cadastro date
}

Table Celulares {
  celular_id int [pk, increment]
  cliente_id int [ref: > Clientes.cliente_id]
  marca_id int [ref: > Marcas.marca_id] 
  modelo varchar(50)
  imei varchar(20) [unique]
  valor decimal(10,2)
}

Table Marcas {
  marca_id int [pk, increment]
  nome varchar(50)
}

Table Planos {
  plano_id int [pk, increment]
  nome_plano varchar(50)
  descricao varchar(500)
  valor_mensal decimal(10,2)
}

Table Coberturas {
  cobertura_id int [pk, increment]
  plano_id int [ref: > Planos.plano_id]
  descricao varchar(500)
}

Table Apolices {
  apolice_id int [pk, increment]
  cliente_id int [ref: > Clientes.cliente_id]
  celular_id int [ref: > Celulares.celular_id]
  plano_id int [ref: > Planos.plano_id]
}

Table Detalhes_Apolices {
  apolice_id int [ref: > Apolices.apolice_id]
  data_inicio date
  data_fim date
  status varchar(20) // ENUM: 'Ativa', 'Cancelada', 'Expirada'
}

Table Pagamentos {
  pagamento_id int [pk, increment]
  apolice_id int [ref: > Apolices.apolice_id]
  data_pagamento date
  valor_pago decimal(10,2)
  status varchar(20) // ENUM: 'Pago', 'Pendente', 'Atrasado'
  metodo_pagamento_id int [ref: > Metodo_Pagamento.metodo_pagamento_id]
}

Table Metodo_Pagamento {
  metodo_pagamento_id int [pk, increment]
  nome varchar(50) // Exemplo: 'Cartão de Crédito', 'Boleto', 'Pix'
}

Table Sinistros {
  sinistro_id int [pk, increment]
  apolice_id int [ref: > Apolices.apolice_id]
  data_ocorrencia date
  tipo_ocorrencia varchar(30) // ENUM: 'Roubo', 'Furto', 'Quebra Acidental', 'Outro'
  descricao varchar(500)
  status varchar(20) // ENUM: 'Em Análise', 'Aprovado', 'Negado'
}

Table Atendimentos {
  atendimento_id int [pk, increment]
  cliente_id int [ref: > Clientes.cliente_id]
  atendente_id int [ref: > Atendentes.atendente_id]
  data_atendimento datetime
  tipo_contato varchar(20) // ENUM: 'Telefone', 'Email', 'Chat'
  assunto varchar(100)
  observacoes varchar(500)
}

Table Atendentes {
  atendente_id int [pk, increment]
  nome_atendente varchar(100)
  email_atendente varchar(100) [unique]
  telefone_atendente varchar(15)
  cargo varchar(50) // Cargo do atendente (ex: "Suporte", "Financeiro", etc.)
  data_admissao date
}