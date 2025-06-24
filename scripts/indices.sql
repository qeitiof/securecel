-- indices para a tabela Clientes
CREATE NONCLUSTERED INDEX idx_clientes_nome ON Clientes(nome);
CREATE NONCLUSTERED INDEX idx_clientes_email ON Clientes(email);
CREATE NONCLUSTERED INDEX idx_clientes_telefone ON Clientes(telefone);
GO

-- indices para a tabela Celulares
CREATE NONCLUSTERED INDEX idx_celulares_cliente_id ON Celulares(cliente_id);
CREATE NONCLUSTERED INDEX idx_celulares_marca_id ON Celulares(marca_id);
GO

-- indices para a tabela Marcas
CREATE NONCLUSTERED INDEX idx_marcas_nome ON Marcas(nome);
GO

-- indices para a tabela Planos
CREATE NONCLUSTERED INDEX idx_planos_nome_plano ON Planos(nome_plano);
GO

-- indices para a tabela Coberturas
CREATE NONCLUSTERED INDEX idx_coberturas_plano_id ON Coberturas(plano_id);
GO

-- indices para a tabela Apolices
CREATE NONCLUSTERED INDEX idx_apolices_cliente_id ON Apolices(cliente_id);
CREATE NONCLUSTERED INDEX idx_apolices_celular_id ON Apolices(celular_id);
CREATE NONCLUSTERED INDEX idx_apolices_plano_id ON Apolices(plano_id);
GO

-- indices para a tabela Detalhes_Apolices
CREATE NONCLUSTERED INDEX idx_detalhes_apolices_apolice_id ON Detalhes_Apolices(apolice_id);
CREATE NONCLUSTERED INDEX idx_detalhes_apolices_status ON Detalhes_Apolices(status);
GO



-- indices para a tabela Pagamentos
CREATE NONCLUSTERED INDEX idx_pagamentos_apolice_id ON Pagamentos(apolice_id);
CREATE NONCLUSTERED INDEX idx_pagamentos_status_pagamentos_id ON Pagamentos(status_pagamentos_id);
CREATE NONCLUSTERED INDEX idx_pagamentos_metodo_pagamento_id ON Pagamentos(metodo_pagamento_id);
GO

-- indices para a tabela Status_Pagamentos
CREATE NONCLUSTERED INDEX idx_status_pagamentos_nome_status ON Status_Pagamentos(nome_status);
GO

-- indices para a tabela Metodo_Pagamento
CREATE NONCLUSTERED INDEX idx_metodo_pagamento_nome ON Metodo_Pagamento(nome);
GO

-- indices para a tabela Sinistros
CREATE NONCLUSTERED INDEX idx_sinistros_apolice_id ON Sinistros(apolice_id);
CREATE NONCLUSTERED INDEX idx_sinistros_tipo_ocorrencia_id ON Sinistros(tipo_ocorrencia_id);
CREATE NONCLUSTERED INDEX idx_sinistros_status_sinistro_id ON Sinistros(status_sinistro_id);
GO

-- indices para a tabela Tipos_Ocorrencia
CREATE NONCLUSTERED INDEX idx_tipos_ocorrencia_nome_tipo ON Tipos_Ocorrencia(nome_tipo);
GO

-- indices para a tabela Status_Sinistros
CREATE NONCLUSTERED INDEX idx_status_sinistros_nome_status ON Status_Sinistros(nome_status);
GO

-- indices para a tabela Atendimentos  
CREATE NONCLUSTERED INDEX idx_atendimentos_cliente_id ON Atendimentos(cliente_id);
CREATE NONCLUSTERED INDEX idx_atendimentos_atendente_id ON Atendimentos(atendente_id);
CREATE NONCLUSTERED INDEX idx_atendimentos_tipo_contato ON Atendimentos(tipo_contato);
GO  

-- indices para a tabela Atendentes
CREATE NONCLUSTERED INDEX idx_atendentes_nome_atendente ON Atendentes(nome_atendente);
CREATE NONCLUSTERED INDEX idx_atendentes_telefone_atendente ON Atendentes(telefone_atendente);
GO  

