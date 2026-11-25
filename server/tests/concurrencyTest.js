/**
 * SlotSync Concurrency & Row-Level Locking Verification Suite
 * Tests simultaneous booking requests against the live Express + MySQL InnoDB backend.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const assert = require('assert');
const { pool } = require('../config/db');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;
const TEST_DATE = '2026-12-15'; // Future date reserved for automated test run

const loginUser = async (email, password = 'Password@123') => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${data.message}`);
  }
  return data.token;
};

const sendBookingRequest = async (token, payload, label) => {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  const durationMs = Date.now() - start;
  return { label, status: res.status, durationMs, body };
};

const runConcurrencyTests = async () => {
  console.log('=================================================================');
  console.log('🧪 SLOTSYNC CONCURRENCY & ROW-LEVEL LOCKING TEST SUITE');
  console.log('=================================================================\n');

  try {
    // Clean up any prior runs on TEST_DATE so the test is repeatable
    await pool.execute(`DELETE FROM bookings WHERE booking_date = ?`, [TEST_DATE]);

    // Authenticate two distinct students & one faculty member
    const tokenUserA = await loginUser('aarav.student@slotsync.edu');
    const tokenUserB = await loginUser('priya.student@slotsync.edu');
    const tokenUserC = await loginUser('rohan.student@slotsync.edu');
    const tokenFaculty = await loginUser('ananya.sharma@slotsync.edu');

    // -------------------------------------------------------------------------
    // TEST 1: Two users booking the EXACT SAME resource & slot simultaneously
    // -------------------------------------------------------------------------
    console.log('▶ TEST 1: Simultaneous identical booking on Resource ID 3 (10:00 - 11:00)');
    const [res1A, res1B] = await Promise.all([
      sendBookingRequest(
        tokenUserA,
        { resource_id: 3, booking_date: TEST_DATE, start_time: '10:00', end_time: '11:00' },
        'User A (Aarav)'
      ),
      sendBookingRequest(
        tokenUserB,
        { resource_id: 3, booking_date: TEST_DATE, start_time: '10:00', end_time: '11:00' },
        'User B (Priya)'
      ),
    ]);

    console.log(`   - ${res1A.label}: HTTP ${res1A.status} (${res1A.durationMs}ms) -> ${res1A.body.message}`);
    console.log(`   - ${res1B.label}: HTTP ${res1B.status} (${res1B.durationMs}ms) -> ${res1B.body.message}`);

    const statuses1 = [res1A.status, res1B.status].sort();
    assert.deepStrictEqual(statuses1, [201, 409], 'Expected exactly one 201 and one 409!');
    console.log('   ✅ PASSED: Row-level lock serialized requests; 1 succeeded (201), 1 rejected (409).\n');

    // -------------------------------------------------------------------------
    // TEST 2: Two users booking OVERLAPPING time slots simultaneously
    // -------------------------------------------------------------------------
    console.log('▶ TEST 2: Simultaneous overlapping slots on Resource ID 3 (14:00-16:00 vs 15:00-17:00)');
    const [res2A, res2B] = await Promise.all([
      sendBookingRequest(
        tokenUserA,
        { resource_id: 3, booking_date: TEST_DATE, start_time: '14:00', end_time: '16:00' },
        'User A (14:00-16:00)'
      ),
      sendBookingRequest(
        tokenUserC,
        { resource_id: 3, booking_date: TEST_DATE, start_time: '15:00', end_time: '17:00' },
        'User C (15:00-17:00)'
      ),
    ]);

    console.log(`   - ${res2A.label}: HTTP ${res2A.status} (${res2A.durationMs}ms) -> ${res2A.body.message}`);
    console.log(`   - ${res2B.label}: HTTP ${res2B.status} (${res2B.durationMs}ms) -> ${res2B.body.message}`);

    const statuses2 = [res2A.status, res2B.status].sort();
    assert.deepStrictEqual(statuses2, [201, 409], 'Expected one 201 and one 409 for overlapping slots!');
    console.log('   ✅ PASSED: Partial interval overlap blocked atomically.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Two users booking DIFFERENT resources simultaneously
    // -------------------------------------------------------------------------
    console.log('▶ TEST 3: Simultaneous bookings on DIFFERENT resources (ID 5 vs ID 6 at 10:00-11:00)');
    const [res3A, res3B] = await Promise.all([
      sendBookingRequest(
        tokenUserA,
        { resource_id: 5, booking_date: TEST_DATE, start_time: '10:00', end_time: '11:00' },
        'User A -> LAB001'
      ),
      sendBookingRequest(
        tokenFaculty,
        { resource_id: 6, booking_date: TEST_DATE, start_time: '10:00', end_time: '11:00' },
        'Faculty -> LAB002'
      ),
    ]);

    console.log(`   - ${res3A.label}: HTTP ${res3A.status} (${res3A.durationMs}ms) -> ${res3A.body.message}`);
    console.log(`   - ${res3B.label}: HTTP ${res3B.status} (${res3B.durationMs}ms) -> ${res3B.body.message}`);

    assert.strictEqual(res3A.status, 201);
    assert.strictEqual(res3B.status, 201);
    console.log('   ✅ PASSED: Distinct resource rows locked independently; both succeeded (201).\n');

    // -------------------------------------------------------------------------
    // TEST 4: 4-way simultaneous burst on the same resource & time slot
    // -------------------------------------------------------------------------
    console.log('▶ TEST 4: 4-way simultaneous burst on Resource ID 8 (09:00 - 11:00)');
    const burstResults = await Promise.all([
      sendBookingRequest(tokenUserA, { resource_id: 8, booking_date: TEST_DATE, start_time: '09:00', end_time: '11:00' }, 'Req 1'),
      sendBookingRequest(tokenUserB, { resource_id: 8, booking_date: TEST_DATE, start_time: '09:00', end_time: '11:00' }, 'Req 2'),
      sendBookingRequest(tokenUserC, { resource_id: 8, booking_date: TEST_DATE, start_time: '09:00', end_time: '11:00' }, 'Req 3'),
      sendBookingRequest(tokenFaculty, { resource_id: 8, booking_date: TEST_DATE, start_time: '09:00', end_time: '11:00' }, 'Req 4'),
    ]);

    const successCount = burstResults.filter((r) => r.status === 201).length;
    const conflictCount = burstResults.filter((r) => r.status === 409).length;
    console.log(`   - Results: ${successCount} Created (201), ${conflictCount} Rejected (409 Conflict)`);
    assert.strictEqual(successCount, 1);
    assert.strictEqual(conflictCount, 3);

    // Verify directly in MySQL that only 1 booking exists for Resource 8 on TEST_DATE
    const [dbRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM bookings WHERE resource_id = 8 AND booking_date = ? AND status = 'CONFIRMED'`,
      [TEST_DATE]
    );
    assert.strictEqual(dbRows[0].total, 1);
    console.log('   ✅ PASSED: MySQL verified with exactly 1 row inserted and 0 double-bookings.\n');

    // Clean up test bookings after verification
    await pool.execute(`DELETE FROM bookings WHERE booking_date = ?`, [TEST_DATE]);

    console.log('=================================================================');
    console.log('🎉 ALL CONCURRENCY TESTS PASSED SUCCESSFULLY!');
    console.log('=================================================================');
  } catch (err) {
    console.error('\n❌ CONCURRENCY TEST FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

runConcurrencyTests();