const axios = require('axios');
const ical = require('node-ical');

const ICAL_URL_PATTERN = /\.ics(?:$|\?)/i;

function isValidIcalUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ICAL_URL_PATTERN.test(parsed.pathname + parsed.search);
  } catch (error) {
    return false;
  }
}

// @desc    Fetch and parse an iCal feed from a URL
// @route   POST /api/calendar/ical
// @access  Private
exports.getICalEvents = async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'יש להזין קישור iCal תקין.' });
  }

  const trimmedUrl = url.trim();
  if (!isValidIcalUrl(trimmedUrl)) {
    return res.status(400).json({ message: 'קישור היומן אינו תקין. יש להזין כתובת HTTPS שמכילה קובץ .ics' });
  }

  try {
    // Use axios to fetch the iCal data from the provided URL
    const response = await axios.get(trimmedUrl, {
      responseType: 'text' // We need the raw ICS data as a string
    });

    // Synchronously parse the ICS data
    const data = ical.sync.parseICS(response.data);
    const events = [];

    // Loop through the parsed data and format it for FullCalendar
    for (const k in data) {
      if (data.hasOwnProperty(k)) {
        const ev = data[k];
        if (ev.type === 'VEVENT') {
          events.push({
            title: ev.summary,
            start: ev.start,
            end: ev.end,
            allDay: !ev.start.getHours || (ev.end - ev.start) % (24 * 60 * 60 * 1000) === 0,
            description: ev.description,
            location: ev.location
          });
        }
      }
    }

    if (!response.data || !String(response.data).includes('BEGIN:VCALENDAR')) {
      return res.status(422).json({ message: 'הקישור לא מחזיר קובץ iCal תקין (BEGIN:VCALENDAR חסר).' });
    }

    res.json(events);

  } catch (error) {
    console.error('Error fetching or parsing iCal feed:', error.message);
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return res.status(422).json({ message: 'קישור היומן דורש הרשאה. יש לפרסם את היומן כקישור ציבורי (ICS).' });
    }

    res.status(502).json({ message: 'לא ניתן למשוך את קובץ היומן. בדוק שהקישור ציבורי וזמין.' });
  }
};