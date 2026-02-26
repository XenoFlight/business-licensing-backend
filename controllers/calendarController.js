const axios = require('axios');
const ical = require('node-ical');

// @desc    Fetch and parse an iCal feed from a URL
// @route   POST /api/calendar/ical
// @access  Private
exports.getICalEvents = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'Please provide an iCal URL' });
  }

  try {
    // Use axios to fetch the iCal data from the provided URL
    const response = await axios.get(url, {
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

    res.json(events);

  } catch (error) {
    console.error('Error fetching or parsing iCal feed:', error.message);
    res.status(500).json({ message: 'Failed to fetch or parse iCal feed. Check the URL and ensure it is publicly accessible.' });
  }
};