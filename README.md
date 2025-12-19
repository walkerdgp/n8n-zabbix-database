```markdown
# Organize Zabbix Alerts – PostgreSQL with Webhook (n8n)

Este projeto integra **Zabbix → n8n → PostgreSQL** para **persistir, organizar e correlacionar alertas**, permitindo histórico completo de indisponibilidade, análises externas, dashboards e automações.

O fluxo foi projetado para:
- Registrar eventos de problema
- Atualizar eventos resolvidos
- Calcular tempo de indisponibilidade (SLA / MTTR)
- Manter uma base estruturada e independente do banco nativo do Zabbix

---

## Arquitetura Geral

```

Zabbix (Action + Media Type)
|
| Webhook
v
n8n
|
| Insert / Update
v
PostgreSQL

![Arquitetura](flow.svg)



````

## Pré-requisitos

### Zabbix
- Versão com suporte a **Webhook Media Type**
- Permissão para criar:
  - Media Types
  - Actions
  - Users
- Triggers ativas

### n8n
- n8n em execução (Docker ou bare metal)
- Nodes habilitados:
  - Webhook
  - PostgreSQL
- Workflow ativo e acessível via HTTP

### PostgreSQL
- Instância acessível pelo n8n
- Banco e tabela criados previamente

---

## Estrutura do Banco de Dados

### Tabela: `zbx_problems`

```sql
CREATE TABLE public.zbx_problems (
    id SERIAL PRIMARY KEY,
    eventid BIGINT NOT NULL UNIQUE,

    hostip VARCHAR(50),
    hostname VARCHAR(255),

    problem TEXT,
    severity VARCHAR(50),

    status VARCHAR(20),

    created_date DATE,
    created_time TIME,

    resolved_date DATE,
    resolved_time TIME,

    updated_at TIMESTAMP
);
````

### Observações

* `eventid` é a **chave lógica** do evento
* O mesmo evento é:

  * Inserido no problema
  * Atualizado no recovery

---

## Importando o Workflow no n8n

1. Acesse o n8n
2. Importe o arquivo JSON do workflow
3. Configure as credenciais do PostgreSQL
4. Copie a URL pública do Webhook
5. Ative o workflow

📷 **Imagem sugerida:**
`docs/images/n8n-workflow.png`

---

## Configuração no Zabbix (Passo a Passo)

---

## 1. Criar Media Type (Webhook)

**Menu:**
`Administration → Media types → Create media type`

### Configuração

* **Type:** Webhook
* **Name:** `N8N-IA-DB`
* **URL:**

```
http://<N8N_HOST>:<PORT>/webhook/randon-zabbix
```

### Payload (exemplo)

```json
{
  "eventid": "{EVENT.ID}",
  "hostip": "{HOST.IP}",
  "hostname": "{HOST.NAME}",
  "problem": "{EVENT.NAME}",
  "severity": "{EVENT.SEVERITY}",
  "status": "{EVENT.STATUS}",
  "date": "{EVENT.DATE}"
}
```

📷 **Imagem sugerida:**
`docs/images/zabbix-media-type.png`

---

## 2. Criar ou Ajustar Usuário no Zabbix

**Menu:**
`Administration → Users`

* O usuário deve possuir **Media configurado**
* O Media deve usar o Media Type `N8N-IA-DB`

📷 **Imagem sugerida:**
`docs/images/zabbix-user.png`

---

## 3. Configurar Media no Usuário

**Menu:**
`Administration → Users → Media`

### Configuração

* **Type:** `N8N-IA-DB`
* **Send to:** valor simbólico (ex: `12345`)
* **When active:** `1-7,00:00-24:00`
* **Severities:** todas habilitadas
* **Enabled:** ✔

📷 **Imagem sugerida:**
`docs/images/zabbix-user-media.png`

---

## 4. Criar Action no Zabbix

**Menu:**
`Configuration → Actions → Trigger actions`

### Aba: Action

* **Name:** `N8N-IA-DB`
* **Enabled:** ✔

### Conditions

> Ajuste conforme sua necessidade

Exemplo utilizado neste projeto:

* **Host equals `DUMB-HOST - LAB`**

Outras possibilidades:

* Severidade
* Trigger
* Grupo
* Tags

📷 **Imagem sugerida:**
`docs/images/zabbix-action-condition.png`

---

## 5. Configurar Operations

### Operation (Problem)

* **Operation type:** Send message
* **Send to users:** Admin (ou outro usuário)
* **Send to media type:** `N8N-IA-DB`
* **Start in:** Immediately

📷 **Imagem sugerida:**
`docs/images/zabbix-operation-problem.png`

---

### Recovery Operation (Obrigatório)

* **Operation type:** Send message
* **Send to users:** mesmo usuário
* **Send to media type:** `N8N-IA-DB`

📷 **Imagem sugerida:**
`docs/images/zabbix-operation-recovery.png`

📌 **Por que usar Problem + Recovery?**
Permite calcular:

* Tempo total de indisponibilidade
* SLA
* MTTR

---

## Funcionamento do Fluxo (n8n)

1. Zabbix envia o evento via Webhook
2. n8n valida se o `eventid` existe no PostgreSQL
3. Se existir:

   * Atualiza status
   * Preenche data/hora de resolução
4. Se não existir:

   * Cria novo registro
5. `updated_at` é sempre atualizado

📷 **Imagem sugerida:**
`docs/images/n8n-flow-detail.png`

---

## Boas Práticas

* Não sobrescrever `created_date`
* Padronizar `status` (`PROBLEM` / `RESOLVED`)
* Manter banco separado do Zabbix
* Usar essa base para:

  * Grafana
  * BI
  * IA
  * Relatórios de SLA

---

## Próximos Passos

* Dashboards no Grafana direto no PostgreSQL
* Cálculo automático de SLA
* Correlação por host e severidade
* Enriquecimento com tags do Zabbix
* Integração com IA

---

## Licença

Projeto open source, uso livre para estudos, laboratório e produção.

```

---

### 📁 Estrutura sugerida no repositório

```

.
├── README.md
├── workflow/
│   └── n8n-zabbix-db.json
└── docs/
└── images/
├── architecture.png
├── n8n-workflow.png
├── zabbix-media-type.png
├── zabbix-user.png
├── zabbix-user-media.png
├── zabbix-action-condition.png
├── zabbix-operation-problem.png
├── zabbix-operation-recovery.png
└── n8n-flow-detail.png

```

Se quiser, no próximo passo posso:
- revisar o README com **linguagem de projeto open source internacional**,
- gerar os **nomes exatos das imagens** com base nos prints que você já tem,
- ou criar um **diagrama SVG** para a arquitetura.
```
