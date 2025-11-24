docker run --rm \
 # db/

Este diretório contém os scripts de esquema (schema) e seeds de exemplo para o projeto Academia.

Arquivos
- `schema.sql` — DDL para criar as tabelas, índices e constraints do banco.
- `seed.sample.sql` — dados de exemplo/sanitizados para desenvolvimento e testes locais.

Segurança
- NÃO comite dumps de produção ou dados reais de usuários.
- Use `seed.sample.sql` para dados de desenvolvimento; ele contém e-mails fictícios e senhas simples apenas para testes locais.

Como aplicar

1) Usando MySQL / MariaDB local (cliente `mysql`):

```bash
# substitua pelo seu usuário/senha/host conforme necessário
mysql -u root -p < db/schema.sql
mysql -u root -p < db/seed.sample.sql
```

2) Usando Docker (recomendado para portabilidade):

```bash
# executa um container temporário e importa os scripts
docker run --rm \
  -e MYSQL_ROOT_PASSWORD=example \
  -v "$PWD/db:/scripts" \
  mysql:8 \
  bash -c "mysql -u root -p\"$MYSQL_ROOT_PASSWORD\" < /scripts/schema.sql && mysql -u root -p\"$MYSQL_ROOT_PASSWORD\" < /scripts/seed.sample.sql"
```

Observações
- Se seu ambiente usar outro SGDB (ex.: Postgres), converta os comandos DDL/seed conforme necessário.
- Mantenha um `env.example` no root para indicar as variáveis de conexão esperadas (não comite `.env`).

Sanitização
- Para criar um dump sanitizado a partir de produção, exporte os dados e execute scripts para substituir ou remover campos sensíveis (e-mails, nomes, hashes de senha). Armazene como `db/dump.sanitized.sql` se necessário e adicione padrões ao `.gitignore` para evitar commits acidentais de dumps grandes.
