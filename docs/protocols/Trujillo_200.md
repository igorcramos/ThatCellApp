# Trujillo_200

Fonte: Trujillo_200.csv, D0–D90. D0 é a agregação; D0 da indução neural corresponde ao D1 do protocolo. Somente as tarefas explícitas da fonte são agendadas. Linhas com traço não especificam tarefa e não orientam omitir cuidados. A fonte não informa frequência de troca, composição de SF/Meios 1–3 ou doses de FGF2/EGF. D2/D3 preservam a notação −/+130 µL.

Instalação: execute `supabase/2026-09-13_trujillo_200.sql` após as migrações de visibilidade e campos bilíngues, e publique o app.js atualizado. O protocolo compartilhado contém nove etapas em D0, D1, D2, D3, D4, D11, D18, D25 e D32; duração D90. A migração pode ser repetida sem duplicar os registros e preserva protocolos e execuções existentes.

O CSV original está preservado nesta pasta. SF, Dorso, SB e Rocki conservam as abreviações da fonte; não foram criadas receitas com composições presumidas. Os separadores de atividades foram normalizados para o checklist independente do app. A opção automatic_media_changes=false impede trocas inferidas e é preservada ao clonar o protocolo. Os demais protocolos mantêm o comportamento anterior.
