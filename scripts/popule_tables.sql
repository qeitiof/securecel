-- Tabelas de domínio
INSERT INTO Status_Apolices (nome_status) VALUES ('ATIVA'), ('CANCELADA'), ('EXPIRADA');
INSERT INTO Status_Pagamentos (nome_status) VALUES ('Pago'), ('Pendente'), ('Cancelado');
INSERT INTO Status_Sinistros (nome_status) VALUES ('Aberto'), ('Fechado');
INSERT INTO Tipos_Ocorrencia (nome_tipo) VALUES ('Roubo'), ('Furto'), ('Dano Acidental'), ('Perda');
INSERT INTO Cargos (nome_cargo, descricao_cargo) VALUES 
  ('Suporte', 'Atendimento ao cliente'),
  ('Gerente', 'Gestão de equipe'),
  ('Analista', 'Análise de processos'),
  ('Supervisor', 'Supervisão de operações');
INSERT INTO Tipos_Contato_Atendimento (nome_tipo) VALUES ('Telefone'), ('E-mail'), ('Chat');

-- Clientes
INSERT INTO Clientes (nome, cpf, email, telefone, data_cadastro) VALUES
('João Silva', '123.456.789-01', 'joao.silva@email.com', '11999990000', '2025/01/05'),
('Maria Souza', '98765432100', 'maria.souza@email.com', '11999991111', '2025/01/06'),
('Pedro Santos', '111.222.333-44', 'pedro.santos@email.com', '11999992222', '2025/01/10'),
('Ana Oliveira', '55566677788', 'ana.oliveira@email.com', '11999993333', '2025/01/13'),
('Lucas Costa', '44455566677', 'lucas.costa@email.com', '11999994444', '2025/01/16'),
('Mariana Lima', '888.999.000-11', 'mariana.lima@email.com', '11999995555', '2025/01/17'),
('Carlos Mendes', '77788899900', 'carlos.mendes@email.com', '11999996666', '2025/01/20'),
('Paula Ramos', '33344455566', 'paula.ramos@email.com', '11999997777', '2025/01/20'),
('Felipe Alves', '22233344455', 'felipe.alves@email.com', '11999998888', '2025/01/29'),
('Juliana Pires', '66677788899', 'juliana.pires@email.com', '11999999999', '2025/02/01');


INSERT INTO Marcas (nome) VALUES
('Apple'), 
('Samsung'), 
('Motorola'), 
('Xiaomi'), 
('LG'),
('Nokia'), 
('Sony'), 
('Huawei'), 
('Asus'), 
('Lenovo');

-- Celulares
INSERT INTO Celulares (cliente_id, marca_id, modelo, imei, valor) VALUES
(1, 1, 'iPhone 13', '111111111111111', 5000.00),
(2, 2, 'Galaxy S21', '222222222222222', 4500.00),
(3, 3, 'Moto G100', '333333333333333', 3000.00),
(4, 4, 'Redmi Note 10', '444444444444444', 2000.00),
(5, 5, 'LG K52', '555555555555555', 1500.00),
(6, 6, 'Nokia G50', '666666666666666', 1800.00),
(7, 7, 'Xperia 10', '777777777777777', 3500.00),
(8, 8, 'P40 Lite', '888888888888888', 2700.00),
(9, 9, 'Zenfone 8', '999999999999999', 4000.00),
(10, 10, 'Legion Phone', '101010101010101', 6000.00);

-- Planos
INSERT INTO Planos (nome_plano, descricao, valor_mensal) VALUES
('Plano Básico', 'Cobertura básica contra roubo e furto.', 50.00),
('Plano Plus', 'Cobertura completa, incluindo danos acidentais.', 80.00),
('Plano Família', 'Cobertura para múltiplos dispositivos.', 100.00),
('Plano Empresarial', 'Cobertura para empresas.', 150.00),
('Plano Estudante', 'Cobertura especial para estudantes.', 40.00),
('Plano VIP', 'Cobertura premium com atendimento personalizado.', 200.00),
('Plano Silver', 'Cobertura intermediária.', 70.00),
('Plano Gold', 'Cobertura completa com benefícios extras.', 120.00),
('Plano Black', 'Cobertura total sem limites.', 250.00),
('Plano Personalizado', 'Cobertura flexível de acordo com suas necessidades.', 180.00);

-- Coberturas
INSERT INTO Coberturas (plano_id, descricao) VALUES
(1, 'Cobertura contra roubo'),
(2, 'Cobertura completa'),
(3, 'Cobertura para toda a família'),
(4, 'Cobertura para empresas'),
(5, 'Cobertura estudantil'),
(6, 'Cobertura VIP'),
(7, 'Cobertura Silver'),
(8, 'Cobertura Gold'),
(9, 'Cobertura Black'),
(10, 'Cobertura flexível');

-- Apolices
INSERT INTO Apolices (cliente_id, celular_id, plano_id) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 3),
(4, 4, 4),
(5, 5, 5),
(6, 6, 6),
(7, 7, 7),
(8, 8, 8),
(9, 9, 9),
(10, 10, 10);

-- Detalhes_Apolices (status_apolice_id: 1=ATIVA)
INSERT INTO Detalhes_Apolices (apolice_id, data_inicio, data_fim, status_apolice_id) VALUES
(1, '2025/01/05', '2026/01/05', 1),
(2, '2025/01/06', '2026/01/06', 1),
(3, '2025/01/10', '2026/01/10', 1),
(4, '2025/01/13', '2026/01/13', 1),
(5, '2025/01/16', '2026/01/16', 1),
(6, '2025/01/17', '2026/01/17', 1),
(7, '2025/01/20', '2026/01/20', 1),
(8, '2025/01/22', '2026/01/20', 1),
(9, '2025/01/29', '2026/01/29', 1),
(10, '2025/02/01', '2026/02/01', 1);

-- Metodo_Pagamento
INSERT INTO Metodo_Pagamento (nome) VALUES
('Cartão de Crédito'), ('Boleto Bancário'), ('Pix'), ('Transferência'), ('Débito Automático'),
('PayPal'), ('Dinheiro'), ('Crédito Loja'), ('Vale Compra'), ('Crédito Celular');

-- Pagamentos (status_pagamentos_id: 1=Pago)
INSERT INTO Pagamentos (apolice_id, data_pagamento, valor_pago, status_pagamentos_id, metodo_pagamento_id) VALUES
(1, '2025/01/10', 50.00, 1, 1),
(2, '2025/01/10', 80.00, 1, 2),
(3, '2025/01/12', 100.00, 1, 3),
(4, '2025/01/15', 150.00, 1, 4),
(5, '2025/01/20', 40.00, 1, 5),
(6, '2025/01/20', 200.00, 1, 6),
(7, '2025/01/22', 70.00, 1, 7),
(8, '2025/01/25', 120.00, 1, 8),
(9, '2025/02/02', 250.00, 1, 9),
(10, '2025/02/10', 180.00, 1, 10);

-- Sinistros (tipo_ocorrencia_id: 1=Roubo, 2=Furto, 3=Dano Acidental, 4=Perda; status_sinistro_id: 1=Aberto, 2=Fechado)
INSERT INTO Sinistros (apolice_id, data_ocorrencia, tipo_ocorrencia_id, descricao, status_sinistro_id) VALUES
(1, '2025/02/01', 1, 'Roubo em transporte público', 1),
(2, '2025/02/01', 2, 'Furto em shopping', 2),
(3, '2025/02/08', 3, 'Queda do aparelho', 1),
(4, '2025/02/10', 1, 'Roubo em casa', 2),
(5, '2025/02/12', 4, 'Perda durante viagem', 1),
(6, '2025/02/18', 2, 'Furto em festa', 1),
(7, '2025/02/18', 1, 'Roubo em transporte público', 2),
(8, '2025/03/08', 3, 'Dano na piscina', 1),
(9, '2025/03/12', 2, 'Furto em evento', 2),
(10, '2025/03/19', 1, 'Roubo em trânsito', 1);

-- Atendentes (cargo_id: 1=Suporte, 2=Gerente, 3=Analista, 4=Supervisor)
INSERT INTO Atendentes (nome_atendente, email_atendente, telefone_atendente, cargo_id, data_admissao) VALUES
('Lucas Atendente', 'lucas.atendente@email.com', '11999990001', 1, '2022/01/05'),
('Mariana Atendente', 'mariana.atendente@email.com', '11999990002', 1, '2022/02/08'),
('Felipe Atendente', 'felipe.atendente@email.com', '11999990003', 1, '2022/03/25'),
('Paula Atendente', 'paula.atendente@email.com', '11999990004', 2, '2022/04/23'),
('Carlos Atendente', 'carlos.atendente@email.com', '11999990005', 3, '2022/05/01'),
('Juliana Atendente', 'juliana.atendente@email.com', '11999990006', 4, '2022/05/05'),
('Pedro Atendente', 'pedro.atendente@email.com', '11999990007', 1, '2022/05/12'),
('Ana Atendente', 'ana.atendente@email.com', '11999990008', 2, '2022/08/10'),
('João Atendente', 'joao.atendente@email.com', '11999990009', 1, '2022/08/12'),
('Rafael Atendente', 'rafael.atendente@email.com', '11999990010', 3, '2022/10/01');

-- Atendimentos (tipo_contato_id: 1=Telefone, 2=E-mail, 3=Chat)
INSERT INTO Atendimentos (cliente_id, atendente_id, data_atendimento, tipo_contato_id, assunto, observacoes) VALUES
(1, 1, '2025/01/15 10:30:50', 1, 'Dúvida sobre plano', 'Cliente com dúvidas sobre cobertura'),
(2, 2, '2025/01/15 20:26:00', 2, 'Troca de aparelho', 'Solicitação de troca de celular'),
(3, 3, '2025/01/28 11:55:00', 3, 'Dúvida sobre pagamento', 'Cliente questionou valor da fatura'),
(4, 4, '2025/02/05 09:00:00', 1, 'Cancelamento', 'Cliente deseja cancelar o plano'),
(5, 5, '2025/02/15 15:08:30', 2, 'Atualização de dados', 'Cliente atualizou endereço'),
(6, 6, '2025/02/22 18:40:00', 3, 'Reembolso', 'Cliente solicitou reembolso'),
(7, 7, '2025/03/08 22:00:23', 1, 'Sinistro', 'Cliente relatou sinistro'),
(8, 8, '2025/03/12 20:50:00', 2, 'Novo plano', 'Cliente interessado em mudar de plano'),
(9, 9, '2025/03/23 14:30:00', 3, 'Dúvida sobre apólice', 'Cliente quer detalhes'),
(10, 10, '2025/03/23 10:10:00', 1, 'Fidelização', 'Cliente elogiou atendimento');

GO

