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

````

<svg width="1200" height="600" viewBox="0 0 1200 600"
     xmlns="http://www.w3.org/2000/svg"
     font-family="Arial, Helvetica, sans-serif">

  <!-- Background -->
  <rect x="0" y="0" width="1200" height="600" fill="#0f172a"/>

  <!-- Zabbix -->
  <rect x="40" y="240" rx="12" ry="12" width="220" height="120" fill="#b91c1c"/>
  <text x="150" y="275" fill="#ffffff" font-size="18" text-anchor="middle">Zabbix</text>
  <text x="150" y="300" fill="#ffffff" font-size="13" text-anchor="middle">
    Trigger Action
  </text>
  <text x="150" y="320" fill="#ffffff" font-size="13" text-anchor="middle">
    Media Type (Webhook)
  </text>

  <!-- Arrow Zabbix -> Webhook -->
  <line x1="260" y1="300" x2="360" y2="300" stroke="#38bdf8" stroke-width="3"/>
  <polygon points="360,300 350,295 350,305" fill="#38bdf8"/>

  <!-- Webhook -->
  <rect x="360" y="240" rx="12" ry="12" width="240" height="120" fill="#1d4ed8"/>
  <text x="480" y="275" fill="#ffffff" font-size="17" text-anchor="middle">
    n8n Webhook
  </text>
  <text x="480" y="300" fill="#ffffff" font-size="13" text-anchor="middle">
    Recebe Eventos - Zabbix
  </text>
  <text x="480" y="320" fill="#ffffff" font-size="12" text-anchor="middle">
    /webhook/randon-zabbix
  </text>

  <!-- Arrow Webhook -> Validate -->
  <line x1="600" y1="300" x2="700" y2="300" stroke="#38bdf8" stroke-width="3"/>
  <polygon points="700,300 690,295 690,305" fill="#38bdf8"/>

  <!-- Validate Event -->
  <rect x="700" y="220" rx="12" ry="12" width="260" height="80" fill="#334155"/>
  <text x="830" y="255" fill="#ffffff" font-size="15" text-anchor="middle">
    Valida evento existente
  </text>
  <text x="830" y="275" fill="#cbd5f5" font-size="12" text-anchor="middle">
    SELECT eventid FROM zbx_problems
  </text>

  <!-- IF -->
  <polygon points="830,320 900,380 830,440 760,380"
           fill="#0ea5e9"/>
  <text x="830" y="375" fill="#ffffff" font-size="14" text-anchor="middle">
    EventID
  </text>
  <text x="830" y="395" fill="#ffffff" font-size="14" text-anchor="middle">
    existe?
  </text>

  <!-- Yes Arrow -->
  <line x1="900" y1="380" x2="1020" y2="300" stroke="#22c55e" stroke-width="3"/>
  <polygon points="1020,300 1010,295 1010,305" fill="#22c55e"/>
  <text x="955" y="335" fill="#22c55e" font-size="12">SIM</text>

  <!-- No Arrow -->
  <line x1="760" y1="380" x2="640" y2="480" stroke="#f97316" stroke-width="3"/>
  <polygon points="640,480 650,475 650,485" fill="#f97316"/>
  <text x="700" y="430" fill="#f97316" font-size="12">NÃO</text>

  <!-- Update -->
  <rect x="1020" y="240" rx="12" ry="12" wi



---

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
