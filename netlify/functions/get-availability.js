// netlify/functions/get-availability.js - VERSIONE CORRETTA COMPLETA
exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Funzione per convertire data in timestamp
  function dateToTimestamp(dateString) {
    const date = new Date(dateString);
    return date.getTime();
  }

  // Gestisci preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Estrai parametri dalla query string
    const { calendarId, startDate, endDate } = event.queryStringParameters || {};

    if (!calendarId || !startDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Parametri mancanti: calendarId e startDate sono obbligatori' 
        })
      };
    }

    // Environment variables
    const PRIVATE_INTEGRATION_TOKEN = process.env.PRIVATE_INTEGRATION_TOKEN;

    if (!PRIVATE_INTEGRATION_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'PRIVATE_INTEGRATION_TOKEN mancante',
          details: 'Configura PRIVATE_INTEGRATION_TOKEN nelle environment variables'
        })
      };
    }

    // Usa endDate se fornito, altrimenti usa startDate
    const finalEndDate = endDate || startDate;

    // Converti le date in timestamp
    const startTimestamp = dateToTimestamp(startDate);
    const endTimestamp = dateToTimestamp(finalEndDate);

    // API v2 endpoint senza locationId
    const apiUrl = `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots?startDate=${startTimestamp}&endDate=${endTimestamp}`;
    
    console.log('Chiamata availability API v2 a:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PRIVATE_INTEGRATION_TOKEN}`,
        'Version': '2021-07-28'
      }
    });

    console.log('Risposta availability:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Errore availability body:', errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `API v2 Error: ${response.status} ${response.statusText}`,
          details: errorText,
          endpoint: apiUrl
        })
      };
    }

    const responseData = await response.json();
    console.log('Risposta completa API:', JSON.stringify(responseData, null, 2));

    // ✅ Processa correttamente il formato GHL:
// Estrai tutti gli slot da tutte le date
const allSlots = [];
Object.keys(responseData).forEach(dateKey => {
  // Ignora chiavi di sistema come 'traceId'
  if (responseData[dateKey] && responseData[dateKey].slots) {
    allSlots.push(...responseData[dateKey].slots);
  }
});

return {
  statusCode: 200,
  headers,
  body: JSON.stringify({
    slots: allSlots, // ✅ Array di slot da tutte le date
    dates: responseData, // ✅ Formato originale per debug
    _debug: {
      apiType: 'API v2 - Private Integration',
      endpoint: apiUrl,
      slotsCount: allSlots.length,
      calendarId,
      dateRange: `${startDate} -> ${finalEndDate}`,
      version: '2021-07-28',
      timestamps: {
        start: startTimestamp,
        end: endTimestamp
      },
      datesFound: Object.keys(responseData).filter(key => key !== 'traceId')
    }
  })
};
  } catch (error) {
    console.error('Errore get-availability:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Errore interno del server',
        details: error.message,
        stack: error.stack
      })
    };
  }
};
