const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const userRouter = require('./routes/userRouter.js');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const initializePassport = require('../src/config/passport.config.js');
const {generateToken, authToken} = require('./utils.js');
const {user} = require('./models/user.js');

const app = express();

// Middlewares incorporados de Express
//Preparar la configuracion del servidor para recibir objetos JSON.
app.use(express.json()); // Formatea los cuerpos json de peticiones entrantes.
app.use(express.urlencoded({extended: true})); // Formatea query params de URLs para peticiones entrantes.
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Iniciamos la conexión con MongoDB
//Coneccion a la base de datos
const uriDB='mongodb+srv://salinasjorgeluis26:YfPLse2acK8ZLIgb@pasteleria.ybu41.mongodb.net/Pasteleria?retryWrites=true&w=majority&appName=Pasteleria'

const connectMongoDB = async () => {
    try {
        await mongoose.connect(uriDB);
        console.log('Base de datos conectada');

    } catch (error) {
        console.log(error);
    }
}

connectMongoDB();

// app.use(session({
//     store: MongoStore.create({
//         mongoUrl: uriDB,
//         mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
//         ttl: 60
//     }),
//     secret: 'coderSecret',
//     resave: false,
//     saveUninitialized: false
// }))

initializePassport()
app.use(passport.initialize())
// app.use(passport.session())

// Router
app.use('/api/sessions', userRouter);

const users = []

app.post("/register", (req,res)=>{
    const {first_name,last_name,email,age,password,role} = req.body
    const exists = users.find(user=>user.email === email)

    if(exists){
        res.sendStatus(409)
        console.log("Usuario registrado")
    }else{
        const user ={
            first_name,last_name,email,age,password,role
        }
        console.log(user)
        users.push(user)
        const access_token = generateToken(user)
        res.send({status:"success", access_token})
    }
})

// Ruta de login de usuario
app.post('/login', async (req, res) => {
    try {
    const { email, password } = req.body;
    const user = await user.findOne({ email });
    if (!user) {
    return res.status(400).send({ message: 'Usuario no encontrado' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
    return res.status(400).send({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
    res.send({ token });
} catch (err) {
    res.status(500).send({ message: 'Error en el servidor', error: err.message });
}
});

app.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.send(req.user);
});

const SERVER_PORT = 9090;
app.listen(SERVER_PORT, () => {
    console.log(`Servidor escuchando por el puerto:  ${SERVER_PORT}`);
});

