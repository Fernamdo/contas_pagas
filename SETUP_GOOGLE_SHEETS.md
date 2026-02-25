# Configuração Google Sheets (Contas + Login)

## 1) Use a mesma planilha com duas abas
Planilha informada:
- `https://docs.google.com/spreadsheets/d/1ZYvgP1dFfkOlpAat6Q7FZFzz1sI_eBeSdBfIC9szYGM/edit`

Crie duas abas:
- `CONTAS`
- `LOGINS`

### Cabeçalhos sugeridos
Aba `CONTAS`:
- `timestamp`
- `DESCRICAO_DA_CONTA`
- `VALOR`
- `DT_PAGAMENTO`
- `OBSERVACAO`

Aba `LOGINS`:
- `timestamp`
- `usuario`
- `sucesso`

## 2) Crie um Apps Script
No Google Sheets:
- Extensões -> Apps Script
- Cole o código abaixo no arquivo `Code.gs`
- Troque `SHEET_ID` pelo id da sua planilha

```javascript
const SHEET_ID = '1ZYvgP1dFfkOlpAat6Q7FZFzz1sI_eBeSdBfIC9szYGM';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.openById(SHEET_ID);

    if (payload.type === 'conta') {
      const sh = ss.getSheetByName('CONTAS');
      sh.appendRow([
        payload.timestamp || new Date().toISOString(),
        payload.data?.DESCRICAO_DA_CONTA || '',
        payload.data?.VALOR || 0,
        payload.data?.DT_PAGAMENTO || '',
        payload.data?.OBSERVACAO || '',
      ]);
    } else if (payload.type === 'login') {
      const sh = ss.getSheetByName('LOGINS');
      sh.appendRow([
        payload.timestamp || new Date().toISOString(),
        payload.data?.usuario || '',
        payload.data?.sucesso ? 'true' : 'false',
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 3) Publique Web App
- Deploy -> New deployment -> Web app
- Execute as: **Me**
- Who has access: **Anyone**
- Copie a URL do Web App

## 4) Configure no navegador
No console do navegador da aplicação:

```javascript
localStorage.setItem('contas_pagas_gas_url', 'COLE_A_URL_DO_WEB_APP_AQUI');
```

Depois recarregue a página.
