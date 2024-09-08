import { Request, Response } from "express"
import Cryptr from "cryptr"
import axios from "axios"
import { Stream } from 'stream'
import model from "../models/model"

const cryptr = new Cryptr(process.env.SecretKey, { encoding: 'base64', pbkdf2Iterations: 10000, saltLength: 30 })


const generate = async (req: Request, res: Response) => {
    try {
        const { name, branch, studentNo, rollNo, section, domain } = req.body
        if (!name || !branch || !studentNo || !rollNo || !section || !domain || req.body.length > 6)
            return res.status(400).json({ error: 'All the fields are necessary' })
        const data = {
            ...req.body
        }
        let encryptedString = cryptr.encrypt(JSON.stringify(data));

        encryptedString = encryptedString.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        console.log(encryptedString)
        try {
            const decryptedString = cryptr.decrypt(encryptedString);
            const decryptedData = JSON.parse(decryptedString);
            console.log('Decrypted:', decryptedData);
        } catch (error) {
            console.error('Decryption failed:', error);
        }


        try {
            const check = await model.findOne({
                $or: [
                    { studentNo },
                    { rollNo }
                ]
            })
            if (!check)
                await model.create(data)
            if (check)
                return res.status(200).json({ msg: 'Student Already exist' })

            const response = await axios({
                method: 'get',
                url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encryptedString}`,
                responseType: 'stream'
            })
            res.setHeader('Content-Type', 'image/png')
            if (response.data instanceof Stream) {
                response.data.pipe(res)
            } else {
                throw new Error('Response data is not a stream')
            }
        } catch (error) {
            console.error('Error generating QR code:', error)
            res.status(500).send('Error generating QR code')
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error occured while fetching data' })
    }
}

const verify = async (req: Request, res: Response) => {
    try {
        let { encrypted } = req.body
        if (!encrypted || typeof encrypted !== 'string' || encrypted.trim().length === 0)
            return res.status(400).json({ error: 'Encrypted string is required' })
        console.log(encrypted)

 // Replace URL-safe characters back to original
 
         encrypted = encrypted.replace(/-/g, '+').replace(/_/g, '/');

         console.log(encrypted);

      let decrypted;
     try {
     decrypted = cryptr.decrypt(encrypted);
     } catch (decryptionError) {
     console.error('Decryption error:', decryptionError);
     return res.status(500).json({ error: 'Failed to decrypt the data 📛' });
       }

 console.log('Decrypted data:', decrypted);
 const decryptedJSON = JSON.parse(decrypted);
 console.log('Parsed decrypted JSON:', decryptedJSON);

        const check = await model.findOne({
            $and: [
                { studentNo: decryptedJSON.studentNo },
                { rollNo: decryptedJSON.rollNo }
            ]
        })
        if(check.present)
            return res.status(200).json({
               msg: `Present already Marked 😵‍💫 \nName: ${check.name}\nBranch: ${check.branch} ${check.section}\nstudentNo: ${check.studentNo}`
             })
        // console.log(studentNoCheck)
        check.present=true
        check.save()
        return res.status(200).json({
            msg: `Present Marked ✅ \nName: ${check.name}\nBranch: ${check.branch} ${check.section}\nstudentNo: ${check.studentNo}`
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error occured while marking attendance ❌' })
    }
}

const manualVerify = async(req: Request, res: Response) => {

    try {
        const { rollNo, studentNo } = req.body
        if (!rollNo || !studentNo)
            return res.status(400).json({ error: 'Roll No and Student No are required 🗿 ' })
        const check = await model.findOne({
            $and: [
                { studentNo },
                { rollNo }
            ]
        })
        if (!check)
            return res.status(404).json({ error: 'Student not found 🚫' })
        if(check.present)
            return res.status(200).json({
                msg: `Present already Marked 😵‍💫 \nName: ${check.name}\nBranch: ${check.branch} ${check.section}\nstudentNo: ${check.studentNo}`
              })
        check.present=true
        check.save()
        return res.status(200).json({
            msg: `Present Marked ✅ \nName: ${check.name}\nBranch: ${check.branch} ${check.section}\nstudentNo: ${check.studentNo}`
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error occured while marking attendance ❌' })
    }
}



export default { generate, verify, manualVerify }

