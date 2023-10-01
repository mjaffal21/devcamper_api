const Course = require('../models/Course')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middlewares/async')

// @desc    Get All Courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public
exports.GetAllCourses = asyncHandler(async(req, res, next) => {

    if(req.params.bootcampId){
        const courses = await Course.find({bootcamp: req.params.bootcampId})
        return res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        })
    } else {
        res.status(200).json(res.advancedResults)
    }
})

// @desc    Get Single Course
// @route   GET /api/v1/courses/:id
// @access  Public
exports.GetCourse = asyncHandler(async(req, res, next) => {
    const course = await Course.findById(req.params.id).populate({path: 'bootcamp', select: 'name description'})

    if(!course){
        next(new ErrorResponse(`No course with id of ${req.params.id}`, 404))
    }
    res.status(200).json({
        success: true,
        data: course
    })
})

// @desc    Update Course
// @route   PUT /api/v1/courses/:id
// @access  Private
exports.UpdateCourseById = asyncHandler(async(req, res, next) => {
    let course = await Course.findById(req.params.id)

    if(!course){
        next(new ErrorResponse(`No course with id of ${req.params.id}`, 404))
    }

    // Make sure user is course owner
    if(course.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update a course ${course._id}`, 401))
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
    res.status(200).json({
        success: true,
        data: course
    })
})

// @desc    Delete Course
// @route   DELETE /api/v1/courses/:id
// @access  Private
exports.DeleteCourseById = asyncHandler(async(req, res, next) => {
    const course = await Course.findById(req.params.id)

    if(!course){
        next(new ErrorResponse(`No course with id of ${req.params.id}`, 404))
    }

    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this course ${course._id}`, 401))
    }

    await course.deleteOne()

    res.status(200).json({
        success: true,
        data: {}
    })
})


