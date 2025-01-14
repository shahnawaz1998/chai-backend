import {v2 as cloudinary} from  "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) =>{    
    try {
        if (!localFilePath) return null;
            
        //upload the file on cloudinary
       const response = cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})

        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary",response.url);
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove ther locally saved temporary file as the upload ooperation got failed
        return null;        
    }
}

cloudinary.config({ 
    cloud_name: 'dnidac3oj', 
    api_key: '517787557146811', 
    api_secret: '<your_api_secret>' // Click 'View API Keys' above to copy your API secret
});

export {uploadOnCloudinary}
    