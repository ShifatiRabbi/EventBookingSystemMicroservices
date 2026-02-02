const axios = require('axios');
const mysql = require('mysql2/promise');

async function validateConsistency() {
  console.log('Validating system consistency after load test...\n');
  
  // Database connection
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 3306
  };
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // 1. Check no negative seats
    const [negativeSeats] = await connection.execute(`
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
    const [consistency] = await connection.execute(`
      SELECT 
        e.id,
        e.title,
        e.total_seats,
        e.available_seats,
        IFNULL(SUM(b.seat_count), 0) as booked_seats,
        e.total_seats - e.available_seats as calculated_booked,
        CASE 
          WHEN e.available_seats < 0 THEN 'OVERBOOKED'
          WHEN e.total_seats - e.available_seats != IFNULL(SUM(b.seat_count), 0) THEN 'INCONSISTENT'
          ELSE 'OK'
        END as status
      FROM event_service.events e
      LEFT JOIN booking_service.bookings b ON e.id = b.event_id AND b.status = 'confirmed'
      GROUP BY e.id
      HAVING status != 'OK'
    `);
    
    if (consistency.length > 0) {
      console.error('Data inconsistency detected:');
      console.table(consistency);
      throw new Error('Data inconsistency detected');
    } else {
      console.log('All events have consistent seat counts');
    }
    
    // 3. Check duplicate bookings
    const [duplicates] = await connection.execute(`
      SELECT booking_id, COUNT(*) as count
      FROM booking_service.bookings
      GROUP BY booking_id
      HAVING count > 1
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
    const eventResponse = await axios.get('http://localhost:3002/api/events');
    console.log(`Event service responding. Events count: ${eventResponse.data.events.length}`);
    
    // Check booking service
    const bookingResponse = await axios.get('http://localhost:3003/api/bookings');
    console.log(`Booking service responding. Bookings count: ${bookingResponse.data.bookings.length}`);
    
    // Check notification service
    const notificationResponse = await axios.get('http://localhost:3004/api/notifications');
    console.log(`Notification service responding. Notifications count: ${notificationResponse.data.notifications.length}`);
    
    console.log('\nAll consistency checks passed!');
    console.log('System maintained data integrity under load.');
    
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

validateConsistency();