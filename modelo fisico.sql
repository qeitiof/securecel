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
  descricao text
  valor_mensal decimal(10,2)
}

Table Coberturas {
  cobertura_id int [pk, increment]
  plano_id int [ref: > Planos.plano_id]
  descricao text
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
  descricao text
  status varchar(20) // ENUM: 'Em Análise', 'Aprovado', 'Negado'
}

Table Atendimentos {
  atendimento_id int [pk, increment]
  cliente_id int [ref: > Clientes.cliente_id]
  atendente_id int [ref: > Atendentes.atendente_id]
  data_atendimento datetime
  tipo_contato varchar(20) // ENUM: 'Telefone', 'Email', 'Chat'
  assunto varchar(100)
  observacoes text
}

Table Atendentes {
  atendente_id int [pk, increment]
  nome_atendente varchar(100)
  email_atendente varchar(100) [unique]
  telefone_atendente varchar(15)
  cargo varchar(50) // Cargo do atendente (ex: "Suporte", "Financeiro", etc.)
  data_admissao date
}