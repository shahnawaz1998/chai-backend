import { Router } from "express";
import { upload } from "../middlewares/multer.middlerware.js"
import {loginUser,logoutUser,registerUser,refreshAccessToken,
     getCurrentUser, changeCurrentPassword, updateAccountDetials,
      updateUserAvatar, updateUserCoverImage, getUserChannelProfile,
       getWatchHistory} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            macCount:1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser) 

//secured Routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetials)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router