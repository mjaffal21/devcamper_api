const path = require('path')
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan')
const colors = require('colors')
const mongosanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const errorHandler = require('./middlewares/error')
const asyncHandler = require('./middlewares/async')
const connectDB = require('./config/db')

// Load env variables
dotenv.config({path: './config/config.env'});
// DB Connection
connectDB()

const app = express();

app.use(express.json());

// Route Files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses')
const auth = require('./routes/auth')
const users = require('./routes/users')
const reviews = require('./routes/reviews')

app.use(cookieParser())

// Dev Logging Middleware
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

app.use(fileUpload())
// Sanitize Data
app.use(mongosanitize())
// Set security headers
app.use(helmet())
// Prevent XSS attacks
app.use(xss())
// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 100
});
app.use(limiter);
// Prevent http param pollution
app.use(hpp());  
// Enable CORS
app.use(cors());

// Set Static Folder
app.use(express.static(path.join('__dirname', 'public')))

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/reviews', reviews)
app.use(asyncHandler)
app.use(errorHandler)

const PORT = process.env.PORT || 5000 ;

const server = app.listen(PORT, console.log(`Server is running in ${process.env.NODE_ENV} mode on Port: ${PORT}`.yellow.bold));

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red)
    server.close(() => process.exit(1))
})