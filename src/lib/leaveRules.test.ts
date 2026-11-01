import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findOverlappingLeave, isRoutedTo, leaveDays, resolveApprover } from './leaveRules';
import type { AdminUser, LeaveRequest } from '../types';

const admin = (id: string, departments?: string[] | null, isActive = true): AdminUser => ({
  id, name: id, role: 'admin', position: 'Admin', email: `${id}@x`, avatarInitials: 'AD', departments, isActive,
});
const leave = (over: Partial<LeaveRequest>): LeaveRequest => ({
  id: 'l', facultyId: 'fac-1', facultyName: 'A', department: 'CSE', deptShort: 'CSE', fromDate: '2026-11-05',
  toDate: '2026-11-06', daysCount: 2, reason: 'x', substitutions: [], status: 'Pending', createdAt: '', ...over,
});

test('department admin wins over an all-departments admin', () => {
  const admins = [admin('all', null), admin('cse', ['CSE'])];
  assert.equal(resolveApprover(admins, 'CSE')?.id, 'cse');
  assert.equal(resolveApprover(admins, 'ECE')?.id, 'all');
});

test('inactive admins are skipped and no admin gives null', () => {
  assert.equal(resolveApprover([admin('a', null, false)], 'CSE'), null);
  assert.equal(resolveApprover([], 'CSE'), null);
});

test('admins see requests routed to them and legacy unrouted ones', () => {
  assert.ok(isRoutedTo(leave({ approverId: 'a' }), 'a'));
  assert.ok(isRoutedTo(leave({ approverId: null }), 'a'));
  assert.ok(!isRoutedTo(leave({ approverId: 'b' }), 'a'));
});

test('overlap ignores rejected leave and other faculty', () => {
  const existing = [leave({ status: 'Rejected' }), leave({ facultyId: 'fac-2' }), leave({ id: 'ok', fromDate: '2026-11-07', toDate: '2026-11-07' })];
  assert.equal(findOverlappingLeave(existing, 'fac-1', '2026-11-05', '2026-11-06'), undefined);
  assert.equal(findOverlappingLeave(existing, 'fac-1', '2026-11-06', '2026-11-08')?.id, 'ok');
});

test('leave days are inclusive and timezone-safe', () => {
  assert.equal(leaveDays('2026-11-02', '2026-11-03'), 2);
  assert.equal(leaveDays('2026-11-07', '2026-11-14'), 8);
  assert.equal(leaveDays('2026-11-03', '2026-11-02'), 0);
  assert.equal(leaveDays('2026-03-28', '2026-03-30'), 3); // across a DST change in zones that have one
});
