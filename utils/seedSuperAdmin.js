const { sequelize } = require('../config/db');
const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    // Ensure the table exists and has the latest schema (including isApproved)
    await sequelize.sync({ alter: true });

    const adminEmail = 'xeno@admin.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log('Superadmin "Xeno" already exists.');
    } else {
      await User.create({
        fullName: 'Xeno',
        email: adminEmail,
        password: '4355', // Will be hashed automatically by the User model hook
        role: 'admin',
        isApproved: true,
        phoneNumber: '000-0000000'
      });
      console.log('Superadmin "Xeno" created successfully.');
      console.log('Login with Email: xeno@admin.com | Password: 4355');
    }
    process.exit();
  } catch (error) {
    console.error('Error seeding superadmin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
