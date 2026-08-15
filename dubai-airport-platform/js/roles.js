/**
 * Role & Access Management — DXB Airport Platform
 * Each role only sees allowed routes and OCC modules.
 */

const ROLES = {
  guest: 'guest',
  customer: 'customer',
  tower: 'tower',
  ops: 'ops',
  admin: 'admin',
}

/** Normalize legacy "user" → customer */
function normalizeRole(role) {
  if (role === 'user') return ROLES.customer
  return role || ROLES.guest
}

/**
 * What each role can access
 * routes: public hash routes
 * modules: OCC module ids (admin shell)
 * theme: customer | ops
 */
const ACCESS_MATRIX = {
  guest: {
    label: 'Guest',
    shell: 'customer',
    description: 'بازدیدکننده عمومی — فقط سایت مشتری',
    routes: ['landing', 'signin', 'signup', 'staff-login'],
    modules: [],
    canManageUsers: false,
  },
  customer: {
    label: 'Customer',
    shell: 'customer',
    description: 'مسافر — رزرو، مدیریت بلیط، وضعیت پرواز، سفرهای من',
    routes: ['landing', 'signin', 'signup', 'my-trips', 'manage', 'flight-status'],
    modules: [],
    canManageUsers: false,
  },
  tower: {
    label: 'Tower Controller',
    shell: 'ops',
    description: 'کنترلر برج — فقط Local Tower و داشبورد خلاصه',
    routes: ['admin', 'staff-login'],
    modules: ['dashboard', 'tower-control'],
    canManageUsers: false,
  },
  ops: {
    label: 'Operations Staff',
    shell: 'ops',
    description: 'عملیات زمینی — گیت، turnaround، خدمه، مسافر',
    routes: ['admin', 'staff-login'],
    modules: ['dashboard', 'gate-management', 'aircraft-turnaround', 'crew-flow', 'passenger-journey'],
    canManageUsers: false,
  },
  admin: {
    label: 'OCC Admin',
    shell: 'ops',
    description: 'مدیر OCC — دسترسی کامل + مدیریت کاربران',
    routes: ['admin', 'staff-login', 'landing'],
    modules: [
      'dashboard',
      'tower-control',
      'gate-management',
      'aircraft-turnaround',
      'crew-flow',
      'passenger-journey',
      'user-management',
    ],
    canManageUsers: true,
  },
}

const MODULE_META = {
  dashboard: { label: 'Dashboard', icon: '◈' },
  'tower-control': { label: 'Tower', icon: '✈' },
  'gate-management': { label: 'Gates', icon: '▣' },
  'aircraft-turnaround': { label: 'Turnaround', icon: '↻' },
  'crew-flow': { label: 'Crew', icon: '◎' },
  'passenger-journey': { label: 'Passengers', icon: '◇' },
  'user-management': { label: 'Users', icon: '⚙' },
}

function getAccess(role) {
  const key = normalizeRole(role)
  return ACCESS_MATRIX[key] || ACCESS_MATRIX.guest
}

function canAccessRoute(role, route) {
  return getAccess(role).routes.includes(route)
}

function canAccessModule(role, moduleId) {
  return getAccess(role).modules.includes(moduleId)
}

function getDefaultModule(role) {
  const mods = getAccess(role).modules
  return mods[0] || null
}

function isStaffRole(role) {
  const r = normalizeRole(role)
  return r === ROLES.admin || r === ROLES.tower || r === ROLES.ops
}

function isCustomerFacing(role) {
  const r = normalizeRole(role)
  return r === ROLES.guest || r === ROLES.customer
}
