import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res) => {
    
    //get user detail from frontEnd
    //Validation - not empty.
    //check if user already exist (email OR userName)
    //check for Images,check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token from response
    //check for user creation
    //return response

    //if data comes from json or payload it comes in req.body

    const {fullName,email,username,password} = req.body
    console.log("email:",email);

    if(
        [fullName,email,username,password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required");
    }

       const existedUser = await User.findOne({
            $or:[{username},{email}]
        })

    if(existedUser){
        throw new ApiError(409,"User allready exist");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files &&
         Array.isArray(req.files.coverImage) && 
         req.files.coverImage[0].length >0)
         {
            coverImageLocalPath = req.files.coverImage[0].path;
         }

    if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar is required.")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar is required.")
    }

    const  user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully!")
    )

})

export {registerUser}