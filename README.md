# n8n-zabbix-database
Integração entre alertas do Zabbix com database postgreSQL utilizando o N8N

1 - Crie um novo media type do tipo "Webhook"
2 - Copie o conteúdo do arquivo "zabbix_media_type.js"
3 - Altere a URL a para a URL do seu webhook do N8N

**CUIDADO, ATUALMENTE O SCRIPT NÃO POSSUI AUTENTICAÇÃO IMPLEMENTADA COMO WEBHOOK PARA TESTES, CONSIDERE INSERIR AUTENTICAÇÃO**

Campos a serem enviados via media type do Zabbix
<img width="715" height="515" alt="image" src="https://github.com/user-attachments/assets/ae95ef0c-ddd0-45b8-bbdb-914d66c22941" />

