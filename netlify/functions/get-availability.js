// Subito dopo aver ricevuto la risposta, aggiungi questo debug:
const data = await response.json();
console.log('Risposta completa API:', JSON.stringify(data, null, 2));

// Poi restituisci la risposta completa per analizzarla:
return {
  statusCode: 200,
  headers,
  body: JSON.stringify({
    originalResponse: data, // ✅ Aggiungi questo per vedere cosa restituisce veramente
    slots: data.slots || [],
    _debug: {
      apiType: 'API v2 - Private Integration',
      endpoint: apiUrl,
      slotsCount: data.slots?.length || 0,
      calendarId,
      dateRange: `${startDate} -> ${finalEndDate}`,
      version: '2021-07-28'
    }
  })
};
