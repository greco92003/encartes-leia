const { google } = require('googleapis');

// Configuração da API do Google Sheets
const SHEET_ID = "1rGjgIvUMVckeYSpX7yWzHKOMPjbqDKtqJiEWiSwl29w";
const SHEET_TAB = "produtos"; // Nome da aba onde estão os produtos

async function writeToSheet() {
  try {
    // Carregar as credenciais da conta de serviço
    const auth = new google.auth.JWT({
      email: "encarte-atacado@encarte-atacado.iam.gserviceaccount.com",
      key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCSZWkYQflMGe8x\nrzs4idJYbw6HghzK43NGBiPCYTDKiZ/S76lljSae590BJWBlZPi5HqExMQ5Gs5H0\nza+hRgpyGsOe0yf4zANI1m1qSAnTx9GmUbbnbmmVog/jj5FOn0L/RVh/VPqMRFdz\nnWTe5WGybYFjrSXtYpD6Y940mRaD3D5Lp8e6EjhA7AW3i692eHAeRxhChT/4FmE+\nESuWeZEhdJ4Gt525aDPNPlND7XZcH7jMMO7E2TzQk5j+i6nbZ48txR/ehqzoyOzO\nCt0b2angBvsKRnsYWdVDXQQzoJXBwa0iya0/DIJtHeZwrcUL1eqv0CEyZVOvpwGN\nQoLlIvC1AgMBAAECggEAErVA6+eqaw45YfkJsVzzc3elvK1k7oyIc59fPHzdFlTm\nBre3xxF1qQLqXDYhjnOL0WRXpwik0WYrNcR/ODXSKei/rPFA/2ta1BkK3HUeRGEZ\nqo5wuDyE46lVLHhxUkHJ9wMunv8GEZy+LDkl5dIcXQffbBR5b0+URVszzzbtCKaQ\nDrb2aYFhlBv1vADvEcJU7BxdcdZN2Do0IeKgC8+A+CdsOge9ghLuJOW4okalvCI1\nBql4FAV7St23QK2p/CTBekc/jxJGTY/fEBYSnYjk/Xt0IBgg+ZXeZMqGlfNE37wc\nGMWzSkyg6BFWrp8WXCzzGNOQASMipFMoYN9h5s6KVQKBgQDJfKkOonbtDGpD8eIM\nIJLeEk7vVxJOg9UHgRuZwhl3pDqttNaqygXpdVWd8tCELQ68oyV7GgDTUmaHpJfP\n6mNsi23F4p96xpUMyWl8Rj8rs3uozRLUey+f+RBdjDpQcZWCgYkbcW9qm3jv2zUJ\nKegL2SFITNo+7dqqrEOTTgf84wKBgQC6ARA775m7dptwKK4Jl5LGFs/a959WIEkq\nLEL/lTzFSX6kYI1M/dwAjz1c8n/E834irdA4eW6EkJPFEwI6atWQAJ5lAkv23m4O\nTE5lxIgLeXfcqTflxkB+BRkKxwKoYZinj75SKY/pjK1oS4GRgicdS06ggmjiF9nU\nHJQcTeInhwKBgQC6WtFmFr/WOeBjXWoMe2g7e0WEuszUz7wNx80GZm71qHEZTqQp\nrNbQ+dQpVXakeaQituaouAFBcvofxQ0goZI5x6/NEfEdNmSPQg6Ngc9VlRjvpFUh\nL5p55HvNejBJTPTSkwqD1mQNfyTY+69O/XKA2t+cpnBJOedAajnKGabrrwKBgB6A\nbCQX/3LBWW4EDb4e7/+x3/X9Y1ChTL4wse/tjiCgE7dq6eD1RC2HT729OnyWnVmc\nfSe1qgztFH5dxqDDwi+yGkdgIArkoNGRa82+c7zF94Tk7visEQlZVqjwx5vLHVhk\n9wXMMQBQhGM09pNg738bSVKC8CYbWSoyYYterjZjAoGAA2bi57mpfv7/o/FfQ+CM\nzM5CbB7GZK01C2ggQDOgREUCnlSUiC/SHhe9U+D0exYLDN2r9mNAR+XAmsg4dynw\n4VM8h5y1ct6ip2teNcVcx/Wl2UHNU1Fajl5plITUk0KF9HMkI1DLv7H2U+mDgOdf\n7ywLKDxbzXNGFxDrZGbi+WI=\n-----END PRIVATE KEY-----\n",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Inicializar a API do Google Sheets
    const sheets = google.sheets({ version: "v4", auth });

    // Escrever "ola mundo" na célula A1049
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A1049`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["ola mundo"]],
      },
    });

    console.log("Escrito 'ola mundo' na célula A1049 com sucesso!");
    console.log(`${result.data.updatedCells} células atualizadas.`);
  } catch (error) {
    console.error("Erro ao escrever na planilha:", error);
  }
}

// Executar a função
writeToSheet();
