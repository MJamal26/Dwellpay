require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const MONGODB_URI = process.env.MONGO_URI;

const users = [
  { name: "Jamal",       email: "jamal@dwellpay.com",   avatar: "", avatarColor: "#2563eb", currency: "INR" },
  { name: "Arun",        email: "arun@dwellpay.com",    avatar: "", avatarColor: "#16a34a", currency: "INR" },
  { name: "Bala",        email: "bala@dwellpay.com",    avatar: "", avatarColor: "#ea580c", currency: "INR" },
  { name: "Karthik",     email: "karthik@dwellpay.com", avatar: "", avatarColor: "#0891b2", currency: "INR" },
  { name: "Rahul",       email: "rahul@dwellpay.com",   avatar: "", avatarColor: "#db2777", currency: "INR" },
  { name: "Shayan bhai", email: "shayan@dwellpay.com",  avatar: "", avatarColor: "#db2777", currency: "INR" },
];

async function seedUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Hash password once for all users
    const passwordHash = await bcrypt.hash("Test123", 12);

    // Get household ID — find the first household in DB
    const Household = require("./models/Household");
    const household = await Household.findOne();
    if (!household) {
      console.error("No household found. Please create one first via the app.");
      process.exit(1);
    }
    console.log(`Using household: "${household.name}" (${household._id})`);

    const usersToInsert = users.map((user) => ({
      ...user,
      password: passwordHash,
      householdId: household._id,
    }));

    let inserted = 0;
    let skipped = 0;

    for (const userData of usersToInsert) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        // Update householdId if not set
        if (!existing.householdId) {
          await User.updateOne({ _id: existing._id }, { householdId: household._id });
        }
        console.log(`  ⏭ Skipped (exists): ${userData.name} → ${userData.email}`);
        skipped++;
        continue;
      }
      await User.create(userData);
      // Also add to household members if not there
      const alreadyMember = household.members.some(
        (m) => m.userId?.toString() === userData._id?.toString()
      );
      console.log(`  ✅ Created: ${userData.name} → ${userData.email}`);
      inserted++;
    }

    // Add all seeded users to household.members
    const allSeededUsers = await User.find({ email: { $in: users.map((u) => u.email) } });
    let membersAdded = 0;
    for (const seededUser of allSeededUsers) {
      const alreadyMember = household.members.some(
        (m) => m.userId?.toString() === seededUser._id.toString()
      );
      if (!alreadyMember) {
        household.members.push({ userId: seededUser._id, role: "member" });
        membersAdded++;
      }
    }
    if (membersAdded > 0) {
      await household.save();
      console.log(`\n  👥 Added ${membersAdded} member(s) to household "${household.name}"`);
    }

    console.log(`\n✅ Done! ${inserted} created, ${skipped} skipped.`);
    console.log(`\nLogin with any of these:`);
    users.forEach((u) => console.log(`  ${u.email}  /  Test123`));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seedUsers();
