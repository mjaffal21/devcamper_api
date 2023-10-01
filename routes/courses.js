const express = require('express')

const { GetAllCourses, GetCourse, UpdateCourseById, DeleteCourseById
    } = require('../controllers/courses')

const Course = require('../models/Course')

const advancedResults = require('../middlewares/advancedResults')
const {Protect, Authorize} = require('../middlewares/auth')
    
const router = express.Router()

router
    .route('/')
    .get(advancedResults(Course, {
        path: 'bootcamp',
        select: 'name description'
    }), GetAllCourses)

router
    .route('/:id')
    .get(GetCourse)
    .put(Protect, Authorize('publisher', 'admin'),UpdateCourseById)
    .delete(Protect, Authorize('publisher', 'admin'),DeleteCourseById)

    
module.exports = router