import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req,res,next)=>{
    try {
        const token = req.cookies?.accessToken
        console.log(token);
        if (!token) {   
            throw new ApiError(401,"Unauthorization request")     
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log(decodedToken);
        console.log(decodedToken?.user._id);
    
        // const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        const user = await User.findById(decodedToken?.user._id).select("-password -refreshToken")
        console.log(user)
    
        if (!user) {
            throw new ApiError(401,"Invalid Access Token") //678baeee3b93dacc6bc4826f
        }
    
        req.user = user;
        next();
    } catch (error) {
       throw new ApiError(401,error?.message || "Invalid Token") 
    }


})