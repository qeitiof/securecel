CREATE TABLE Clientes (
  cliente_id int PRIMARY KEY IDENTITY(1, 1),
  nome varchar(100),
  cpf varchar(14) UNIQUE,
  email varchar(100),
  telefone varchar(16),
  data_cadastro date
)
GO

CREATE TABLE Atendentes (
  atendente_id int PRIMARY KEY IDENTITY(1, 1),
  nome_atendente varchar(100),
  email_atendente varchar(100) UNIQUE,
  telefone_atendente varchar(16),
  cargo_id int,
  data_admissao date
)
GO

CREATE TABLE Atendimentos (
  atendimento_id int PRIMARY KEY IDENTITY(1, 1),
  cliente_id int,
  atendente_id int,
  data_atendimento datetime,
  tipo_contato varchar(20),
  assunto varchar(100),
  observacoes varchar(500)
)
GO

CREATE TABLE Apolices (
  apolice_id int PRIMARY KEY IDENTITY(1, 1),
  cliente_id int,
  celular_id int,
  plano_id int
)
GO

CREATE TABLE Detalhes_Apolices (
  apolice_id int,
  data_inicio date,
  data_fim date,
  status varchar(20)
)
GO


CREATE TABLE Celulares (
  celular_id int PRIMARY KEY IDENTITY(1, 1),
  cliente_id int,
  marca_id int,
  modelo varchar(50),
  imei varchar(20) UNIQUE,
  valor decimal(10,2)
)
GO

CREATE TABLE Marcas (
  marca_id int PRIMARY KEY IDENTITY(1, 1),
  nome varchar(50)
)
GO


CREATE TABLE Planos (
  plano_id int PRIMARY KEY IDENTITY(1, 1),
  nome_plano varchar(50),
  descricao varchar(500),
  valor_mensal decimal(10,2)
)
GO


CREATE TABLE Coberturas (
  cobertura_id int PRIMARY KEY IDENTITY(1, 1),
  plano_id int,
  descricao varchar(500)
)
GO


CREATE TABLE Pagamentos (
  pagamento_id int PRIMARY KEY IDENTITY(1, 1),
  apolice_id int,
  data_pagamento date,
  valor_pago decimal(10,2),
  status_pagamentos_id int,
  metodo_pagamento_id int
)
GO

CREATE TABLE Status_Pagamentos (
  status_pagamento_id int PRIMARY KEY IDENTITY(1, 1),
  nome_status varchar(50)
)
GO


CREATE TABLE Metodo_Pagamento (
  metodo_pagamento_id int PRIMARY KEY IDENTITY(1, 1),
  nome varchar(50)
)
GO

CREATE TABLE Sinistros (
  sinistro_id int PRIMARY KEY IDENTITY(1, 1),
  apolice_id int,
  data_ocorrencia date,
  tipo_ocorrencia_id int,
  descricao varchar(500),
  status_sinistro_id int
)
GO


CREATE TABLE Tipos_Ocorrencia (
  tipo_ocorrencia_id int PRIMARY KEY IDENTITY(1, 1),
  nome_tipo varchar(50)
)
GO


CREATE TABLE Status_Sinistros (
  status_sinistro_id int PRIMARY KEY IDENTITY(1, 1),
  nome_status varchar(50)
)
GO

ALTER TABLE Celulares ADD FOREIGN KEY (cliente_id) REFERENCES Clientes (cliente_id)
GO

ALTER TABLE Celulares ADD FOREIGN KEY (marca_id) REFERENCES Marcas (marca_id)
GO

ALTER TABLE Coberturas ADD FOREIGN KEY (plano_id) REFERENCES Planos (plano_id)
GO

ALTER TABLE Apolices ADD FOREIGN KEY (cliente_id) REFERENCES Clientes (cliente_id)
GO

ALTER TABLE Apolices ADD FOREIGN KEY (celular_id) REFERENCES Celulares (celular_id)
GO

ALTER TABLE Apolices ADD FOREIGN KEY (plano_id) REFERENCES Planos (plano_id)
GO

ALTER TABLE Detalhes_Apolices ADD FOREIGN KEY (apolice_id) REFERENCES Apolices (apolice_id)
GO



ALTER TABLE Pagamentos ADD FOREIGN KEY (apolice_id) REFERENCES Apolices (apolice_id)
GO

ALTER TABLE Pagamentos ADD FOREIGN KEY (metodo_pagamento_id) REFERENCES Metodo_Pagamento (metodo_pagamento_id)
GO

ALTER TABLE Sinistros ADD FOREIGN KEY (apolice_id) REFERENCES Apolices (apolice_id)
GO

ALTER TABLE Sinistros ADD FOREIGN KEY (tipo_ocorrencia_id) REFERENCES Tipos_Ocorrencia (tipo_ocorrencia_id)
GO

ALTER TABLE Sinistros ADD FOREIGN KEY (status_sinistro_id) REFERENCES Status_Sinistros (status_sinistro_id)
GO

ALTER TABLE Atendimentos ADD FOREIGN KEY (cliente_id) REFERENCES Clientes (cliente_id)
GO

ALTER TABLE Atendimentos ADD FOREIGN KEY (atendente_id) REFERENCES Atendentes (atendente_id)
GO




ALTER TABLE Clientes
ADD CONSTRAINT chk_cpf_length CHECK (LEN(cpf) >= 11 AND LEN(cpf) <= 14);
GO

ALTER TABLE Celulares
ADD CONSTRAINT chk_imei_length CHECK (LEN(imei) >= 15 and LEN(imei) <= 20);
GO

ALTER TABLE Celulares
ADD CONSTRAINT chk_valor_celular CHECK (valor >= 1)
GO

ALTER TABLE Planos
ADD CONSTRAINT chk_valor_mensal_plano CHECK (valor_mensal >= 1)
GO

ALTER TABLE Pagamentos
ADD CONSTRAINT chk_valor_pago CHECK (valor_pago >= 1)
GO

ALTER TABLE Detalhes_Apolices
ADD CONSTRAINT chk_datas_apolice CHECK (data_inicio <= data_fim)
GO

ALTER TABLE Clientes
ADD CONSTRAINT chk_telefone_cliente_length CHECK (LEN(telefone) >= 10)
GO

ALTER TABLE Atendentes
ADD CONSTRAINT chk_telefone_atendente_length CHECK (LEN(telefone_atendente) >= 10)
GO