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
        const encryptedString = cryptr.encrypt(JSON.stringify(data))
        console.log(encryptedString)
        try {
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
            const check = await model.findOne({
                $and: [
                    { studentNo },
                    { rollNo }
                ]
            })
            if (!check)
                await model.create(data)
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
        const { encrypted } = req.body
        if (!encrypted || req.body.length > 1)
            return res.status(400).json({ error: 'Encrypted string is required' })
        const decrypted = cryptr.decrypt(encrypted)
        const decryptedJSON = JSON.parse(decrypted)

        const check = await model.findOne({
            $and: [
                { studentNo: decryptedJSON.studentNo },
                { rollNo: decryptedJSON.rollNo }
            ]
        })
        if(check.present)
            return res.status(200).json({ msg: 'Present already Marked' })
        // console.log(studentNoCheck)
        check.present=true
        check.save()
        return res.status(200).json({ msg: 'Present Marked' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Error occured while marking attendance' })
    }
}



export default { generate, verify }

