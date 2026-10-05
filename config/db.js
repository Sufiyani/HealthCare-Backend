import mongoose from 'mongoose';

const connectDB = async () => {
try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4, // Force IPv4 to fix ECONNREFUSED on new laptops
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
