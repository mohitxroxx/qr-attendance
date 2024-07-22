import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
const dbURL = process.env.MONGO_URL
if (!dbURL) {
    console.error('MONGO_URL is not set in .env file')
    process.exit(1)
}
const connectDB = async () => {
    try {
        const connect = await mongoose.connect(dbURL, {})
        console.log("MongoDB connected", connect.connection.host)
    } catch (error) {
        console.error('Error occured while connecting to DB', error)
        process.exit(1)
    }
}

export default connectDB