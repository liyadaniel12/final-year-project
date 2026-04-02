import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

const router = express.Router();

router.post('/feedback', async (req, res) => {
  try {
    const { customerName, rating, feedbackText, productName, batchNumber } = req.body;

    if (!customerName || !rating || !feedbackText || !productName || !batchNumber) {
      return res.status(400).json({ error: 'Missing required feedback fields.' });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        customer_name: customerName,
        rating: rating,
        message: feedbackText,
        product_name: productName,
        batch_number: batchNumber
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting feedback:', error);
      return res.status(500).json({ error: 'Failed to submit feedback' });
    }

    return res.status(201).json({ message: 'Feedback submitted successfully', data });
  } catch (err) {
    console.error('Feedback submission error:', err);
    return res.status(500).json({ error: 'Server error during feedback submission' });
  }
});

export default router;
