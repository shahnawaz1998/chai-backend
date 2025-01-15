const asyncHandler = (requestHandler) =>{
   return (req,res,next)=>{
         Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}

export {asyncHandler}


// Javascript explanation for high order function.

// const asyncHa ndler = ()=>{}  Normal function
// const asyncHandler = (func) => () => {}  Passing function as parameter
// const asyncHandler = (func) => async () => {} adding Async Await to above high order function

// const asyncHandler = (fn) => async (req,res,next) =>{}