const express = require('express');
const router = express.Router();
const employeesController = require('../controllers/employeesController');

router.get('/get', employeesController.getAll);
router.get('/getbyid/:id', employeesController.getById);
router.post('/add', employeesController.create);
router.post('/edit/:id', employeesController.update);
router.delete('/delete/:id', employeesController.remove);
router.post('/login', employeesController.login);
module.exports = router;
