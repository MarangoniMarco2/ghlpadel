// netlify/functions/get-availability.js - VERSIONE LOCATION API
exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  // Funzione per convertire data in timestamp Unix
    function dateToTimestamp(dateString) {
      const date = new Date(dateString);
      return date.getTime(); // Restituisce millisecondi
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

    // Per Location API
    const LOCATION_API_KEY = process.env.LOCATION_API_KEY;
    const LOCATION_ID = process.env.GHL_LOCATION_ID;

    if (!LOCATION_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'LOCATION_API_KEY mancante',
          details: 'Configura LOCATION_API_KEY nelle environment variables'
        })
      };
    }

    // Usa endDate se fornito, altrimenti usa startDate
    const finalEndDate = endDate || startDate;

    // Endpoint per Location API
    // CORRETTO (nuovo endpoint API v2):
    const apiUrl = `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${finalEndDate}`;
    
    console.log('Chiamata availability a:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCATION_API_KEY}`
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
          error: `Location API Error: ${response.status} ${response.statusText}`,
          details: errorText,
          endpoint: apiUrl
        })
      };
    }

    const data = await response.json();
    console.log('Slots trovati:', data.slots?.length || 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        slots: data.slots || [],
        _debug: {
          apiType: 'Location API',
          endpoint: apiUrl,
          slotsCount: data.slots?.length || 0,
          calendarId,
          dateRange: `${startDate} -> ${finalEndDate}`
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
        details: error.message
      })
    };
  }
};
