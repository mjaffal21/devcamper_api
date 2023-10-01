const advancedResults = (model, populate) => async(req, res, next) => {
    let query

    const reqQuery = {...req.query}
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit']

    removeFields.forEach(param => delete reqQuery[param])

    queryString = JSON.stringify(reqQuery)
    queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)
    query = model.find(JSON.parse(queryString))
    // Select
    if(req.query.select){
        const fields = req.query.select.split(',').join(' ')
        query = query.select(fields)
    }
    // Sort
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ')
        query = query.sort(sortBy)
    } else {
        query = query.sort('-createdAt')
    }
    // Pagination
    const page = parseInt(req.query.page, 10) || 1; // Current page
    const limit = parseInt(req.query.limit, 10) || 25; // Items per page
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit
    const total = await model.countDocuments()

    query = query.skip(startIndex).limit(limit)

    if(populate){
        query = query.populate(populate)
    }

    const results = await query
    const pagination = {}

    if(endIndex < total){
        pagination.next = {
            page: page + 1,
            limit: limit
        }
    }
    if(startIndex > 0){
        pagination.previous = {
            page: page - 1,
            limit: limit
        }
    }
    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }
    next()
}

module.exports = advancedResults