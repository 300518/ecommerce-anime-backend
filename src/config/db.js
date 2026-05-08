import mongoose from 'mongoose';

export const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('MongoDB atlas conectado');
  } catch (error) {
    console.error('Error base:', error);
  }
};