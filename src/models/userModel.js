import { Router } from 'express';
const router = Router();
import { findById } from './userModel.js';

// Route to find a user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const user = await findById(req.params.id);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: 'Error finding user', error });
  }
});

export default router;
