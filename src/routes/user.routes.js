import { Router } from "express";
import { upload } from "../middlewares/multer.middlerware.js"
import {loginUser,logoutUser,registerUser,refreshAccessToken} from "../controllers/user.controller.js";
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

export default router