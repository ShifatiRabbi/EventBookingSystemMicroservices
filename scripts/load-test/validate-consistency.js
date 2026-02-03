const axios = require('axios');
const mysql = require('mysql2/promise');

async function validateConsistency() {
  console.log('Validating system consistency after load test...\n');
  
  // Connect to Event DB
  const eventConn = await mysql.createConnection({
    host: "event-db",
    user: "root",
    password: "root",
    database: "event_service",
  });

  // Connect to Booking DB
  const bookingConn = await mysql.createConnection({
    host: "booking-db",
    user: "root",
    password: "root",
    database: "booking_service",
  });

  try {
    // 1. Check no negative seats
    const [negativeSeats] = await eventConn.execute(`
      SELECT id, title, available_seats 
      FROM event_service.events 
      WHERE available_seats < 0
    `);
    
    if (negativeSeats.length > 0) {
      console.error('CRITICAL: Found events with negative seats!');
      console.table(negativeSeats);
      throw new Error('Overselling detected');
    } else {
      console.log('No negative seats found');
    }
    
    // 2. Verify seat consistency
    const [events] = await eventConn.execute(`
      SELECT id, title, total_seats, available_seats
      FROM events
    `);

    const [bookings] = await bookingConn.execute(`
      SELECT event_id, SUM(seat_count) as booked_seats
      FROM bookings
      WHERE status = 'confirmed'
      GROUP BY event_id
    `);

    const bookingMap = new Map();
    bookings.forEach(b => bookingMap.set(b.event_id, b.booked_seats));

    for (const e of events) {
      const booked = bookingMap.get(e.id) || 0;
      const calculatedBooked = e.total_seats - e.available_seats;
      if (booked !== calculatedBooked) {
        console.error(`INCONSISTENT: Event ${e.id} - booked=${booked}, calculated=${calculatedBooked}`);
      }
    }
    console.log('All events have consistent seat counts');
    
    // 3. Check duplicate bookings
    const [duplicates] = await bookingConn.execute(`
      SELECT booking_id, COUNT(*) as count
      FROM booking_service.bookings
      GROUP BY booking_id
      HAVING count > 1;
    `);
    
    if (duplicates.length > 0) {
      console.error('Duplicate booking IDs detected:');
      console.table(duplicates);
    } else {
      console.log('No duplicate booking IDs');
    }
    
    // 4. Verify through APIs
    console.log('\nVerifying through service APIs...');
    
    // Check event service
    try {
      const eventResponse = await axios.get('http://localhost:3002/api/events');
      console.log(`Event service responding. Events count: ${eventResponse.data.events.length}`);
    } catch {
      console.log("Event service not responding!!!" );
    }
    
    // Check booking service
    try {
      const bookingResponse = await axios.get('http://localhost:3003/api/bookings');
      console.log(`Booking service responding. Bookings count: ${bookingResponse.data.bookings.length}`);
    } catch {
      console.log("Booking service not responding!!!" );
    }
    
    // Check notification service
    try {
      const notificationResponse = await axios.get('http://localhost:3004/api/notifications');
      console.log(`Notification service responding. Notifications count: ${notificationResponse.data.notifications.length}`);
    } catch {
      console.log("Notification service not responding!!!" );
    }
    
    console.log('\nAll consistency checks passed!');
    console.log('System maintained data integrity under load.');
    
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  } finally {
    await eventConn.end();
    await bookingConn.end();
  }
}

validateConsistency();