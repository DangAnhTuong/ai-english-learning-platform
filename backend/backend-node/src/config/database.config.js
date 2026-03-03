const mongoose = require('mongoose');

// MongoDB Configuration
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/englishdb_nodejs';
const mongooseOptions = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    family: 4, // Use IPv4, skip trying IPv6
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 3, // Maintain at least 3 socket connections
    retryWrites: true, // Retry failed writes
    retryReads: true, // Retry failed reads
};

// Retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds
const CONTINUOUS_RETRY_DELAY = 30000; // 30 seconds after max retries
let retryCount = 0;
let retryTimeout = null;

// Handle initial connection with retry logic
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(mongoURI, mongooseOptions);
        console.info(`✅ MongoDB Connected: ${mongoURI}`);
        retryCount = 0; // Reset retry count on successful connection

        // Handle errors after initial connection
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
            // Attempt to reconnect
            if (!retryTimeout) {
                retryConnection();
            }
        });

        mongoose.connection.on('reconnected', () => {
            console.info('✅ MongoDB reconnected');
            retryCount = 0; // Reset retry count on successful reconnection
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            try {
                if (retryTimeout) {
                    clearTimeout(retryTimeout);
                }
                await mongoose.connection.close();
                console.info('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error during MongoDB connection closure:', err);
                process.exit(1);
            }
        });

    } catch (error) {
        const errorMsg = error.message || error.toString();
        console.error('❌ MongoDB connection error:', errorMsg);

        // Don't crash the app, allow it to start and retry in background
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            if (retryCount === 1) {
                console.warn('\n⚠️  MongoDB is not available. The app will continue to run.');
                console.warn('⚠️  Database features will be unavailable until MongoDB is connected.');
                console.warn('💡 To start MongoDB:');
                console.warn('   - Windows: net start MongoDB (or start MongoDB service)');
                console.warn('   - Linux/Mac: sudo systemctl start mongod (or brew services start mongodb-community)');
                console.warn('   - Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest\n');
            }
            // Only show retry message every 2 attempts to reduce verbosity
            if (retryCount % 2 === 0 || retryCount === MAX_RETRIES) {
                console.warn(`⚠️  Retrying MongoDB connection (${retryCount}/${MAX_RETRIES})...`);
            }
            retryConnection();
        } else {
            console.error('\n❌ Maximum retry attempts reached. MongoDB connection failed.');
            console.warn('⚠️  App will continue to run, but database features will be unavailable.');
            console.warn('💡 Please ensure MongoDB is running and the app will automatically reconnect when available.\n');
        }
    }
};

// Retry connection function
const retryConnection = () => {
    if (retryTimeout) {
        clearTimeout(retryTimeout);
    }

    // Use longer delay if we've exceeded max retries
    const delay = retryCount >= MAX_RETRIES ? CONTINUOUS_RETRY_DELAY : RETRY_DELAY;

    retryTimeout = setTimeout(async () => {
        if (mongoose.connection.readyState === 0) { // 0 = disconnected
            try {
                await mongoose.connect(mongoURI, mongooseOptions);
                console.info(`✅ MongoDB Connected: ${mongoURI}`);
                retryCount = 0;
            } catch (error) {
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    // Only show retry message every 2 attempts to reduce verbosity
                    if (retryCount % 2 === 0 || retryCount === MAX_RETRIES) {
                        console.warn(`⚠️  Retry ${retryCount}/${MAX_RETRIES} failed. Retrying...`);
                    }
                    retryConnection();
                } else {
                    // After max retries, continue retrying but less frequently
                    if (retryCount === MAX_RETRIES) {
                        console.warn(`⚠️  Maximum retries reached. Will continue retrying every ${CONTINUOUS_RETRY_DELAY / 1000} seconds...`);
                        retryCount++; // Increment to prevent showing message again
                    }
                    retryConnection(); // Continue retrying with longer delay
                }
            }
        }
    }, delay);
};

// Execute connection
connectDB();

// Export helper function to check MongoDB connection status
const getMongoDBStatus = () => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        99: 'uninitialized'
    };
    return {
        status: states[mongoose.connection.readyState] || 'unknown',
        readyState: mongoose.connection.readyState,
        isConnected: mongoose.connection.readyState === 1,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown'
    };
};

module.exports = mongoose;
module.exports.getMongoDBStatus = getMongoDBStatus;
