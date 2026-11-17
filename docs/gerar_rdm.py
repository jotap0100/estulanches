"""Gera a Ficha RDM em PDF (1 página). Uso: python3 docs/gerar_rdm.py
Requer: pip install reportlab
Depois de rodar ./scripts/validar.sh com sucesso, mude DOCKER_VALIDADO para True e rode de novo.
"""
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

# ---------- Preencha aqui ----------
RESPONSAVEL = "Marcus — Técnico de Implantação"
VERSAO = "1.0.0"
DOCKER_VALIDADO = False   # True após build/up/ps/logs executados com sucesso
# -----------------------------------

agora = datetime.now().strftime("%d/%m/%Y %H:%M")
docker_txt = "Aprovado" if DOCKER_VALIDADO else "PENDENTE (executar ./scripts/validar.sh)"
status = "IMPLANTADO COM SUCESSO" if DOCKER_VALIDADO else "PARCIAL — aguardando validação dos containers"

ss = getSampleStyleSheet()
n = ParagraphStyle("n", parent=ss["Normal"], fontSize=9, leading=11.5)
b = ParagraphStyle("b", parent=n, fontName="Helvetica-Bold")
h = ParagraphStyle("h", parent=ss["Title"], fontSize=15, spaceAfter=2)
sec = ParagraphStyle("sec", parent=n, fontName="Helvetica-Bold", fontSize=10,
                     textColor=colors.white, backColor=colors.HexColor("#1f3a5f"),
                     leftIndent=0, borderPadding=(2, 4, 2, 4), spaceBefore=8, spaceAfter=4)

def P(t, s=n): return Paragraph(t, s)

def tabela(linhas, larguras):
    t = Table([[P(c, b if j == 0 else n) for j, c in enumerate(l)] for l in linhas],
              colWidths=larguras)
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef2f7")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return t

doc = SimpleDocTemplate("docs/RDM_EstuLanches.pdf", pagesize=A4,
                        leftMargin=15*mm, rightMargin=15*mm, topMargin=12*mm, bottomMargin=10*mm,
                        title="RDM - EstuLanches", author=RESPONSAVEL)
W = 180*mm
el = [P("FICHA SIMPLIFICADA DE REGISTRO DE MUDANÇA (RDM)", h),
      P("Implantação em produção — Sistema EstuLanches (gestão de cardápio e pedidos da cantina escolar)",
        ParagraphStyle("c", parent=n, alignment=1))]

el += [P("1. IDENTIFICAÇÃO", sec), tabela([
    ["Sistema", "EstuLanches", "Versão implantada", VERSAO],
    ["Data/horário", agora, "Responsável", RESPONSAVEL],
    ["Tipo de mudança", "Nova implantação (containers Docker)", "Ambiente", "Produção"],
], [30*mm, 60*mm, 33*mm, 57*mm])]

el += [P("2. PARÂMETROS CONFIGURADOS / ALTERADOS", sec), tabela([
    ["APP_PORT", "3000 (porta publicada da aplicação)"],
    ["DB_USER / DB_NAME", "estulanches / estulanches"],
    ["DB_PASSWORD", "Alterada do valor padrão via arquivo .env (não versionado)"],
    ["Banco de dados", "PostgreSQL 16-alpine; porta 5432 NÃO exposta ao host (rede interna do Compose)"],
    ["Persistência", "Volume nomeado <i>pgdata</i>; schema e dados iniciais via db/init.sql"],
    ["Resiliência", "restart: unless-stopped; healthcheck no banco; app só inicia com banco saudável"],
    ["Imagem da app", "node:22-alpine, execução como usuário não-root, HEALTHCHECK em /health"],
    ["Interface web", "Página simples (cardápio, pedido, acompanhamento) servida pela própria app em http://localhost:3000/"],
], [38*mm, 142*mm])]

el += [P("3. RESULTADO DOS TESTES DE VALIDAÇÃO", sec), tabela([
    ["Testes unitários", "8 de 8 aprovados (regras de negócio: total, validações, fluxo de status)"],
    ["Testes de integração", "8 de 8 aprovados (API + PostgreSQL 16: health, página web, cardápio, pedido, status, erros 400/404/409)"],
    ["Sintaxe do Compose", "docker compose config -q: aprovado"],
    ["Build, up, ps e logs (Docker)", docker_txt],
    ["Logs de inicialização", "App: conexão com o banco estabelecida e servidor na porta 3000, sem erros. "
                              "Banco: verificado com PostgreSQL 16 local; logs dos containers: "
                              + ("sem erros críticos." if DOCKER_VALIDADO else "pendentes.")],
], [45*mm, 135*mm])]

el += [P("4. LISTA DE VERIFICAÇÃO (resumo)", sec), tabela([
    ["Concluídos", "docker-compose válido; testes unitários; testes de integração; ficha RDM"],
    ["Pendentes" if not DOCKER_VALIDADO else "Demais itens",
     "build da imagem; containers Up (healthy); portas ativas; logs dos containers; persistência após restart"
     if not DOCKER_VALIDADO else "Todos concluídos (ver docs/CHECKLIST.md)"],
], [45*mm, 135*mm])]

el += [P("5. PLANO DE REVERSÃO", sec),
       P("Em caso de falha: <font face='Courier'>docker compose down</font> e restaurar a versão anterior "
         "(tag Git). Dados preservados no volume <i>pgdata</i> (usar <font face='Courier'>down -v</font> "
         "somente se o descarte dos dados for intencional).")]

el += [P("6. STATUS FINAL DA IMPLANTAÇÃO", sec),
       tabela([["Status", status]], [45*mm, 135*mm]), Spacer(1, 14*mm),
       Table([[P("______________________________<br/>Responsável pela implantação"),
               P("______________________________<br/>Aprovação (professor/gestor)")]],
             colWidths=[W/2, W/2])]
doc.build(el)
print("RDM gerada: docs/RDM_EstuLanches.pdf")
