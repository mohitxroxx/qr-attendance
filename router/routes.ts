import { Router } from "express";
import ctrl from '../controllers/controllers'
const app: Router = Router();


app.post('/generate',ctrl.generate)
app.post('/verify',ctrl.verify)

export default app