/**
 * makeAdmin.js
 * Moves the admin user into a target household as a HIDDEN owner (ghost admin).
 * - Admin can see all data in that household
 * - Admin is invisible to regular members (not shown in member lists, balances, splits)
 * Run: node makeAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Household = require('./models/Household');

const ADMIN_EMAIL    = 'admin@dwellpay.com';
const TARGET_HOUSEHOLD_ID = '6a79b416ce158b3cec9da386';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) { console.error('❌ Admin user not found'); process.exit(1); }

  const household = await Household.findById(TARGET_HOUSEHOLD_ID);
  if (!household) { console.error('❌ Target household not found'); process.exit(1); }

  // 1. Remove admin from old household (if any)
  if (admin.householdId) {
    await Household.findByIdAndUpdate(admin.householdId, {
      $pull: { members: { userId: admin._id } },
    });
    console.log(`✅ Removed admin from old household (${admin.householdId})`);
  }

  // 2. Remove any existing entry in target household to avoid duplicates
  await Household.findByIdAndUpdate(TARGET_HOUSEHOLD_ID, {
    $pull: { members: { userId: admin._id } },
  });

  // 3. Add admin as hidden owner
  household.members.push({ userId: admin._id, role: 'owner', hidden: true });
  await household.save();
  console.log(`✅ Added admin to "${household.name}" as HIDDEN OWNER`);

  // 4. Update admin's householdId
  admin.householdId = household._id;
  await admin.save();
  console.log(`✅ Updated admin householdId → ${household._id}`);

  console.log('\n🎉 Done!');
  console.log(`   Admin: ${ADMIN_EMAIL} / adminishere`);
  console.log(`   Household: "${household.name}" (${household._id})`);
  console.log(`   Admin is HIDDEN — regular members won't see them`);
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
