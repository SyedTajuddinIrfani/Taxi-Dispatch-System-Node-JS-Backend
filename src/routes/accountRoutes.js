const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

router.post('/add', accountController.createAccount);
router.get('/get', accountController.getAccounts);
router.get('/getbyid/:id', accountController.getAccountById);
router.post('/edit/:id', accountController.updateAccount);  // ✅ edit
router.delete('/delete/:id', accountController.deleteAccount); // ✅ delete

module.exports = router;
