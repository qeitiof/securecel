create database Securecel

SELECT name FROM sys.databases;

-- Script para criar um login e usuário no SQL Server para o projeto SecureCel

-- 1. Criar um login no nível do servidor
CREATE LOGIN securecel_user WITH PASSWORD = 'SecureCelPass2025!';

-- 2. Selecionar o banco de dados SecureCelDB
USE Securecel;

-- 3. Criar um usuário associado ao login
CREATE USER securecel_user FOR LOGIN securecel_user;

-- 4. Conceder permissões básicas ao usuário (SELECT, INSERT, UPDATE, DELETE)
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO securecel_user;

-- 5. Opcional: Conceder permissão para executar procedimentos armazenados
GRANT EXECUTE ON SCHEMA::dbo TO securecel_user;

-- 6. Opcional: Verificar se o usuário foi criado
SELECT name, type_desc FROM sys.database_principals WHERE name = 'securecel_user';