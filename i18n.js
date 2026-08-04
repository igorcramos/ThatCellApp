(() => {
  const STORAGE_KEY = "thatcellapp-language";
  const supportedLanguages = new Set(["en", "pt"]);
  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
  let currentLanguage = supportedLanguages.has(savedLanguage)
    ? savedLanguage
    : (navigator.language || "en").toLowerCase().startsWith("pt") ? "pt" : "en";

  const pt = new Map(Object.entries({
    "Language": "Idioma",
    "Interface language": "Idioma da interface",
    "Cell culture tracking": "Acompanhamento de cultura celular",
    "Connecting": "Conectando",
    "Loading": "Carregando",
    "Online": "Online",
    "Offline": "Offline",
    "Error": "Erro",
    "Refresh": "Atualizar",
    "Refresh…": "Atualizando…",
    "Sign out": "Sair",
    "Secure lab access": "Acesso seguro ao laboratório",
    "Sign in without a password": "Entrar sem senha",
    "Access pending": "Acesso pendente",
    "Use your work email. We will send a secure sign-in link; your session stays active on this device.": "Use seu e-mail de trabalho. Enviaremos um link seguro de acesso; sua sessão permanecerá ativa neste dispositivo.",
    "Email": "E-mail",
    "Email me a sign-in link": "Enviar link de acesso por e-mail",
    "I received a one-time code": "Recebi um código de uso único",
    "Six-digit code": "Código de seis dígitos",
    "Verify code": "Verificar código",
    "Enter a code only if your Supabase email template is configured to show one.": "Digite um código apenas se o modelo de e-mail do Supabase estiver configurado para exibi-lo.",
    "Only approved project members can access lab records.": "Somente membros aprovados dos projetos podem acessar os registros do laboratório.",
    "You opened a local file. Sign-in links will return to the secure published version.": "Você abriu um arquivo local. Os links de acesso retornarão para a versão publicada segura.",
    "Open the published app now.": "Abrir o app publicado agora.",
    "Open the app from its website or localhost before requesting a link.": "Abra o app pelo site ou por localhost antes de solicitar um link.",
    "Open the app from its website or": "Abra o app pelo site ou por",
    "; email links cannot return to a": "; links de e-mail não podem retornar para uma página",
    "page.": ".",
    "Today": "Hoje",
    "Cell lines": "Linhagens celulares",
    "Cultures & plates": "Culturas e placas",
    "Cryostock": "Criopreservação",
    "Reagents": "Reagentes",
    "Projects": "Projetos",
    "Protocols": "Protocolos",
    "Differentiations": "Diferenciações",
    "Activity": "Atividade",
    "App sections": "Seções do app",
    "Choose a differentiation run": "Escolher uma diferenciação",
    "Delete selected vials": "Excluir tubos selecionados",
    "Delete selected wells": "Excluir poços selecionados",
    "Filter culture": "Filtrar cultura",
    "Filter project": "Filtrar projeto",
    "Filter project overview": "Filtrar visão geral do projeto",
    "Filter protocol tasks by project": "Filtrar tarefas do protocolo por projeto",
    "Filter purchase requests": "Filtrar solicitações de compra",
    "Today overview": "Visão geral de hoje",
    "Active cultures and recently recorded activity.": "Culturas ativas e atividades registradas recentemente.",
    "Active cultures": "Culturas ativas",
    "Plates": "Placas",
    "Cryovials": "Criotubos",
    "Events": "Eventos",
    "Ongoing cultures": "Culturas em andamento",
    "Today’s differentiation tasks": "Tarefas de diferenciação de hoje",
    "Check off work to record it automatically in Activity.": "Marque o trabalho concluído para registrá-lo automaticamente em Atividade.",
    "Print schedules": "Imprimir cronogramas",
    "Available cell lines": "Linhagens celulares disponíveis",
    "Add cell lines before they enter culture.": "Cadastre as linhagens antes de iniciarem a cultura.",
    "Identifier / routine name": "Identificador / nome de rotina",
    "Full name": "Nome completo",
    "Clone": "Clone",
    "Species": "Espécie",
    "Not specified": "Não especificado",
    "Human": "Humano",
    "Mice": "Camundongo",
    "Rat": "Rato",
    "Add...": "Adicionar...",
    "Custom species": "Espécie personalizada",
    "Enter species": "Digite a espécie",
    "Cell type": "Tipo celular",
    "Embryonic Kidney": "Rim embrionário",
    "Custom cell type": "Tipo celular personalizado",
    "Enter cell type": "Digite o tipo celular",
    "Source": "Origem",
    "Modifications": "Modificações",
    "Target": "Alvo",
    "Variant": "Variante",
    "Transgene expression": "Expressão de transgene",
    "Transgene": "Transgene",
    "Fluorescence": "Fluorescência",
    "No": "Não",
    "Red": "Vermelha",
    "Green": "Verde",
    "Yellow": "Amarela",
    "Blue": "Azul",
    "Custom fluorescence": "Fluorescência personalizada",
    "Enter fluorescence": "Digite a fluorescência",
    "Marker of": "Marcador de",
    "Plasmid": "Plasmídeo",
    "Transgene notes": "Observações do transgene",
    "Notes": "Observações",
    "Free-form notes": "Observações livres",
    "Expression notes": "Observações de expressão",
    "Plasmid name or ID": "Nome ou ID do plasmídeo",
    "Save cell line": "Salvar linhagem",
    "Cancel edit": "Cancelar edição",
    "Saved cell lines": "Linhagens salvas",
    "Start a culture, add plates, and map wells from one workflow.": "Inicie uma cultura, adicione placas e mapeie os poços no mesmo fluxo.",
    "Cell lines in this batch": "Linhagens neste lote",
    "Culture name": "Nome da cultura",
    "Project": "Projeto",
    "Custom project": "Projeto personalizado",
    "Enter project": "Digite o projeto",
    "Start date": "Data de início",
    "Current passage": "Passagem atual",
    "Initial cell type": "Tipo celular inicial",
    "Custom initial cell type": "Tipo celular inicial personalizado",
    "Initial plates": "Placas iniciais",
    "Add plate setup": "Adicionar configuração de placa",
    "Medium": "Meio",
    "Status": "Status",
    "Active": "Ativa",
    "Paused": "Pausada",
    "Frozen": "Congelada",
    "Discarded": "Descartada",
    "Contaminated": "Contaminada",
    "Completed": "Concluída",
    "Location": "Localização",
    "Culture members": "Membros da cultura",
    "Start culture": "Iniciar cultura",
    "Create plate from culture": "Criar placa a partir da cultura",
    "Saved cultures": "Culturas salvas",
    "Add plate": "Adicionar placa",
    "Plate map": "Mapa da placa",
    "Selected wells": "Poços selecionados",
    "Cell line": "Linhagem celular",
    "Culture": "Cultura",
    "Condition": "Condição",
    "Treatment": "Tratamento",
    "Dose": "Dose",
    "Save selected wells": "Salvar poços selecionados",
    "Clear selection": "Limpar seleção",
    "Plate name": "Nome da placa",
    "Plate type": "Tipo de placa",
    "Select type": "Selecionar tipo",
    "Cultures": "Culturas",
    "Planned": "Planejada",
    "Create plate": "Criar placa",
    "Map cryogenic boxes, freezer position, and every vial in storage.": "Mapeie caixas criogênicas, posições no freezer e cada tubo armazenado.",
    "Box name": "Nome da caixa",
    "Freezer": "Freezer",
    "Rack": "Rack",
    "Shelf": "Prateleira",
    "Drawer": "Gaveta",
    "Box position": "Posição da caixa",
    "Rows": "Linhas",
    "Columns": "Colunas",
    "Save box": "Salvar caixa",
    "Cryogenic boxes": "Caixas criogênicas",
    "Cryobox map": "Mapa da caixa criogênica",
    "Export layout:": "Exportar layout:",
    "Selected positions": "Posições selecionadas",
    "Other": "Outro",
    "Freeze date": "Data de congelamento",
    "Passage": "Passagem",
    "Available": "Disponível",
    "Reserved": "Reservado",
    "Thawed": "Descongelado",
    "Frozen by": "Congelado por",
    "Save selected vials": "Salvar tubos selecionados",
    "Vial lookup": "Busca de tubos",
    "Show lookup": "Mostrar busca",
    "Manage project labels, colors, active cultures, plates, and recent activity.": "Gerencie nomes, cores, culturas ativas, placas e atividades recentes dos projetos.",
    "Project name": "Nome do projeto",
    "Project notes": "Observações do projeto",
    "Project color": "Cor do projeto",
    "Project members": "Membros do projeto",
    "Save project": "Salvar projeto",
    "Project overview": "Visão geral do projeto",
    "Define reusable differentiation protocols and planned tasks.": "Defina protocolos reutilizáveis de diferenciação e tarefas planejadas.",
    "Import a protocol": "Importar um protocolo",
    "Upload CSV or TSV columns: Protocol name, Day, Base task, Medium.": "Envie CSV ou TSV com as colunas: Nome do protocolo, Dia, Tarefa base e Meio.",
    "Upload protocol": "Enviar protocolo",
    "Protocol name": "Nome do protocolo",
    "Protocol notes": "Observações do protocolo",
    "Target cell type": "Tipo celular alvo",
    "Version": "Versão",
    "Expected duration (days)": "Duração esperada (dias)",
    "Save protocol": "Salvar protocolo",
    "Saved protocols": "Protocolos salvos",
    "Protocol": "Protocolo",
    "Protocol day": "Dia do protocolo",
    "Task": "Tarefa",
    "Task type": "Tipo de tarefa",
    "Media change": "Troca de meio",
    "Factor addition": "Adição de fator",
    "Replating": "Replaqueamento",
    "Observation": "Observação",
    "Collection": "Coleta",
    "Endpoint": "Ponto final",
    "Estimated duration (hours)": "Duração estimada (horas)",
    "Medium / reagents": "Meio / reagentes",
    "Save task": "Salvar tarefa",
    "Protocol tasks": "Tarefas do protocolo",
    "Start protocol runs from cultures, whole plates, or selected wells.": "Inicie protocolos a partir de culturas, placas inteiras ou poços selecionados.",
    "Run name": "Nome da execução",
    "Run notes": "Observações da execução",
    "Day 0 date": "Data do dia 0",
    "Source type": "Tipo de origem",
    "Whole plate": "Placa inteira",
    "Source culture": "Cultura de origem",
    "Source plate": "Placa de origem",
    "Cell lines in this differentiation batch": "Linhagens neste lote de diferenciação",
    "Source wells": "Poços de origem",
    "Failed": "Falhou",
    "Schedule color": "Cor do cronograma",
    "Start differentiation": "Iniciar diferenciação",
    "Differentiation runs": "Diferenciações",
    "Run schedule": "Cronograma da execução",
    "Protocol tasks, automatic medium changes, and recorded collections in one timeline.": "Tarefas do protocolo, trocas de meio automáticas e coletas registradas em uma linha do tempo.",
    "Print schedule": "Imprimir cronograma",
    "Differentiation run": "Diferenciação",
    "Collection date": "Data da coleta",
    "Quantity": "Quantidade",
    "Experiment / destination": "Experimento / destino",
    "Collection notes": "Observações da coleta",
    "Sample IDs, conditions, storage, or other details": "IDs das amostras, condições, armazenamento ou outros detalhes",
    "Add collection": "Adicionar coleta",
    "Reagent inventory": "Estoque de reagentes",
    "Find culture reagents by name or catalog number, then track stock, reconstitution, and aliquots.": "Encontre materiais de cultura pelo nome ou catálogo e acompanhe estoque, reconstituição e alíquotas.",
    "Scan a product or container": "Escanear produto ou recipiente",
    "Use the camera, an image, or enter the barcode/QR value.": "Use a câmera, uma imagem ou digite o valor do código de barras/QR.",
    "Barcode or QR value": "Código de barras ou valor QR",
    "Barcode, GTIN, catalog, or QR value": "Código de barras, GTIN, catálogo ou valor QR",
    "Find": "Buscar",
    "Use camera": "Usar câmera",
    "Scan image": "Escanear imagem",
    "Barcode camera preview": "Prévia da câmera do scanner",
    "Stop camera": "Parar câmera",
    "Camera scanning needs HTTPS or localhost and browser permission. Manual entry always works.": "O scanner por câmera requer HTTPS ou localhost e permissão do navegador. A digitação manual sempre funciona.",
    "Stock alerts": "Alertas de estoque",
    "Expiration and reorder checks.": "Verificações de validade e reposição.",
    "Warn within": "Alertar nos próximos",
    "Warn within days": "Alertar nos próximos dias",
    "days": "dias",
    "expired": "vencido",
    "expiring": "próximo do vencimento",
    "low/depleted": "baixo/esgotado",
    "invalid/duplicate": "inválido/duplicado",
    "missing fields": "campos ausentes",
    "catalog products": "produtos no catálogo",
    "Data quality": "Qualidade dos dados",
    "Duplicates, invalid fields, and missing stock details.": "Duplicatas, campos inválidos e informações ausentes do estoque.",
    "Reagent library": "Biblioteca de reagentes",
    "Select a result below. The starter library can be extended in Supabase.": "Selecione um resultado abaixo. A biblioteca inicial pode ser ampliada no Supabase.",
    "Type part of a name or catalog number": "Digite parte do nome ou número de catálogo",
    "Lot number": "Número do lote",
    "Container barcode / QR": "Código de barras / QR do recipiente",
    "Scan or type the label value": "Escaneie ou digite o código da etiqueta",
    "Expiration date": "Data de validade",
    "Opened on": "Aberto em",
    "Quantity available": "Quantidade disponível",
    "Reorder at or below": "Repor quando igual ou abaixo de",
    "Unit": "Unidade",
    "units": "unidades",
    "vials": "tubos",
    "bottles": "frascos",
    "Low stock": "Estoque baixo",
    "Depleted": "Esgotado",
    "Expired": "Vencido",
    "Quarantined": "Em quarentena",
    "Reconstitution (optional)": "Reconstituição (opcional)",
    "Reconstituted on": "Reconstituído em",
    "Solvent": "Solvente",
    "Example: sterile water": "Exemplo: água estéril",
    "Final concentration": "Concentração final",
    "Concentration unit": "Unidade de concentração",
    "Instructions / notes": "Instruções / observações",
    "Add to inventory": "Adicionar ao estoque",
    "Current stock": "Estoque atual",
    "Filter reagent stock": "Filtrar estoque de reagentes",
    "Filter stock": "Filtrar estoque",
    "Open an item to manage its aliquots.": "Abra um item para gerenciar suas alíquotas.",
    "Catalog library": "Biblioteca do catálogo",
    "Add one product manually or import a verified supplier CSV.": "Adicione um produto manualmente ou importe um CSV verificado do fornecedor.",
    "Add a catalog product": "Adicionar produto ao catálogo",
    "Product name": "Nome do produto",
    "Catalog number": "Número de catálogo",
    "Manufacturer / supplier": "Fabricante / fornecedor",
    "Category": "Categoria",
    "Default storage": "Armazenamento padrão",
    "Product barcode": "Código de barras do produto",
    "Supplier URL": "URL do fornecedor",
    "Synonyms": "Sinônimos",
    "Separate names with semicolons": "Separe os nomes com ponto e vírgula",
    "Add to library": "Adicionar à biblioteca",
    "Import catalog CSV": "Importar CSV do catálogo",
    "Review supplier metadata before importing. Existing manufacturer + catalog pairs are updated.": "Revise os dados do fornecedor antes de importar. Pares existentes de fabricante + catálogo serão atualizados.",
    "Choose CSV": "Escolher CSV",
    "Download template": "Baixar modelo",
    "Import valid rows": "Importar linhas válidas",
    "Requests & purchasing": "Solicitações e compras",
    "Request, review, order, and receive materials into stock.": "Solicite, revise, compre e receba materiais no estoque.",
    "New request": "Nova solicitação",
    "Select a product": "Selecione um produto",
    "Catalog product": "Produto do catálogo",
    "Requested by": "Solicitado por",
    "Enter name": "Digite o nome",
    "Vendor": "Fornecedor",
    "Estimated cost": "Custo estimado",
    "Currency": "Moeda",
    "Priority": "Prioridade",
    "Normal": "Normal",
    "Low": "Baixa",
    "High": "Alta",
    "Urgent": "Urgente",
    "Justification": "Justificativa",
    "Submit request": "Enviar solicitação",
    "Purchase queue": "Fila de compras",
    "Available actions follow the current status.": "As ações disponíveis dependem do status atual.",
    "All statuses": "Todos os status",
    "Requested": "Solicitado",
    "Approved": "Aprovado",
    "Ordered": "Pedido realizado",
    "Received": "Recebido",
    "Rejected": "Rejeitado",
    "Cancelled": "Cancelado",
    "Add aliquot": "Adicionar alíquota",
    "Aliquot label": "Identificação da alíquota",
    "Prepared on": "Preparada em",
    "Used": "Usada",
    "Save aliquot": "Salvar alíquota",
    "Close": "Fechar",
    "Record what happened today and follow the daily feed.": "Registre o que aconteceu hoje e acompanhe o histórico diário.",
    "Target type": "Tipo de alvo",
    "Culture(s)": "Cultura(s)",
    "Plate": "Placa",
    "Event type": "Tipo de evento",
    "Plating": "Plaqueamento",
    "Freezing": "Congelamento",
    "Thawing": "Descongelamento",
    "Contamination": "Contaminação",
    "Discard": "Descarte",
    "Date": "Data",
    "Performed by": "Realizado por",
    "Custom person": "Pessoa personalizada",
    "Optional photo": "Foto opcional",
    "What happened?": "O que aconteceu?",
    "Initial notes": "Observações iniciais",
    "Setup notes": "Observações da configuração",
    "Well-specific notes": "Observações específicas do poço",
    "Task details, reagents, timing notes": "Detalhes da tarefa, reagentes e horários",
    "Medium, vial count notes, recovery notes": "Meio, quantidade de tubos e observações de recuperação",
    "bottles, vials, mL…": "frascos, tubos, mL…",
    "Record event": "Registrar evento",
    "Daily feed": "Histórico diário",
    "Mark task complete": "Marcar tarefa como concluída",
    "Mark task incomplete": "Marcar tarefa como pendente",
    "Edit culture": "Editar cultura",
    "Delete culture": "Excluir cultura",
    "Edit cell line": "Editar linhagem",
    "Delete cell line": "Excluir linhagem",
    "Edit plate": "Editar placa",
    "Delete plate": "Excluir placa",
    "Edit cryobox": "Editar caixa criogênica",
    "Delete cryobox": "Excluir caixa criogênica",
    "Edit project": "Editar projeto",
    "Delete project": "Excluir projeto",
    "Edit protocol": "Editar protocolo",
    "Delete protocol": "Excluir protocolo",
    "Edit task": "Editar tarefa",
    "Delete task": "Excluir tarefa",
    "Edit differentiation": "Editar diferenciação",
    "Delete differentiation": "Excluir diferenciação",
    "Edit activity": "Editar atividade",
    "Delete activity": "Excluir atividade",
    "Edit reagent": "Editar reagente",
    "Aliquots": "Alíquotas",
    "Optional details and modifications": "Detalhes e modificações opcionais",
    "No active cultures right now.": "Nenhuma cultura ativa no momento.",
    "No differentiation tasks scheduled for today.": "Nenhuma tarefa de diferenciação programada para hoje.",
    "No library reagent matches this search.": "Nenhum reagente da biblioteca corresponde à busca.",
    "No reagent stock matches this filter.": "Nenhum item do estoque corresponde ao filtro.",
    "No aliquots recorded for this item.": "Nenhuma alíquota registrada para este item.",
    "No stock alerts.": "Nenhum alerta de estoque.",
    "No data-quality issues detected.": "Nenhum problema de qualidade de dados detectado.",
    "No purchase requests match this filter.": "Nenhuma solicitação de compra corresponde ao filtro.",
    "No activity recorded": "Nenhuma atividade registrada",
    "No date": "Sem data",
    "Save": "Salvar",
    "Edit": "Editar",
    "Delete": "Excluir",
    "Cancel": "Cancelar",
    "Clear": "Limpar",
    "available": "disponível",
    "low": "baixo",
    "depleted": "esgotado",
    "expired": "vencido",
    "quarantined": "em quarentena",
    "used": "usada",
    "discarded": "descartada",
    "requested": "solicitado",
    "approved": "aprovado",
    "ordered": "pedido realizado",
    "received": "recebido",
    "rejected": "rejeitado",
    "cancelled": "cancelado",
    "low priority": "prioridade baixa",
    "normal priority": "prioridade normal",
    "high priority": "prioridade alta",
    "urgent priority": "prioridade urgente"
  }));

  const patterns = [
    [/^Last updated: never$/, () => "Última atualização: nunca"],
    [/^Last updated: (.+)$/, (match) => `Última atualização: ${match[1]}`],
    [/^Last checked: (.+)$/, (match) => `Última verificação: ${match[1]}`],
    [/^Example: (.+)$/, (match) => `Exemplo: ${match[1]}`],
    [/^Enter (.+)$/, (match) => `Digite ${match[1]}`],
    [/^Filter (.+)$/, (match) => `Filtrar ${match[1]}`],
    [/^Delete (.+)$/, (match) => `Excluir ${match[1]}`],
    [/^Edit (.+)$/, (match) => `Editar ${match[1]}`],
    [/^Save (.+)$/, (match) => `Salvar ${match[1]}`],
    [/^Select (.+)$/, (match) => `Selecionar ${match[1]}`],
    [/^Add (.+)$/, (match) => `Adicionar ${match[1]}`],
    [/^No (.+) found\.$/, (match) => `Nenhum(a) ${match[1]} encontrado(a).`],
    [/^Error loading data: (.+)$/, (match) => `Erro ao carregar dados: ${match[1]}`],
    [/^Error saving (.+): (.+)$/, (match) => `Erro ao salvar ${match[1]}: ${match[2]}`],
    [/^Could not (.+): (.+)$/, (match) => `Não foi possível ${match[1]}: ${match[2]}`],
    [/^Found stock container: (.+)\.$/, (match) => `Recipiente encontrado no estoque: ${match[1]}.`],
    [/^Found (.+)\. Complete the lot details below\.$/, (match) => `${match[1]} encontrado. Preencha os dados do lote abaixo.`],
    [/^No exact match\. The code was copied into the catalog form so you can verify and add the product\.$/, () => "Nenhuma correspondência exata. O código foi copiado para o cadastro para que você possa verificar e adicionar o produto."],
    [/^(\d+) possible products found\. Select one from the library results\.$/, (match) => `${match[1]} produtos possíveis encontrados. Selecione um resultado da biblioteca.`],
    [/^Camera access requires HTTPS or localhost\. Type the code or use an image instead\.$/, () => "O acesso à câmera requer HTTPS ou localhost. Digite o código ou use uma imagem."],
    [/^Camera access is unavailable in this browser\. Type the code instead\.$/, () => "A câmera não está disponível neste navegador. Digite o código."],
    [/^Camera permission was denied\.(.+)$/, (match) => `A permissão da câmera foi negada.${match[1]}`],
    [/^Point the rear camera at a barcode or QR code\.$/, () => "Aponte a câmera traseira para um código de barras ou QR."],
    [/^Camera stopped\.$/, () => "Câmera parada."],
    [/^Reconstituted (.+)$/, (match) => `Reconstituído em ${match[1]}`],
    [/^Expires (.+)$/, (match) => `Vence em ${match[1]}`],
    [/^Expired (.+)$/, (match) => `Vencido em ${match[1]}`],
    [/^(.+) is expired$/, (match) => `${match[1]} está vencido`],
    [/^(.+) expires in (\d+) day$/, (match) => `${match[1]} vence em ${match[2]} dia`],
    [/^(.+) expires in (\d+) days$/, (match) => `${match[1]} vence em ${match[2]} dias`],
    [/^(\d+) available aliquot$/, (match) => `${match[1]} alíquota disponível`],
    [/^(\d+) available aliquots$/, (match) => `${match[1]} alíquotas disponíveis`],
    [/^(\d+) expired$/, (match) => `${match[1]} vencido(s)`],
    [/^(\d+) expiring$/, (match) => `${match[1]} próximo(s) do vencimento`],
    [/^(\d+) low\/depleted$/, (match) => `${match[1]} baixo(s)/esgotado(s)`],
    [/^(\d+) invalid\/duplicate$/, (match) => `${match[1]} inválido(s)/duplicado(s)`],
    [/^(\d+) missing fields$/, (match) => `${match[1]} com campos ausentes`],
    [/^(\d+) catalog products$/, (match) => `${match[1]} produtos no catálogo`],
    [/^Lot (.+)$/, (match) => `Lote ${match[1]}`],
    [/^Cell lines: (.+)$/, (match) => `Linhagens: ${match[1]}`],
    [/^Code (.+)$/, (match) => `Código ${match[1]}`],
    [/^Reorder ≤ (.+)$/, (match) => `Repor ≤ ${match[1]}`],
    [/^Aliquots · (.+)$/, (match) => `Alíquotas · ${match[1]}`],
    [/^Day 0: (.+)$/, (match) => `Dia 0: ${match[1]}`],
    [/^Started: (.+)$/, (match) => `Iniciada em: ${match[1]}`],
    [/^Frozen: (.+)$/, (match) => `Congelado em: ${match[1]}`],
    [/^Due (.+); est\. done (.+)$/, (match) => `Prazo ${match[1]}; término estimado ${match[2]}`],
    [/^PO (.+)$/, (match) => `PC ${match[1]}`],
    [/^Review: (.+)$/, (match) => `Revisão: ${match[1]}`],
    [/^Imported (\d+) of (\d+) rows…$/, (match) => `Importadas ${match[1]} de ${match[2]} linhas…`],
    [/^Imported (\d+) catalog rows successfully\.$/, (match) => `${match[1]} linhas do catálogo importadas com sucesso.`],
    [/^Your account is ready, but an administrator still needs to assign project or culture access\.$/, () => "Sua conta está pronta, mas um administrador ainda precisa atribuir acesso a um projeto ou cultura."],
    [/^Sign-in link sent to (.+)\. You can close this message after opening the link\.$/, (match) => `Link de acesso enviado para ${match[1]}. Abra o link recebido para entrar.`],
    [/^Sign-in link sent to (.+)\. It will open the secure published app\.$/, (match) => `Link de acesso enviado para ${match[1]}. Ele abrirá o app publicado seguro.`],
    [/^Sign in to load lab data\.$/, () => "Entre para carregar os dados do laboratório."],
    [/^Run (.+) in Supabase\.$/, (match) => `Execute ${match[1]} no Supabase.`]
  ];

  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const translatableAttributes = ["placeholder", "title", "aria-label"];

  function translateEnglish(source) {
    if (!source || currentLanguage !== "pt") return source;
    if (pt.has(source)) return pt.get(source);
    for (const [pattern, replacement] of patterns) {
      const match = source.match(pattern);
      if (match) return replacement(match);
    }
    return source;
  }

  function translatedForCurrentLanguage(source) {
    return currentLanguage === "pt" ? translateEnglish(source) : source;
  }

  function isSkippedTextNode(node) {
    return ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(node.parentElement?.tagName);
  }

  function translateTextNode(node, force = false) {
    if (!node?.nodeValue || isSkippedTextNode(node)) return;
    const current = node.nodeValue;
    const currentTrimmed = current.trim();
    if (!currentTrimmed) return;
    let source = originalText.get(node);
    if (source === undefined) {
      source = currentTrimmed;
      originalText.set(node, source);
    } else if (!force && currentTrimmed !== translatedForCurrentLanguage(source)) {
      source = currentTrimmed;
      originalText.set(node, source);
    }
    const translated = translatedForCurrentLanguage(source);
    const leading = current.match(/^\s*/)?.[0] || "";
    const trailing = current.match(/\s*$/)?.[0] || "";
    const next = `${leading}${translated}${trailing}`;
    if (current !== next) node.nodeValue = next;
  }

  function translateElementAttributes(element, force = false) {
    if (!(element instanceof Element)) return;
    let originals = originalAttributes.get(element);
    if (!originals) {
      originals = {};
      originalAttributes.set(element, originals);
    }
    translatableAttributes.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute);
      let source = originals[attribute];
      if (source === undefined) {
        source = current;
        originals[attribute] = source;
      } else if (!force && current !== translatedForCurrentLanguage(source)) {
        source = current;
        originals[attribute] = source;
      }
      const translated = translatedForCurrentLanguage(source);
      if (current !== translated) element.setAttribute(attribute, translated);
    });
  }

  function translateTree(root, force = false) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, force);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) translateElementAttributes(root, force);
    const elements = root.querySelectorAll?.("*") || [];
    elements.forEach((element) => translateElementAttributes(element, force));
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    while (textNode) {
      translateTextNode(textNode, force);
      textNode = walker.nextNode();
    }
  }

  function applyLanguage(language, persist = true) {
    currentLanguage = supportedLanguages.has(language) ? language : "en";
    if (persist) window.localStorage.setItem(STORAGE_KEY, currentLanguage);
    document.documentElement.lang = currentLanguage === "pt" ? "pt-BR" : "en";
    const select = document.querySelector("#languageSelect");
    if (select) select.value = currentLanguage;
    translateTree(document.body, true);
    window.dispatchEvent(new CustomEvent("app:languagechange", { detail: { language: currentLanguage } }));
  }

  window.getAppLanguage = () => currentLanguage;
  window.getAppLocale = () => currentLanguage === "pt" ? "pt-BR" : "en-US";
  window.translateAppText = (text) => translatedForCurrentLanguage(String(text ?? ""));
  window.setAppLanguage = (language) => applyLanguage(language, true);

  const languageSelect = document.querySelector("#languageSelect");
  languageSelect?.addEventListener("change", (event) => applyLanguage(event.currentTarget.value, true));
  applyLanguage(currentLanguage, false);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "characterData") translateTextNode(mutation.target, false);
      mutation.addedNodes?.forEach((node) => translateTree(node, false));
    });
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true });
})();
