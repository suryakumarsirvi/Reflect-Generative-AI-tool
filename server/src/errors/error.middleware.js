
const errorMiddleware = (err, req, res, next) => {
    // Handle multer file upload errors
    if (err.name === 'MulterError') {
        let message = 'File upload error';
        
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File size exceeds the limit of 50MB';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files';
        } else if (err.code === 'FILE_TOO_LARGE') {
            message = 'File is too large';
        } else {
            message = err.message;
        }
        
        return res.status(400).json({
            success: false,
            message,
            error: err.code
        });
    }
    
    // Handle custom file validation errors
    if (err.message && err.message.includes('Only PDF files are allowed')) {
        return res.status(400).json({
            success: false,
            message: 'Only PDF files are allowed',
            error: 'INVALID_FILE_TYPE'
        });
    }
    
    // Handle other errors
    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal server error",
        errors: err.errors || []
    })
}

export default errorMiddleware;