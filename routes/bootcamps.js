const express = require('express')

const { GetAllBootcamps, 
        GetBootcampById, 
        CreateBootcamp, 
        UpdateBootcampById,
        DeleteBootcampById,
        GetBootcampsInRadius,
        CreateCourse,
        UploadPhotoBootcamp
} = require('../controllers/bootcamps')

const Bootcamp = require('../models/Bootcamp')

const advancedResults = require('../middlewares/advancedResults')
    
const {GetAllCourses} = require('../controllers/courses')
const {AddReview} = require('../controllers/bootcamps')
const {GetReviews} = require('../controllers/reviews')
const {Protect, Authorize} = require('../middlewares/auth')

const router = express.Router()

router
    .route('/:bootcampId/courses')
    .get(GetAllCourses)
    .post(Protect, Authorize('publisher', 'admin'), CreateCourse)

router
    .route('/:bootcampId/reviews')
    .get(GetReviews)
    .post(Protect, Authorize('user', 'admin'), AddReview)

router
    .route('/radius/:zipcode/:distance')
    .get(GetBootcampsInRadius)
    
router
    .route('/')
    .get(advancedResults(Bootcamp, 'courses'), GetAllBootcamps)
    .post(Protect, Authorize('publisher', 'admin'),CreateBootcamp)

router
    .route('/:id')
    .get(GetBootcampById)
    .put(Protect, Authorize,UpdateBootcampById)
    .delete(Protect, Authorize('publisher', 'admin'),DeleteBootcampById)

router
    .route('/:id/photo')
    .put(Protect, Authorize('publisher', 'admin'),UploadPhotoBootcamp)

module.exports = router