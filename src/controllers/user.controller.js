import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
// import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// const generateAccessAndRefereshTokens = async(userId) =>{
//     try {
//         const user = await User.findById(userId)
//         console.log(user)
//         const accessToken = user.generateAccessToken()
//         console.log(accessToken)
//         const refreshToken = user.generateRefreshToken()

//         user.refreshToken = refreshToken
//         await user.save({ validateBeforeSave: false })

//         return {accessToken, refreshToken}


//     } catch (error) {
//         throw new ApiError(500, "Something went wrong while generating referesh and access token")
//     }
// }

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

const loginUser = asyncHandler(async (req,res)=>{
    //req body => data
    //username or email access check
    //find the user
    //password check
    //access and refresh token
    //send cookies with response

    const {email,username,password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"username or email is required.")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })
    

    if(!user){
        throw new ApiError(404,"user doesnot exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials");
    }

    // const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)
    const accessToken = jwt.sign({user},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})
    const refreshToken = jwt.sign({user},process.env.REFRESH_TOKEN_SECRET,{expiresIn:'10d'})

    // user.refreshToken = refreshToken
    // await user.save({validateBeforeSave:false})

    // console.log(accessToken)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options) //pushing accessToken and refresh token in cookies
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{
        user:loggedInUser,accessToken,refreshToken
    },
     "User logged in!!"   ))

})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,   // got this from middleware Auth its used in user.routes
        {
            $set:{
                refreshToken : undefined,
            }
        },
        {
            new:true //return response will give u new updated value that is without refresh Token
        }
        )

        const options = {
            httpOnly:true,
            secure:true
        }

        return res.status(200)
        .clearCookie("accessToken",options) //clearing cookies for logout
        .clearCookie("refreshToken",options)
        .json( new ApiResponse(200,{},"User logged out!"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incmoingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incmoingRefreshToken){
        throw new ApiError(401,"Unauthorized request.")
    }

    try {
        const decodedToken = jwt.verify(
            incmoingRefreshToken,process.env.REFRESH_TOKEN_SECRET
        )
    
        // console.log(decodedToken);
    
        const user = await User.findById(decodedToken?._id)
        console.log(user)
    
        if(!user) {
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if (incmoingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Rfresh token is expired")
        }
    
        const accessToken = await jwt.sign({user},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})
        const newRefreshToken = await  jwt.sign({user},process.env.REFRESH_TOKEN_SECRET,{expiresIn:'10d'})
        
        const options = {
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options) //pushing accessToken and refresh token in cookies
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(200,{
            accessToken,refreshToken :newRefreshToken
        },
         "Access Token Refreshed"   ))
    
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
    }
})

 const changeCurrentPassword = asyncHandler(async (req,res)=>{

    const {oldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect)
    {
        throw new ApiError(400,"invalid oldpassword password.")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed."))

 })

 const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully."))
 })

 const updateAccountDetials = asyncHandler(async (req,res)=>{
    const {fullName,email} = req.body;
    if (!fullName || !email) {
        throw new ApiError(400,"All fileds are required.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },{
            new:true
        }
    ).select("-password")

   return  res.status(200)
            .json(new ApiResponse(200,user,"Account details updated."))

 })

 const updateUserAvatar = asyncHandler(async (req,res)=>{
    //check user
    //get file
    //validate file
    //save and response

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar foler")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avator")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully."))
 })

 const updateUserCoverImage = asyncHandler(async (req,res)=>{
    //check user
    //get file
    //validate file
    //save and response

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath)
    {
        throw new ApiError(400,"coverImageLocalPath file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
            .json(new ApiResponse(200,user,"coverImage updated successfully."))
 })

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const username = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"Username is missing.");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase(),
            },
        },
        {
            $lookup:{
               from:"subscriptions",
               localField:_id,
               foreignField:"channel",
               as:"subscribers" 
            }
        },
        {
            $lookup:{
                from:"subcriptions",
                localField:_id,
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers",
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1

            }
        }
        
    ])

    console.log(channel);

    if(!channel?.length){
        throw new ApiError(404,"Channel does not exist.")
    }

    return res.status(200)
                .json(new ApiResponse(200,channel[0],"User channel fetched successfully."))

}) 

const getWatchHistory = asyncHandler( async (req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{  // this lookup is from user to video Schema
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{ //video schema have owner which is nothing but user hence we are ussing sub pipeline
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as : "owner",
                            pipeline:[
                                {
                                    $project:{ // it is used to set limimted data in owner because we dont want to whole user object
                                        username:1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner" // aggregate pipeline return value is array so to send first field this code is written
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
                .json(new ApiResponse(200,user[0],"watchHistory fetched successfully"))

})
 

export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetials,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory}