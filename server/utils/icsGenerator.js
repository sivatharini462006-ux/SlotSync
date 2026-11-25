/**
 * Formats a YYYY-MM-DD date and HH:MM(:SS) time into an RFC-5545 local timestamp (YYYYMMDDTHHMMSS)
 */
const formatIcsDateTime = (bookingDate, timeStr) => {
  const datePart = String(bookingDate).slice(0, 10).replace(/-/g, '');
  const cleanTime = String(timeStr).padEnd(8, ':00').slice(0, 8).replace(/:/g, '');
  return `${datePart}T${cleanTime}`;
};

const escapeIcsText = (text = '') =>
  String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

/**
 * Generates a downloadable .ics calendar file string with a 15-minute check-in alarm
 */
const buildBookingIcs = (booking) => {
  const dtStart = formatIcsDateTime(booking.booking_date, booking.start_time);
  const dtEnd = formatIcsDateTime(booking.booking_date, booking.end_time);
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const summary = escapeIcsText(
    `SlotSync: [${booking.resource_code}] ${booking.resource_name}`
  );
  const location = escapeIcsText(
    `${booking.building}, Floor ${booking.floor_number}, Room ${booking.room_number}`
  );
  const description = escapeIcsText(
    `Reservation Code: ${booking.booking_code}\n` +
      `Resource: ${booking.resource_name} (${booking.resource_code})\n` +
      `Location: ${booking.building}, Floor ${booking.floor_number}, Room ${booking.room_number}\n` +
      `Reminder: Scan QR or enter code ${booking.booking_code} within 15 minutes of start time to avoid auto-release.`
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SlotSync Campus Resource OS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:slotsync-${booking.booking_code}@slotsync.edu`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:SlotSync Check-In Reminder (15 mins before session)',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

module.exports = { buildBookingIcs };